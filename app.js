/* Pengu landing — playground + interactions */
(function () {
  "use strict";

  /* ---------- playground ---------- */
  const editor = document.getElementById("editor");
  const output = document.getElementById("output-code");
  const status = document.getElementById("run-status");
  const btnRun = document.getElementById("btn-run");
  const btnReset = document.getElementById("btn-reset");

  const EXAMPLES = {
    hello: `# hello.pengu — your first Pengu program
say "Hello from Pengu! 🐧"

let name = "builder"
say "Welcome, " + name

for i in 0..5:
  say i

flock greet(who):
  return "Hi " + who + "!"

say greet("Pengu")`,

    flock: `# flock.pengu — functions are called flocks
flock fibonacci(n):
  slide n <= 1:
    return n
  return fibonacci(n - 1) + fibonacci(n - 2)

say "first 8 fibonacci numbers:"
for i in 0..8:
  say fibonacci(i)`,

    slide: `# slide.pengu — conditions slide one way or another
let temp = 4

slide temp < 0:
  say "Freezing! Bundle up. 🧣"
else:
  say "Chilly but fine. 🐧"

slide temp > 20:
  say "T-shirt weather"
else:
  say "Pengu weather"`
  };

  function setOutput(html) {
    output.innerHTML = html;
    const pre = document.getElementById("output");
    pre.scrollTop = pre.scrollHeight;
  }

  function escapeHtml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function run() {
    const lines = [];
    try {
      window.Pengu.run(editor.value, (line) => lines.push(line));
      setOutput(
        (lines.length ? escapeHtml(lines.join("\n")) : '<span class="dim">// (no output)</span>') +
        '\n\n<span class="dim">— program finished cleanly ✓</span>'
      );
      status.textContent = "ok ✓";
      status.classList.remove("err");
    } catch (e) {
      setOutput(
        (lines.length ? escapeHtml(lines.join("\n")) + "\n\n" : "") +
        '<span class="err">Pengu error: ' + escapeHtml(String(e.message || e)) + "</span>"
      );
      status.textContent = "error ✗";
      status.classList.add("err");
    }
  }

  if (editor && window.Pengu) {
    editor.value = EXAMPLES.hello;

    btnRun.addEventListener("click", run);
    btnReset.addEventListener("click", () => {
      editor.value = EXAMPLES.hello;
      run();
    });
    editor.addEventListener("keydown", (e) => {
      /* Tab inserts two spaces instead of leaving the field */
      if (e.key === "Tab") {
        e.preventDefault();
        const { selectionStart: s, selectionEnd: t } = editor;
        editor.value = editor.value.slice(0, s) + "  " + editor.value.slice(t);
        editor.selectionStart = editor.selectionEnd = s + 2;
      }
      /* Ctrl/Cmd + Enter runs */
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        run();
      }
    });

    document.querySelectorAll(".example-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        editor.value = EXAMPLES[chip.dataset.example] || EXAMPLES.hello;
        run();
        document.getElementById("playground").scrollIntoView({ behavior: "smooth", block: "center" });
      });
    });
  }

  /* ---------- penguin speech bubble ---------- */
  const speech = document.getElementById("pengu-speech");
  const QUIPS = [
    'say "boop!" 🐧',
    "flock hug(penguin): return you",
    "let joy = true",
    "for fish in 0..99: eat(fish)",
    "slide you: else: adopt_penguin()",
    "# you are now part of the flock",
    "return 'welcome to Pengu!'",
    "let dialect = YOURS"
  ];
  let quipIdx = 0, speechTimer = null;
  window.addEventListener("pengu:boop", () => {
    if (!speech) return;
    speech.textContent = QUIPS[quipIdx % QUIPS.length];
    quipIdx++;
    speech.classList.add("show");
    clearTimeout(speechTimer);
    speechTimer = setTimeout(() => speech.classList.remove("show"), 2200);
  });

  /* ---------- smooth anchor scroll ---------- */
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const target = document.querySelector(a.getAttribute("href"));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });
})();
