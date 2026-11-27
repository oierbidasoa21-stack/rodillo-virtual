# Registro de cambios

Todos los commits de `main`, del más antiguo al más reciente, agrupados por fase. Se genera a partir de `git log`; al cerrar cada tarea o fase se añaden los nuevos al final.

Formato: `hash` · fecha · mensaje (Conventional Commits, en inglés).

## Fase 0 — Base del proyecto

Ramas: chore/phase-0-setup, docs/phase-0-done, ci/skip-deploy-on-docs

- `acdff57` · 2026-10-02 · docs: add project instructions, roadmap and v1 reference
- `74f1db4` · 2026-10-02 · docs: move roadmap and v1 reference into docs/
- `a143aa5` · 2026-10-02 · chore: scaffold vite react-ts app
- `177a855` · 2026-10-02 · chore: add eslint and prettier
- `311c4d0` · 2026-10-02 · test: set up vitest with sample domain test
- `bdbb00f` · 2026-10-02 · chore(config): move athlete data to local config
- `755a567` · 2026-10-02 · chore: create source folder structure
- `eb04c52` · 2026-10-02 · ci: add lint, test, build and pages deploy workflow
- `a814a6b` · 2026-10-02 · docs: add readme and tick phase 0 tasks
- `10f647b` · 2026-10-02 · docs: tick ci and pages deploy in phase 0
- `1b0970e` · 2026-10-02 · ci: skip pages deploy on docs-only changes

## Fase 1 — Port de la v1 (workout player por pulso)

Ramas: feat/phase-1-port

- `0167af5` · 2026-10-02 · feat(zones): add configurable hr zones, classification and config parser
- `73c6aff` · 2026-10-02 · feat(workout): add workout model, editor ops, library and player state machine
- `6202cf8` · 2026-10-02 · feat(metrics): add time in zone, zone load and MET kcal estimate
- `9e24d6b` · 2026-10-02 · feat(storage): add dexie database for workouts, history and settings
- `4eeecf9` · 2026-10-02 · feat(zones): keep zones contiguous when editing a bound
- `6dfc1bf` · 2026-10-02 · feat(store): add zustand stores backed by dexie
- `4720e5b` · 2026-10-02 · feat(ui): add app shell with tabs, zone strip, themes and self-hosted fonts
- `c341515` · 2026-10-02 · feat(ui): add workout library with own and built-in sessions
- `fc6815e` · 2026-10-02 · feat(ui): add workout editor with blocks, repeats and validation
- `ec84a12` · 2026-10-02 · feat(ui): add settings with athlete data, zones, import/export and theme
- `622bb11` · 2026-10-02 · fix(ui): keep zone table readable on narrow screens
- `7fad6e5` · 2026-10-02 · feat(audio): add beeps and spanish voice cues driven by player events
- `5e847ce` · 2026-10-02 · feat(ui): keep the screen on during a session with wake lock
- `4e46dff` · 2026-10-02 · feat(ui): add guided 10-second pulse counter
- `b4e6f2c` · 2026-10-02 · feat(ui): add session summary with planned vs ridden time per zone
- `dd758c7` · 2026-10-02 · feat(ui): add history with 7-day totals
- `4b675a4` · 2026-10-02 · feat(ui): add full-screen workout player and wire it into the app
- `b570867` · 2026-10-02 · docs: close phase 1 and move roadmap to phase 2

## Fase 2 — PWA (y cambio a pruebas en ordenador)

Ramas: feat/pwa, docs/desktop-first

- `d1f97ba` · 2026-10-02 · docs: add pwa phase to roadmap and renumber later phases
- `d6b964f` · 2026-10-02 · feat(pwa): add app icons
- `52fe0fe` · 2026-10-02 · feat(pwa): add web manifest and service worker with precache
- `6f44756` · 2026-10-02 · feat(pwa): show update prompt, deferred while a session is running
- `b4a91ca` · 2026-10-02 · feat(storage): request persistent storage
- `4c533fd` · 2026-10-02 · docs: document install and offline use
- `0966193` · 2026-10-02 · docs: fix roadmap ticks marked by mistake and a stale phase reference
- `65af4be` · 2026-10-02 · docs: test on desktop chrome first and move mobile testing to a final phase
- `8183d20` · 2026-10-02 · docs: close phase 2 and move roadmap to phase 3

## Fase 3 — Sensores Bluetooth (con simulados)

Ramas: feat/sensors

- `1e3788a` · 2026-10-02 · feat(settings): add configurable wheel circumference (700×32 default)
- `c59bc4c` · 2026-10-02 · chore: add web bluetooth types
- `7985754` · 2026-10-02 · feat(sensors): add common sensor interface and store
- `d70efbe` · 2026-10-02 · feat(sensors): decode heart rate and csc packets
- `67fdca6` · 2026-10-02 · feat(sensors): add simulated heart rate and speed/cadence sensors
- `8c7e908` · 2026-10-02 · feat(sensors): connect heart rate and csc over web bluetooth
- `8e427d0` · 2026-10-02 · feat(ui): add sensors screen with pairing and live status
- `e11094a` · 2026-10-03 · feat(player): show live heart rate, speed and cadence with sensor alerts
- `4757310` · 2026-10-03 · feat(metrics): use measured heart rate for time in zone
- `33b4a29` · 2026-10-03 · docs: document sensors and note the pending hardware test
- `eb56125` · 2026-10-03 · docs: close phase 3 and move roadmap to phase 4

## Fase 4 — Potencia estimada, ramp test y métricas

Ramas: feat/power

- `65e218d` · 2026-10-03 · feat(trainer): add speed to power curves for fluid trainers
- `2ac120b` · 2026-10-03 · feat(physics): solve virtual speed from power, slope and mass
- `a480d59` · 2026-10-03 · feat(metrics): add NP, IF, TSS, kJ, best average and Coggan power zones
- `4637983` · 2026-10-03 · feat(workout): give blocks an hr, %FTP or watts target and migrate stored workouts
- `875757d` · 2026-10-03 · feat(workout): add ramp test protocol and FTP estimate
- `27df3eb` · 2026-10-03 · docs: tick physics task in phase 4
- `98a07c2` · 2026-10-03 · feat(storage): export and import a full backup of workouts, history and settings
- `97b2309` · 2026-10-03 · feat(settings): choose trainer curve and set FTP with power zones
- `2f66ac1` · 2026-10-03 · feat(sensors): show live estimated power and let the simulator ride power targets
- `0977e78` · 2026-10-03 · feat(ramp): guided ramp test that estimates and saves FTP
- `7e93bb0` · 2026-10-03 · feat(metrics): summarise estimated power: avg, max, NP, IF, TSS, kJ and power zones
- `40c9431` · 2026-10-03 · feat(editor): power blocks as % of FTP, with two power sessions in the library
- `31da36b` · 2026-10-03 · feat(player): power blocks with watts band, power summary and TSS in history
- `299430e` · 2026-10-03 · docs: document power, ramp test and backups; note the pending trainer test
- `f12dba4` · 2026-10-03 · docs: close phase 4 and move roadmap to phase 5

## Fase 5 — Rutas en 2D

Ramas: feat/routes

- `514a3f5` · 2026-10-03 · feat(route): read GPX and build routes resampled every 10 m with smoothed grades
- `04b9609` · 2026-10-03 · feat(route): position on a route and ride along it by power or by wheel speed
- `e3827be` · 2026-10-03 · feat(route): add three invented example routes
- `8a35898` · 2026-10-03 · feat(storage): store imported routes (Dexie v3) and include them in backups
- `22acbbc` · 2026-10-03 · feat(metrics): summarise rides on a route: distance, climbing, speed and mode
- `12cc36d` · 2026-10-03 · feat(ui): routes tab with GPX import and a race view for free rides
- `c03c3de` · 2026-10-03 · feat(player): ride a workout on a route that loops until the workout ends
- `271472d` · 2026-10-03 · docs: document routes, close phase 5 and move roadmap to phase 6

## Fase 6 — Grabación y exportación

Ramas: feat/recording

- `44f89cc` · 2026-11-25 · feat(recording): record one sample per second and build TCX files
- `349d7e9` · 2026-11-25 · feat(recording): add a serialisable recorder for heart rate, power, samples and wheel distance
- `fa0e23a` · 2026-11-25 · feat(storage): store recordings and the session in progress (Dexie v4)
- `1e02a64` · 2026-11-25 · feat(recording): record every session, save it in progress and offer to resume it
- `72b5ebe` · 2026-11-25 · feat(history): open a saved session with charts, TCX export and delete
- `012c967` · 2026-11-25 · feat(workout): import and export .zwo workouts
- `d66cb75` · 2026-11-25 · docs: close phase 6 (recording, recovery, history detail, TCX and .zwo)

## Fase 7 — Mundo 3D

Ramas: feat/world-3d

- `20a337b` · 2026-11-25 · feat(world): build the 3D road, ground and trees from a route
- `b9c98dc` · 2026-11-25 · feat(ride): ride routes in 3D with the HUD on top, and a 3D demo
- `e564906` · 2026-11-25 · docs: close phase 7 (3D world and demo)

## Después de la Fase 7 — realismo 3D y mejoras de entrenamiento

Ramas: feat/world-realism, feat/world-spectators, feat/fitness, feat/coach-plan

- `ad36302` · 2026-11-26 · feat(world): shadows, textures, sky with sun and clouds, edge lines and roadside posts
- `3250f48` · 2026-11-26 · fix(world): lighter plain verge; docs for the 3D realism pass
- `4c75763` · 2026-11-26 · feat(world): horizon mountains, dense roadside scenery, detailed rider that leans into corners
- `5aae342` · 2026-11-26 · feat(world): cheering spectators, guardrails, wheel tracks, gravel verges and time of day
- `25fe577` · 2026-11-26 · feat(history): condition, fatigue and freshness from the training load
- `bd35605` · 2026-11-26 · feat(audio): voice coaching: heart rate out of zone, long blocks, climbs ahead, summary
- `fdb32bd` · 2026-11-26 · feat(ride): race a ghost of your fastest earlier ride on the route
- `31f8f15` · 2026-11-26 · feat(plan): bridge with the coaching agent: training report out, weekly plan in
- `37a6215` · 2026-11-27 · chore(docker): self-hostable image and a guide to every folder and file
- `e3f81ec` · 2026-11-27 · feat(ui): full screen for rides and workouts (button or F key)
- `7d4c444` · 2026-11-27 · docs: plan phases 10–12 (real landscape from the GPX) — [PR #31](https://github.com/oierbidasoa21-stack/rodillo-virtual/pull/31)
- `6a48260` · 2026-11-27 · docs(roadmap): current phase 9 and the execution order — [PR #32](https://github.com/oierbidasoa21-stack/rodillo-virtual/pull/32)
- `74ebba5` · 2026-11-27 · docs(roadmap): full execution order with tasks T14, T13 and T19, and T12 in phase 9 — PR #32

## Fase 9 — Mantenimiento

### T1 · Zonas Z1…Z6 · rama `feat/zones-z1-z6`, [PR #33](https://github.com/oierbidasoa21-stack/rodillo-virtual/pull/33) (fusionado el 2026-11-28)

- `2af00bf` · 2026-11-27 · feat(zones): rename heart rate zones L1…VO2 to Z1…Z6, with migration
- `fe6d3b2` · 2026-11-27 · feat(ui): say and show Z1…Z6, and tell heart rate zones from power zones
- `cb0799c` · 2026-11-27 · docs: zones Z1…Z6 in CLAUDE.md, the structure guide, the agent guide and Dexie v6
- `5e00464` · 2026-11-27 · style: format the docs touched by the zone rename

### T12 · Curvas suaves · rama `fix/smooth-curves`, [PR #35](https://github.com/oierbidasoa21-stack/rodillo-virtual/pull/35) (fusionado el 2026-11-28)

- `7583d2a` · 2026-11-27 · fix(world): smooth curves: spline path every metre, heading from the tangent, gentler camera
- `8be9924` · 2026-11-27 · docs: phase 9 plan, T12 done and in review
- `856ae4b` · 2026-11-27 · fix(world): no stack overflow on long routes; close loops explicitly

### T2 · Seguimiento al día · rama `docs/tracking-up-to-date`, [PR #36](https://github.com/oierbidasoa21-stack/rodillo-virtual/pull/36) (en revisión)

- _(commits de esta tarea al fusionar su PR)_

### T11 · README y manual · rama `docs/t11-manual`, [PR #67](https://github.com/oierbidasoa21-stack/rodillo-virtual/pull/67) (en revisión)

- `ad29688` · 2026-11-27 · docs(manual): add desktop screenshots and the script that takes them
- `650611b` · 2026-11-27 · docs(manual): user manual for the whole app
- `33f3718` · 2026-11-27 · docs(readme): short front page that links to the manual
- `1cc33bd` · 2026-11-27 · docs(claude): cloud change agent in the work split; keep the manual up to date

## Documentación de contexto (`docs/contexto/`) desde `3250f48`

Commits de Claude en la nube (tareas, decisiones, estudios y página de seguimiento) y del agente de VS Code (estado y registro), que no estaban en ninguna fase:

- `fd5fa65` · 2026-11-27 · docs(contexto): note tasks T0–T6 and answers of 2026-11-27
- `176a5ec` · 2026-11-27 · docs(contexto): note roadmap proposal, GitHub, database and DIY trainer
- `0eb5b21` · 2026-11-27 · docs(contexto): Supabase without own backend, trainer to buy, private repo
- `df693d4` · 2026-11-27 · docs(contexto): propose execution order 9, 13, 14, 15a, then 10–12
- `4f10fa8` · 2026-11-27 · docs(contexto): confirm execution order, Supabase for Strava, buy a trainer
- `94ab5f7` · 2026-11-27 · docs(contexto): note what sharing the project means for Strava uploads
- `ad32059` · 2026-11-27 · docs(contexto): Strava flow for a single user and FIT for the coach
- `fc11f55` · 2026-11-27 · docs(contexto): Strava upload happens automatically on save
- `28e2ade` · 2026-11-27 · docs(contexto): note how the Strava API app is created and where the secret goes
- `0972364` · 2026-11-27 · docs(contexto): correct Strava API, now only for subscribers
- `def98fa` · 2026-11-27 · docs(contexto): note why going through iGPSPORT does not help with Strava
- `26591e8` · 2026-11-27 · docs(contexto): Strava via file download on save and manual upload (option b)
- `1dcf14f` · 2026-11-27 · docs(contexto): note README rewrite and a user manual for the whole app (T11)
- `ce4b946` · 2026-11-27 · docs(contexto): note tasks T12–T20 and the user's notes of 2026-11-28
- `d801afd` · 2026-11-27 · docs(contexto): place tasks T12–T20 in the execution order
- `872aa72` · 2026-11-27 · docs(contexto): add the tracking page source and link it
- `07792f8` · 2026-11-27 · docs(contexto): context bombs, curves first and data in Supabase
- `1876f6c` · 2026-11-27 · style(contexto): format the tracking page
- `c44b779` · 2026-11-27 · docs(contexto): T0 done, phase 9 current, T1 in review in PR #33
- `4a3ea52` · 2026-11-27 · docs(contexto): review of PR #33 and a clearer work split
- `e25ad76` · 2026-11-27 · docs(contexto): coach instructions at the end; make the ghost easier to see
- `e7f9270` · 2026-11-27 · docs(contexto): PR #35 for T12 in the log, phase plan and task status
- `4256c85` · 2026-11-27 · docs(contexto): tracking page with T1 done and T12 in review
- `b631779` · 2026-11-27 · docs(contexto): T12 review fixes in the phase plan, log and session
- `61fa23b` · 2026-11-27 · docs(contexto): T12 approved on the tracking page
