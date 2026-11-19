// Renders <App/> to an HTML string through Vite's SSR loader, so content.yaml goes through the
// same plugin as the real build. Used by tools/prerender.mjs (build) and tools/smoke-test.mjs (check).
import { createServer } from 'vite';

export const viteServer = (root) =>
  createServer({ root, logLevel: 'error', server: { middlewareMode: true }, appType: 'custom' });

export async function renderApp(server) {
  // React itself is imported natively: the app's own imports of it resolve to this same copy.
  const React = (await import('react')).default;
  const { renderToString } = (await import('react-dom/server')).default;
  const { default: App } = await server.ssrLoadModule('/src/App.jsx');
  return renderToString(React.createElement(React.StrictMode, null, React.createElement(App)));
}
