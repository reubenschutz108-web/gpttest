# 🐧 Pengu v0.1 — Starter Kit

Pengu is a simple base coding language that gives you **full codebase access**
to customize and extend — so you can shape it into your personalized,
ideal coding language.

## Quick start

```bash
# Windows / macOS / Linux — Python 3.10+ required
python pengu.py examples/hello.pengu
```

## Your first Pengu program

```pengu
# hello.pengu
say "Hello from Pengu!"

let name = "builder"
say "Welcome, " + name

for i in 0..5:
  say i

flock greet(who):
  return "Hi " + who

say greet("Pengu")
```

## Language basics

| What you want | How you write it |
|---|---|
| Print | `say "text"` |
| Variable | `let x = 42` |
| Function | `flock name(args):` + indented body |
| Loop | `for i in 0..10:` |
| Condition | `slide x > 5:` / `else:` |
| Comment | `# like this` |

## Make it yours

Pengu's interpreter (`pengu.py`) is plain Python — open it, rename the
keywords, add new ones, change the syntax. There is no lock-in.
Fork it, remix it, ship your dialect.

## Files in this zip

- `pengu.py` — the interpreter (single file, no dependencies)
- `examples/` — runnable example programs
- `pengu.config.json` — your dialect settings (edit freely)

Made with 🐧 on the ice.
