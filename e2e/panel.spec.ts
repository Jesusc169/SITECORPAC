import { test, expect, type Page } from "@playwright/test";
import path from "path";

const CLAVE = "Clave-E2E-2026!";
const FOTO = path.join(__dirname, "..", "public", "logo_site.jpg");

async function entrar(page: Page, email: string) {
  await page.goto("/login");
  await page.getByPlaceholder("Correo").fill(email);
  await page.getByPlaceholder("Contraseña").fill(CLAVE);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await page.waitForURL("**/dashboard");
}

test.describe.configure({ mode: "serial" });

test("contraseña equivocada muestra el error y no entra", async ({ page }) => {
  await page.goto("/login");
  await page.getByPlaceholder("Correo").fill("admin@e2e.test");
  await page.getByPlaceholder("Contraseña").fill("mala");
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page.locator("#login-error")).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
});

test("sin sesión el panel manda al login", async ({ page }) => {
  await page.goto("/admin/noticias");
  await expect(page).toHaveURL(/\/login/);
});

test("ciclo completo de una noticia: crear, ver, editar, historial, eliminar y restaurar", async ({ page }) => {
  page.on("dialog", (d) => d.accept());
  await entrar(page, "admin@e2e.test");

  // Crear con foto
  await page.goto("/admin/noticias");
  await page.getByRole("button", { name: "+ Nueva noticia" }).click();
  await page.getByPlaceholder("Título de la noticia").fill("Asamblea E2E");
  await page.getByPlaceholder("Resumen corto para la portada").fill("Resumen de la asamblea");
  await page.getByPlaceholder("Contenido completo de la noticia").fill("Detalle de la asamblea");
  await page.locator('input[type="file"][accept="image/*"]').first().setInputFiles(FOTO);
  await page.getByRole("button", { name: "Publicar noticia" }).click();
  await expect(page.getByText("Asamblea E2E")).toBeVisible();

  // Se ve en el sitio
  await page.goto("/noticias");
  await expect(page.getByText("Asamblea E2E").first()).toBeVisible();

  // Editar el título
  await page.goto("/admin/noticias");
  const fila = page.locator("tr", { hasText: "Asamblea E2E" });
  await fila.getByRole("button", { name: "Editar" }).click();
  const titulo = page.locator(".modal input.form-control").first();
  await titulo.fill("Asamblea E2E editada");
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page.getByText("Asamblea E2E editada")).toBeVisible();

  // Historial: el cambio aparece y se puede ver qué cambió
  await page.goto("/admin/sistema");
  await page.getByRole("tab", { name: "Registro de actividad" }).click();
  await expect(page.getByText('Editó la noticia "Asamblea E2E editada"')).toBeVisible();
  await page.getByRole("button", { name: "Ver cambios" }).first().click();
  await expect(page.getByRole("dialog")).toContainText("Asamblea E2E editada");
  // El foco entra a la ventana y Escape la cierra
  await expect(page.getByRole("dialog").getByRole("button", { name: "Cerrar" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Ver cambios" }).first()).toBeFocused();
  // con el botón Cerrar también
  await page.getByRole("button", { name: "Ver cambios" }).first().click();
  await page.getByRole("dialog").getByRole("button", { name: "Cerrar" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);

  // Eliminar → papelera → restaurar
  await page.goto("/admin/noticias");
  const filaEditada = page.locator("tr", { hasText: "Asamblea E2E editada" });
  // Escape cierra la ventana de eliminar sin borrar nada
  await filaEditada.getByRole("button", { name: "Eliminar" }).click();
  await page.locator(".modal-footer").getByRole("button", { name: "Cancelar" }).focus();
  await page.keyboard.press("Escape");
  await expect(page.locator(".modal-footer")).toHaveCount(0);
  await filaEditada.getByRole("button", { name: "Eliminar" }).click();
  await page.locator(".modal-footer").getByRole("button", { name: "Eliminar" }).click();
  await expect(page.getByText("Asamblea E2E editada")).toHaveCount(0);

  await page.goto("/admin/sistema");
  await page.getByRole("tab", { name: "Papelera" }).click();
  await expect(page.getByText("Asamblea E2E editada")).toBeVisible();
  await page.getByRole("button", { name: "Restaurar" }).click();
  await expect(page.getByRole("status")).toContainText("se restauró");

  await page.goto("/noticias");
  await expect(page.getByText("Asamblea E2E editada").first()).toBeVisible();
});

test("la pantalla de Sistema muestra sus pestañas", async ({ page }) => {
  await entrar(page, "admin@e2e.test");
  await page.getByRole("link", { name: "Sistema y registros" }).click();
  for (const pestana of ["Resumen", "Registro de actividad", "Papelera", "Seguridad", "Usuarios"]) {
    await page.getByRole("tab", { name: pestana }).click();
    await expect(page.getByRole("tabpanel")).toBeVisible();
  }
});

test("una secretaria no ve ni puede abrir Sistema y registros", async ({ page }) => {
  await entrar(page, "secretaria@e2e.test");
  await expect(page.getByRole("link", { name: "Administrar noticias" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Sistema y registros" })).toHaveCount(0);
  await page.goto("/admin/sistema");
  await expect(page).toHaveURL(/\/dashboard/);
});

test("desactivar una cuenta la deja fuera; reactivarla la deja entrar", async ({ browser }) => {
  const admin = await browser.newPage();
  admin.on("dialog", (d) => d.accept());
  await entrar(admin, "admin@e2e.test");
  await admin.goto("/admin/usuarios");
  const fila = admin.locator("tr", { hasText: "secretaria@e2e.test" });
  await fila.getByRole("button", { name: "Desactivar" }).click();
  await expect(fila.getByText("Desactivada", { exact: true })).toBeVisible();

  const sec = await browser.newPage();
  await sec.goto("/login");
  await sec.getByPlaceholder("Correo").fill("secretaria@e2e.test");
  await sec.getByPlaceholder("Contraseña").fill(CLAVE);
  await sec.getByRole("button", { name: "Ingresar" }).click();
  await expect(sec.locator("#login-error")).toContainText("desactivada");

  await fila.getByRole("button", { name: "Reactivar" }).click();
  await expect(fila.getByText("Activa", { exact: true })).toBeVisible();
  await entrar(sec, "secretaria@e2e.test");
});

test("al crear una feria, las empresas se eligen con el teclado", async ({ page }) => {
  await entrar(page, "admin@e2e.test");
  await page.goto("/admin/ferias");
  await page.getByRole("button", { name: /Nueva Feria/i }).click();
  await page.getByPlaceholder("Buscar empresa...").click();
  const opcion = page.getByRole("button", { name: "Empresa E2E", exact: true });
  await opcion.focus();
  await page.keyboard.press("Enter");
  // queda elegida: aparece como etiqueta con su botón × para quitarla
  await expect(page.locator("span", { hasText: "Empresa E2E" }).getByRole("button", { name: "×" })).toBeVisible();
});
