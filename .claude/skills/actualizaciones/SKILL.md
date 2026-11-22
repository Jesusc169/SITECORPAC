---
name: actualizaciones
description: Revisa vulnerabilidades y parches de toda la tecnología de SITECORPAC (npm, Next.js, React, Prisma, Node, MySQL, Nginx, Ubuntu) y, con OK de Jesús, los aplica por el camino seguro. Úsalo con /actualizaciones, o cuando Jesús diga "revisa parches", "¿estamos al día?", "hay vulnerabilidades?".
argument-hint: "[rapido]"
---

# /actualizaciones — parches y vulnerabilidades de SITECORPAC

Modo: $ARGUMENTS (vacío = completo)

Lee `.claude/proceso.md`. La bitácora (`.claude/local/bitacora.md`) ya está cargada: úsala para
saber qué está en producción. **Regla de modelo:** en cada llamada a Agent pasa `model: "opus"`.
Español sencillo; sé honesto con lo que se revisó y lo que no.

1. **Revisar.** Llama a `centinela` (modo completo, o rápido si $ARGUMENTS dice "rapido").
2. **Explicar a Jesús** en corto: qué está al día, qué hallazgos hay (urgencia, si es alcanzable,
   dónde se aplica) y tu recomendación. Descarta con razón los que no aplican.
3. Si no hay nada que aplicar: llama a `cronista` para anotar la revisión y termina.
4. **⏸ OK:** AskUserQuestion con los parches propuestos (multiSelect) + "No aplicar nada".
5. Aplica SOLO lo aprobado:
   - **app** (dependencias): rama `chore/parches-<fecha>` desde `main`; actualiza solo lo
     aprobado (nunca `npm audit fix --force`); luego sigue el flujo de `/requerimiento` desde la
     Fase 3 (qa-pruebas → revisión → OK 2 → deploy-seguro → infra-servidor post-deploy).
   - **servidor**: `infra-servidor` con el OK literal de Jesús en el mensaje, respaldo antes,
     flag de mantenimiento, sin `pm2 update`, verificación después.
6. **Cerrar:** llama a `cronista` con lo revisado, lo aplicado y lo que quedó esperando.
