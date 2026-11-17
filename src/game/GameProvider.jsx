import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { achievements, achById } from '../data/achievements.js';
import { sound } from './sound.js';
import { store } from './storage.js';

export const accents = [
  { name: 'mint', hex: '#6EF0B4', rgb: '110, 240, 180' },
  { name: 'sky', hex: '#5CC8FF', rgb: '92, 200, 255' },
  { name: 'lilac', hex: '#C4A1FF', rgb: '196, 161, 255' },
  { name: 'amber', hex: '#FFC857', rgb: '255, 200, 87' },
];

const GameCtx = createContext(null);
export const useGame = () => useContext(GameCtx);

// A tiny event bus so sections can talk without prop-drilling
// (e.g. terminal `deploy` → pipeline runs, `chaos` → cluster).
function makeBus() {
  const subs = new Map();
  return {
    on(evt, fn) {
      if (!subs.has(evt)) subs.set(evt, new Set());
      subs.get(evt).add(fn);
      return () => subs.get(evt).delete(fn);
    },
    emit(evt, payload) {
      subs.get(evt)?.forEach((fn) => fn(payload));
    },
  };
}

export function GameProvider({ children }) {
  const [found, setFound] = useState(() => new Set(store.get('ach', [])));
  const [accentIdx, setAccentIdx] = useState(() => {
    const i = store.get('accent', 0);
    return i >= 0 && i < accents.length ? i : 0;
  });
  const [soundOn, setSoundOn] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [achOpen, setAchOpen] = useState(false);
  const [status, setStatusState] = useState({ level: 'ok', text: 'all systems operational' });
  const [stats, setStats] = useState({ deploys: 0, podsKilled: 0, botsThrown: 0, requests: 0 });
  const foundRef = useRef(found);
  const bus = useRef(makeBus()).current;
  const toastId = useRef(0);

  // Accent → CSS variables
  useEffect(() => {
    const a = accents[accentIdx];
    const r = document.documentElement.style;
    r.setProperty('--accent', a.hex);
    r.setProperty('--accent-rgb', a.rgb);
    store.set('accent', accentIdx);
  }, [accentIdx]);

  const toast = useCallback((text, kind = 'info', ms = 3200) => {
    const id = ++toastId.current;
    setToasts((t) => [...t.slice(-3), { id, text, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), ms);
  }, []);

  const unlock = useCallback(
    (id) => {
      if (!achById[id] || foundRef.current.has(id)) return;
      const next = new Set(foundRef.current);
      next.add(id);
      foundRef.current = next;
      setFound(next);
      store.set('ach', [...next]);
      sound.play('unlock');
      toast(`Achievement unlocked · ${achById[id].name}`, 'ach', 4000);
    },
    [toast]
  );

  const cycleAccent = useCallback(
    (name) => {
      setAccentIdx((i) => {
        if (name) {
          const j = accents.findIndex((a) => a.name === name);
          return j === -1 ? i : j;
        }
        return (i + 1) % accents.length;
      });
      unlock('theme');
    },
    [unlock]
  );

  const setSound = useCallback(
    (on) => {
      sound.set(on);
      setSoundOn(on);
      if (on) {
        sound.play('ok');
        unlock('sound');
      }
    },
    [unlock]
  );

  const bump = useCallback((key, by = 1) => setStats((s) => ({ ...s, [key]: (s[key] || 0) + by })), []);
  const setStatus = useCallback((level, text) => setStatusState({ level, text }), []);

  // "Full Scroll": reaching the bottom of the page.
  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      if (el.scrollTop + window.innerHeight >= el.scrollHeight - 8) unlock('bottom');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [unlock]);

  const value = useMemo(
    () => ({
      found, total: achievements.length, unlock,
      accent: accents[accentIdx], cycleAccent,
      soundOn, setSound, play: sound.play,
      toasts, toast,
      achOpen, setAchOpen,
      status, setStatus,
      stats, bump,
      bus,
    }),
    [found, unlock, accentIdx, cycleAccent, soundOn, setSound, toasts, toast, achOpen, status, setStatus, stats, bump, bus]
  );

  return <GameCtx.Provider value={value}>{children}</GameCtx.Provider>;
}
