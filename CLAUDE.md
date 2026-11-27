# CLAUDE.md — Rodillo Virtual

Instrucciones para Claude Code. Léelas al empezar cada sesión, junto con `docs/ROADMAP.md`.

## Qué es este proyecto

Aplicación web de entrenamiento en rodillo para **uso personal**, inspirada en el funcionamiento de Zwift: workouts estructurados, rutas virtuales con pendiente, métricas en directo y, más adelante, un mundo 3D.

- Un único usuario (yo). Sin backend, sin cuentas, sin multijugador.
- Todo corre en el navegador y los datos se quedan en el dispositivo.
- No uses el nombre, logos, mundos, rutas ni assets de Zwift. Se replican **funcionalidades**, no su contenido.

## Referencia

`docs/reference/rodillo-pulso-v1.html` es la versión 1 que ya funciona (un solo archivo HTML). Es la **referencia funcional** para la Fase 1: zonas por pulso en /10″, biblioteca y editor de sesiones, player con avisos, contador de pulso de 10″, resumen con carga y kcal, historial.

- Reutiliza su lógica y su modelo de datos, pero **no copies su estructura**: el proyecto se organiza en módulos (ver Arquitectura).
- Si algo de la v1 contradice este documento, manda este documento.

## Atleta y equipo

- Los datos personales (peso, peso de la bici y zonas de pulso) **no se versionan**. Están en `config/athlete.local.json` (ignorado por git). Si no existe, usa `config/athlete.example.json`, que tiene el mismo esquema y valores de ejemplo.
  - Para conocer mis valores reales, lee `config/athlete.local.json`. No los copies a código, tests, documentación ni commits.
  - Zonas: `Z1`, `Z2`, `Z3`, `Z4` (umbral), `Z5`, `Z6`, contadas en 10 segundos (ppm = valor × 6). `max: null` = sin límite superior. Hasta la Fase 9 se llamaban `L1`, `L2`, `L3`, `UA`, `UA+`, `VO2` (misma posición): la app sigue aceptando esos nombres al importar.
  - Las zonas de **potencia** también se llaman Z1…Z7 (Coggan) y no coinciden con las de pulso: donde salgan las dos, se dice «de pulso» o «de potencia».
- Entreno **por pulso y sensaciones**. Aún no tengo FTP medido.

- Bici: Van Rysel EDR AF, ruedas 700×32.
- Equipo previsto: **rodillo "tonto"** + banda de pulso BLE + sensor de velocidad BLE en la rueda trasera. Puede que más adelante haya rodillo inteligente (FTMS). El diseño soporta ambos.
- Regla: **la app nunca inventa datos**. Si un sensor no está conectado, la métrica que depende de él no se muestra. Las métricas estimadas (potencia en rodillo tonto, kcal) se marcan siempre como estimadas.

## Stack

- **Vite + React + TypeScript** (modo `strict`).
- Estado: **Zustand**. Persistencia local: **Dexie** (IndexedDB). Nada de `localStorage` para datos importantes.
- Tests: **Vitest** para la lógica de dominio.
- Calidad: **ESLint + Prettier**.
- Sensores: **Web Bluetooth** (Chrome en el ordenador). Requiere HTTPS o `localhost`.
- 3D (solo a partir de la Fase 7): **Three.js** con **@react-three/fiber**.
- Despliegue: **GitHub Pages** mediante GitHub Actions (da HTTPS, que necesitan Web Bluetooth y la PWA fuera de `localhost`).
- PWA con **vite-plugin-pwa**: instalable y funciona sin conexión una vez cargada.

Puedes añadir dependencias cuando hagan falta, sin pedir confirmación: elige la opción más ligera y mantenida, y explica para qué sirve en el commit y en `docs/contexto/decisiones/`.

## Arquitectura

```
src/
  domain/            # Lógica pura, sin React ni navegador. Toda con tests.
    zones/           # Zonas de pulso y de potencia, clasificación de valores
    workout/         # Modelo de sesión (bloques y repeticiones), expansión, import/export .zwo
    metrics/         # NP, IF, TSS, kJ, TRIMP por zonas, kcal
    physics/         # Velocidad virtual a partir de potencia y pendiente
    trainer/         # Curvas velocidad→potencia de rodillos tontos (cada una con su fuente)
    route/           # Parseo de GPX, remuestreo, suavizado de pendiente
  sensors/           # Web Bluetooth: HR (0x180D), CSC (0x1816), Cycling Power (0x1818), FTMS (0x1826)
    simulated/       # Sensores simulados para desarrollar sin hardware (Ajustes → Desarrollo)
  recording/         # Grabación a 1 Hz y exportación TCX
  storage/           # Dexie: sesiones, historial, ajustes, rutas
  audio/             # Pitidos y voz
  store/             # Stores de Zustand
  ui/                # Componentes y pantallas
```

Reglas:

- `domain/` no importa nada de `ui/`, `sensors/` ni APIs del navegador. Debe poder testearse en Node.
- Cada sensor implementa la misma interfaz (`connect`, `disconnect`, flujo de lecturas con timestamp). La UI no sabe si el dato viene de un sensor real o simulado.
- Una curva de rodillo solo entra en `domain/trainer` si tiene fuente verificable; si no, el usuario puede meterla como personalizada.
- Las rutas de ejemplo son inventadas (nada de Zwift ni de sitios reales). Los GPX del usuario se importan en la app y no van al repo; si hay que guardarlos en disco, en `data/`.
- Los cambios de modelo de datos guardados suben la versión de Dexie con su migración (y su test con una base de la versión anterior).
- Las unidades van en el nombre cuando no son obvias: `durationSec`, `speedKmh`, `powerW`, `distanceM`.

## Física y cálculos (referencia)

- **Velocidad virtual**: resolver `v` en
  `P · η = (0.5 · ρ · CdA · v² + Crr · m · g · cos θ + m · g · sin θ) · v`
  con η = 0.975, ρ = 1.225, CdA = 0.32, Crr = 0.005, m = peso + bici. Usar bisección o Newton.
- **Potencia en rodillo tonto**: `P = f(velocidad de rueda)` según la curva del modelo de rodillo (polinomio, normalmente `a·v + b·v³`). La circunferencia de rueda es configurable (por defecto 2155 mm para 700×32).
- **NP**: media móvil de 30 s, elevar a la 4ª, media, raíz 4ª. **IF** = NP / FTP. **TSS** = (s · NP · IF) / (FTP · 3600) · 100.
- **Carga por pulso**: minutos en zona × peso (Z1 1, Z2 2, Z3 3, Z4 4, Z5 5, Z6 6).
- **kcal**: con potencia, kJ ≈ kcal. Sin potencia, MET por zona × peso × horas (±20 %).

Cada fórmula vive en `domain/` con tests que incluyan al menos un caso calculado a mano.

## Convenciones

- Código, identificadores y commits en **inglés**. Textos de la interfaz y documentación en **español**.
- Componentes React funcionales con hooks. Un componente por archivo.
- La interfaz del player se diseña para leerse a 1 metro: números grandes, colores por zona, avisos sonoros.
- Diseño para el **ordenador**, con tema claro y oscuro. No hay versión móvil: las pantallas estrechas no son requisito.

## Forma de trabajar

1. Trabaja **solo en la fase actual** de `docs/ROADMAP.md`. No adelantes trabajo de fases futuras.
2. **Trabaja en automático, sin pedirme aprobación** (desde 2026-11-25): antes de cada fase escribe un plan corto en `docs/contexto/fases/` y síguelo sin esperar confirmación. Avísame del resultado al terminar.
3. Cambios pequeños e incrementales. Explica el **porqué** de las decisiones técnicas, no solo el qué.
4. Antes de cada commit: `npm run lint`, `npm run test` y `npm run build` deben pasar.
5. Al terminar una tarea, marca su casilla en `docs/ROADMAP.md`.
6. Las decisiones de diseño y prioridades tómalas tú con un criterio razonable y anótalas, con su motivo, en `docs/contexto/decisiones/`. Pregúntame solo lo que únicamente yo puedo saber (qué equipo tengo, qué voy a comprar).
7. **Contexto entre conversaciones**: al empezar, lee `docs/contexto/README.md` y `docs/contexto/estado/ESTADO.md`. Al terminar cada tarea, actualiza `docs/contexto/` según su README (estado, registro de cambios, decisiones, fase en curso, pendientes y sesión). Los scripts de prueba en navegador se guardan en `docs/contexto/pruebas/scripts/`.
8. Las tareas pendientes viven también en GitHub como issues dentro del milestone de su fase. Al cerrar una tarea, cierra su issue; al cerrar una fase, cierra su milestone.

## Dónde se prueba

- La app se usa **solo en el ordenador: Chrome en Windows**. No hay móvil en el proyecto (decidido el 2026-11-25). Los criterios de «hecho» de cada fase se comprueban ahí, con la web publicada en GitHub Pages.
- Las comprobaciones automáticas (navegador headless, capturas) se hacen a tamaño de escritorio.

## Git y GitHub

- Rama `main` siempre funcional. Trabajo en ramas: `feat/…`, `fix/…`, `chore/…`, `docs/…`.
- Commits con **Conventional Commits**: `feat(workout): add repeat blocks`, `fix(sensors): handle HR disconnect`.
- Commits pequeños, uno por cambio lógico.
- **Haz push y fast-forward a `main` tú mismo**, sin pedir permiso, cuando lint, tests y build pasen y lo hecho esté comprobado. Después vigila **CI** y **Deploy** y, si cambia la app, repite la prueba contra la web publicada. Nunca `--force` sobre `main`.
- Nunca subas datos personales: exportaciones de entrenamientos y archivos `.tcx`/`.fit`/`.gpx` propios van en `data/`, que está en `.gitignore`.
- Sin secretos en el repo (no hacen falta: no hay backend).

## Comandos

```
npm run dev       # servidor local (localhost, válido para Web Bluetooth)
npm run test      # Vitest
npm run lint      # ESLint
npm run build     # build de producción
```
