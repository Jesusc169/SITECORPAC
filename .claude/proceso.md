# Proceso de desarrollo SITECORPAC (orquestador + agentes)

Lo usa el comando `/requerimiento`. Todos los agentes leen este archivo primero.

## Contexto del proyecto
- Sitio y panel del Sindicato (SITECORPAC). Usuarios del panel: secretarias no técnicas.
  Público: afiliados, muchos adultos mayores, muchos desde celular.
- Stack: Next.js 16 (App Router) + React 19 + TypeScript 6, Prisma 7 + MySQL 8, Node 24,
  Vitest (unit + integración contra BD `sitecorpac_test`), Playwright E2E, CSS Modules
  (tokens en `src/styles/global.css`, tema claro/oscuro), PM2 + Nginx en un VPS Hostinger.
- Arquitectura MVC: `src/app` (páginas y API) → `src/controllers` → `src/models` (Prisma);
  lógica pura en `src/lib`; UI en `src/components`, `src/views`, `src/hooks`.
- Lee `AGENTS.md`: esta versión de Next tiene cambios; consulta `node_modules/next/dist/docs/`.

## Reglas que nunca se rompen
1. **Repo PÚBLICO**: nunca versionar IPs, rutas del servidor, contraseñas, tokens, `.env`,
   ni nada de `.claude/local/` o `docs/` (docs es privado y local).
2. **Producción solo con OK explícito de Jesús** y siguiendo `.claude/local/servidor.md`.
3. Commits sin líneas de atribución de Claude (sin `Co-Authored-By`).
4. Trabajo en rama `feat/<tema>`; a `main` solo con pruebas en verde.
5. Cobertura 100 % (líneas/ramas/funciones) en api, controllers, models, lib, services, middleware.
6. Accesibilidad AA en claro y oscuro; todo usable a 390 px de ancho; sin jerga para la secretaria.
7. Datos personales: Ley 29733 (minimizar, informar en `/privacidad`, no exponer en logs).
8. Overlays/modales a pantalla completa con `createPortal(…, document.body)`.
9. Agentes en modelo **Opus** siempre.
10. Ser honesto: si una prueba falla o un paso se salta, se dice.

## Flujo
| Fase | Quién | Entrega |
|---|---|---|
| 0. Entender | orquestador (+ `analista`) | Ficha del requerimiento; preguntas si hay dudas |
| 1. Diseñar | `feature-dev:code-explorer` + `feature-dev:code-architect` | Plan: archivos, BD, riesgos |
| ⏸ OK 1 | Jesús | Aprueba el plan |
| 2. Construir | orquestador (desarrollo) | Código en rama `feat/…` |
| 3. Probar | `qa-pruebas` | Vitest + cobertura + E2E + capturas |
| 4. Revisar | `pr-review-toolkit:*`, `security-guidance`, `claude-security`, `sonarqube`, `cumplimiento` | Hallazgos → se corrigen y se vuelve a 3 |
| 5. Pulir | `code-simplifier` | Código más claro, mismo comportamiento |
| 6. Documentar | `documentador` | Manual / informe / SRS (en `docs/`, local) |
| ⏸ OK 2 | Jesús | Aprueba pasar a producción |
| 7. Desplegar | `deploy-seguro` (+ `infra-servidor` antes y después) | Producción verificada |
| 8. Cerrar | orquestador | Resumen para el cliente + memoria actualizada |
