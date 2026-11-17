// A small robot: a rounded "pod" body with a screen face, an antenna light and two legs.
export default function BotSprite({ color = '#6EF0B4', size = 40, sleeping = false, className = '' }) {
  return (
    <svg className={`bot-svg ${className}`} viewBox="0 0 40 46" width={size} height={size * 1.15} aria-hidden="true" style={{ '--bot': color }}>
      <line x1="20" y1="2" x2="20" y2="9" stroke="#8B95A3" strokeWidth="2" strokeLinecap="round" />
      <circle className="bot-light" cx="20" cy="3" r="2.6" fill={color} />
      <rect x="6" y="9" width="28" height="25" rx="9" fill="#1A2028" stroke={color} strokeWidth="2" />
      <rect x="10" y="14" width="20" height="12" rx="5" fill="#0A0C0F" />
      {sleeping ? (
        <>
          <path d="M14 20.5h4M22 20.5h4" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle className="bot-eye" cx="16" cy="20" r="2.2" fill={color} />
          <circle className="bot-eye" cx="24" cy="20" r="2.2" fill={color} />
        </>
      )}
      <rect x="2" y="18" width="4" height="9" rx="2" fill="#8B95A3" className="bot-arm-l" />
      <rect x="34" y="18" width="4" height="9" rx="2" fill="#8B95A3" className="bot-arm-r" />
      <rect x="12" y="34" width="5" height="9" rx="2.5" fill="#8B95A3" className="bot-leg" />
      <rect x="23" y="34" width="5" height="9" rx="2.5" fill="#8B95A3" className="bot-leg b" />
    </svg>
  );
}
