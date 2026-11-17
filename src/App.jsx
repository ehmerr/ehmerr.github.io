import { profile } from './data/profile.js';

// Step 1 placeholder: proves fonts, tokens and data wiring. Sections arrive in Step 3.
export default function App() {
  return (
    <main className="wrap sec">
      <p className="sec-kicker mono">00 / BOOTING</p>
      <h1 className="sec-title">{profile.name}</h1>
      <p className="sec-lede">{profile.tagline}</p>
    </main>
  );
}
