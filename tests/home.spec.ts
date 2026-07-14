import { test, expect } from '@playwright/test';

test.describe('Página Principal', () => {
  test('debería cargar la página principal correctamente', async ({ page }) => {
    // Ir a la ruta principal
    await page.goto('/');

    // Verificar que el título de la página contenga 'Sanación en Luz'
    await expect(page).toHaveTitle(/Sanación en Luz/i);

    // Verificar que el logo esté visible
    const logo = page.getByAltText(/Sanación en Luz/i).first();
    await expect(logo).toBeVisible();

    // Verificar que el botón de login esté presente
    const loginLink = page.getByRole('link', { name: /ingresar a mi cuenta|log in/i });
    await expect(loginLink).toBeVisible();
  });
});
