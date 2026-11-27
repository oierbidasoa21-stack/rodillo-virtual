# Pendientes

_Última actualización: 2026-11-27._

## Tareas apuntadas el 2026-11-27 (para el agente de VS Code)

El usuario pide **apuntarlas, no hacerlas**: los cambios los hace su agente. Van en este orden.

**Reparto del trabajo (decidido el 2026-11-27):**

- El usuario habla **solo con Claude en la nube**, que hace de intermediario: apunta las tareas aquí (y como issues), revisa los PR, vigila CI y mantiene `docs/contexto/` al día.
- El **agente de VS Code** hace los cambios de código: una rama por tarea y un PR que la cierra.
- Se comunican **a través del repo**, porque ninguno ve la conversación del otro.
- **Para no pisarse** (ajustado el 2026-11-28, porque la regla 7 de `CLAUDE.md` pide al agente actualizar el contexto):
  - El **agente de VS Code** actualiza, al cerrar cada tarea suya: `estado/`, `registro/`, `fases/`, `sesiones/` y la línea de estado de su tarea aquí. También es suyo todo lo demás: código, `ROADMAP.md`, `CLAUDE.md` y `README.md`.
  - **Claude en la nube** escribe lo que sale de hablar con el usuario: tareas nuevas y decisiones (`pendientes/`, `decisiones/`, `estudios/`), la página `estado/seguimiento.html`, los issues y las revisiones de PR.
  - Claude en la nube sube a `main` en pocos commits y siempre después de traer lo último, para no cruzarse con un merge del agente. Si un merge del agente se rechaza por eso, se trae `main` a la rama con un merge normal, sin forzar, como se hizo con el PR #32. El porqué y el detalle de las preguntas están en [`../estudios/2026-11-27-rodillo-inteligente-produccion-aws.md`](../estudios/2026-11-27-rodillo-inteligente-produccion-aws.md).

### T0 · «PR cero»: fusionar el plan de los niveles de realismo (#31)

[PR #31](https://github.com/oierbidasoa21-stack/rodillo-virtual/pull/31) (`docs: plan de las fases 10–12`) sigue **abierto sin fusionar**. Lleva al `ROADMAP` las fases 10, 11 y 12 (paisaje real, niveles 1, 2 y 3) y crea `fases/fase-10-paisaje-real.md`. Hasta que se fusione, `main` dice que la fase actual es la 8 y no aparecen los niveles de realismo.

- [x] Revisar y fusionar #31 (CI en verde). Fusionado el 2026-11-28.
- [x] Comprobar que existen los milestones «Fase 10 — Paisaje real · nivel 1», «Fase 11 …» y «Fase 12 …», y que los issues #22–#30 (etiqueta `paisaje-real`) están en el suyo. Comprobado el 2026-11-28.
- [x] Después, actualizar `estado/ESTADO.md` («Queda la Fase 8» → fases 10–12 en curso o planificadas, la 8 en espera) y la lista «Fases por hacer» de abajo. Hecho el 2026-11-28 (con la Fase 9 como actual).

### T1 · Zonas de pulso Z1…Z6

**Estado (2026-11-28): hecha en el [PR #33](https://github.com/oierbidasoa21-stack/rodillo-virtual/pull/33). Revisada por Claude en la nube: aprobada para fusionar.**

- Comprobado: lint, 322 tests y build pasan en local sobre la rama.
- Migración v6 en las 5 tablas, con test v5→v6.
- Nombres viejos aceptados en la copia, el archivo de atleta, el plan y los `.zwo` (con el fallo de `UA+` corregido).
- Ningún nombre viejo suelto fuera de los mapas de compatibilidad.
- `CLAUDE.md`, `ESTRUCTURA.md` y `ARQUITECTURA.md` actualizados.
- Sin archivos personales.

**Le toca al usuario:** fusionar el PR, volver a dar las instrucciones a su agente entrenador y, cuando quiera, renombrar las zonas en su `athlete.local.json`.

Sigue el diseño de abajo.

Pedido por el usuario: las zonas pasan de `L1, L2, L3, UA, UA+, VO2` a `Z1, Z2, Z3, Z4, Z5, Z6` (misma posición, mismos pesos y MET). Es un **cambio de modelo de datos guardados**, así que lleva migración (regla de `CLAUDE.md`). Diseño propuesto (se probó en una rama local el 2026-11-27, con todos los tests en verde, y se descartó porque el usuario prefiere que lo haga su agente):

- `domain/zones/zones.ts`: `ZONE_IDS = Z1…Z6`; `LEGACY_ZONE_IDS` (L1→Z1, L2→Z2, L3→Z3, UA→Z4, UA+→Z5, VO2→Z6); `toZoneId(v)` que acepta nombres nuevos y viejos; `isZoneId` estricto; `DEFAULT_ZONE_LABELS` (Z4 = «Z4 (umbral)»).
- `domain/zones/legacy.ts`: `migrateLegacyZoneIds(valor)` que recorre un objeto guardado y renombra:
  - `zoneId` y `targetZoneId`;
  - los registros de segundos por zona (`plannedSecByZone`, `actualSecByZone`, `hrMeasured.secByZone`);
  - las zonas del atleta (`id`, y la `label` solo si sigue siendo la de ejemplo; una etiqueta escrita por el usuario se respeta).
- **Dexie v6**, mismos índices, con `upgrade` que pasa `migrateLegacyZoneIds` por `workouts`, `history`, `settings`, `inProgress` y `plans`. `routes` y `recordings` no se tocan (no llevan zonas, y una ruta podría llamarse «UA»). Test v5→v6 con una base de la versión anterior.
- **Seguir aceptando lo viejo** al importar, para no perder nada:
  - copia de seguridad (`parseBackup`);
  - `athlete.local.json` (`parseAthleteConfig`). Importante: si no, `normalizeSettings` volvería a las zonas de ejemplo;
  - plan del agente (`zona` en `plan.ts`);
  - marcador `Zona L2 (pulso)` de los `.zwo` exportados antes (`zwo.ts`). Ojo: hoy `\b` tras `UA\+` no corta bien; usar `(?=\s|$)`.
- Textos:
  - voz: «zona uno» … «zona seis», en vez de «L uno» o «umbral»;
  - nombres de la biblioteca: «Fondo Z2», «Tempo 3×12′ Z3», «VO2máx 5×3′»…;
  - ayuda de la carga en Ajustes y en el informe (`report.ts`, `SettingsView.tsx`);
  - «por debajo de Z1» en el resumen;
  - `config/athlete.example.json`.
- **Instrucciones del agente entrenador** (`domain/plan/instructions.ts` y `docs/agente-entrenador.md`): pasar a Z1…Z6. **El usuario tiene que actualizar el prompt de su agente**; la app seguirá aceptando L1… por si acaso.
- **Choque de nombres con la potencia:** las zonas de potencia (Coggan) ya son `Z1…Z7`, y no coinciden con las de pulso (Z5 pulso = antiguo UA+, Z5 potencia = VO2máx). Donde salgan las dos (resumen, historial, editor) hay que distinguirlas: «Pulso Z4» frente a «Potencia Z4».
- Documentar en `decisiones/`, `arquitectura/` (tabla de versiones de Dexie), `CLAUDE.md` (sección Atleta y equipo, y la carga por pulso de «Física y cálculos») y `README.md`.

### T2 · Documentos de seguimiento al día

- [ ] `docs/ROADMAP.md`: añadir una sección **«Mejoras fuera de fase (2026-11-26/27)»** con lo hecho tras la Fase 7, que hoy solo está en `estado/` y `decisiones/`:
  - realismo 3D en tres rondas: (1) sombras, texturas, cielo, marcas viales y balizas; (2) horizonte con montañas, vegetación, ciclista detallado y cámara; (3) público, quitamiedos, rodadas, arcén de grava y hora del día;
  - forma y fatiga, fantasma, avisos de voz y plan del entrenador;
  - imagen Docker y `ESTRUCTURA.md`;
  - pantalla completa.
- [ ] `docs/ROADMAP.md` (pedido el 2026-11-27): además de lo anterior y de fusionar #31, que el roadmap recoja **todo lo apuntado aquí**. Propuesta (el orden se puede cambiar):
  - **Fase 9 — Mantenimiento** (el número de la 9 descartada queda libre): zonas Z1…Z6 (T1), seguimiento al día (T2) y README con `docs/MANUAL.md` (T11).
  - **Fase 10–12 — Paisaje real** niveles 1–3 (#31, sin cambios).
  - **Fase 13 — GitHub profesional** (T7) y **Fase 14 — Docker de producción y seguridad** (T4). Van juntas o seguidas, porque la CSP y CI se tocan en las dos.
  - **Fase 15 — Mejoras aceptadas** (punto 5 del estudio, sin el modo daltónico): copia cifrada, recordatorio de copia, límites al importar, panel de inicio, calidad gráfica del 3D, FIT, Strava y zonas desde un test.
  - **En espera o en estudio**, sin número: Fase 8 (rodillo inteligente o casero, T5 y T9), base de datos centralizada (T8), AWS (T6) y modo local con repo privado (T3, depende de T7).
  - **Orden de ejecución (confirmado por el usuario el 2026-11-27):** el usuario sugiere hacer 13–15 antes que 10–12. Claude está de acuerdo con matices:
    1. **Fase 9** (zonas y seguimiento): lo más pequeño, y cambia el modelo de datos, así que mejor antes de añadir nada más.
    2. **Fase 13** (GitHub profesional): fija la forma de trabajar (todo por PR, CI obligatorio, plantillas). Con dos agentes, cuanto antes mejor: todo lo que venga después ya pasa por ese filtro. Se puede hacer mientras el repo siga público, porque las reglas de rama son gratis en públicos.
    3. **Fase 14** (Docker de producción y seguridad): poner la CSP estricta **antes** de la Fase 10 es seguridad desde el diseño. Luego la Fase 10 solo abre, de forma explícita, los servicios de teselas que necesita, en vez de tener que cerrar después lo que quedó abierto.
    4. **Fase 15** partida en dos:
       - **15a, antes de la 10**: calidad gráfica del 3D, panel de inicio, **Strava opción (b)** (T8), **meta o arco de llegada** (T16), **pulso máximo de la sesión** (T17) y **reconexión de Bluetooth sin preguntar** (T18), además de las ideas aceptadas de «más bonito»: transiciones entre bloques, cuenta atrás grande en los últimos 5 s y gráfica de zonas tipo donut en el resumen. ~~Recordatorio de copia, límites al importar y copia cifrada~~: van al final (T19), por decisión del 2026-11-28.
       - **15b, después o en espera**: exportar FIT (botón «Descargar FIT» junto al TCX, con el FIT SDK oficial de Garmin, mismos datos; el usuario lo quiere para compartir con su entrenador) y zonas desde un test, con **sugerencias de zonas** y sensaciones al terminar (T20). ~~Strava sale de la Fase 15 y va con Supabase~~. **Cambio (2026-11-27):** la API de Strava es de pago, y el usuario elige la opción (b) sin API, que vuelve a la Fase 15a.
    5. **Fases 10 → 11 → 12** (paisaje real): lo más grande y con más riesgo (servicios externos, rendimiento, licencias). Mejor con la base ya limpia y segura.
    6. **Fase 8** cuando haya rodillo: es independiente y puede entrar en cualquier momento.
    7. **Añadidos del 2026-11-28:**
       - la **Fase 9** suma T12 (curvas suaves) y T11 (README y manual);
       - **crear ruta en un mapa** (T14) va justo después de la 10;
       - el **ciclista realista** (T13) va después de la 12;
       - la **seguridad complementaria** (T19) es lo último de todo;
       - T16, T17 y T18 van a la 15a, y T20 a la 15b.

       Orden completo: 9 → 13 → 14 → 15a → 10 → T14 → 11 → 12 → 15b → T13 → T19 (la 8 cuando haya rodillo).
    - **Los números no se cambian**, aunque el orden sea otro: los issues y milestones de #31 ya usan 10–12. En `ROADMAP.md` basta con poner «Fase actual: 9» y una línea con el orden de ejecución. Recordar la regla 1 de `CLAUDE.md` (trabajar solo en la fase actual).
  - Cada fase con su milestone y un issue por casilla (regla 8 de `CLAUDE.md`). Añadir también la regla del reparto de trabajo de arriba a `CLAUDE.md` («Forma de trabajar» y «Git y GitHub»).
- [ ] Esta lista «Fases por hacer» estaba desfasada (decía que faltaban la 6 y la 7): ya corregida abajo; repasarla tras T0.
- [ ] `sesiones/`: la sesión del 2026-11-26 está metida al final de `2026-11-25.md`; separarla en `2026-11-26.md`.
- [ ] `registro/CAMBIOS.md`: añadir los commits que falten desde `3250f48`.

### T3 · Modo local y repo privado

El usuario quiere poder hacer el repo **privado sin GitHub Pro**. GitHub Pages no publica desde repos privados en el plan gratuito, así que la app pasaría a usarse en local con Docker (`docker compose up -d` → `http://localhost:8080`). Bluetooth y la PWA funcionan porque Chrome trata `localhost` como seguro.

- [ ] `deploy.yml`: que se salte solo si el repo es privado (`if: ${{ !github.event.repository.private }}` en los jobs), para no romper nada mientras siga siendo público.
- [ ] `CLAUDE.md` («Dónde se prueba» y «Despliegue»), `README.md`, `ROADMAP.md` (criterio de hecho) y `entorno/ENTORNO.md`: la referencia pasa a ser `localhost:8080` cuando el repo sea privado.
- [ ] Guía corta para el usuario: exportar la copia en la web publicada (si tiene datos), cambiar la visibilidad (Settings → General → Danger Zone, eso lo hace él), arrancar Docker e importar la copia. Usar siempre el mismo puerto: cada dirección tiene su propia base.
- [ ] Anotar la decisión cuando el usuario cambie la visibilidad.

**Estado (2026-11-27): apuntado, todavía no.** El usuario no cambia la visibilidad por ahora.

**Qué se rompería al pasarlo a privado** (respuesta del 2026-11-27):

- **La web de GitHub Pages deja de publicarse** (plan gratuito). Es lo único importante: la app se usaría en `localhost:8080` con Docker (este T3). Una PWA instalada desde `github.io` puede seguir abriendo desde su caché, pero ya no se actualiza.
- **Las reglas de protección de rama dejan de aplicarse** en el plan gratuito (afecta a T7).
- Los enlaces al repo (issues, `README`, la URL del roadmap en los issues) piden iniciar sesión a quien no tenga acceso.
- **No se rompe:**
  - el código, el historial, los issues, los PR y los milestones;
  - CI, con 2.000 minutos gratis al mes en privados, de sobra;
  - el acceso de Claude (app de GitHub instalada) ni el del agente de VS Code;
  - los datos del usuario, que están en su navegador.
- **Es reversible:** se puede volver a público cuando se quiera.

### T4 · Docker de producción y seguridad

Ver la tabla del punto 2 del estudio:

- [ ] nginx sin root y con solo lectura;
- [ ] `cap_drop` y `no-new-privileges`;
- [ ] cabeceras de seguridad con CSP, repetidas en cada `location`;
- [ ] imágenes fijadas por digest;
- [ ] Trivy, `npm audit` y CodeQL en CI;
- [ ] Dependabot;
- [ ] SBOM y firma;
- [ ] perfil `prod` con Caddy y HTTPS;
- [ ] release a GHCR;
- [ ] `docs/despliegue/` y `SECURITY.md`.

La CSP tendrá que permitir los servicios de teselas de la Fase 10 (`connect-src` e `img-src`).

Explicación de cada punto (el porqué) en la tabla del punto 2 del estudio, que el usuario pidió apuntar entera. Si algún día fuese un producto comercial, además:

- [ ] cambiar la imagen de satélite de la Fase 10, que es no comercial (CC BY-NC-SA), por una fuente con licencia comercial;
- [ ] revisar las condiciones de Google 3D Tiles (Fase 12);
- [ ] mantener fuera cualquier marca de terceros;
- [ ] con cuentas o sincronización, aplicar el RGPD para datos de salud (ver T8).

### T5 · Fase 8 · Rodillo inteligente

Sigue en espera hasta que el usuario compre uno con **Bluetooth FTMS** o monte uno casero (T9). Se puede adelantar un FTMS simulado. Detalle en el punto 1 del estudio.

### T6 · AWS (solo si se decide)

S3 privado + CloudFront (OAC, ACM, cabeceras) + Route 53, Terraform en `infra/`, despliegue desde GitHub Actions con OIDC. Detalle en el punto 4 del estudio. No hay nada decidido.

### T7 · GitHub como el de una empresa

Pedido por el usuario el 2026-11-27. Detalle y porqué en el punto 7 del estudio.

- [ ] **Antes de nada**, que el usuario decida entre público (todo gratis) o privado (necesita Pro o Team para las reglas de rama). Afecta a T3.
- [ ] Presentación:
  - descripción, temas, web e imagen para compartir;
  - `README` con insignias, capturas y arranque rápido.
- [ ] Archivos estándar:
  - `LICENSE` (que la decida el usuario);
  - `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `SUPPORT.md` y `CHANGELOG.md`.
- [ ] `.github/`:
  - plantillas de issue en formulario y de PR;
  - `CODEOWNERS` y `dependabot.yml`;
  - etiquetas `tipo:`, `área:` y `prioridad:`.
- [ ] Reglas de `main`:
  - solo por PR y con CI obligatorio;
  - historial lineal y sin `--force`;
  - fusión _squash_ y borrado automático de ramas.

  Actualizar «Git y GitHub» en `CLAUDE.md`: se acaba el push directo a `main`.

- [ ] Commitlint en CI, release-please (versiones, etiquetas y `CHANGELOG`) y la imagen en GHCR por versión (enlaza con T4).
- [ ] GitHub Project (tablero) junto a los milestones.
- [ ] Seguridad del repo:
  - escaneo de secretos con bloqueo;
  - alertas de Dependabot y CodeQL;
  - informe privado de vulnerabilidades;
  - OpenSSF Scorecard.
- [ ] Opcional: organización gratuita con el nombre de la «empresa» y transferir el repo.

### T8 · Base de datos centralizada (en estudio)

**Decisión (2026-11-28): los datos se centralizan en Supabase** (opción C). El usuario lo confirma: «para los datos, ¿no íbamos a usar Supabase?». Strava no lo necesita (va con la opción b).

- **Ubicación propuesta en el orden:** una fase propia, **«Datos en Supabase»**, después de la 15b y antes del ciclista realista (T13), y siempre antes de la seguridad complementaria (T19), que la necesita para las trampas. **[POR CONFIRMAR]**
- **Lo que lleva:**
  - tablas y RLS con tests;
  - login con enlace mágico;
  - sincronización con Dexie sin perder el modo sin conexión;
  - región UE;
  - cambiar la regla «sin backend» de `CLAUDE.md`. Antes de construir nada, hay que diseñarlo en una fase propia:

- tablas y políticas RLS con tests;
- login;
- sincronización con Dexie sin perder el modo sin conexión;
- región UE.

Al empezarla, cambiar la regla «sin backend, sin cuentas» de `CLAUDE.md`.

**Strava con Supabase** (punto 8.2 del estudio):

- Edge Function `strava-oauth`, que cambia el código por tokens con el _client secret_, guardado como secreto de Supabase y nunca en el repo ni en la web;
- tabla `strava_tokens` con RLS (solo su dueño);
- refresco del token en la función;
- subida del TCX o FIT desde la app con el token.

**Decisión del usuario (2026-11-27): la subida es automática al pulsar «Guardar»** al terminar la sesión. Detalles:

- si no hay conexión o Strava falla, la subida queda en cola y se reintenta, con un aviso discreto y un botón de reintentar en el historial;
- interruptor en Ajustes para desactivarla;
- nunca se suben sesiones simuladas ni sesiones por debajo del mínimo que ya no se guardan (60 s).

**Corrección (2026-11-27):** **la API de Strava ahora es solo para suscriptores.** El usuario lo comprobó en la página de la API («La API de Strava está disponible para suscriptores»). Claude había dicho que era gratis: era información desfasada. Subir un archivo a mano en la web de Strava sí es gratis.

**Decisión del usuario (2026-11-27): opción (b), sin API y gratis.** Así se hará (Fase 15a):

- **Al pulsar «Guardar»**, la app descarga sola el archivo de la sesión: FIT cuando exista (Fase 15b), TCX mientras tanto.
- Aparece un botón **«Abrir Strava para subir»** que abre en otra pestaña la página de subida manual de Strava (`https://www.strava.com/upload/select`; comprobar la URL al construirlo).
- El mismo botón y la descarga están en el detalle de cada sesión del historial, por si se cierra el aviso.
- Interruptor en Ajustes: «Descargar el archivo al guardar» (activado por defecto).
- No se descarga ni se ofrece subir en sesiones con sensores simulados (se avisa).
- Contenido del archivo: vatios marcados como estimados (en las notas del archivo si el formato lo permite), sin posición en rutas inventadas.
- **Strava ya no necesita Supabase ni secretos.** La subida automática con la API (opción a) queda descartada mientras no haya suscripción, y sustituye lo descrito arriba sobre la Edge Function `strava-oauth`, que solo vale si algún día se paga.

Opciones que se valoraron:

- **(a)** pagar la suscripción y mantener la subida automática con Supabase;
- **(b) recomendada si no quiere pagar:** sin API. Al guardar, la app descarga el FIT (o TCX) y ofrece un botón **«Abrir Strava para subir»** con la página de subida manual. Son unos 20 segundos, gratis y sin Supabase.

Con (b), Strava deja de necesitar Supabase, y Supabase solo hace falta si se centralizan los datos (resto de T8).

**App de la API de Strava (2026-11-27):** el usuario la crea en `https://www.strava.com/settings/api`, con el dominio de retorno `localhost` mientras no exista la integración.

- El _client secret_ lo guarda él, en su gestor de contraseñas: **nunca en el repo ni en el chat**. Irá a los secretos de Supabase al construir T8.
- El _client id_ es público: puede ir en la configuración.
- Al desplegar, cambiar el dominio de retorno al de la web.

Flujo paso a paso y qué datos llegan en el punto 8.4 del estudio:

- vatios marcados como estimados en la descripción;
- actividad de interior o virtual;
- sin posición en las rutas inventadas;
- no subir sesiones simuladas.

Si se comparte el proyecto (punto 8.3 del estudio):

- exportar a mano tiene que seguir funcionando para todos;
- las claves van por configuración y la integración se desactiva si faltan;
- antes de dejar conectarse a otras personas: pedir a Strava la ampliación de atletas y tener política de privacidad y consentimiento (RGPD).

Aclaración del 2026-11-27: con **Supabase** (opción C) **no hay que programar un backend propio**. La app habla directamente con Supabase, la seguridad va en políticas RLS por tabla y solo Strava necesitaría una Edge Function. Sí hay que diseñar las tablas, las políticas RLS y el login. Detalle en el punto 8.1 del estudio.

Pregunta del usuario el 2026-11-27. Opciones en el punto 8 del estudio:

- **A**: copia automática en una carpeta sincronizada, sin servidor;
- **B**: PocketBase o PostgreSQL propio en Docker;
- **C**: Supabase o AWS.

Recomendación: A ya, B si se quiere una base de datos de verdad. **B y C cambian la regla «sin backend»: lo decide el usuario.** Nada que hacer hasta que elija.

### T9 · Rodillo inteligente casero (en estudio)

El usuario quiere saber si le sale más barato montar uno con piezas y el software de aquí. Respuesta en el punto 6 del estudio:

- con rodillo de **fluido**, no es viable;
- con rodillo **magnético con palanca**, sí: ESP32 + servo que se anuncia como FTMS, unos 40–80 € en piezas, a cambio de muchas horas y menos precisión.

**El usuario todavía no tiene rodillo** (2026-11-27). Con eso, la comparación de coste total del punto 6 del estudio da que el casero apenas ahorra frente a un **FTMS de segunda mano (150–250 €, orientativo)** y da mucho menos.

- **Recomendación:** comprar un FTMS de segunda mano.
- **Decisión del usuario (2026-11-27):** si el casero se complica y sale más rentable comprar, se compra. Con los números del estudio es así, así que **la vía elegida es comprar un rodillo FTMS** (mejor de segunda mano). El casero queda descartado salvo que el usuario quiera retomarlo como proyecto.
- **Casero:** solo como proyecto opcional. Si sale adelante, el firmware va en `firmware/` o en otro repo, y la app no cambia (Fase 8).
- **Si compra un rodillo magnético tonto:** la app hoy solo trae curvas de fluido, así que habría que meter una curva personalizada.
- Cuando compre, actualizar «Atleta y equipo» en `CLAUDE.md`.

### T11 · README y manual de uso de toda la app

Pedido el 2026-11-27: que el agente de VS Code actualice la documentación para que explique bien cómo funciona **toda** la app. Hoy el `README.md` (136 líneas) mezcla presentación, comandos y funciones; `docs/ESTRUCTURA.md` explica el código, no el uso.

**Reparto de archivos:**

- `README.md`: la portada, corta. Qué es, captura o GIF, funciones principales en una lista, arranque rápido (web publicada, Docker y `npm run dev`), requisitos (Chrome en el ordenador y Bluetooth), privacidad (los datos se quedan en el navegador) y enlaces al manual, a `ESTRUCTURA.md`, al `ROADMAP` y a `docs/contexto/`. Las insignias y el estilo de empresa llegan con la Fase 13 (T7).
- **`docs/MANUAL.md`** (nuevo): cómo se usa todo, en español sencillo y con capturas a tamaño de escritorio. Contenido propuesto:
  1. Primeros pasos: abrir, instalar como app, configurar el atleta (peso, bici, rueda) y las zonas de pulso Z1…Z6.
  2. Sensores: emparejar banda y sensor de velocidad, qué pasa si se cae uno y sensores simulados.
  3. Rodillo y potencia: elegir modelo o curva, qué significa «estimado», ramp test y FTP, zonas de potencia.
  4. Biblioteca y editor de sesiones: bloques por pulso o por potencia, repeticiones, importar y exportar `.zwo`.
  5. El player: lo que se ve en pantalla, avisos de voz y pitidos, contador de 10″, +1′, saltar y pantalla completa (F).
  6. Rutas: rutas inventadas e importar GPX, modo potencia y modo rueda, vista 3D, hora del día, fantasma y demo 3D (y el paisaje real cuando exista).
  7. Al terminar: resumen (tiempo en zona, carga, kcal, NP, IF, TSS), guardar, descarga del archivo y subida a Strava (opción b), y FIT para el entrenador.
  8. Historial: detalle con gráficas, forma y fatiga, exportar y borrar, retomar una sesión sin terminar.
  9. Plan del entrenador: copiar el informe y pegar el plan (resume y enlaza `docs/agente-entrenador.md`).
  10. Datos y copia de seguridad: dónde se guardan, exportar e importar, qué se pierde si se borran los datos de Chrome.
  11. Cálculos explicados: carga por pulso, kcal, NP, IF, TSS y la velocidad virtual. Las fórmulas de `CLAUDE.md` contadas para personas.
  12. Problemas frecuentes: Bluetooth no aparece, el sensor se desconecta, la app no se actualiza, `localhost` frente a la web publicada.

**Cuándo:** después de la Fase 9, para que ya salgan las zonas Z1…Z6. Puede ir como última tarea de la 9 o junto a la 13. A partir de ahí, **cada fase que cambie algo visible actualiza el manual** (añadir la regla a «Forma de trabajar» en `CLAUDE.md`).

**Criterio de hecho:**

- alguien que no conoce la app puede hacer una sesión completa solo con el manual;
- no hay datos personales en capturas ni en ejemplos;
- la regla de `CLAUDE.md` está añadida.

### T12 · Curvas suaves en la vista 3D (fallo, Fase 9)

**El usuario lo confirma (2026-11-28): curvas antes que el realismo.**

El usuario lo notó el 2026-11-27: en las curvas el ciclista gira «a tirones». **No depende de los niveles de realismo**: es un fallo de la geometría, y se arregla antes.

- **Causa probable** (`src/domain/world/path.ts`):
  - la ruta se remuestrea cada 10 m y `pointAt` interpola en línea recta entre puntos, así que el camino es una poligonal con esquinas;
  - `poseAt` saca el rumbo con una ventana de ±5 m, por lo que el rumbo cambia de golpe en cada vértice;
  - la carretera, los quitamiedos y las balizas usan la misma poligonal.
- **Arreglo propuesto:**
  - suavizar el trazado en planta (spline Catmull-Rom centrípeta, o un suavizado previo de lat/lon del GPX) y remuestrear denso (~1 m) para el mundo 3D;
  - rumbo desde la tangente de la curva;
  - un poco de amortiguación en la cámara y en la inclinación del ciclista.
- Test en `domain/world` con un caso a mano: en un arco de radio conocido, el cambio de rumbo entre muestras seguidas es pequeño y constante.
- Comprobación visual con la demo 3D en una ruta con curvas.

### T13 · Ciclista realista

Pregunta del 2026-11-27: **los niveles 1–3 mejoran el paisaje, no el ciclista**; seguiría siendo el «muñequito» actual.

- Para un ciclista realista: modelo 3D detallado (glTF) con esqueleto, animación de pedaleo ligada a la cadencia y bici con detalle.
- El modelo tiene que ser propio o con licencia libre (CC0 o CC-BY) y no puede parecerse a los de Zwift.
- Al terminar, el público también puede usar modelos mejores.
- **Cuándo:** después de la Fase 12, o antes si el usuario lo prioriza; es independiente del paisaje. Hay que cuidar el rendimiento (calidad gráfica de la 15a).

### T14 · Crear una ruta eligiendo puntos en un mapa

Pedido el 2026-11-27 («con lo del GPX sería bomba»):

- El usuario marca inicio, fin y puntos de paso en un mapa, y la app calcula el recorrido por carreteras, le pone altitud y lo guarda como una ruta más, igual que un GPX importado.
- **Cómo:**
  - mapa con teselas de OpenStreetMap, con atribución;
  - rutas por un servicio gratuito de cálculo para bici: BRouter (sin clave) u OpenRouteService (clave gratuita). Google Maps sirve, pero es de pago y con clave;
  - la altitud, desde las teselas de relieve de la Fase 10, que ya se decodifican allí.
- **Cuándo:** justo después de la Fase 10, porque reutiliza su lógica de teselas y relieve.
- Privacidad: avisar de que el servicio de rutas recibe los puntos elegidos.

### T15 · Clave de Google para el nivel 3 (cuando se hagan los niveles 1 y 2)

El usuario quiere ayuda para darse de alta. **No es Google Earth, sino Google Maps Platform** (Photorealistic 3D Tiles, con la Map Tiles API). Pasos para hacerlos juntos al llegar a la Fase 12:

1. Entrar en Google Cloud Console con su cuenta de Google y crear un proyecto.
2. Crear una cuenta de facturación. Google pide tarjeta incluso para el uso gratuito.
3. Activar la **Map Tiles API**.
4. Crear una **clave de API restringida**: solo esa API y solo las direcciones de la app (`localhost` y la web publicada).
5. Poner un **presupuesto con alertas** y cuotas diarias bajas, para que nunca haya un cargo inesperado.
6. Pegar la clave en Ajustes de la app. Se guarda solo en su navegador y nunca va al repo.

Comprobar en ese momento el precio y las condiciones (atribución, caché).

### T16 · Arco o cámara de llegada («FINISH»)

Pedido el 2026-11-27:

- un arco de meta 3D propio al final de la ruta (o al final de cada vuelta);
- al cruzarlo, una cámara lenta lateral o frontal unos segundos con el texto de llegada, y después el resumen.
- **Condición del usuario:** que se mantenga con los niveles 2 y 3. Es un objeto propio colocado sobre la carretera del GPX, así que funciona con cualquier terreno; con las 3D Tiles de Google hay que comprobar que se ve bien sobre ellas.
- Se hace en la 15a y se revisa en la 11 y la 12.

### T17 · Pulso máximo de la sesión y avisos

Pedido el 2026-11-27:

- **Lo que ya existe:** el editor deja planificar por bloques de zona (por ejemplo 30′ Z2 + 20′ Z4 + 10′ Z2) y el player avisa por voz si el pulso sale de la zona del bloque (tras 60 s de bloque, avisa a los 25 s fuera y no repite antes de 90 s). Hay que contárselo bien al usuario en el manual (T11).
- **Nuevo:**
  - **pulso máximo** opcional por sesión, en ppm o como «no pasar de Z_n», y opcional también por bloque;
  - si se supera, aviso inmediato (pitido y voz) que se repite mientras siga por encima, sin las esperas de los avisos de zona;
  - el resumen muestra el tiempo por encima del máximo;
  - se guarda con la sesión y en la copia de seguridad (cambio de modelo, así que migración de Dexie si hace falta).

### T18 · Reconexión de Bluetooth sin preguntar

Sobre la limitación «Chrome pide elegir el sensor una vez por sesión»:

- **No hace falta hardware.** Chrome tiene una función experimental, la opción `chrome://flags/#enable-web-bluetooth-new-permissions-backend`, que permite recordar los sensores ya emparejados (`navigator.bluetooth.getDevices()` y `watchAdvertisements()`). La activa el usuario una vez en Chrome.
- La app la usaría si está disponible y, si no, pediría el sensor como ahora.
- Explicar en el manual cómo activarla. Es experimental: puede cambiar con las versiones de Chrome.

### T19 · Seguridad complementaria (al final de todo)

Decisión del usuario (2026-11-28): las ideas de seguridad del punto 5 del estudio se hacen **después de terminar con todo**, como algo complementario y pensado para empresa:

- copia de seguridad cifrada;
- recordatorio de copia;
- límites de tamaño al importar;
- y lo que salga de la revisión de seguridad.

La CSP y las cabeceras siguen en la Fase 14. **«Context bombs» (aclarado el 2026-11-28): el usuario quiere las dos cosas.**

- **CSP:** en la Fase 14 (T4), como ya estaba.
- **Trampas que avisan (_canary tokens_, _honeytokens_):** aquí, al final. En una app sin servidor hay poco que vigilar; tienen sentido sobre todo con Supabase:
  - filas y usuarios señuelo que nadie legítimo lee, con aviso si alguien accede;
  - una ruta o tabla señuelo;
  - un token web señuelo en un documento interno.
- **Ojo con poner claves falsas en el repo** (por ejemplo, claves de AWS de canarytokens.org): el escaneo de secretos de GitHub las detecta y las puede bloquear o hacer revocar. Si se usan, fuera del repo público o como token web, no como clave.

### T20 · Sugerencias de zonas («X podría ser tu Z2»)

Pedido el 2026-11-27: que la app avise si las zonas configuradas no encajan con lo que pasa en los entrenos, por ejemplo si el Z2 configurado está entre 130 y 140 pero los datos dicen otra cosa.

- **Nunca cambia las zonas sola:** muestra una sugerencia con el porqué y el usuario la acepta o no (regla «no inventar datos»).
- **De dónde sale:**
  - (1) un test guiado de umbral de 30′: el pulso medio de los últimos 20′ da el umbral, y las zonas salen como % de ese umbral. Es lo de «zonas desde un test» de la 15b;
  - (2) el historial: mejor pulso sostenido en 20–30′ en sesiones duras y pulso máximo visto;
  - (3) sensaciones (escala de esfuerzo 1–10) que se piden al terminar cada sesión, porque el usuario entrena por pulso y sensaciones. Si en bloques de Z2 marca esfuerzo alto de forma repetida, es una pista.
- Va en la 15b.

### T10 · Pasar las tareas a issues de GitHub (después)

Pedido el 2026-11-27: **apuntado para hacerlo más adelante, no ahora.** Cuando el usuario lo diga:

- un issue por tarea o casilla (T0–T9), con criterios de «hecho»;
- cada uno en el milestone de su fase según la propuesta de roadmap de T2 (crear los milestones que falten);
- etiquetas de tipo y área.

Lo hará Claude en la nube (los issues son suyos según el reparto). El agente de VS Code trabajará desde ellos: rama por issue y PR con `Closes #n`. Antes de crear issues nuevos, revisar los que ya existen para no duplicar: #10–#12 de la Fase 8, #18–#21 de pruebas con hardware y #22–#30 de paisaje real.

## Fases por hacer

Ver el detalle en [`fases/`](../fases/) y en `docs/ROADMAP.md`. Cada tarea es un issue en su milestone de GitHub. Las fases 0–7 están hechas.

- **Fases 10–12 · Paisaje real** (niveles 1, 2 y 3): planificadas en el PR #31, sin fusionar (ver T0).
- **Fase 8 · Rodillo inteligente (opcional)**: FTMS, modo ERG, modo simulación. Solo si se compra uno.

## Pruebas con hardware real (milestone propio)

- [ ] Fase 2: instalar la PWA en Chrome para Windows, usarla sin conexión y ver el aviso de actualización. **2026-11-27:** el usuario la ha instalado y le sale el botón «Actualizar». Falta confirmar el uso sin conexión.
- [ ] Fase 3: banda de pulso y sensor de velocidad/cadencia reales (pulso, velocidad y cadencia en directo, reconexión).
- [ ] Fase 4: rodillo real (elegir su modelo o meter su curva) y ramp test de verdad.
- [ ] Fase 5: una ruta completa con sensores reales.

## Limitaciones conocidas

- Chrome pide elegir el sensor Bluetooth una vez por sesión de la app. Reconectar sin preguntar requiere activar una opción experimental de Chrome: ver T18.
- ~~El player con ruta cabe justo en 1280×900~~: el usuario confirma (2026-11-27) que en su pantalla se ve bien sin scroll. Quitada.
- El IF y el TSS se calculan con el FTP del momento; cambiar el FTP no recalcula sesiones antiguas.
- Tras un ramp test con simulados se puede guardar un FTP simulado (avisa de que no es real).
- Una sesión retomada no guarda el hueco en que la app estuvo cerrada: el TCX lleva el tiempo en movimiento seguido. Ejemplo: si la app se cierra en el minuto 20 y vuelves a los 5 minutos, el archivo no muestra esa pausa de 5 minutos y la hora de fin sale 5 minutos antes de la real. No afecta a la distancia, al pulso ni a la carga.
- La vista 3D está en «Rodar» y en la demo; la sesión sobre ruta sigue con la franja 2D.
- Los fps de la vista 3D solo se han medido en headless; falta verlo en el portátil del usuario.
- El TCX aún no se ha subido de verdad a Strava ni a Garmin Connect (se genera siguiendo el orden del esquema TCX v2 y los tests comprueban ese orden, pero no se ha validado contra el XSD).

## Ideas y mejoras pedidas

- **Importar rutas en otros formatos** (KML, TCX) además de GPX. Hoy solo GPX con altitud. Para rutas dibujadas a mano: gpx.studio, Strava, Komoot o RideWithGPS exportan GPX con altitud; Google Maps no exporta GPX y «Mis mapas» da KML sin altitud (pregunta del usuario, 2026-11-25).
- **Ideas de seguridad, diseño y funciones** (2026-11-27): copia cifrada, recordatorio de copia, límites de tamaño al importar, panel de inicio, selector de calidad gráfica del 3D, exportar FIT, subida a Strava, zonas desde un test. **Aceptadas por el usuario** (van a la Fase 15 propuesta en T2), **salvo el modo daltónico**, que no le interesa por ahora. Ver el punto 5 del [estudio del 2026-11-27](../estudios/2026-11-27-rodillo-inteligente-produccion-aws.md).
- _(Añadir aquí las mejoras que pida el usuario.)_
