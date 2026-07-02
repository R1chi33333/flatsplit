import { expect, test, type Page } from '@playwright/test';

/**
 * The two flows a reviewer actually runs: one-click demo login, and
 * importing a bank CSV. Both run against the seeded demo flat; the
 * import test cleans up after itself.
 */

const E2E_CSV = [
  'Type,Details,Particulars,Code,Reference,Amount,Date,ForeignCurrencyAmount,ConversionCharge',
  'Eft-Pos,E2E COFFEE CART,,,,-4.50,01/07/2026,,',
  'Eft-Pos,E2E TEST SHOP,,,,-25.00,02/07/2026,,',
  'Direct Credit,E2E REFUND,,,,10.00,03/07/2026,,',
].join('\n');

async function signInToDemo(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByRole('button', { name: 'Open the demo flat' }).click();
  await page.waitForURL('**/app');
}

test('demo login reaches a populated dashboard in one click', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /Try the demo/ }).click();
  await expect(page).toHaveURL(/\/login/);

  await page.getByRole('button', { name: 'Open the demo flat' }).click();
  await page.waitForURL('**/app');

  await expect(page.getByRole('heading', { name: '18 Aro Valley Road' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Members' })).toBeVisible();
  await expect(page.getByText('Aroha')).toBeVisible();

  await page.getByRole('link', { name: 'Settle up' }).click();
  await expect(page.getByText(/transfers? to settle everything|Nothing to settle/)).toBeVisible();
});

test('bank CSV import lands selected transactions as expenses', async ({ page }) => {
  await signInToDemo(page);

  await page.goto('/app/expenses/import');
  await page.getByLabel('CSV content').fill(E2E_CSV);

  await expect(page.getByText('ANZ', { exact: true })).toBeVisible();
  await expect(page.getByText('3 transactions, 2 outgoing')).toBeVisible();

  // Credits must not be importable.
  await expect(page.getByLabel('Include Direct Credit E2E REFUND')).toBeDisabled();

  await page.getByRole('button', { name: 'Add 2 expenses split evenly' }).click();
  await expect(page.getByText('2 expenses imported and split evenly.')).toBeVisible();

  await page.goto('/app/expenses');
  await expect(page.getByText('Eft-Pos E2E COFFEE CART')).toBeVisible();
  await expect(page.getByText('Eft-Pos E2E TEST SHOP')).toBeVisible();

  // Clean up so repeated runs and the shared demo stay tidy.
  for (const name of ['Eft-Pos E2E COFFEE CART', 'Eft-Pos E2E TEST SHOP']) {
    await page.getByRole('button', { name: `Delete ${name}` }).click();
    await expect(page.getByText(name)).toHaveCount(0);
  }
});
