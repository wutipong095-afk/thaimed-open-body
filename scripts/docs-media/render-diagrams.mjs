import puppeteer from "puppeteer-core";
import { mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const DIR = process.argv[2] || "docs/diagrams";
const FONTS = pathToFileURL(resolve("web/vendor/fonts/fonts.css")).href;

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe",
  userDataDir: mkdtempSync(join(tmpdir(), "thaimed-media-")),
  headless: "new",
  args: ["--allow-file-access-from-files"],
});
const page = await browser.newPage();
for (const f of readdirSync(DIR).filter((n) => n.endsWith(".svg"))) {
  const svg = readFileSync(join(DIR, f), "utf8");
  const w = Number(svg.match(/width="(\d+)"/)[1]);
  const h = Number(svg.match(/height="(\d+)"/)[1]);
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 2 });
  await page.setContent(
    `<!doctype html><html><head><link rel="stylesheet" href="${FONTS}"><style>body{margin:0}</style></head><body>${svg}</body></html>`,
    { waitUntil: "load" }
  );
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(DIR, f.replace(".svg", ".png")) });
  console.log("rendered", f, w, h);
}
await browser.close();
