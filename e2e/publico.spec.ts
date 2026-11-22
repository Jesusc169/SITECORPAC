import { test, expect } from "@playwright/test";

/** Páginas públicas: cargan, tienen título, sin errores de consola y sin scroll horizontal en celular. */
const PAGINAS = [
  "/",
  "/noticias",
  "/actividades/ferias",
  "/actividades/sorteos",
  "/directorio",
  "/nuestra_historia",
  "/legislacion/constitucion",
  "/legislacion/estatuto",
  "/legislacion/ley-relaciones",
  "/legislacion/ley-seguridad",
  "/legislacion/oit",
  "/tramites/prestamos",
  "/tramites/beneficio-fallecido",
  "/privacidad",
  "/terminos",
  "/cookies",
  "/accesibilidad",
  "/login",
];

for (const ruta of PAGINAS) {
  test(`${ruta} carga bien en computadora y celular`, async ({ page }) => {
    const errores: string[] = [];
    page.on("console", (m) => m.type() === "error" && errores.push(m.text()));
    page.on("pageerror", (e) => errores.push(e.message));

    const res = await page.goto(ruta);
    expect(res?.status()).toBe(200);
    // Desde el rediseño A+C todas las páginas tienen un <h1> visible.
    await expect(page.locator("h1").first()).toBeVisible();

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(ruta);
    const ancho = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(ancho, "sin scroll horizontal en celular").toBeLessThanOrEqual(390);

    // Imágenes de ejemplo que no existen en la base de prueba no cuentan
    expect(errores.filter((e) => !/Failed to load resource/.test(e))).toEqual([]);
  });
}

test("una noticia publicada aparece en el listado y abre su detalle", async ({ page }) => {
  await page.goto("/noticias");
  const tarjeta = page.locator("article", { hasText: "Bienvenida E2E" });
  await tarjeta.getByRole("link", { name: "Leer más" }).click();
  await expect(page.locator("h1")).toContainText("Bienvenida E2E");
});

test("el contenido cargado en la base aparece en las páginas", async ({ page }) => {
  await page.goto("/tramites/prestamos");
  await expect(page.getByText("Cooperativa E2E")).toBeVisible();
  await page.goto("/directorio");
  await expect(page.getByText("Dirigente E2E")).toBeVisible();
  await page.goto("/actividades/sorteos");
  await expect(page.getByText("Sorteo E2E")).toBeVisible();
});

test("una página inexistente da 404", async ({ page }) => {
  expect((await page.goto("/esta-pagina-no-existe"))?.status()).toBe(404);
});

async function abrirGaleria(page: import("@playwright/test").Page) {
  await page.goto("/noticias");
  await page.locator("article", { hasText: "Galería E2E" }).getByRole("link", { name: "Leer más" }).click();
  return page.getByRole("region", { name: "Fotos de Galería E2E" });
}

test("carrusel de fotos: gira solo, se pausa y se maneja con flechas y puntos", async ({ page }) => {
  const carrusel = await abrirGaleria(page);
  const activa = () => carrusel.locator('[aria-roledescription="diapositiva"]:not([inert])');
  await expect(activa()).toHaveAttribute("aria-label", "1 de 3");
  // Gira solo (cada 5 s) sin el mouse encima
  await page.mouse.move(0, 0);
  await expect(activa()).toHaveAttribute("aria-label", "2 de 3", { timeout: 8000 });
  // Pausar: ya no avanza
  await carrusel.getByRole("button", { name: /Pausar/ }).click();
  await page.mouse.move(0, 0);
  await page.waitForTimeout(6000);
  await expect(activa()).toHaveAttribute("aria-label", "2 de 3");
  await expect(carrusel.getByRole("button", { name: /Reanudar/ })).toBeVisible();
  // Flechas (dan la vuelta) y puntos
  await carrusel.getByRole("button", { name: "Foto siguiente" }).click();
  await expect(activa()).toHaveAttribute("aria-label", "3 de 3");
  await carrusel.getByRole("button", { name: "Foto siguiente" }).click();
  await expect(activa()).toHaveAttribute("aria-label", "1 de 3");
  await carrusel.getByRole("button", { name: "Foto anterior" }).click();
  await expect(activa()).toHaveAttribute("aria-label", "3 de 3");
  await carrusel.getByRole("button", { name: "Ir a la foto 2" }).click();
  await expect(activa()).toHaveAttribute("aria-label", "2 de 3");
  await expect(carrusel.getByRole("button", { name: "Ir a la foto 2" })).toHaveAttribute("aria-current", "true");
  // Las diapositivas ocultas no se pueden enfocar ni leer
  await expect(carrusel.locator('[aria-roledescription="diapositiva"][inert]')).toHaveCount(2);
  const ocultaEnfocable = await carrusel.locator('[inert] button').first().evaluate((b) => {
    (b as HTMLButtonElement).focus();
    return document.activeElement === b;
  });
  expect(ocultaEnfocable).toBe(false);
});

test("carrusel de fotos: no gira solo si el equipo pide reducir el movimiento", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const carrusel = await abrirGaleria(page);
  await expect(carrusel.getByRole("button", { name: /Reanudar/ })).toBeVisible();
  await page.mouse.move(0, 0);
  await page.waitForTimeout(6000);
  await expect(carrusel.locator('[aria-roledescription="diapositiva"]:not([inert])')).toHaveAttribute("aria-label", "1 de 3");
});

test("visor de fotos: se abre desde el carrusel, se recorre con las flechas y se cierra con Escape", async ({ page }) => {
  const carrusel = await abrirGaleria(page);
  await carrusel.getByRole("button", { name: /Pausar/ }).click();
  const abrir = carrusel.getByRole("button", { name: /^Ampliar foto 1 de 3/ });
  await abrir.click();
  const visor = page.getByRole("dialog");
  await expect(visor).toContainText("Foto 1 de 3");
  await expect(page.getByRole("button", { name: "Cerrar galería" })).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(visor).toContainText("Foto 2 de 3");
  await page.keyboard.press("ArrowLeft");
  await expect(visor).toContainText("Foto 1 de 3");
  // Tab no se escapa del visor
  for (let i = 0; i < 6; i++) await page.keyboard.press("Tab");
  expect(await visor.evaluate((d) => d.contains(document.activeElement))).toBe(true);
  await page.keyboard.press("Escape");
  await expect(visor).toHaveCount(0);
  await expect(abrir).toBeFocused();
});

test("visor de fotos: clic en la foto no cierra; clic en el fondo sí", async ({ page }) => {
  const carrusel = await abrirGaleria(page);
  await carrusel.getByRole("button", { name: /Pausar/ }).click();
  await carrusel.getByRole("button", { name: "Ir a la foto 2" }).click();
  await carrusel.getByRole("button", { name: /^Ampliar foto 2 de 3/ }).click();
  const visor = page.getByRole("dialog");
  await expect(visor).toContainText("Foto 2 de 3");
  await visor.locator("img").first().click();
  await expect(visor).toBeVisible();
  await visor.click({ position: { x: 5, y: 5 } });
  await expect(visor).toHaveCount(0);
});
