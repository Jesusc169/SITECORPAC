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
  await expect(page.locator("#login-error")).toHaveText("Correo o contraseña incorrectos");
  await expect(page).toHaveURL(/\/login/);
});

test("login: si el servidor responde una página de error, muestra un aviso claro", async ({ page }) => {
  await page.route("**/api/auth/login", (r) =>
    r.fulfill({ status: 502, contentType: "text/html", body: "<html>Bad Gateway</html>" })
  );
  await page.goto("/login");
  await page.getByPlaceholder("Correo").fill("admin@e2e.test");
  await page.getByPlaceholder("Contraseña").fill(CLAVE);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page.locator("#login-error")).toContainText("problema del sistema");
  await expect(page.locator("#login-error")).not.toContainText(/Unexpected|JSON|Bad Gateway/);
});

test("login: sin conexión, pide revisar internet", async ({ page }) => {
  await page.route("**/api/auth/login", (r) => r.abort());
  await page.goto("/login");
  await page.getByPlaceholder("Correo").fill("admin@e2e.test");
  await page.getByPlaceholder("Contraseña").fill(CLAVE);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page.locator("#login-error")).toContainText("Revisa tu internet");
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
  // Hay dos barras de formato: la de la descripción breve (compacta, sin
  // títulos ni listas) y la del contenido.
  const [barraResumen, barraContenido] = [page.getByRole("toolbar").nth(0), page.getByRole("toolbar").nth(1)];
  await page.getByRole("textbox", { name: "Descripción breve" }).click();
  await page.keyboard.type("Resumen de la asamblea");
  await page.keyboard.press("ControlOrMeta+A");
  await barraResumen.getByRole("button", { name: "Cursiva" }).click();
  await expect(barraResumen.getByRole("button", { name: "Cursiva" })).toHaveAttribute("aria-pressed", "true");
  await expect(barraResumen.getByRole("button", { name: "Lista con viñetas" })).toHaveCount(0);
  // Editor con formato: se escribe y se pone en negrita con la barra
  await page.getByRole("textbox", { name: "Contenido" }).click();
  await page.keyboard.type("Detalle de la asamblea");
  await page.keyboard.press("ControlOrMeta+A");
  await barraContenido.getByRole("button", { name: "Negrita" }).click();
  await expect(barraContenido.getByRole("button", { name: "Negrita" })).toHaveAttribute("aria-pressed", "true");
  await page.locator('input[type="file"][accept="image/*"]').first().setInputFiles(FOTO);
  await page.getByRole("button", { name: "Publicar noticia" }).click();
  await expect(page.getByText("Asamblea E2E")).toBeVisible();

  // Se ve en el sitio
  await page.goto("/noticias");
  await expect(page.getByText("Asamblea E2E").first()).toBeVisible();
  // La descripción breve sale con su formato en la tarjeta
  await expect(page.locator("em", { hasText: "Resumen de la asamblea" }).first()).toBeVisible();
  await page.getByRole("link", { name: /Asamblea E2E/ }).first().click();
  await expect(page.locator("strong", { hasText: "Detalle de la asamblea" })).toBeVisible();

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

for (const ancho of [1280, 390]) {
  test(`si la lista de noticias no carga, se avisa y no dice que no hay noticias (${ancho} px)`, async ({ page }) => {
    await page.setViewportSize({ width: ancho, height: 844 });
    await entrar(page, "admin@e2e.test");
    // El servidor responde con una página de error (HTML, no JSON)
    await page.route("**/api/administrador/noticias", (ruta) =>
      ruta.request().method() === "GET"
        ? ruta.fulfill({ status: 500, contentType: "text/html", body: "<html><body>Error</body></html>" })
        : ruta.continue()
    );
    await page.goto("/admin/noticias");
    await expect(
      page.getByRole("alert").filter({ hasText: "No se pudo cargar la lista de noticias. Recarga la página o inténtalo en unos minutos." })
    ).toBeVisible();
    await expect(page.getByText("No hay noticias registradas")).toHaveCount(0);
  });
}

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

/**
 * Video de un sorteo: se sube con barra de avance y el servidor lo comprime.
 * Con ffmpeg instalado (CI y servidor) se prueba hasta verlo en el sitio;
 * sin ffmpeg (una PC sin el programa), que el aviso sea claro.
 */
test("video de un sorteo: subir, comprimir y verlo en el sitio", async ({ page }, testInfo) => {
  test.setTimeout(180_000);
  const { execSync } = await import("child_process");
  const { writeFileSync } = await import("fs");
  const video = testInfo.outputPath("sorteo.mp4");
  let hayFfmpeg = true;
  try {
    execSync(
      `ffmpeg -hide_banner -loglevel error -y -f lavfi -i testsrc2=duration=3:size=1280x720:rate=30 -f lavfi -i sine=duration=3 -c:v libx264 -c:a aac -shortest "${video}"`
    );
  } catch {
    hayFfmpeg = false;
    // Cabecera MP4 válida (pasa el control de la subida; sin ffprobe no se puede comprimir)
    writeFileSync(video, Buffer.concat([Buffer.from([0, 0, 0, 0x18]), Buffer.from("ftypisom"), Buffer.alloc(4000, 1)]));
  }

  page.on("dialog", (d) => d.accept());
  await entrar(page, "admin@e2e.test");
  await page.goto("/admin/sorteos");
  await page.getByRole("button", { name: "Editar Sorteo E2E" }).click();
  await page.getByLabel("Video del sorteo (opcional)").setInputFiles(video);

  if (!hayFfmpeg) {
    await expect(page.getByText(/no tiene instalado el programa de video/)).toBeVisible({ timeout: 30_000 });
    return;
  }
  await expect(page.getByText(/Video listo/)).toBeVisible({ timeout: 90_000 });
  await page.getByRole("button", { name: "Guardar Sorteo" }).click();
  await expect(page.getByRole("button", { name: "Guardar Sorteo" })).toHaveCount(0);
  // al volver a abrirlo, el formulario muestra el video que ya tiene
  await page.getByRole("button", { name: "Editar Sorteo E2E" }).click();
  await expect(page.getByText(/Video listo/)).toBeVisible();
  await page.getByRole("button", { name: "Cancelar" }).click();

  await page.goto("/actividades/sorteos");
  await page.getByRole("button", { name: /Ver video/ }).first().click();
  const reproductor = page.getByRole("dialog").locator("video");
  await expect(reproductor).toBeVisible();
  await expect(reproductor).toHaveAttribute("src", /^\/uploads\/videos\/\d+-[0-9a-f]+\.mp4$/);
  await page.getByRole("button", { name: "Cerrar video" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
