# Decisiones

Cada decisión con su fecha, quién la tomó (**usuario** o **técnica**, propuesta por Claude y aceptada) y el motivo. Las más recientes, al final.

## 2026-10-02 — Arranque y Fase 0

- **Usuario · Cuenta de GitHub `oierbidasoa21-stack`**, no `oierfernandezg`: es la cuenta con sesión en `gh`. Repo `rodillo-virtual`.
- **Usuario · Repo público**, para poder usar GitHub Pages gratis. Los datos personales que quedaron en la v1 de referencia y en el historial de git **se dejan así**, sin reescribir el historial.
- **Usuario · Peso y zonas fuera del repo**: en `config/athlete.local.json` (ignorado), con `config/athlete.example.json` como esquema.
- **Técnica · TypeScript fijado en `~6.0`**: typescript-eslint no admite TS 7.
- **Técnica · Un solo workflow de CI** y luego, a petición del usuario, **`Deploy` separado con `paths-ignore`** para `docs/**` y `*.md` (los cambios de documentación no redespliegan; el lint sigue corriendo en todo).

## 2026-10-02 — Fase 1

- **Usuario · Peso y zonas en la app**: valores de ejemplo por defecto; se editan en Ajustes o se **importa `athlete.json`**. Se guardan en IndexedDB.
- **Usuario · Fuentes Barlow autoalojadas** con `@fontsource` (sin Google Fonts).
- **Usuario · `fake-indexeddb`** para testear la capa de almacenamiento.
- **Técnica · Player como máquina de estados pura** que emite eventos; la UI y el audio solo reaccionan. El tiempo que sobra de un tick pasa al bloque siguiente.
- **Técnica · Al editar una zona se ajusta la vecina** para que no queden huecos.
- **Técnica · El contador de 10″ siempre pita**, aunque los pitidos estén apagados.

## 2026-10-02 — Fase 2 y cambio de enfoque

- **Usuario · Fase PWA insertada como Fase 2** y renumeración del resto.
- **Usuario · `vite-plugin-pwa`**.
- **Técnica · Actualizaciones en modo «aviso»**: nunca se recarga sola; el aviso espera si hay una sesión o el editor abierto.
- **Usuario · Probar solo en el ordenador (Chrome en Windows)**. El móvil pasa a una fase final aparte (Fase 9). Los criterios de «hecho» se comprueban en el ordenador.
- **Usuario · Fase 2 cerrada sin su prueba de instalación**: la hará más adelante.

## 2026-10-02/03 — Fase 3

- **Usuario · `@types/web-bluetooth`**.
- **Usuario · Circunferencia de rueda en la Fase 3**, por defecto **2155 mm (700×32)**. Bici: Van Rysel EDR AF.
- **Usuario · Sensores simulados también en la web publicada**, tras un interruptor en Ajustes → Desarrollo, siempre marcados como SIMULADO.
- **Usuario · Sin hardware todavía**: la fase se cierra con simulados y la prueba real queda pendiente.
- **Técnica · Los sensores simulados generan paquetes en bytes** que pasan por los mismos decodificadores que los reales.

## 2026-10-03 — Fase 4

- **Usuario · Curvas de rodillo**: lista de modelos con fuente verificable + curva personalizada. Por defecto ninguna (sin potencia).
- **Usuario · Objetivos de potencia en % del FTP** (banda ±5 %).
- **Usuario · Ramp test estándar**: 5′ a 100 W, +20 W/min, FTP = 75 % del mejor minuto.
- **Usuario · Una fase con 3 revisiones**.
- **Usuario · Copia de seguridad completa** (sesiones, historial, ajustes) antes de seguir.
- **Técnica · Solo rodillos de fluido** en la lista (coeficientes de GoldenCheetah); los magnéticos dependen del nivel de resistencia.
- **Técnica · `zoneId` → `target`** en los bloques, con migración Dexie v1 → v2.
- **Técnica · El simulador vuelve a su estado** al terminar una sesión.

## 2026-10-03 — Fase 5

- **Usuario · 3 rutas inventadas** en la app; los GPX propios se importan y no van al repo.
- **Usuario · Minimapa en SVG sin mapa de fondo** (funciona sin conexión).
- **Usuario · Sin potencia no se rueda en modo potencia**, pero **sí en un modo «por velocidad de rueda»**, siempre marcado como «sin potencia».
- **Usuario · En sesión sobre ruta, la ruta da vueltas** hasta que acaba la sesión.
- **Usuario · El modo activo siempre visible** en la vista de carrera.
- **Técnica · Altitud suavizada con media triangular de ±50 m** (una media simple dejaba bordes del 60 % con picos de GPS).

## 2026-11-25 — Organización

- **Usuario · Milestones en GitHub** para organizar el trabajo: uno por fase, más «Pruebas con hardware real». Las tareas pendientes como issues.
- **Usuario · Carpeta `docs/contexto/`** con todo el contexto, actualizada tarea a tarea.
- **Técnica · Artefacto de Claude como «app instalable»: no sirve como sustituto de la PWA.** El visor de artefactos bloquea las APIs de dispositivo (Web Bluetooth incluida), no permite service worker ni manifest propios y no deja hacer peticiones a otros sitios. Se puede fijar en la barra lateral de claude.ai, pero no instalar como app del sistema. La app instalable es la PWA de GitHub Pages.
- **Usuario · Sin artefacto**: no se hará demo como artefacto de Claude.
- **Usuario · Trabajo en automático**: Claude hace todo sin pedir aprobación: planes (escritos en `docs/contexto/fases/`), decisiones de diseño (anotadas aquí), dependencias nuevas (explicadas), commits, push y fast-forward a `main`. Solo pregunta lo que únicamente el usuario puede saber (equipo, compras).
- **Usuario · Solo ordenador**: no hay móvil en el proyecto. Se elimina la Fase 9 del roadmap y se cierran su milestone y sus issues como «no planificado».
- **Usuario · Se mantiene el formato `.zwo` en la Fase 6** tras explicarle qué es (archivo de sesiones estructuradas que usan muchas apps de rodillo).
