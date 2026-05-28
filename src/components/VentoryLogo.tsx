interface Props {
  size?: number;
  showWordmark?: boolean;
  wordmarkColor?: string;
  className?: string;
}

export default function VentoryLogo({ size = 36, showWordmark = false, wordmarkColor = 'text-white', className = '' }: Props) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <img
        src="/logo.svg"
        alt="Ventory"
        width={size}
        height={size}
        style={{ display: 'block', objectFit: 'contain' }}
      />
      {showWordmark && (
        <span className={`font-bold tracking-[0.22em] text-base ${wordmarkColor}`}>
          VENTORY
        </span>
      )}
    </div>
  );
}
