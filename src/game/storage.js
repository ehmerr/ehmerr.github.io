// localStorage that never throws (private windows, blocked storage).
const PREFIX = 'ahmar.';

export const store = {
  get(key, fallback) {
    try {
      const raw = window.localStorage.getItem(PREFIX + key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch { /* ignore */ }
  },
};

export const session = {
  get(key) {
    try { return window.sessionStorage.getItem(PREFIX + key); } catch { return null; }
  },
  set(key, value) {
    try { window.sessionStorage.setItem(PREFIX + key, value); } catch { /* ignore */ }
  },
};
