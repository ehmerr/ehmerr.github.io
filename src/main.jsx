import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles/tokens.css';
import './styles/base.css';
import { reducedMotion } from './motion/motion.js';

if (!reducedMotion()) document.documentElement.classList.add('js-motion');

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
