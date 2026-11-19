import { useEffect } from 'react';

// Visitor stats: counts named events in GoatCounter. GoatCounter is only loaded on the live site
// when content.yaml › analytics › goatcounter is set (see tools/site-plugin.js) and the visitor
// hasn't asked not to be tracked; otherwise every call here does nothing.
const sent = new Set();

export function track(name) {
  if (typeof window === 'undefined' || sent.has(name)) return; // each event once per page view
  sent.add(name);
  let tries = 0;
  const send = () => {
    const gc = window.goatcounter;
    if (gc && typeof gc.count === 'function') gc.count({ path: name, title: name, event: true });
    else if (++tries < 10 && document.querySelector('script[data-goatcounter]')) setTimeout(send, 1000); // still loading
  };
  send();
}

// One listener for every link on the page: resume, email, LinkedIn, GitHub.
const KINDS = [
  [/\.pdf($|[?#])/i, 'resume'],
  [/^mailto:/i, 'email'],
  [/^tel:/i, 'phone'],
  [/linkedin\.com/i, 'linkedin'],
  [/github\.com/i, 'github'],
];

export function useLinkTracking() {
  useEffect(() => {
    const onClick = (e) => {
      const href = e.target.closest?.('a[href]')?.getAttribute('href') || '';
      const kind = KINDS.find(([re]) => re.test(href));
      if (kind) track(`click-${kind[1]}`);
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);
}
