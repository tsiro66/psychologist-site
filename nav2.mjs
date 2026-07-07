import puppeteer from "puppeteer-core";

const browser = await puppeteer.launch({
  executablePath: "/usr/bin/chromium",
  headless: "new",
  args: ["--no-sandbox"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900 });

await page.goto("http://localhost:4321/", { waitUntil: "networkidle0" });

// Navigate and inspect immediately at multiple points
const results = await page.evaluate(async () => {
  const out = [];
  // click the about link
  document.querySelector('a[href="/about"]').click();
  // poll
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 50));
    const nav = document.querySelector(".navbar");
    const htmlHas = document.documentElement.classList.contains("astro-vt-nav");
    const cs = nav ? getComputedStyle(nav) : null;
    const matches = nav ? nav.matches(".astro-vt-nav .animate-nav-drop[data-astro-cid-l7arcky5]") : null;
    out.push({ t: i*50, htmlHas, animName: cs?.animationName, opacity: cs?.opacity, matches });
  }
  return out;
});

console.log("t | htmlHas | animName | opacity | matchesSelector");
for (const r of results) {
  console.log(`${r.t} | ${r.htmlHas} | ${r.animName} | ${r.opacity} | ${r.matches}`);
}

// Dump matching CSS rules from stylesheets
const rules = await page.evaluate(() => {
  const found = [];
  for (const sheet of document.styleSheets) {
    let rules;
    try { rules = sheet.cssRules; } catch { continue; }
    for (const r of rules) {
      if (r.selectorText && r.selectorText.includes("astro-vt-nav")) {
        found.push({ sel: r.selectorText, css: r.cssText.slice(0, 200) });
      }
    }
  }
  return found;
});
console.log("=== MATCHING RULES ===");
console.log(JSON.stringify(rules, null, 2));

await browser.close();
