import { test, expect } from '@playwright/test';

test.describe('Navegación del Navbar', () => {


    // Lista de menús esperados (en español) según el componente NavbarClient
    const expectedMenus = [
      { name: /Inicio|Home/i, id: 'inicio' },
      { name: /Talleres|Workshops/i, id: 'talleres' },
      { name: /Blog/i, id: 'blog' },
      { name: /Videos/i, id: 'videos' },
      { name: /Quiénes Somos|About Us/i, id: 'quienes-somos' },
      { name: /Testimonios|Testimonials/i, id: 'testimonios' },
      { name: /Galería|Gallery/i, id: 'galeria' },
      { name: /Contacto|Contact/i, id: 'contacto' }
    ];
    
    for (const menu of expectedMenus) {
      test(`debería poder navegar a la sección: ${menu.id}`, async ({ page }) => {
        // 1. Vamos a la página principal
        await page.goto('/');

        // 2. Encontramos el enlace y hacemos clic
        const menuLink = page.getByRole('link', { name: menu.name }).first();
        await expect(menuLink).toBeAttached();
        
        await menuLink.click();

        // 3. Verificamos que la nueva página cargue correctamente
        // Nos aseguramos de que no diga "404" ni "Error"
        await expect(page.locator('body')).not.toContainText('404');
        await expect(page.locator('body')).not.toContainText('Internal Server Error');
      });
    }
});
