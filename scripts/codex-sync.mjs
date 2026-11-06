// Updates the "Codex activity" card from the Codex logs on this computer, then
// pushes the change to GitHub. Run from the repo root:  node scripts/codex-sync.mjs
//
// Codex saves every session as a .jsonl file under ~/.codex/sessions (and
// ~/.codex/archived_sessions). We add up the tokens in those files per day.
// Days up to the baseline date keep the snapshot from the Codex profile page;
// later days use these local logs, so usage on other devices or in the cloud is
// not counted (the card can under-count, never over-count).
//
// Flags:  --dry-run   update files but don't commit or push
//         --no-push   commit but don't push
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync, createReadStream } from "node:fs";
import { join, basename } from "node:path";
import { homedir } from "node:os";
import { createInterface } from "node:readline";
import { execFileSync } from "node:child_process";

const DRY = process.argv.includes("--dry-run");
const NO_PUSH = process.argv.includes("--no-push");
const CODEX_HOME = process.env.CODEX_HOME || join(homedir(), ".codex");
const DATA = "data/codex.json";

// Token thresholds for the five colour levels on days measured locally.
const LEVELS = [1, 50e6, 100e6, 250e6]; // >0, ≥50M, ≥100M, ≥250M

const localDate = (ts) => new Date(ts).toLocaleDateString("en-CA"); // YYYY-MM-DD in local time
const today = new Date().toLocaleDateString("en-CA");

function findLogs(dir, out = new Map()) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) findLogs(p, out);
    else if (name.endsWith(".jsonl")) out.set(basename(p), p); // same file archived twice counts once
  }
  return out;
}

async function readSession(path, tokensByDay) {
  let prevTotal = 0, turnStart = null, longest = 0;
  const lines = createInterface({ input: createReadStream(path, "utf8"), crlfDelay: Infinity });
  for await (const line of lines) {
    if (!line.includes('"event_msg"')) continue;
    let ev; try { ev = JSON.parse(line); } catch { continue; }
    const p = ev.payload || {}, ts = ev.timestamp;
    if (!ts) continue;
    if (p.type === "token_count" && p.info) {
      const total = p.info.total_token_usage?.total_tokens;
      let delta = 0;
      if (typeof total === "number" && total >= prevTotal) { delta = total - prevTotal; prevTotal = total; }
      else delta = p.info.last_token_usage?.total_tokens ?? 0;
      if (delta > 0) { const d = localDate(ts); tokensByDay[d] = (tokensByDay[d] || 0) + delta; }
    } else if (p.type === "task_started" || p.type === "turn_started") {
      turnStart = Date.parse(ts);
    } else if ((p.type === "task_complete" || p.type === "turn_complete") && turnStart) {
      longest = Math.max(longest, (Date.parse(ts) - turnStart) / 60000);
      turnStart = null;
    }
  }
  return longest;
}

const fmtTokens = (n) => n >= 1e9 ? `${+(n / 1e9).toFixed(1)}B` : n >= 1e6 ? `${+(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}K` : `${n}`;
const fmtMinutes = (m) => { m = Math.round(m); const h = Math.floor(m / 60); return h ? `${h}h ${m % 60}m` : `${m}m`; };
const level = (t) => LEVELS.reduce((l, th, i) => (t >= th ? i + 1 : l), 0);
const addDays = (iso, n) => { const d = new Date(iso + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

const git = (...a) => execFileSync("git", a, { encoding: "utf8" }).trim();
// Get the latest version first (including any script updates), so our commit
// never conflicts with changes made on GitHub.
if (!DRY) git("pull", "--rebase", "--autostash", "--quiet");

// ---- Read logs ----
const logs = findLogs(join(CODEX_HOME, "sessions"));
findLogs(join(CODEX_HOME, "archived_sessions"), logs);
const tokensByDay = {};
let longestLocal = 0;
for (const p of logs.values()) longestLocal = Math.max(longestLocal, await readSession(p, tokensByDay));

// ---- Merge with the baseline snapshot ----
const data = JSON.parse(readFileSync(DATA, "utf8"));
const base = data.baseline;
const after = Object.fromEntries(Object.entries(tokensByDay).filter(([d]) => d > base.date && d <= today));
data.local = { tokens: after, longestTaskMinutes: Math.round(longestLocal) };

const levels = { ...base.levels };
for (let d = addDays(base.date, 1); d <= today; d = addDays(d, 1)) levels[d] = level(after[d] || 0);
// Keep one year of days.
const cutoff = addDays(today, -400);
for (const d of Object.keys(levels)) if (d < cutoff) delete levels[d];

const days = Object.keys(levels).sort();
let longestStreak = base.longestStreak, run = 0;
for (const d of days) { run = levels[d] > 0 ? run + 1 : 0; longestStreak = Math.max(longestStreak, run); }
// Current streak: ending today, or yesterday if today has no usage yet.
let current = 0, d = levels[today] > 0 ? today : addDays(today, -1);
while (levels[d] > 0) { current++; d = addDays(d, -1); }

const localTotal = Object.values(after).reduce((a, b) => a + b, 0);
const peak = Math.max(base.peakTokens, ...Object.values(after), 0);
const longestTask = Math.max(base.longestTaskMinutes, longestLocal);
data.levels = levels;
data.updated = today;
data.stats = {
  lifetimeTokens: fmtTokens(base.lifetimeTokens + localTotal),
  peakTokens: fmtTokens(peak),
  longestTask: fmtMinutes(longestTask),
  longestStreak: `${longestStreak} day${longestStreak === 1 ? "" : "s"}`,
  currentStreak: `${current} day${current === 1 ? "" : "s"}`,
};
writeFileSync(DATA, JSON.stringify(data, null, 1) + "\n");
execFileSync(process.execPath, ["scripts/build-codex.mjs"], { stdio: "inherit" });

console.log(`Read ${logs.size} Codex session file(s) from ${CODEX_HOME}`);
console.log(`Since ${base.date}: ${fmtTokens(localTotal)} tokens on ${Object.keys(after).length} day(s)`);
console.log("Card:", data.stats);
if (DRY) { console.log("Dry run: not committing."); process.exit(0); }

// ---- Commit and push ----
// Committed as an unlinked "Codex sync" author, so these automatic updates
// do NOT add squares to your GitHub contribution graph.
const FILES = [DATA, "assets/codex-dark.svg", "assets/codex-light.svg", "README.md"];
git("add", ...FILES);
if (!git("status", "--porcelain", "--", ...FILES)) { console.log("No changes."); process.exit(0); }
git("-c", "user.name=Codex sync", "-c", "user.email=codex-sync@localhost", "commit", "-m", `Update Codex activity (${today})`);
if (NO_PUSH) process.exit(0);
git("push");
console.log("Pushed to GitHub.");
