# 🐧 Pengu — 3D Landing Page

An interactive, glacial-dark 3D landing page for **Pengu** — a simple base coding
language that gives you full codebase access to customize and extend.

## What's here

| Path | What it is |
|---|---|
| `index.html` | The landing page (hero, features, live playground, get-started) |
| `three-scene.js` | Interactive 3D hero — procedural low-poly penguin, snow, floating code cubes (Three.js via CDN) |
| `pengu.js` | Pengu interpreter compiled to JS — powers the in-browser playground |
| `app.js` | Playground logic, example programs, penguin speech bubbles |
| `styles.css` | Full page styling (glacial dark theme) |
| `downloads/pengu-starter.zip` | ⬇️ The downloadable starter kit |
| `pengu-starter/` | Source of the zip: interpreter + examples + config |

## Run it locally

```bash
python3 -m http.server 4173
# open http://localhost:4173
```

## The starter zip

Unzip `downloads/pengu-starter.zip` and run your first Pengu program:

```bash
python pengu.py examples/hello.pengu
```

The whole interpreter is one dependency-free Python file. Open it, rename the
keywords (`say`, `let`, `for`, `flock`, `slide`, `return`), add your own —
that's the entire point of Pengu. Fork it, remix it, ship your dialect.

## Interactions

- **Drag** the hero scene to orbit the penguin
- **Click the penguin** for a surprise (speech bubble + jump)
- **Playground**: edit Pengu code, `Ctrl/Cmd + Enter` or ▶ to run, tab-indents
