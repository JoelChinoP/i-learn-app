import { useEffect, useRef, useState } from 'react';
import { Mic, Square, Play, Pause, Trash2 } from 'lucide-react';

interface AudioRecorderProps {
  disabled?: boolean;
  /** Se invoca cuando hay una grabación lista. null cuando se descarta. */
  onChange: (audio: { blob: Blob; durationSec: number; dataUrl: string } | null) => void;
}

type RecState = 'idle' | 'recording' | 'recorded';

const BAR_COUNT = 28;

function fmtTime(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function AudioRecorder({ disabled, onChange }: AudioRecorderProps) {
  const [state, setState] = useState<RecState>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [levels, setLevels] = useState<number[]>(() => Array(BAR_COUNT).fill(0.1));
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const startedAtRef = useRef<number>(0);
  const previewUrlRef = useRef<string | null>(null);
  const playerRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => () => { void cleanup(); }, []);

  async function cleanup() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      try { await audioCtxRef.current.close(); } catch { /* noop */ }
    }
    audioCtxRef.current = null;
    analyserRef.current = null;
  }

  async function startRecording() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      recorder.onstop = () => finalizeRecording();
      recorder.start();
      recorderRef.current = recorder;

      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;

      startedAtRef.current = Date.now();
      setElapsed(0);
      setState('recording');
      tickMeter();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo acceder al micrófono');
    }
  }

  function tickMeter() {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const data = new Uint8Array(analyser.frequencyBinCount);

    const tick = () => {
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        const v = (data[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / data.length);
      const level = Math.min(1, rms * 4);
      setLevels((prev) => {
        const next = prev.slice(1);
        next.push(0.12 + level * 0.88);
        return next;
      });
      setElapsed((Date.now() - startedAtRef.current) / 1000);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }

  function stopRecording() {
    recorderRef.current?.stop();
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }

  async function finalizeRecording() {
    const blob = new Blob(chunksRef.current, { type: chunksRef.current[0] && (chunksRef.current[0] as Blob).type ? (chunksRef.current[0] as Blob).type : 'audio/webm' });
    const durationSec = (Date.now() - startedAtRef.current) / 1000;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    const dataUrl = await blobToDataUrl(blob);
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = URL.createObjectURL(blob);
    setState('recorded');
    onChange({ blob, durationSec, dataUrl });
  }

  function discard() {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = null;
    setLevels(Array(BAR_COUNT).fill(0.1));
    setElapsed(0);
    setIsPlaying(false);
    setState('idle');
    onChange(null);
  }

  function togglePlay() {
    const audio = playerRef.current;
    if (!audio) return;
    if (audio.paused) {
      void audio.play();
      setIsPlaying(true);
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }

  return (
    <div className="rounded-xl border-[1.5px] border-[#56358C] bg-[#0c0c0c] p-3">
      <div className="flex items-center gap-3">
        {state === 'idle' && (
          <button
            type="button"
            onClick={() => void startRecording()}
            disabled={disabled}
            className="flex size-12 items-center justify-center rounded-full bg-[#9CFF0F] text-black transition disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Empezar grabación"
          >
            <Mic className="size-5" />
          </button>
        )}
        {state === 'recording' && (
          <button
            type="button"
            onClick={stopRecording}
            className="loop-neon-pulse flex size-12 items-center justify-center rounded-full bg-[#ff4d6d] text-white"
            aria-label="Detener grabación"
            style={{ animation: 'loop-neon-pulse 1.4s ease infinite' }}
          >
            <Square className="size-5 fill-current" />
          </button>
        )}
        {state === 'recorded' && (
          <>
            <button
              type="button"
              onClick={togglePlay}
              className="flex size-12 items-center justify-center rounded-full bg-[#9CFF0F] text-black"
              aria-label={isPlaying ? 'Pausar reproducción' : 'Reproducir'}
            >
              {isPlaying ? <Pause className="size-5" /> : <Play className="size-5" />}
            </button>
            <audio
              ref={playerRef}
              src={previewUrlRef.current ?? undefined}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            />
          </>
        )}

        <div className="flex flex-1 items-end gap-[3px]" aria-hidden="true">
          {levels.map((lv, i) => (
            <span
              key={i}
              className="w-[3px] rounded-full"
              style={{
                height: `${Math.round(lv * 36)}px`,
                background:
                  state === 'recording'
                    ? `rgba(156,255,15,${0.45 + lv * 0.55})`
                    : state === 'recorded'
                    ? '#9CFF0F'
                    : 'rgba(86,53,140,0.6)',
                transition: 'height 80ms linear',
              }}
            />
          ))}
        </div>

        <div className="text-right tabular-nums">
          <div
            className="text-lg leading-none text-white"
            style={{ fontFamily: '"Bebas Neue", sans-serif' }}
          >
            {fmtTime(elapsed)}
          </div>
          <div className="text-[9px] uppercase tracking-[0.18em] text-white/40">
            {state === 'recording' ? 'grabando' : state === 'recorded' ? 'listo' : 'micrófono'}
          </div>
        </div>

        {state === 'recorded' && (
          <button
            type="button"
            onClick={discard}
            className="flex size-9 items-center justify-center rounded-full border border-[#56358C] text-white/65 hover:text-white"
            aria-label="Descartar grabación"
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </div>

      {error && (
        <p className="mt-2 text-[11px] uppercase tracking-[0.12em] text-[#ff8a8a]">
          {error}
        </p>
      )}
      {state === 'idle' && !error && (
        <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-white/35">
          Pulsa el micrófono para grabar tu respuesta
        </p>
      )}
    </div>
  );
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(blob);
  });
}
