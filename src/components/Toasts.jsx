import { useGame } from '../game/GameProvider.jsx';

export default function Toasts() {
  const { toasts } = useGame();
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast mono toast-${t.kind}`}>
          {t.kind === 'ach' && <span className="toast-ic" aria-hidden="true">★</span>}
          {t.text}
        </div>
      ))}
    </div>
  );
}
