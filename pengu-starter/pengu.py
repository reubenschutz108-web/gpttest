#!/usr/bin/env python3
"""
Pengu v0.1 — a simple base language you can fully customize.

Usage:
    python pengu.py examples/hello.pengu

This interpreter is intentionally tiny and readable. Open it up,
rename keywords, add new ones — that's the whole point of Pengu.
"""
import sys
import re

KEYWORDS = {"say", "let", "for", "in", "flock", "slide", "else", "return", "true", "false"}

TOKEN_RE = re.compile(r"""
    (?P<STRING>"(?:[^"\\]|\\.)*")
  | (?P<NUMBER>\d+(?:\.\d+)?)
  | (?P<RANGE>\.\.)
  | (?P<OP><=|>=|==|!=|[+\-*/%<>=(),:])
  | (?P<NAME>[A-Za-z_][A-Za-z0-9_]*)
  | (?P<SKIP>[ \t]+)
""", re.VERBOSE)

class PenguError(Exception):
    pass

def tokenize(line, lineno):
    tokens, i = [], 0
    while i < len(line):
        m = TOKEN_RE.match(line, i)
        if not m:
            raise PenguError(f"line {lineno}: unexpected character {line[i]!r}")
        kind = m.lastgroup
        if kind != "SKIP":
            tokens.append((kind, m.group()))
        i = m.end()
    return tokens

class Parser:
    def __init__(self, tokens, lineno):
        self.tokens, self.pos, self.lineno = tokens, 0, lineno
    def peek(self):
        return self.tokens[self.pos] if self.pos < len(self.tokens) else (None, None)
    def next(self):
        t = self.peek(); self.pos += 1; return t
    def expect(self, value):
        kind, val = self.next()
        if val != value:
            raise PenguError(f"line {self.lineno}: expected {value!r}, got {val!r}")
    def parse_expr(self):
        return self.parse_comparison()
    def parse_comparison(self):
        left = self.parse_add()
        kind, val = self.peek()
        if val in ("<", ">", "<=", ">=", "==", "!="):
            self.next()
            return ("binop", val, left, self.parse_add())
        return left
    def parse_add(self):
        node = self.parse_mul()
        while self.peek()[1] in ("+", "-"):
            op = self.next()[1]
            node = ("binop", op, node, self.parse_mul())
        return node
    def parse_mul(self):
        node = self.parse_unary()
        while self.peek()[1] in ("*", "/", "%"):
            op = self.next()[1]
            node = ("binop", op, node, self.parse_unary())
        return node
    def parse_unary(self):
        if self.peek()[1] == "-":
            self.next()
            return ("neg", self.parse_unary())
        return self.parse_primary()
    def parse_primary(self):
        kind, val = self.next()
        if kind == "NUMBER":
            return ("num", float(val) if "." in val else int(val))
        if kind == "STRING":
            return ("str", val[1:-1].encode().decode("unicode_escape"))
        if kind == "NAME":
            if val == "true": return ("bool", True)
            if val == "false": return ("bool", False)
            if self.peek()[1] == "(":
                self.next()
                args = []
                if self.peek()[1] != ")":
                    args.append(self.parse_expr())
                    while self.peek()[1] == ",":
                        self.next(); args.append(self.parse_expr())
                self.expect(")")
                return ("call", val, args)
            return ("var", val)
        if val == "(":
            node = self.parse_expr(); self.expect(")"); return node
        raise PenguError(f"line {self.lineno}: unexpected token {val!r}")

def parse_program(source):
    lines = []
    for n, raw in enumerate(source.splitlines(), 1):
        stripped = raw.split("#", 1)[0].rstrip()
        if stripped.strip():
            indent = len(stripped) - len(stripped.lstrip(" "))
            lines.append((indent, stripped.strip(), n))
    stmts, idx = parse_block(lines, 0, 0)
    if idx < len(lines):
        raise PenguError(f"line {lines[idx][2]}: unexpected indent")
    return stmts

def parse_block(lines, idx, indent):
    stmts = []
    while idx < len(lines):
        ind, text, lineno = lines[idx]
        if ind < indent:
            break
        if ind > indent:
            raise PenguError(f"line {lineno}: unexpected indent")
        tokens = tokenize(text, lineno)
        head = tokens[0][1] if tokens else ""
        if head == "say":
            p = Parser(tokens[1:], lineno)
            stmts.append(("say", p.parse_expr())); idx += 1
        elif head == "let":
            p = Parser(tokens[1:], lineno)
            name = p.next()[1]; p.expect("=")
            stmts.append(("let", name, p.parse_expr())); idx += 1
        elif head == "return":
            p = Parser(tokens[1:], lineno)
            stmts.append(("return", p.parse_expr())); idx += 1
        elif head == "for":
            p = Parser(tokens[1:], lineno)
            var = p.next()[1]; p.expect("in")
            lo = p.parse_expr(); p.expect(".."); hi = p.parse_expr(); p.expect(":")
            body, idx = parse_block(lines, idx + 1, indent + 2)
            stmts.append(("for", var, lo, hi, body))
        elif head == "flock":
            p = Parser(tokens[1:], lineno)
            name = p.next()[1]; p.expect("(")
            params = []
            if p.peek()[1] != ")":
                params.append(p.next()[1])
                while p.peek()[1] == ",":
                    p.next(); params.append(p.next()[1])
            p.expect(")"); p.expect(":")
            body, idx = parse_block(lines, idx + 1, indent + 2)
            stmts.append(("flock", name, params, body))
        elif head == "slide":
            p = Parser(tokens[1:], lineno)
            cond = p.parse_expr(); p.expect(":")
            body, idx = parse_block(lines, idx + 1, indent + 2)
            else_body = []
            if idx < len(lines) and lines[idx][0] == indent and lines[idx][1].startswith("else"):
                else_body, idx = parse_block(lines, idx + 1, indent + 2)
            stmts.append(("slide", cond, body, else_body))
        else:
            raise PenguError(f"line {lineno}: unknown statement {text!r} — Pengu keywords: say, let, for, flock, slide, return")
    return stmts, idx

class Return(Exception):
    def __init__(self, value): self.value = value

def eval_expr(node, env, funcs):
    kind = node[0]
    if kind in ("num", "str", "bool"): return node[1]
    if kind == "var":
        if node[1] not in env: raise PenguError(f"undefined variable {node[1]!r}")
        return env[node[1]]
    if kind == "neg": return -eval_expr(node[1], env, funcs)
    if kind == "binop":
        _, op, l, r = node
        lv, rv = eval_expr(l, env, funcs), eval_expr(r, env, funcs)
        ops = {"+": lambda a, b: a + b, "-": lambda a, b: a - b, "*": lambda a, b: a * b,
               "/": lambda a, b: a / b, "%": lambda a, b: a % b, "<": lambda a, b: a < b,
               ">": lambda a, b: a > b, "<=": lambda a, b: a <= b, ">=": lambda a, b: a >= b,
               "==": lambda a, b: a == b, "!=": lambda a, b: a != b}
        return ops[op](lv, rv)
    if kind == "call":
        _, name, arg_nodes = node
        if name not in funcs: raise PenguError(f"undefined function {name!r}")
        params, body = funcs[name]
        args = [eval_expr(a, env, funcs) for a in arg_nodes]
        if len(args) != len(params): raise PenguError(f"{name}() expects {len(params)} args, got {len(args)}")
        local = dict(zip(params, args))
        try:
            exec_block(body, local, funcs)
        except Return as ret:
            return ret.value
        return None
    raise PenguError(f"bad expression {node!r}")

def fmt(v):
    if isinstance(v, bool): return "true" if v else "false"
    if isinstance(v, float) and v.is_integer(): return str(int(v))
    return str(v)

def exec_block(stmts, env, funcs):
    for s in stmts:
        kind = s[0]
        if kind == "say":
            print(fmt(eval_expr(s[1], env, funcs)))
        elif kind == "let":
            env[s[1]] = eval_expr(s[2], env, funcs)
        elif kind == "return":
            raise Return(eval_expr(s[1], env, funcs))
        elif kind == "for":
            _, var, lo, hi, body = s
            for i in range(int(eval_expr(lo, env, funcs)), int(eval_expr(hi, env, funcs))):
                env[var] = i
                exec_block(body, env, funcs)
        elif kind == "flock":
            funcs[s[1]] = (s[2], s[3])
        elif kind == "slide":
            _, cond, body, else_body = s
            exec_block(body if eval_expr(cond, env, funcs) else else_body, env, funcs)

def run(source):
    exec_block(parse_program(source), {}, {})

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python pengu.py <file.pengu>"); sys.exit(1)
    try:
        with open(sys.argv[1], encoding="utf-8") as f:
            run(f.read())
    except PenguError as e:
        print(f"Pengu error: {e}", file=sys.stderr); sys.exit(1)
