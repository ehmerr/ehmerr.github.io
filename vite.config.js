import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import content from './tools/content-plugin.js';

// ehmerr.github.io is a user site, so it is served from the domain root.
export default defineConfig({
  base: '/',
  plugins: [content(), react()],
});
