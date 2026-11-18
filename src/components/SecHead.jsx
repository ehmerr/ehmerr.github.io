// Shared section heading: "01 / EXPERIENCE" kicker (line draws in), big title (scrambles), lede (fades up).
export default function SecHead({ num, kicker, title, id, children }) {
  return (
    <header className="sec-head">
      <p className="sec-kicker mono" data-reveal="left">
        {num ? `${num} / ` : ''}
        {kicker}
      </p>
      <h2 className="sec-title" id={id} data-scramble data-reveal style={{ '--d': '80ms' }}>
        {title}
      </h2>
      {children ? <p className="sec-lede" data-reveal style={{ '--d': '200ms' }}>{children}</p> : null}
    </header>
  );
}
