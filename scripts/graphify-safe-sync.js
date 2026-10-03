#!/usr/bin/env node
import { existsSync, lstatSync, readFileSync, readdirSync, realpathSync, statSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const GRAPHIFY = "$AISTACK_HOME/vendor/graphify/.venv/bin/graphify";
const TIMEOUT_MS = 120000;
const MAX_FILES = 5000;
const MAX_BYTES = 200 * 1024 * 1024;
const EXCLUDES = [
  ".git",
  ".ecc",
  ".agent-zero",
  ".opencode",
  ".env",
  ".env.*",
  "credentials",
  "secrets",
  "node_modules",
  "vendor",
  "venv",
  ".venv",
  "graphify-out",
];

function fail(message, code = 2) {
  process.stderr.write(`${message}\n`);
  process.exit(code);
}

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    encoding: "utf8",
    timeout: options.timeout ?? TIMEOUT_MS,
    cwd: options.cwd,
    env: options.env,
  });
}

function gitRoot(project) {
  const probe = run("git", ["-C", project, "rev-parse", "--show-toplevel"]);
  if (probe.status !== 0) return null;
  const root = probe.stdout.trim();
  if (!root || !existsSync(root)) return null;
  const bare = run("git", ["-C", root, "rev-parse", "--is-bare-repository"]);
  if (bare.status !== 0 || bare.stdout.trim() === "true") return null;
  return realpathSync(root);
}

function allowedUntracked(path) {
  return path === ".env" ||
    path.startsWith(".env.") ||
    path.startsWith(".ecc/") ||
    path.startsWith(".agent-zero/") ||
    path.startsWith(".opencode/") ||
    path.startsWith("credentials/") ||
    path.startsWith("secrets/") ||
    path.startsWith("node_modules/") ||
    path.startsWith("vendor/") ||
    path.startsWith("venv/") ||
    path.startsWith(".venv/");
}

function gitClean(root) {
  const status = run("git", ["-C", root, "status", "--porcelain=v1", "--untracked-files=all"]);
  if (status.status !== 0) return false;
  for (const line of status.stdout.split(/\r?\n/)) {
    if (!line) continue;
    if (!line.startsWith("?? ")) return false;
    if (!allowedUntracked(line.slice(3))) return false;
  }
  return true;
}

function underAllowedHome(root) {
  const home = process.env.HOME;
  if (!home) return false;
  const workspace = resolve(home, "workspace");
  return root === workspace || root.startsWith(`${workspace}/`);
}

function countSourceTree(root) {
  const ignored = new Set([".git", ".ecc", ".agent-zero", ".opencode", "node_modules", "vendor", "venv", ".venv", "graphify-out"]);
  const stack = [root];
  let files = 0;
  let bytes = 0;

  while (stack.length) {
    const current = stack.pop();
    let entries;
    try {
      entries = readdirSync(current, { withFileTypes: true });
    } catch {
      return null;
    }
    for (const entry of entries) {
      if (ignored.has(entry.name)) continue;
      const path = `${current}/${entry.name}`;
      let stat;
      try {
        stat = lstatSync(path);
      } catch {
        return null;
      }
      if (stat.isSymbolicLink()) return null;
      if (stat.isDirectory()) {
        stack.push(path);
        continue;
      }
      if (!stat.isFile()) continue;
      files += 1;
      bytes += stat.size;
      if (files > MAX_FILES || bytes > MAX_BYTES) return { files, bytes, over: true };
    }
  }
  return { files, bytes, over: false };
}

function ensureLocalExclude(root) {
  const gitDir = run("git", ["-C", root, "rev-parse", "--git-dir"]);
  if (gitDir.status !== 0) return false;
  const exclude = resolve(root, gitDir.stdout.trim(), "info", "exclude");
  let content = "";
  try {
    content = existsSync(exclude) ? readFileSync(exclude, "utf8") : "";
  } catch {
    return false;
  }
  if (content.split(/\r?\n/).includes("graphify-out/")) return true;
  try {
    writeFileSync(exclude, `${content}${content.endsWith("\n") || !content ? "" : "\n"}graphify-out/\n`, "utf8");
    return true;
  } catch {
    return false;
  }
}

const args = process.argv.slice(2);
if (args.length < 1 || args.length > 2 || (args[1] && args[1] !== "--force")) {
  fail("uso: graphify-safe-sync.js <proyecto-local> [--force]");
}
if (!existsSync(GRAPHIFY)) fail("Graphify no está instalado en el runtime global", 1);

let project;
try {
  project = realpathSync(args[0]);
} catch {
  fail("el proyecto debe existir y ser accesible");
}

let info;
try {
  info = statSync(project);
} catch {
  fail("el proyecto debe ser accesible");
}
if (!info.isDirectory()) fail("el proyecto debe ser un directorio");
if (!underAllowedHome(project)) fail("el proyecto debe estar dentro de ~/workspace");

const root = gitRoot(project);
if (!root) fail("se omite: no es un repositorio Git no-bare", 0);
if (!gitClean(root)) fail("se omite: el repositorio tiene cambios sin confirmar", 0);
const tree = countSourceTree(root);
if (!tree) fail("se omite: el árbol contiene enlaces simbólicos o no es legible", 0);
if (tree.over) fail(`se omite: supera los límites (${tree.files} archivos, ${tree.bytes} bytes)`, 0);
if (!ensureLocalExclude(root)) fail("se omite: no se pudo excluir graphify-out/ localmente", 0);

const out = resolve(root, "graphify-out");
const baseArgs = ["extract", root, "--out", root, "--code-only", "--no-cluster", "--max-workers", "2"];
for (const exclude of EXCLUDES) baseArgs.push("--exclude", exclude);
if (args[1] === "--force") baseArgs.push("--force");

const environment = {
  PATH: process.env.PATH ?? "",
  HOME: process.env.HOME ?? "",
  LANG: "C.UTF-8",
  LC_ALL: "C.UTF-8",
  NO_PROXY: "*",
  no_proxy: "*",
  HTTP_PROXY: "",
  HTTPS_PROXY: "",
  ALL_PROXY: "",
  http_proxy: "",
  https_proxy: "",
  all_proxy: "",
  GRAPHIFY_OUT: "graphify-out",
};
const sandbox = "/usr/bin/bwrap";
const command = existsSync(sandbox)
  ? sandbox
  : GRAPHIFY;
const commandArgs = existsSync(sandbox)
  ? [
      "--unshare-net",
      "--ro-bind", "/", "/",
      "--bind", root, root,
      "--chdir", root,
      "--proc", "/proc",
      "--dev", "/dev",
      "--setenv", "HOME", environment.HOME,
      "--setenv", "PATH", environment.PATH,
      "--setenv", "LANG", environment.LANG,
      "--setenv", "LC_ALL", environment.LC_ALL,
      "--setenv", "GRAPHIFY_OUT", environment.GRAPHIFY_OUT,
      GRAPHIFY,
      ...baseArgs,
    ]
  : baseArgs;
const result = run(command, commandArgs, {
  cwd: root,
  env: environment,
});
if (result.error?.code === "ETIMEDOUT") fail("Graphify agotó el límite de 120 segundos", 1);
if (result.status !== 0) {
  process.stderr.write(result.stderr || result.stdout || "Graphify falló\n");
  process.exit(result.status || 1);
}
if (!existsSync(out)) fail("Graphify terminó sin crear graphify-out", 1);
process.stdout.write(result.stdout);
