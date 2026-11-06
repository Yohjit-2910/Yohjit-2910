// Renders the "Codex activity" card from data/codex.json.
// Usage: node scripts/build-codex.mjs   (run from the repo root)
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";

const data = JSON.parse(readFileSync("data/codex.json", "utf8"));

const FONT = `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif`;
const MONO = `ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace`;
const THEMES = {
  dark: { card: "#151b23", border: "#2a313c", text: "#f0f6fc", muted: "#9198a1", tile: "#1c232d", empty: "#232a33",
    levels: ["#232a33", "#0c3a66", "#0a5299", "#1683f5", "#66b5ff"] },
  light: { card: "#f6f8fa", border: "#d1d9e0", text: "#1f2328", muted: "#59636e", tile: "#ffffff", empty: "#e6eaef",
    levels: ["#e6eaef", "#b9dbff", "#7dbcff", "#2f8fff", "#0a5fcc"] },
};
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const day = (iso) => new Date(iso + "T00:00:00Z");
const iso = (d) => d.toISOString().slice(0, 10);
const updated = day(data.updated);
// 52 weeks ending with the week (Sun–Sat) that contains the update date.
const lastSunday = new Date(updated); lastSunday.setUTCDate(updated.getUTCDate() - updated.getUTCDay());
const first = new Date(lastSunday); first.setUTCDate(first.getUTCDate() - 7 * 51);

const STATS = [
  [data.stats.lifetimeTokens, "Lifetime tokens"],
  [data.stats.todayTokens ?? "0", "Today’s tokens"],
  [data.stats.longestTask, "Longest task"],
  [data.stats.longestStreak, "Longest streak"],
  [data.stats.currentStreak, "Current streak"],
];

function render(t) {
  const W = 1280, pad = 40, cell = 18, gap = 4.6, step = cell + gap;
  const gridW = 52 * step - gap, gx = pad + (W - 2 * pad - gridW) / 2 + 14;
  let out = "";

  // Stats row
  const sy = pad + 34, sh = 84, sgap = 12, sw = (W - 2 * pad - sgap * 4) / 5;
  STATS.forEach(([v, label], i) => {
    const x = pad + i * (sw + sgap);
    out += `<rect x="${x}" y="${sy}" width="${sw}" height="${sh}" rx="12" fill="${t.tile}" stroke="${t.border}"/>`;
    out += `<text x="${x + sw / 2}" y="${sy + 38}" text-anchor="middle" font-family="${FONT}" font-size="24" font-weight="700" fill="${t.text}">${esc(v)}</text>`;
    out += `<text x="${x + sw / 2}" y="${sy + 63}" text-anchor="middle" font-family="${FONT}" font-size="14" fill="${t.muted}">${esc(label)}</text>`;
  });

  // Heatmap
  const gy = sy + sh + 52;
  let lastMonth = -1;
  for (let c = 0; c < 52; c++) {
    const weekStart = new Date(first); weekStart.setUTCDate(first.getUTCDate() + 7 * c);
    const m = weekStart.getUTCMonth();
    if (m !== lastMonth && c < 50) {
      if (lastMonth !== -1 || weekStart.getUTCDate() <= 7)
        out += `<text x="${gx + c * step}" y="${gy - 10}" font-family="${FONT}" font-size="13" fill="${t.muted}">${MONTHS[m]}</text>`;
      lastMonth = m;
    }
    for (let r = 0; r < 7; r++) {
      const d = new Date(weekStart); d.setUTCDate(weekStart.getUTCDate() + r);
      if (d > updated) continue;
      const lvl = data.levels[iso(d)] ?? 0;
      out += `<rect x="${(gx + c * step).toFixed(1)}" y="${(gy + r * step).toFixed(1)}" width="${cell}" height="${cell}" rx="4" fill="${t.levels[lvl]}"><title>${iso(d)}</title></rect>`;
    }
  }
  ["Mon", "Wed", "Fri"].forEach((d, i) => {
    out += `<text x="${gx - 12}" y="${gy + (1 + 2 * i) * step + 13}" text-anchor="end" font-family="${FONT}" font-size="12" fill="${t.muted}">${d}</text>`;
  });

  // Footer: legend + updated date
  const fy = gy + 7 * step + 26;
  out += `<text x="${gx}" y="${fy}" font-family="${MONO}" font-size="12" fill="${t.muted}">updated ${esc(data.updated)}</text>`;
  const lx = gx + gridW - 5 * 18 - 70;
  out += `<text x="${lx - 8}" y="${fy}" text-anchor="end" font-family="${FONT}" font-size="12" fill="${t.muted}">Less</text>`;
  t.levels.forEach((c, i) => { out += `<rect x="${lx + i * 18}" y="${fy - 11}" width="13" height="13" rx="3" fill="${c}"/>`; });
  out += `<text x="${lx + 5 * 18 + 4}" y="${fy}" font-family="${FONT}" font-size="12" fill="${t.muted}">More</text>`;

  const H = fy + pad - 8;
  const active = Object.values(data.levels).filter((v) => v > 0).length;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Codex activity: ${esc(STATS.map(([v, l]) => `${l} ${v}`).join(", "))}; active on ${active} days in the last year">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff7a59"/><stop offset="0.5" stop-color="#a855f7"/><stop offset="1" stop-color="#22d3ee"/></linearGradient></defs>
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="17.5" fill="${t.card}" stroke="${t.border}"/>
  <text x="${pad}" y="${pad + 10}" font-family="${FONT}" font-size="20" font-weight="700" fill="${t.text}">Codex activity</text>
  <rect x="${pad + 160}" y="${pad + 1}" width="40" height="4" rx="2" fill="url(#g)"/>
  <text x="${W - pad}" y="${pad + 10}" text-anchor="end" font-family="${FONT}" font-size="14" fill="${t.muted}">AI pair-programming, tokens per day</text>
  ${out}
</svg>`;
}

for (const [mode, t] of Object.entries(THEMES)) writeFileSync(`assets/codex-${mode}.svg`, render(t));
console.log("wrote assets/codex-{dark,light}.svg");

// Give the images a new URL on each update (?v=date) so browsers and caches
// can't keep showing an old copy.
if (existsSync("README.md")) {
  const readme = readFileSync("README.md", "utf8");
  const version = createHash("sha256").update(JSON.stringify(data)).digest("hex").slice(0, 16);
  const next = readme.replace(/assets\/codex-(dark|light)\.svg(\?v=[\w-]*)?/g, `assets/codex-$1.svg?v=${version}`);
  if (next !== readme) writeFileSync("README.md", next);
}
