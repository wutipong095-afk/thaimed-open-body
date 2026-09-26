import puppeteer from "puppeteer-core";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const URL = process.env.APP_URL || "https://wutipong095-afk.github.io/thaimed-open-body/web/";
const OUT = process.argv[2] || "docs/screenshots";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe",
  userDataDir: mkdtempSync(join(tmpdir(), "thaimed-media-")),
  headless: "new",
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--lang=th-TH"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
await page.goto(URL, { waitUntil: "networkidle0" });
await sleep(800);

// 1) 2D, patient mode: back view, left scapula
await page.click('.view-btn[data-view="posterior"]');
await sleep(300);
await page.$eval('#view-posterior .hotspot[data-region="scapula_left"]', (el) =>
  el.dispatchEvent(new MouseEvent("click", { bubbles: true }))
);
await sleep(600);
await page.screenshot({ path: `${OUT}/01-2d-patient.png` });
console.log("1:", await page.$eval("#detail-title", (e) => e.textContent));

// 2) 3D: wait for the model, then click a muscle
await page.click('.mode-btn[data-mode="3d"]');
for (let i = 0; i < 120; i++) {
  await sleep(1000);
  const hint = await page.$eval("#stage-hint", (e) => e.textContent);
  if (/พร้อม|ไม่ได้/.test(hint)) { console.log("3d:", hint); break; }
}
await sleep(1500);
const box = await (await page.$("#figure-3d canvas")).boundingBox();
// Try points around the upper body until a muscle is picked.
const tries = [[0.44, 0.3], [0.56, 0.3], [0.5, 0.35], [0.42, 0.4], [0.58, 0.4], [0.5, 0.45], [0.45, 0.55]];
for (const [fx, fy] of tries) {
  await page.mouse.click(box.x + box.width * fx, box.y + box.height * fy);
  await sleep(700);
  const shown = await page.$eval("#detail-muscle", (e) => !e.hidden && e.textContent);
  if (shown) { console.log("2:", shown); break; }
}
await page.screenshot({ path: `${OUT}/02-3d-muscle.png` });

// 3) Learner mode, 2D, right shoulder: region knowledge from the public knowledge base
await page.click('.role-btn[data-role="learner"]');
await page.click('.mode-btn[data-mode="2d"]');
await page.click('.view-btn[data-view="anterior"]');
await sleep(400);
await page.$eval('#view-anterior .hotspot[data-region="shoulder_right"]', (el) =>
  el.dispatchEvent(new MouseEvent("click", { bubbles: true }))
);
await sleep(800);
await page.setViewport({ width: 1440, height: 1500, deviceScaleFactor: 2 });
await page.evaluate(() => window.scrollTo(0, 0));
await sleep(500);
await page.screenshot({ path: `${OUT}/03-learner.png` });
console.log("3:", await page.$$eval("#detail-knowledge .k-section", (e) => e.map((x) => x.textContent)));

// 4) Ask the knowledge base, with a red-flag phrase to show the guardrail
await page.type("#ask-input", "ยักไหล่แล้วปวดบ่า แน่นหน้าอก");
await page.click("#ask-form button");
await sleep(600);
const ask = await page.$(".ask-box");
await ask.screenshot({ path: `${OUT}/04-ask-knowledge.png` });
console.log("4:", await page.$eval("#ask-alert", (e) => e.textContent), await page.$$eval("#ask-results .vault-card", (e) => e.length));

await browser.close();
