import { useRef, useState } from 'react';
import { useGame } from '../game/GameProvider.jsx';
import { quips, pick } from '../data/bots.js';
import BotSprite from './BotSprite.jsx';

// The night-shift bot asleep in the footer.
export default function NightBot() {
  const { unlock, play } = useGame();
  const [awake, setAwake] = useState(false);
  const [line, setLine] = useState('');
  const t = useRef(0);

  const wake = () => {
    clearTimeout(t.current);
    setAwake(true);
    setLine(pick(quips.night));
    unlock('wake');
    play('alarm');
    t.current = setTimeout(() => { setAwake(false); setLine(''); }, 3500);
  };

  return (
    <div className="night">
      {line && <p className="wk-say mono night-say">{line}</p>}
      <button type="button" className={`night-bot${awake ? ' awake' : ''}`} onClick={wake} aria-label="Night-shift bot, asleep. Click to wake it.">
        <BotSprite color="#5CC8FF" sleeping={!awake} size={46} />
        {!awake && (
          <span className="night-z mono" aria-hidden="true">
            <i>z</i><i>z</i><i>z</i>
          </span>
        )}
      </button>
    </div>
  );
}
