import { useEffect, useState } from 'react';
import { useGame } from '../game/GameProvider.jsx';
import { reducedMotion } from './motion.js';

// Types `text` out once the boot screen is gone, with a blinking caret. Screen readers get the full text.
export default function Typewriter({ text, speed = 32, delay = 700 }) {
  const { bus } = useGame();
  const [n, setN] = useState(() => (reducedMotion() ? text.length : 0));

  useEffect(() => {
    if (reducedMotion()) { setN(text.length); return; }
    let t = 0;
    let iv = 0;
    const start = () => {
      clearTimeout(t); clearInterval(iv);
      setN(0);
      t = setTimeout(() => {
        iv = setInterval(() => setN((k) => { if (k >= text.length) { clearInterval(iv); return k; } return k + 1; }), speed);
      }, delay);
    };
    if (document.body.classList.contains('booted')) start();
    const off = bus.on('fx:boot-done', start);
    return () => { off(); clearTimeout(t); clearInterval(iv); };
  }, [text, speed, delay, bus]);

  return (
    <>
      <span className="sr">{text}</span>
      <span aria-hidden="true">
        {text.slice(0, n)}
        <span className={`tw-caret${n >= text.length ? ' done' : ''}`} />
      </span>
    </>
  );
}
