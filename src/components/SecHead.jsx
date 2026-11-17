// Shared section heading: "01 / EXPERIENCE" kicker, big title, optional lede.
export default function SecHead({ num, kicker, title, id, children }) {
  return (
    <header className="sec-head">
      <p className="sec-kicker mono">
        {num ? `${num} / ` : ''}
        {kicker}
      </p>
      <h2 className="sec-title" id={id} data-scramble>
        {title}
      </h2>
      {children ? <p className="sec-lede">{children}</p> : null}
    </header>
  );
}
