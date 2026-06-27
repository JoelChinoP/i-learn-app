interface LoopLogoProps {
  alt?: string;
  className?: string;
}

export function LoopLogo({ className = '', alt = 'Loop' }: LoopLogoProps) {
  return (
    <img
      src="/assets/loop-logo.webp"
      width={800}
      height={568}
      alt={alt}
      className={className}
      decoding="async"
    />
  );
}
