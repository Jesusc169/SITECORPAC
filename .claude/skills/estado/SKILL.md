---
name: estado
description: Resumen rápido de cómo está SITECORPAC ahora mismo — servidor, producción y demo, parches urgentes, herramientas locales y pendientes de la bitácora. Úsalo con /estado, o cuando Jesús pregunte "¿cómo está todo?", "¿en qué nos quedamos?", "estado de sitecorpac".
---

# /estado — cómo está SITECORPAC

Objetivo: en ~2 minutos, una foto clara para Jesús. **Todo es SOLO LECTURA.**
La bitácora (`.claude/local/bitacora.md`) ya está cargada. **Regla de modelo:** en cada llamada a
Agent pasa `model: "opus"`.

1. En paralelo:
   - `infra-servidor`: chequeo CORTO (≤2 min) de producción y demo: HEAD en el servidor, PM2 (2
     online), `sitecorpac-demo` activo, sitecorpac.com y demo.sitecorpac.com en 200, vigía, disco,
     RAM, paquetes de seguridad pendientes, reboot-required, vencimiento del certificado, último
     respaldo diario y último paquete off-site (fecha y tamaño). Sin cambios.
   - `centinela` en **modo rápido**.
   - Tú mismo (Bash, local): `git status -sb`, `git log origin/main..main --oneline` (commits sin
     subir), ramas abiertas, worktrees; Docker y `sonarqube` arriba
     (`curl -s localhost:9000/api/system/status`); fecha del último respaldo bajado a la PC.
2. Responde en este formato, corto y en español sencillo:
   - **Producción** 🟢/🟡/🔴 (commit, una línea) · **Demo** 🟢/🟡/🔴 · **Servidor** 🟢/🟡/🔴
   - **Seguridad:** parches urgentes o "nada urgente".
   - **Respaldos:** último diario / último off-site / último en la PC.
   - **Local:** commits sin subir, ramas, SonarQube.
   - **Pendientes** (de la bitácora, máx. 5, los más importantes primero).
   - **Sugerencia:** lo siguiente que conviene hacer (una línea).
3. Si encuentras algo que contradice la bitácora (otro commit en producción, un pendiente ya
   resuelto), dilo y llama a `cronista` para corregirla.
