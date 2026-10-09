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
    // Título principal visible. Lo ideal es <h1>; varias páginas usan <h2>
    // como título (pendiente para el rediseño), por eso se acepta cualquiera.
    await expect(page.locator("h1, h2").first()).toBeVisible();

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
  await tarjeta.getByRole("link", { name: "Ver más" }).click();
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

test("visor de fotos: se abre, se recorre con las flechas y se cierra con Escape", async ({ page }) => {
  await page.goto("/noticias");
  await page.locator("article", { hasText: "Galería E2E" }).getByRole("link", { name: "Ver más" }).click();
  const abrir = page.getByRole("button", { name: /^Ver foto 1 de 2/ });
  await abrir.click();
  const visor = page.getByRole("dialog");
  await expect(visor).toContainText("Foto 1 de 2");
  await expect(page.getByRole("button", { name: "Cerrar galería" })).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(visor).toContainText("Foto 2 de 2");
  await page.keyboard.press("ArrowLeft");
  await expect(visor).toContainText("Foto 1 de 2");
  // Tab no se escapa del visor
  for (let i = 0; i < 6; i++) await page.keyboard.press("Tab");
  expect(await visor.evaluate((d) => d.contains(document.activeElement))).toBe(true);
  await page.keyboard.press("Escape");
  await expect(visor).toHaveCount(0);
  await expect(abrir).toBeFocused();
});

test("visor de fotos: clic en la foto no cierra; clic en el fondo sí", async ({ page }) => {
  await page.goto("/noticias");
  await page.locator("article", { hasText: "Galería E2E" }).getByRole("link", { name: "Ver más" }).click();
  await page.getByRole("button", { name: /^Ver foto 2 de 2/ }).click();
  const visor = page.getByRole("dialog");
  await visor.locator("img").first().click();
  await expect(visor).toBeVisible();
  await visor.click({ position: { x: 5, y: 5 } });
  await expect(visor).toHaveCount(0);
});
