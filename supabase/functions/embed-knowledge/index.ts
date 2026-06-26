import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { errorCode, json } from '../_shared/http.ts';
import { embedText } from '../_shared/rag.ts';
import { requireInternal, serviceClient } from '../_shared/supabase.ts';

Deno.serve(async (req) => {
  try {
    requireInternal(req);
    const admin = serviceClient();
    const { data: rows, error } = await admin.from('knowledge_embeddings')
      .select('id,embedding_text').neq('embedding_status', 'ready').limit(50);
    if (error) throw new Error(error.message);
    let processed = 0;
    const failed: string[] = [];
    for (const row of rows ?? []) {
      try {
        const embedding = await embedText(row.embedding_text);
        if (embedding.length !== 384) throw new Error('INVALID_EMBEDDING_SIZE');
        const updated = await admin.from('knowledge_embeddings').update({
          embedding,
          embedding_status: 'ready',
          embedding_error: null,
        }).eq('id', row.id);
        if (updated.error) throw updated.error;
        processed += 1;
      } catch (embeddingError) {
        failed.push(row.id);
        await admin.from('knowledge_embeddings').update({
          embedding_status: 'failed',
          embedding_error: errorCode(embeddingError),
        }).eq('id', row.id);
      }
    }
    return json({ processed, failed, remaining: Math.max(0, (rows?.length ?? 0) - processed) });
  } catch (error) {
    const code = errorCode(error);
    return json({ error_code: code }, code === 'UNAUTHENTICATED' ? 401 : 500);
  }
});
