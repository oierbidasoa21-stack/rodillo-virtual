# Pendientes

_Última actualización: 2026-11-27._

## Tareas apuntadas el 2026-11-27 (para el agente de VS Code)

El usuario pide **apuntarlas, no hacerlas**: los cambios los hace su agente. Van en este orden.

**Reparto del trabajo (decidido el 2026-11-27):**

- El usuario habla **solo con Claude en la nube**, que hace de intermediario: apunta las tareas aquí (y como issues), revisa los PR, vigila CI y mantiene `docs/contexto/` al día.
- El **agente de VS Code** hace los cambios de código: una rama por tarea y un PR que la cierra.
- Se comunican **a través del repo**, porque ninguno ve la conversación del otro.
- Para no pisarse: Claude en la nube solo toca `docs/contexto/` y los issues; el resto de archivos (código, `ROADMAP.md`, `CLAUDE.md`, `README.md`) son del agente de VS Code. El porqué y el detalle de las preguntas están en [`../estudios/2026-11-27-rodillo-inteligente-produccion-aws.md`](../estudios/2026-11-27-rodillo-inteligente-produccion-aws.md).

### T0 · «PR cero»: fusionar el plan de los niveles de realismo (#31)

[PR #31](https://github.com/oierbidasoa21-stack/rodillo-virtual/pull/31) (`docs: plan de las fases 10–12`) sigue **abierto sin fusionar**. Lleva al `ROADMAP` las fases 10, 11 y 12 (paisaje real, niveles 1, 2 y 3) y crea `fases/fase-10-paisaje-real.md`. Hasta que se fusione, `main` dice que la fase actual es la 8 y no aparecen los niveles de realismo.

- [ ] Revisar y fusionar #31 (CI en verde).
- [ ] Comprobar que existen los milestones «Fase 10 — Paisaje real · nivel 1», «Fase 11 …» y «Fase 12 …», y que los issues #22–#30 (etiqueta `paisaje-real`) están en el suyo.
- [ ] Después, actualizar `estado/ESTADO.md` («Queda la Fase 8» → fases 10–12 en curso o planificadas, la 8 en espera) y la lista «Fases por hacer» de abajo.

### T1 · Zonas de pulso Z1…Z6

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
  - **Fase 9 — Mantenimiento** (el número de la 9 descartada queda libre): zonas Z1…Z6 (T1) y seguimiento al día (T2).
  - **Fase 10–12 — Paisaje real** niveles 1–3 (#31, sin cambios).
  - **Fase 13 — GitHub profesional** (T7) y **Fase 14 — Docker de producción y seguridad** (T4). Van juntas o seguidas, porque la CSP y CI se tocan en las dos.
  - **Fase 15 — Mejoras aceptadas** (punto 5 del estudio, sin el modo daltónico): copia cifrada, recordatorio de copia, límites al importar, panel de inicio, calidad gráfica del 3D, FIT, Strava y zonas desde un test.
  - **En espera o en estudio**, sin número: Fase 8 (rodillo inteligente o casero, T5 y T9), base de datos centralizada (T8), AWS (T6) y modo local con repo privado (T3, depende de T7).
  - **Orden de ejecución propuesto (2026-11-27, pendiente de que el usuario lo confirme):** el usuario sugiere hacer 13–15 antes que 10–12. Claude está de acuerdo con matices:
    1. **Fase 9** (zonas y seguimiento): lo más pequeño, y cambia el modelo de datos, así que mejor antes de añadir nada más.
    2. **Fase 13** (GitHub profesional): fija la forma de trabajar (todo por PR, CI obligatorio, plantillas). Con dos agentes, cuanto antes mejor: todo lo que venga después ya pasa por ese filtro. Se puede hacer mientras el repo siga público, porque las reglas de rama son gratis en públicos.
    3. **Fase 14** (Docker de producción y seguridad): poner la CSP estricta **antes** de la Fase 10 es seguridad desde el diseño. Luego la Fase 10 solo abre, de forma explícita, los servicios de teselas que necesita, en vez de tener que cerrar después lo que quedó abierto.
    4. **Fase 15** partida en dos:
       - **15a, antes de la 10**: lo pequeño (recordatorio de copia, límites al importar, copia cifrada, calidad gráfica del 3D, panel de inicio). Los límites al importar y la copia cifrada encajan con la Fase 14.
       - **15b, después o en espera**: exportar FIT y zonas desde un test. **Strava sale de la Fase 15**: necesita un secreto (OAuth), y por tanto una Edge Function o un servidor, así que depende de T8.
    5. **Fases 10 → 11 → 12** (paisaje real): lo más grande y con más riesgo (servicios externos, rendimiento, licencias). Mejor con la base ya limpia y segura.
    6. **Fase 8** cuando haya rodillo: es independiente y puede entrar en cualquier momento.
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
- **Casero:** solo como proyecto opcional. Si sale adelante, el firmware va en `firmware/` o en otro repo, y la app no cambia (Fase 8).
- **Si compra un rodillo magnético tonto:** la app hoy solo trae curvas de fluido, así que habría que meter una curva personalizada.
- Cuando compre, actualizar «Atleta y equipo» en `CLAUDE.md`.

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

- [ ] Fase 2: instalar la PWA en Chrome para Windows, usarla sin conexión y ver el aviso de actualización.
- [ ] Fase 3: banda de pulso y sensor de velocidad/cadencia reales (pulso, velocidad y cadencia en directo, reconexión).
- [ ] Fase 4: rodillo real (elegir su modelo o meter su curva) y ramp test de verdad.
- [ ] Fase 5: una ruta completa con sensores reales.

## Limitaciones conocidas

- Chrome pide elegir el sensor Bluetooth una vez por sesión de la app (reconectar sin pedirlo requiere un flag experimental).
- El player con ruta cabe justo en 1280×900; en pantallas más bajas necesita algo de scroll.
- El IF y el TSS se calculan con el FTP del momento; cambiar el FTP no recalcula sesiones antiguas.
- Tras un ramp test con simulados se puede guardar un FTP simulado (avisa de que no es real).
- Una sesión retomada no guarda el hueco en que la app estuvo cerrada: el TCX lleva el tiempo en movimiento seguido.
- La vista 3D está en «Rodar» y en la demo; la sesión sobre ruta sigue con la franja 2D.
- Los fps de la vista 3D solo se han medido en headless; falta verlo en el portátil del usuario.
- El TCX aún no se ha subido de verdad a Strava ni a Garmin Connect (se genera siguiendo el orden del esquema TCX v2 y los tests comprueban ese orden, pero no se ha validado contra el XSD).

## Ideas y mejoras pedidas

- **Importar rutas en otros formatos** (KML, TCX) además de GPX. Hoy solo GPX con altitud. Para rutas dibujadas a mano: gpx.studio, Strava, Komoot o RideWithGPS exportan GPX con altitud; Google Maps no exporta GPX y «Mis mapas» da KML sin altitud (pregunta del usuario, 2026-11-25).
- **Ideas de seguridad, diseño y funciones** (2026-11-27): copia cifrada, recordatorio de copia, límites de tamaño al importar, panel de inicio, selector de calidad gráfica del 3D, exportar FIT, subida a Strava, zonas desde un test. **Aceptadas por el usuario** (van a la Fase 15 propuesta en T2), **salvo el modo daltónico**, que no le interesa por ahora. Ver el punto 5 del [estudio del 2026-11-27](../estudios/2026-11-27-rodillo-inteligente-produccion-aws.md).
- _(Añadir aquí las mejoras que pida el usuario.)_
