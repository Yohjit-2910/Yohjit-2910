// One-off probe: can a GitHub runner read the public Codex profile page?
import { chromium } from "playwright";
const URL = "https://chatgpt.com/u/mf4myc4hnv";

const plain = await fetch(URL, { headers: { "user-agent": "Mozilla/5.0" } });
const body = await plain.text();
console.log("PLAIN status", plain.status, "len", body.length, "hasLifetime", body.includes("Lifetime"), "cf", /cloudflare|challenge/i.test(body));

const browser = await chromium.launch();
const page = await browser.newPage({ userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36" });
page.on("response", async (r) => {
  const ct = r.headers()["content-type"] || "";
  if (ct.includes("json") && !r.url().includes("statsig") && !r.url().includes("sentry")) {
    let snippet = ""; try { snippet = (await r.text()).slice(0, 600); } catch {}
    console.log("JSON", r.status(), r.url().slice(0, 200), "\n   ", snippet.replace(/\s+/g, " "));
  }
});
const resp = await page.goto(URL, { waitUntil: "networkidle", timeout: 60000 }).catch((e) => (console.log("GOTO error", e.message), null));
console.log("BROWSER status", resp?.status(), "title", await page.title());
await page.waitForTimeout(4000);
const text = await page.evaluate(() => document.body.innerText);
console.log("TEXT----\n" + text.slice(0, 1500) + "\n----");
const cells = await page.evaluate(() => [...document.querySelectorAll("[title],[aria-label],[data-date],[data-tooltip]")].slice(0, 40).map((e) => [e.tagName, e.getAttribute("title"), e.getAttribute("aria-label"), e.getAttribute("data-date"), e.className?.toString().slice(0, 60)]));
console.log("ATTRS", JSON.stringify(cells));
await browser.close();
