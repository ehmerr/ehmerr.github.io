# ehmerr.github.io

Personal site of Ahmar Rahmani, built as a playable "ops console": a terminal, a release pipeline,
a self-healing cluster, a skills periodic table and 25 achievements to find.

## Develop

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # outputs dist/
```

## Edit content

All the wording lives in `src/data/`:

| file | what |
| --- | --- |
| `profile.js` | name, tagline, contact, education, resume |
| `career.js` | experience, shown as `git log` with diff lines |
| `elements.js` | skills periodic table and reactor compounds |
| `pipeline.js`, `cluster.js` | the pipeline and cluster games |
| `achievements.js`, `bots.js`, `quips.js` | achievements and bot lines |

## Deploy

Pushing to `main` runs `.github/workflows/deploy.yml`, which builds with Vite and publishes `dist/`
to GitHub Pages. In the repo settings, Pages → Source must be set to **GitHub Actions**.
