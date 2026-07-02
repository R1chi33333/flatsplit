/**
 * Capture product screenshots from the live demo for the landing
 * page and README. Run: node scripts/capture-screenshots.mjs
 */
import { chromium } from '@playwright/test';

const BASE = process.env.SHOT_BASE_URL ?? 'https://flatsplit-nz.vercel.app';

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1280, height: 800 },
  deviceScaleFactor: 2,
  colorScheme: 'dark',
});

await page.goto(`${BASE}/login`);
await page.getByRole('button', { name: 'Open the demo flat' }).click();
await page.waitForURL('**/app');

await page.screenshot({ path: 'public/shots/overview.png' });

await page.goto(`${BASE}/app/settle`);
await page.waitForSelector('text=transfers to settle everything');
await page.screenshot({ path: 'public/shots/settle.png' });

await page.goto(`${BASE}/app/expenses`);
await page.waitForSelector('tbody tr');
await page.screenshot({ path: 'public/shots/expenses.png' });

await browser.close();
console.log('captured 3 screenshots into public/shots/');
