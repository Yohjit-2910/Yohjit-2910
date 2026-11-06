// Generates the theme-aware SVG artwork for the GitHub profile README.
// Usage: node scripts/build-art.mjs assets
import { mkdirSync, writeFileSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const out = process.argv[2];
mkdirSync(out, { recursive: true });
for (const f of readdirSync(out)) if (f.endsWith(".svg")) rmSync(join(out, f));

const FONT = `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif`;
const MONO = `ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace`;

const THEMES = {
  dark: {
    bg: "#0d1117", card: "#151b23", border: "#2a313c", text: "#f0f6fc", muted: "#9198a1",
    chip: "#1c232d", chipBorder: "#2f3742", blobOpacity: 0.32,
  },
  light: {
    bg: "#ffffff", card: "#f6f8fa", border: "#d1d9e0", text: "#1f2328", muted: "#59636e",
    chip: "#ffffff", chipBorder: "#d1d9e0", blobOpacity: 0.20,
  },
};

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
// Rough text width for the system sans stack; errs on the wide side.
const textW = (s, size) => [...s].reduce((w, ch) => w + (/[A-Z]/.test(ch) ? 0.66 : /[ilj.,'²·/ ]/.test(ch) ? 0.3 : /[mw]/.test(ch) ? 0.85 : 0.56), 0) * size;

const gradient = (id, vertical = false) => `
    <linearGradient id="${id}" x1="0" y1="0" x2="${vertical ? 0 : 1}" y2="${vertical ? 1 : 0}">
      <stop offset="0" stop-color="#ff7a59"/>
      <stop offset="0.5" stop-color="#a855f7"/>
      <stop offset="1" stop-color="#22d3ee"/>
    </linearGradient>`;

const chipSvg = (t, x, y, name, color, size, h) => {
  const w = Math.ceil(textW(name, size)) + Math.round(size * 2.4) + 4;
  return {
    w,
    svg: `<g transform="translate(${x},${y})"><rect width="${w}" height="${h}" rx="${h / 2}" fill="${t.chip}" stroke="${t.chipBorder}"/><circle cx="${h * 0.5}" cy="${h / 2}" r="${h * 0.15}" fill="${color ?? t.text}"/><text x="${h * 0.5 + size * 0.85}" y="${h / 2 + size * 0.34}" font-family="${FONT}" font-size="${size}" fill="${t.text}">${esc(name)}</text></g>`,
  };
};

// ---------- Banner ----------
function banner(t) {
  const W = 1280, H = 320;
  const bars = 34, bx0 = 790, bw = 7, gap = 5.5, cy = 160;
  let wave = "";
  for (let i = 0; i < bars; i++) {
    const env = Math.sin((i / (bars - 1)) * Math.PI);
    const h = 18 + env * (70 + 40 * Math.abs(Math.sin(i * 1.7)));
    const x = bx0 + i * (bw + gap);
    const dur = (1.1 + ((i * 37) % 9) / 10).toFixed(2);
    const delay = (-((i * 53) % 17) / 10).toFixed(2);
    wave += `<rect class="bar" x="${x}" y="${(cy - h / 2).toFixed(1)}" width="${bw}" height="${h.toFixed(1)}" rx="3.5" fill="url(#g)" style="animation-duration:${dur}s;animation-delay:${delay}s"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Yohjit Chopra, Data and AI Engineer in Melbourne">
  <defs>${gradient("g")}
    <filter id="blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="60"/></filter>
    <clipPath id="clip"><rect width="${W}" height="${H}" rx="18"/></clipPath>
    <pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.2" fill="${t.muted}" opacity="0.25"/></pattern>
  </defs>
  <style>
    .bar { transform-box: fill-box; transform-origin: center; animation: pulse 1.4s ease-in-out infinite alternate; }
    @keyframes pulse { from { transform: scaleY(0.35); } to { transform: scaleY(1); } }
    .cursor { animation: blink 1.1s steps(1) infinite; }
    @keyframes blink { 50% { opacity: 0; } }
    .blob { animation: drift 14s ease-in-out infinite alternate; }
    @keyframes drift { to { transform: translate(40px, -20px); } }
    @media (prefers-reduced-motion: reduce) { .bar, .cursor, .blob { animation: none; } }
  </style>
  <g clip-path="url(#clip)">
    <rect width="${W}" height="${H}" fill="${t.bg}"/>
    <rect width="${W}" height="${H}" fill="url(#dots)"/>
    <g filter="url(#blur)" opacity="${t.blobOpacity}">
      <circle class="blob" cx="140" cy="40" r="170" fill="#ff7a59"/>
      <circle class="blob" cx="1050" cy="300" r="190" fill="#8b5cf6" style="animation-delay:-5s"/>
      <circle class="blob" cx="640" cy="-40" r="150" fill="#22d3ee" style="animation-delay:-9s"/>
    </g>
    <text x="72" y="92" font-family="${MONO}" font-size="17" fill="${t.muted}" letter-spacing="0.5">~/melbourne $ whoami</text>
    <text x="68" y="168" font-family="${FONT}" font-size="68" font-weight="800" fill="${t.text}" letter-spacing="-1.5">Yohjit Chopra</text>
    <rect x="72" y="190" width="132" height="5" rx="2.5" fill="url(#g)"/>
    <text x="72" y="236" font-family="${FONT}" font-size="24" fill="${t.text}" opacity="0.92">Data &amp; AI Engineer</text>
    <text x="72" y="272" font-family="${MONO}" font-size="16" fill="${t.muted}">pipelines · cloud · generative AI<tspan class="cursor" fill="${t.text}"> ▍</tspan></text>
    ${wave}
  </g>
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="17.5" fill="none" stroke="${t.border}"/>
</svg>`;
}

// ---------- Highlights strip ----------
const HIGHLIGHTS = [
  ["~25%", "monthly cloud cost cut", "moving VMs to managed Azure services"],
  ["2023", "National iAward winner", "with Project Echo, as HMI team lead"],
  ["Springer", "published co-author", "IoT smart restaurant system"],
  ["Honours", "B. Software Engineering", "Deakin University, AI major"],
];
function highlights(t) {
  const W = 1280, H = 150, gap = 16, n = HIGHLIGHTS.length, cw = (W - gap * (n - 1)) / n;
  let body = "";
  HIGHLIGHTS.forEach(([big, label, sub], i) => {
    const x = i * (cw + gap);
    body += `<g transform="translate(${x},0)">
      <rect x="0.5" y="0.5" width="${cw - 1}" height="${H - 1}" rx="15.5" fill="${t.card}" stroke="${t.border}"/>
      <text x="26" y="62" font-family="${FONT}" font-size="36" font-weight="800" fill="url(#g)" letter-spacing="-0.5">${esc(big)}</text>
      <text x="26" y="96" font-family="${FONT}" font-size="16" font-weight="600" fill="${t.text}">${esc(label)}</text>
      <text x="26" y="121" font-family="${FONT}" font-size="13.5" fill="${t.muted}">${esc(sub)}</text>
    </g>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(HIGHLIGHTS.map((h) => h.join(" ")).join("; "))}">
  <defs><linearGradient id="g" gradientUnits="userSpaceOnUse" x1="20" y1="0" x2="200" y2="0"><stop offset="0" stop-color="#ff7a59"/><stop offset="0.55" stop-color="#a855f7"/><stop offset="1" stop-color="#22d3ee"/></linearGradient></defs>
  ${body}
</svg>`;
}

// ---------- Experience timeline ----------
const EXPERIENCE = [
  { role: "Data & AI Engineer", org: "LivedCX (Datagamz Global)", when: "Oct 2024 – now", now: true,
    lines: ["Own production ETL/ELT pipelines and multi-tenant data connectors on Azure and AWS.", "Turn call-centre voice recordings and logs into insights with Azure AI Foundry and LLMs."],
    tags: [["Azure Data Factory", "#0078d4"], ["Databricks", "#ff3621"], ["Azure OpenAI", "#10a37f"], ["Functions", "#0062ad"], ["AWS", "#ff9900"]] },
  { role: "Team Lead, HMI · Junior Developer", org: "Project Echo, DataBytes", when: "Jul 2023 – May 2024",
    lines: ["Started as a junior developer, then led the human-machine interface team on the", "bioacoustics project that won a 2023 National iAward."],
    tags: [["Python", "#3776ab"], ["FastAPI", "#009688"], ["Node.js", "#5fa04e"], ["MongoDB", "#47a248"]] },
  { role: "Bachelor of Software Engineering (Honours)", org: "Deakin University", when: "2021 – 2025",
    lines: ["Major in Artificial Intelligence, with projects across IoT, computer vision and web."],
    tags: [] },
];
function experience(t) {
  const W = 1280, pad = 40, railX = pad + 8;
  let y = pad + 62, body = "";
  const dots = [];
  for (const e of EXPERIENCE) {
    dots.push(y);
    body += `<text x="${railX + 30}" y="${y + 6}" font-family="${FONT}" font-size="19" font-weight="700" fill="${t.text}">${esc(e.role)}</text>`;
    body += `<text x="${railX + 30}" y="${y + 32}" font-family="${FONT}" font-size="15" fill="${t.text}" opacity="0.85">${esc(e.org)}</text>`;
    const ww = Math.ceil(textW(e.when, 13)) + 26;
    body += `<g transform="translate(${W - pad - ww},${y - 12})"><rect width="${ww}" height="26" rx="13" fill="${e.now ? "url(#g)" : "none"}" stroke="${e.now ? "none" : t.chipBorder}"/><text x="${ww / 2}" y="17.5" text-anchor="middle" font-family="${MONO}" font-size="13" font-weight="${e.now ? 700 : 400}" fill="${e.now ? "#ffffff" : t.muted}">${esc(e.when)}</text></g>`;
    let ly = y + 60;
    for (const l of e.lines) { body += `<text x="${railX + 30}" y="${ly}" font-family="${FONT}" font-size="15" fill="${t.muted}">${esc(l)}</text>`; ly += 23; }
    if (e.tags.length) {
      let tx = railX + 30;
      for (const [n, c] of e.tags) { const ch = chipSvg(t, tx, ly - 8, n, c, 13, 26); body += ch.svg; tx += ch.w + 8; }
      ly += 30;
    }
    y = ly + 34;
  }
  const H = y - 34 + pad - 6;
  const rail = `<rect x="${railX - 1.5}" y="${dots[0]}" width="3" height="${dots[dots.length - 1] - dots[0]}" rx="1.5" fill="url(#gv)" opacity="0.7"/>`;
  const dotSvg = dots.map((d, i) => `<circle cx="${railX}" cy="${d}" r="8" fill="${t.card}" stroke="url(#g)" stroke-width="3"/>${i === 0 ? `<circle class="live" cx="${railX}" cy="${d}" r="3.5" fill="#22c55e"/>` : ""}`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Experience: ${esc(EXPERIENCE.map((e) => `${e.role}, ${e.org}, ${e.when}`).join("; "))}">
  <defs>${gradient("g")}${gradient("gv", true)}</defs>
  <style>.live { animation: live 1.6s ease-in-out infinite; } @keyframes live { 50% { opacity: 0.25; } } @media (prefers-reduced-motion: reduce) { .live { animation: none; } }</style>
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="17.5" fill="${t.card}" stroke="${t.border}"/>
  <text x="${pad}" y="${pad + 10}" font-family="${FONT}" font-size="20" font-weight="700" fill="${t.text}">Experience</text>
  <rect x="${pad + 120}" y="${pad + 1}" width="40" height="4" rx="2" fill="url(#g)"/>
  ${rail}${dotSvg}${body}
</svg>`;
}

// ---------- Toolbox ----------
const STACK = [
  ["Azure", [["Data Factory", "#0078d4"], ["Databricks", "#ff3621"], ["Functions", "#0062ad"], ["Container Apps", "#0078d4"], ["Logic Apps", "#3c8bdb"], ["AI Foundry", "#7f5af0"]]],
  ["AWS", [["Lambda", "#ff9900"], ["S3", "#569a31"], ["EC2", "#ff9900"], ["IAM", "#dd344c"], ["CloudWatch", "#e7157b"]]],
  ["AI & ML", [["Azure OpenAI", "#10a37f"], ["LLMs & RAG", "#a855f7"], ["Prompt engineering", "#ec4899"], ["Computer vision", "#5c3ee8"], ["Neural networks", "#22c55e"], ["Predictive models", "#f59e0b"]]],
  ["Data", [["Python", "#3776ab"], ["SQL", "#e38c00"], ["PostgreSQL", "#4169e1"], ["MySQL", "#00758f"], ["MongoDB", "#47a248"], ["Power BI", "#f2c811"], ["Tableau", "#e97627"]]],
  ["Software", [["JavaScript", "#f7df1e"], ["TypeScript", "#3178c6"], ["React", "#61dafb"], ["Next.js", null], ["Node.js", "#5fa04e"], ["FastAPI", "#009688"], ["C#", "#9b4f96"], ["C++", "#00599c"], ["PHP", "#777bb4"]]],
  ["DevOps & IoT", [["Docker", "#2496ed"], ["Git", "#f05032"], ["Bitbucket", "#2684ff"], ["CI/CD", "#22c55e"], ["Raspberry Pi", "#c51a4a"], ["Arduino", "#00878f"], ["MQTT", "#9b59b6"]]],
];
function toolbox(t) {
  const W = 1280, pad = 40, labelW = 170, chipH = 34, size = 15;
  let y = pad + 46, body = "";
  for (const [label, chips] of STACK) {
    let x = pad + labelW;
    const rowY = y;
    for (const [name, color] of chips) {
      const probe = chipSvg(t, 0, 0, name, color, size, chipH);
      if (x + probe.w > W - pad) { y += chipH + 10; x = pad + labelW; }
      const ch = chipSvg(t, x, y, name, color, size, chipH);
      body += ch.svg; x += ch.w + 10;
    }
    body += `<text x="${pad}" y="${rowY + chipH / 2 + 5}" font-family="${MONO}" font-size="14" fill="${t.muted}" letter-spacing="0.6">${esc(label.toUpperCase())}</text>`;
    y += chipH + 22;
  }
  const H = y - 22 + pad + 6;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Toolbox: ${esc(STACK.map(([l, c]) => `${l}: ${c.map(([n]) => n).join(", ")}`).join("; "))}">
  <defs>${gradient("g")}</defs>
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="17.5" fill="${t.card}" stroke="${t.border}"/>
  <text x="${pad}" y="${pad + 10}" font-family="${FONT}" font-size="20" font-weight="700" fill="${t.text}">Toolbox</text>
  <rect x="${pad + 98}" y="${pad + 1}" width="40" height="4" rx="2" fill="url(#g)"/>
  ${body}
</svg>`;
}

// ---------- Project cards ----------
const PROJECTS = [
  { slug: "project-echo", emoji: "🐾", title: "Project Echo", status: "2023 iAward winner",
    lines: ["Bioacoustics platform that identifies animals from field", "recordings to help conservationists. I led the HMI team", "and built sign-up, login and OTP password reset."],
    tags: [["Python", "#3776ab"], ["FastAPI", "#009688"], ["Node.js", "#5fa04e"], ["ML", "#22c55e"]] },
  { slug: "stonks", emoji: "📈", title: "STONKS", status: "Side project",
    lines: ["Autonomous 24/7 trading engine. Ten independent", "algorithms vote on entries, AI reads global news for", "market impact, and reinforcement learning tunes it."],
    tags: [["Python", "#3776ab"], ["LLMs", "#a855f7"], ["Reinforcement learning", "#22c55e"]] },
  { slug: "sees", emoji: "🍽️", title: "SEES", status: "Smart eatery & evacuation",
    lines: ["Sensor-driven system combining restaurant food", "ordering with emergency evacuation and safety", "features, built as a university team project."],
    tags: [["IoT", "#9b59b6"], ["Sensors", "#f59e0b"], ["Web", "#61dafb"]] },
  { slug: "server-cool", emoji: "❄️", title: "Server Cool", status: "University project",
    lines: ["Web app that monitors server-room temperature and", "uses AI models to adjust cooling automatically,", "cutting cooling costs."],
    tags: [["IoT", "#9b59b6"], ["AI", "#a855f7"], ["Web app", "#61dafb"]] },
  { slug: "fire-detection", emoji: "🔥", title: "Fire detection", status: "Computer vision",
    lines: ["Imaging-based system that spots fire hazards in", "real time with computer vision, for earlier warnings", "and faster response."],
    tags: [["Python", "#3776ab"], ["OpenCV", "#5c3ee8"], ["Computer vision", "#ef4444"]] },
  { slug: "mate-and-co", emoji: "🛍️", title: "Mate & Co.", status: "Building now",
    lines: ["A shop, blog, scam-alert hub and Instagram-synced", "feed for international students in Australia, with", "a full admin panel and Stripe checkout."],
    tags: [["Next.js 15", null], ["TypeScript", "#3178c6"], ["Prisma", "#5a67d8"], ["Stripe", "#635bff"]] },
];
function card(p, t) {
  const W = 620, H = 220, pad = 28;
  let tx = pad, tags = "";
  for (const [name, color] of p.tags) { const ch = chipSvg(t, tx, H - pad - 26, name, color, 13, 26); tags += ch.svg; tx += ch.w + 8; }
  const sw = Math.ceil(textW(p.status, 12)) + 22;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(p.title)}: ${esc(p.lines.join(" "))}">
  <defs>${gradient("g")}<clipPath id="c"><rect width="${W}" height="${H}" rx="16"/></clipPath></defs>
  <g clip-path="url(#c)"><rect width="${W}" height="${H}" fill="${t.card}"/><rect width="${W}" height="4" fill="url(#g)"/></g>
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="15.5" fill="none" stroke="${t.border}"/>
  <text x="${pad}" y="${pad + 28}" font-size="24">${p.emoji}</text>
  <text x="${pad + 38}" y="${pad + 26}" font-family="${FONT}" font-size="21" font-weight="700" fill="${t.text}">${esc(p.title)}</text>
  <g transform="translate(${W - pad - sw},${pad + 8})"><rect width="${sw}" height="24" rx="12" fill="none" stroke="${t.chipBorder}"/><text x="${sw / 2}" y="16.5" text-anchor="middle" font-family="${MONO}" font-size="12" fill="${t.muted}">${esc(p.status)}</text></g>
  ${p.lines.map((l, i) => `<text x="${pad}" y="${pad + 66 + i * 22}" font-family="${FONT}" font-size="15" fill="${t.muted}">${esc(l)}</text>`).join("")}
  ${tags}
</svg>`;
}

for (const [mode, t] of Object.entries(THEMES)) {
  writeFileSync(join(out, `banner-${mode}.svg`), banner(t));
  writeFileSync(join(out, `highlights-${mode}.svg`), highlights(t));
  writeFileSync(join(out, `experience-${mode}.svg`), experience(t));
  writeFileSync(join(out, `toolbox-${mode}.svg`), toolbox(t));
  for (const p of PROJECTS) writeFileSync(join(out, `card-${p.slug}-${mode}.svg`), card(p, t));
}
console.log("wrote", out);
