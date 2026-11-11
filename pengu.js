/* Pengu v0.1 — browser interpreter (mirrors pengu.py in the starter zip).
   Supports: say, let, for ... in a..b, flock (functions), slide/else, return,
   arithmetic, comparison, strings, calls. */
(function (global) {
  "use strict";

  const TOKEN_RE = /("(?:[^"\\]|\\.)*")|(\d+(?:\.\d+)?)|(\.\.)|(<=|>=|==|!=|[+\-*/%<>=(),:])|([A-Za-z_][A-Za-z0-9_]*)|([ \t]+)/g;

  function tokenize(line, lineno) {
    const tokens = [];
    let m, last = 0;
    TOKEN_RE.lastIndex = 0;
    while ((m = TOKEN_RE.exec(line)) !== null) {
      if (m.index !== last) throw new Error(`line ${lineno}: unexpected character ${JSON.stringify(line[last])}`);
      last = TOKEN_RE.lastIndex;
      if (m[6] !== undefined) continue; // whitespace
      if (m[1] !== undefined) tokens.push(["STRING", m[1]]);
      else if (m[2] !== undefined) tokens.push(["NUMBER", m[2]]);
      else if (m[3] !== undefined) tokens.push(["RANGE", m[3]]);
      else if (m[4] !== undefined) tokens.push(["OP", m[4]]);
      else if (m[5] !== undefined) tokens.push(["NAME", m[5]]);
    }
    if (last !== line.length) throw new Error(`line ${lineno}: unexpected character ${JSON.stringify(line[last])}`);
    return tokens;
  }

  function Parser(tokens, lineno) {
    this.tokens = tokens; this.pos = 0; this.lineno = lineno;
  }
  Parser.prototype.peek = function () { return this.tokens[this.pos] || [null, null]; };
  Parser.prototype.next = function () { const t = this.peek(); this.pos++; return t; };
  Parser.prototype.expect = function (v) {
    const t = this.next();
    if (t[1] !== v) throw new Error(`line ${this.lineno}: expected '${v}', got '${t[1]}'`);
  };
  Parser.prototype.parseExpr = function () { return this.parseComparison(); };
  Parser.prototype.parseComparison = function () {
    let left = this.parseAdd();
    const v = this.peek()[1];
    if (["<", ">", "<=", ">=", "==", "!="].includes(v)) {
      this.next();
      return ["binop", v, left, this.parseAdd()];
    }
    return left;
  };
  Parser.prototype.parseAdd = function () {
    let node = this.parseMul();
    while (["+", "-"].includes(this.peek()[1])) {
      const op = this.next()[1];
      node = ["binop", op, node, this.parseMul()];
    }
    return node;
  };
  Parser.prototype.parseMul = function () {
    let node = this.parseUnary();
    while (["*", "/", "%"].includes(this.peek()[1])) {
      const op = this.next()[1];
      node = ["binop", op, node, this.parseUnary()];
    }
    return node;
  };
  Parser.prototype.parseUnary = function () {
    if (this.peek()[1] === "-") { this.next(); return ["neg", this.parseUnary()]; }
    return this.parsePrimary();
  };
  Parser.prototype.parsePrimary = function () {
    const t = this.next(), kind = t[0], val = t[1];
    if (kind === "NUMBER") return ["num", val.includes(".") ? parseFloat(val) : parseInt(val, 10)];
    if (kind === "STRING") return ["str", JSON.parse(val)];
    if (kind === "NAME") {
      if (val === "true") return ["bool", true];
      if (val === "false") return ["bool", false];
      if (this.peek()[1] === "(") {
        this.next();
        const args = [];
        if (this.peek()[1] !== ")") {
          args.push(this.parseExpr());
          while (this.peek()[1] === ",") { this.next(); args.push(this.parseExpr()); }
        }
        this.expect(")");
        return ["call", val, args];
      }
      return ["var", val];
    }
    if (val === "(") { const n = this.parseExpr(); this.expect(")"); return n; }
    throw new Error(`line ${this.lineno}: unexpected token '${val}'`);
  };

  function parseProgram(source) {
    const lines = [];
    source.split("\n").forEach((raw, i) => {
      const noComment = raw.split("#")[0].replace(/\s+$/, "");
      if (noComment.trim()) {
        const indent = noComment.length - noComment.replace(/^ +/, "").length;
        lines.push([indent, noComment.trim(), i + 1]);
      }
    });
    const res = parseBlock(lines, 0, 0);
    if (res[1] < lines.length) throw new Error(`line ${lines[res[1]][2]}: unexpected indent`);
    return res[0];
  }

  function parseBlock(lines, idx, indent) {
    const stmts = [];
    while (idx < lines.length) {
      const ind = lines[idx][0], text = lines[idx][1], lineno = lines[idx][2];
      if (ind < indent) break;
      if (ind > indent) throw new Error(`line ${lineno}: unexpected indent`);
      const tokens = tokenize(text, lineno);
      const head = tokens.length ? tokens[0][1] : "";
      if (head === "say") {
        stmts.push(["say", new Parser(tokens.slice(1), lineno).parseExpr()]); idx++;
      } else if (head === "let") {
        const p = new Parser(tokens.slice(1), lineno);
        const name = p.next()[1]; p.expect("=");
        stmts.push(["let", name, p.parseExpr()]); idx++;
      } else if (head === "return") {
        stmts.push(["return", new Parser(tokens.slice(1), lineno).parseExpr()]); idx++;
      } else if (head === "for") {
        const p = new Parser(tokens.slice(1), lineno);
        const varName = p.next()[1]; p.expect("in");
        const lo = p.parseExpr(); p.expect(".."); const hi = p.parseExpr(); p.expect(":");
        const body = parseBlock(lines, idx + 1, indent + 2);
        stmts.push(["for", varName, lo, hi, body[0]]); idx = body[1];
      } else if (head === "flock") {
        const p = new Parser(tokens.slice(1), lineno);
        const name = p.next()[1]; p.expect("(");
        const params = [];
        if (p.peek()[1] !== ")") {
          params.push(p.next()[1]);
          while (p.peek()[1] === ",") { p.next(); params.push(p.next()[1]); }
        }
        p.expect(")"); p.expect(":");
        const body = parseBlock(lines, idx + 1, indent + 2);
        stmts.push(["flock", name, params, body[0]]); idx = body[1];
      } else if (head === "slide") {
        const p = new Parser(tokens.slice(1), lineno);
        const cond = p.parseExpr(); p.expect(":");
        const body = parseBlock(lines, idx + 1, indent + 2);
        let elseBody = [], nextIdx = body[1];
        if (nextIdx < lines.length && lines[nextIdx][0] === indent && lines[nextIdx][1].startsWith("else")) {
          const eb = parseBlock(lines, nextIdx + 1, indent + 2);
          elseBody = eb[0]; nextIdx = eb[1];
        }
        stmts.push(["slide", cond, body[0], elseBody]); idx = nextIdx;
      } else {
        throw new Error(`line ${lineno}: unknown statement '${text}' — keywords: say, let, for, flock, slide, return`);
      }
    }
    return [stmts, idx];
  }

  function evalExpr(node, env, funcs) {
    const kind = node[0];
    if (kind === "num" || kind === "str" || kind === "bool") return node[1];
    if (kind === "var") {
      if (!(node[1] in env)) throw new Error(`undefined variable '${node[1]}'`);
      return env[node[1]];
    }
    if (kind === "neg") return -evalExpr(node[1], env, funcs);
    if (kind === "binop") {
      const lv = evalExpr(node[2], env, funcs), rv = evalExpr(node[3], env, funcs);
      switch (node[1]) {
        case "+": return lv + rv;
        case "-": return lv - rv;
        case "*": return lv * rv;
        case "/": return lv / rv;
        case "%": return lv % rv;
        case "<": return lv < rv;
        case ">": return lv > rv;
        case "<=": return lv <= rv;
        case ">=": return lv >= rv;
        case "==": return lv === rv;
        case "!=": return lv !== rv;
      }
    }
    if (kind === "call") {
      const name = node[1];
      if (!funcs[name]) throw new Error(`undefined function '${name}'`);
      const params = funcs[name][0], body = funcs[name][1];
      const args = node[2].map(a => evalExpr(a, env, funcs));
      if (args.length !== params.length) throw new Error(`${name}() expects ${params.length} args, got ${args.length}`);
      const local = {};
      params.forEach((p, i) => local[p] = args[i]);
      try { execBlock(body, local, funcs, () => {}); }
      catch (e) { if (e && e.__return) return e.value; throw e; }
      return null;
    }
    throw new Error(`bad expression ${JSON.stringify(node)}`);
  }

  function fmt(v) {
    if (typeof v === "boolean") return v ? "true" : "false";
    if (v === null || v === undefined) return "null";
    return String(v);
  }

  function execBlock(stmts, env, funcs, out) {
    for (const s of stmts) {
      const kind = s[0];
      if (kind === "say") out(fmt(evalExpr(s[1], env, funcs)));
      else if (kind === "let") env[s[1]] = evalExpr(s[2], env, funcs);
      else if (kind === "return") throw { __return: true, value: evalExpr(s[1], env, funcs) };
      else if (kind === "for") {
        const lo = Math.trunc(evalExpr(s[2], env, funcs)), hi = Math.trunc(evalExpr(s[3], env, funcs));
        for (let i = lo; i < hi; i++) { env[s[1]] = i; execBlock(s[4], env, funcs, out); }
      } else if (kind === "flock") funcs[s[1]] = [s[2], s[3]];
      else if (kind === "slide") execBlock(evalExpr(s[1], env, funcs) ? s[2] : s[3], env, funcs, out);
    }
  }

  function run(source, out) {
    const lines = [];
    try {
      execBlock(parseProgram(source), {}, {}, out || (() => {}));
    } catch (e) {
      if (e && e.__return) throw new Error("'return' outside of a flock (function)");
      throw e;
    }
  }

  global.Pengu = { run, parseProgram, tokenize };
})(window);
