import { chromium, type Browser, type Page } from "@playwright/test";

const URL = process.env.URL || "http://localhost:3000";
const OUTPUT_DIR = "screenshots";
const VIEWPORTS = {
  desktop: { width: 1280, height: 800 },
  mobile: { width: 390, height: 844 },
} as const;

async function takeScreenshots() {
  const browser: Browser = await chromium.launch({ headless: true });

  try {
    for (const [label, viewport] of Object.entries(VIEWPORTS)) {
      const context = await browser.newContext({ viewport });
      const page: Page = await context.newPage();
      await page.goto(URL, { waitUntil: "networkidle" });

      const filePath = `${OUTPUT_DIR}/${label}.png`;
      await page.screenshot({ path: filePath, fullPage: true });
      console.log(`Saved ${filePath}`);

      await context.close();
    }
  } finally {
    await browser.close();
  }
}

takeScreenshots().catch((err) => {
  console.error("Screenshot failed:", err);
  process.exit(1);
});
