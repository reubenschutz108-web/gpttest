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


  /* ---------- embedded starter zip (host-independent download) ----------
     The starter kit is 4.6 KB, so we embed it as base64 and hand out a
     Blob. The download button works no matter where the site is hosted. */
  const PENGU_ZIP_BASE64 = "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";

  function downloadEmbeddedZip() {
    const bin = atob(PENGU_ZIP_BASE64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const blob = new Blob([bytes], { type: "application/zip" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pengu-starter.zip";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  document.querySelectorAll('a[href$="pengu-starter.zip"], a[href$="pengu-starter.zip" i]').forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      downloadEmbeddedZip();
    });
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
