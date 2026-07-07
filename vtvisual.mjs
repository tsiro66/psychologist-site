import puppeteer from "puppeteer-core";
const EXEC = "/usr/bin/chromium";
const BASE = "http://localhost:4321/";

const browser = await puppeteer.launch({ executablePath: EXEC, headless: "new", args: ["--no-sandbox","--disable-setuid-sandbox","--disable-dev-shm-usage"] });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900 });
page.on("pageerror", e => console.log("[pageerror]", e.message));

await page.goto(BASE, { waitUntil: "networkidle2" });

// Screenshot the old page (home) for reference
await page.screenshot({ path: "/tmp/vt-before-nav.png" });

const navTo = h => page.evaluate((hh)=>{const a=[...document.querySelectorAll('a')].find(x=>x.getAttribute('href')===hh||x.getAttribute('href')===hh+'/');if(!a)return false;a.click();return true;},h);

// Click and grab frames during the transition
await navTo("/services");
// capture several frames in the first 600ms (Astro VT default ~250-400ms)
for (const ms of [60, 120, 180, 260]) {
  await new Promise(r=>setTimeout(r, ms - (ms===60?0:60)));
  await page.screenshot({ path: `/tmp/vt-frame-${ms}.png` });
}
await new Promise(r=>setTimeout(r, 1500));
await page.screenshot({ path: "/tmp/vt-after-nav.png" });

// Also dump whether the VT pseudo element tree is present mid-nav on a second nav
await navTo("/");
await new Promise(r=>setTimeout(r, 80));
const mid = await page.evaluate(() => {
  // presence of view-transition pseudo is detectable via computed style on html
  const cs = getComputedStyle(document.documentElement, "::view-transition-group");
  return {
    groupPseudoExists: cs.display !== "inline" && cs.animationName !== undefined && cs.getPropertyValue("animation-name") !== "",
    animCount: document.getAnimations().filter(a => String(a.pseudoElement||"").includes("view-transition")).length,
    allAnims: document.getAnimations().length,
  };
});
console.log("MID-NAV vt pseudo:", JSON.stringify(mid));
await new Promise(r=>setTimeout(r, 1500));

await browser.close();
console.log("frames saved");