# Reglas de seguridad propias de SITECORPAC

- Toda ruta bajo `src/app/api/administrador/` debe verificar sesión (`verificarSesion` /
  `obtenerUsuarioActual` de `src/lib/auth.ts`) Y el privilegio con `tienePermiso` de
  `src/lib/permisos.ts`. Rutas solo de administrador comprueban el rol, no un privilegio.
  Sin sesión → 401; sin permiso → 403. Nunca confiar en datos de rol enviados por el cliente.
- HTML del editor de texto rico (contenido de noticia, descripción de feria/sorteo) se guarda y
  se muestra SIEMPRE pasando por `limpiarHtml` / `limpiarTextoRico` / `limpiarResumen` de
  `src/lib/htmlSeguro.ts`. Cualquier `dangerouslySetInnerHTML` sin esa limpieza es XSS.
- Subidas de archivos: validar tipo real y tamaño con `src/lib/validacionArchivos.ts` y los
  límites de `src/lib/constantesArchivos.ts`; nombres de archivo generados por el servidor,
  nunca el nombre original en la ruta de disco (path traversal).
- Login: el límite de intentos usa `src/lib/rateLimiter.ts` (`obtenerIp`, `estaBloqueado`,
  `registrarFallo`); no saltárselo ni confiar en cabeceras de IP manipulables fuera de `obtenerIp`.
- CSV exportados: proteger contra inyección de fórmulas (celdas que empiezan con = + - @).
- Errores: registrar con `registrarError` (no `console.error`) y no devolver detalles internos
  ni datos personales al cliente. Datos personales (DNI, teléfono, correo) nunca en logs ni URLs.
- El repositorio es PÚBLICO: ninguna IP, ruta del servidor, contraseña o token en código o commits.
