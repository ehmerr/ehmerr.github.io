import { useEffect, useState } from 'react';
import { profile } from '../data/profile.js';

const fmt = (() => {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: profile.timeZone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  } catch {
    return null;
  }
})();

export default function LocalTime() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!fmt) return null;
  return (
    <p className="local-time mono">
      <span className="live-dot" aria-hidden="true" />
      Local time in {profile.city} · <time>{fmt.format(now)}</time> IST
    </p>
  );
}
