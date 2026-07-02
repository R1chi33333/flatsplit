/**
 * Mobile responsiveness audit: loads key pages at iPhone width and
 * reports any horizontal overflow plus screenshots for eyeballing.
 * Run: node scripts/mobile-audit.mjs
 */
import { chromium } from '@playwright/test';

const BASE = process.env.SHOT_BASE_URL ?? 'https://flatsplit-nz.vercel.app';

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 375, height: 812 },
  deviceScaleFactor: 2,
  colorScheme: 'dark',
});

await page.goto(`${BASE}/login`);
await page.getByRole('button', { name: 'Open the demo flat' }).click();
await page.waitForURL('**/app');

const targets = [
  ['landing', '/'],
  ['login-signed-in-redirect', '/login'],
  ['overview', '/app'],
  ['expenses', '/app/expenses'],
  ['import', '/app/expenses/import'],
  ['settle', '/app/settle'],
];

let failures = 0;
for (const [name, path] of targets) {
  await page.goto(`${BASE}${path}`);
  await page.waitForLoadState('networkidle');
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  await page.screenshot({ path: `mobile-audit/${name}.png`, fullPage: true });
  if (overflow > 0) {
    failures++;
    console.log(`OVERFLOW ${name}: ${overflow}px wider than viewport`);
  } else {
    console.log(`ok ${name}`);
  }
}

await browser.close();
if (failures > 0) {
  process.exitCode = 1;
}
