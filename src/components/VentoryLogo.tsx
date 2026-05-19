interface Props {
  size?: number;
  showWordmark?: boolean;
  wordmarkColor?: string;
  className?: string;
}

export default function VentoryLogo({ size = 36, showWordmark = false, wordmarkColor = 'text-white', className = '' }: Props) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="9" fill="#1a56db" />
        {/* V mark — inventory trendline meeting at decision point */}
        <path
          d="M9 12L20 29L31 12"
          stroke="white"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {showWordmark && (
        <span className={`font-bold tracking-[0.22em] text-base ${wordmarkColor}`}>
          VENTORY
        </span>
      )}
    </div>
  );
}
