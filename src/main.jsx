import React from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles/tokens.css';
import './styles/base.css';

// The <head> script in index.html has already set html.js-motion / html.boot-on; this tells its failsafe we're running.
window.__appStarted = true;

const root = document.getElementById('root');
const app = (
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
// The production build ships the page pre-rendered (tools/prerender.mjs): take it over in place.
// `npm run dev` serves an empty #root: render from scratch.
if (root.firstElementChild) hydrateRoot(root, app);
else createRoot(root).render(app);
