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

**Everything written on the site is in [`content.yaml`](content.yaml)**: your name and tagline, every
experience line, skills, education, section headings, achievements, even the bots' jokes.
Open it, change the text after the colon, save. With `npm run dev` running, the page updates instantly.

```yaml
experience:
  - title: DevOps Intern @ BytePe
    when: Jun 2026 – present
    place: Noida
    groups:
      - heading: monitoring          # shown as  @@ monitoring @@
        points:                      # each one shown as  + line
          - Set up Grafana and Prometheus for all three environments.
```

Rules:

- Keep the indentation (spaces, not tabs). Items in a list start with `- `.
- No quotes needed, **except** when the text contains `: ` (colon + space), starts with
  `#`, `[`, `{`, `*`, `&`, `!` or `'`, or is a colour like `'#5CC8FF'`.
- Don't change achievement `id`s; their names and hints are yours to rewrite.
- To add a job, copy a whole `- title:` block and edit it. The newest job goes first.

If something is mistyped, the terminal (and the browser, during `npm run dev`) tells you the line:

```
content.yaml needs a fix:
  • line 101: experience › item 1 › title is missing or empty
```

To swap the resume, put the new PDF in `public/` and update `resume.file` and `resume.updated`.

Game mechanics (timings, colours, pod counts) live in `src/data/*.js`; you shouldn't need to touch them.

## Check

```bash
npm run check           # renders every section and plays through the games in a simulated browser
npm run check:reduced   # the same, with reduced motion switched on
```

## Deploy

Pushing to `main` runs `.github/workflows/deploy.yml`, which builds with Vite and publishes `dist/`
to GitHub Pages. In the repo settings, Pages → Source must be set to **GitHub Actions**.
