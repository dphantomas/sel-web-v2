import { test, expect } from '@playwright/test';
test('test client nav', async ({ page }) => {
  await page.goto('http://localhost:3333/');
  const menuLink = page.getByRole('link', { name: 'Recursos' }).first(); // Wait, where is the link?
  // NavbarClient has 'recursos'? No, NavbarClient has 'dashboard/recursos' inside a UserMenu if logged in!
});
