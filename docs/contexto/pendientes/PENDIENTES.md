# Pendientes

_Última actualización: 2026-11-27._

## Tareas apuntadas el 2026-11-27 (para el agente de cambios)

El usuario pide **apuntarlas, no hacerlas**: los cambios los hace su agente. Van en este orden. El porqué y el detalle de las preguntas están en [`../estudios/2026-11-27-rodillo-inteligente-produccion-aws.md`](../estudios/2026-11-27-rodillo-inteligente-produccion-aws.md).

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
- [ ] Esta lista «Fases por hacer» estaba desfasada (decía que faltaban la 6 y la 7): ya corregida abajo; repasarla tras T0.
- [ ] `sesiones/`: la sesión del 2026-11-26 está metida al final de `2026-11-25.md`; separarla en `2026-11-26.md`.
- [ ] `registro/CAMBIOS.md`: añadir los commits que falten desde `3250f48`.

### T3 · Modo local y repo privado

El usuario quiere poder hacer el repo **privado sin GitHub Pro**. GitHub Pages no publica desde repos privados en el plan gratuito, así que la app pasaría a usarse en local con Docker (`docker compose up -d` → `http://localhost:8080`). Bluetooth y la PWA funcionan porque Chrome trata `localhost` como seguro.

- [ ] `deploy.yml`: que se salte solo si el repo es privado (`if: ${{ !github.event.repository.private }}` en los jobs), para no romper nada mientras siga siendo público.
- [ ] `CLAUDE.md` («Dónde se prueba» y «Despliegue»), `README.md`, `ROADMAP.md` (criterio de hecho) y `entorno/ENTORNO.md`: la referencia pasa a ser `localhost:8080` cuando el repo sea privado.
- [ ] Guía corta para el usuario: exportar la copia en la web publicada (si tiene datos), cambiar la visibilidad (Settings → General → Danger Zone, eso lo hace él), arrancar Docker e importar la copia. Usar siempre el mismo puerto: cada dirección tiene su propia base.
- [ ] Anotar la decisión cuando el usuario cambie la visibilidad.

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

### T5 · Fase 8 · Rodillo inteligente

Sigue en espera hasta que el usuario compre uno con **Bluetooth FTMS**. Se puede adelantar un FTMS simulado. Detalle en el punto 1 del estudio.

### T6 · AWS (solo si se decide)

S3 privado + CloudFront (OAC, ACM, cabeceras) + Route 53, Terraform en `infra/`, despliegue desde GitHub Actions con OIDC. Detalle en el punto 4 del estudio. No hay nada decidido.

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
- **Ideas de seguridad, diseño y funciones** (2026-11-27): copia cifrada, recordatorio de copia, límites de tamaño al importar, panel de inicio, selector de calidad gráfica del 3D, modo daltónico, exportar FIT, subida a Strava, zonas desde un test. Ver el punto 5 del [estudio del 2026-11-27](../estudios/2026-11-27-rodillo-inteligente-produccion-aws.md).
- _(Añadir aquí las mejoras que pida el usuario.)_
