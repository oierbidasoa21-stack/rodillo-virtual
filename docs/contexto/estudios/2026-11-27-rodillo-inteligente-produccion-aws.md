# Preguntas del 2026-11-27: rodillo inteligente, producción, datos y AWS

Respuestas a lo que preguntó el usuario el 2026-11-27. Solo es estudio: **nada de esto está hecho**. Las tareas que salen de aquí están en [`../pendientes/PENDIENTES.md`](../pendientes/PENDIENTES.md) y las hará el agente de cambios del usuario.

## 1. ¿Se puede hacer el software para el rodillo inteligente?

**Sí.** Es la Fase 8 (issues #10, #11 y #12) y el diseño ya está preparado para ella.

- **Cómo se conecta:** por Web Bluetooth, con el estándar **FTMS** (Fitness Machine Service, `0x1826`). La mayoría de rodillos inteligentes actuales lo traen (hay que comprobarlo en la ficha de cada modelo).
  - Lectura: característica _Indoor Bike Data_ (`0x2AD2`): potencia, cadencia y velocidad **medidas**, ya no estimadas.
  - Control: característica _Control Point_ (`0x2AD9`): primero «pedir control», luego:
    - **ERG**: «fijar potencia objetivo». Para los bloques por potencia: el rodillo pone los vatios y da igual la cadencia.
    - **Simulación**: «parámetros de simulación» (pendiente, viento, Crr, CdA). Para las rutas: en la subida cuesta más.
- **Encaja sin tocar la UI:** el rodillo implementa la misma interfaz que el resto de sensores (`connect`, `disconnect`, lecturas con marca de tiempo). Cuando hay potencia medida, sustituye a la estimada y desaparece la etiqueta «estimado».
- **Se puede adelantar sin rodillo:** con un **FTMS simulado** en Ajustes → Desarrollo (como los sensores simulados de la Fase 3), que responda a ERG y a la pendiente. La prueba de verdad sí necesita el rodillo.
- **Antes de comprar:** que diga **«Bluetooth FTMS»**. Algunos rodillos baratos solo hablan ANT+ FE-C o un protocolo propio, y el navegador no puede usar ninguno de los dos.

## 2. ¿Docker «de producción», como si fuese una empresa?

**Sí, se puede dejar profesional.** Lo que hay hoy (imagen multietapa Node → nginx, sin datos personales, `HEALTHCHECK`) es una buena base, pero le falta para producción:

| Qué falta                                                                                                                                                                                                                                       | Por qué                                                                                                                                                                                                                      |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| nginx **sin root** (`nginxinc/nginx-unprivileged`, puerto 8080) y **sistema de archivos de solo lectura** (`read_only: true` + `tmpfs` para caché y pid)                                                                                        | Si alguien rompiera nginx, no podría escribir ni escalar privilegios.                                                                                                                                                        |
| `cap_drop: [ALL]`, `security_opt: no-new-privileges`, límites de CPU y memoria                                                                                                                                                                  | El contenedor solo puede hacer lo mínimo.                                                                                                                                                                                    |
| **Cabeceras de seguridad**: `Content-Security-Policy` estricta, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` (solo `bluetooth` y `screen-wake-lock` en el propio sitio), `Cross-Origin-Opener-Policy`, `server_tokens off` | La CSP es la defensa principal de una app sin backend: impide ejecutar código inyectado. **Ojo:** en nginx un `add_header` dentro de un `location` borra los del `server`, así que hay que repetirlas (o usar un `include`). |
| **Imágenes fijadas por digest** (`node:24-alpine@sha256:…`) y Dependabot para actualizarlas                                                                                                                                                     | Builds reproducibles: nadie cambia la imagen base por debajo.                                                                                                                                                                |
| **Escaneo** de la imagen (Trivy) y de dependencias (`npm audit`, CodeQL) en CI, **SBOM** y firma de la imagen (cosign)                                                                                                                          | Saber qué lleva la imagen y demostrar que no la han tocado.                                                                                                                                                                  |
| **HTTPS delante**: Caddy o Traefik con Let's Encrypt en `compose.yaml` (perfil `prod`), con HSTS                                                                                                                                                | Bluetooth y la PWA lo exigen fuera de `localhost`.                                                                                                                                                                           |
| Publicar la imagen en **GHCR** con versión (`v1.2.0`) desde un workflow de release                                                                                                                                                              | Desplegar una versión concreta y poder volver atrás.                                                                                                                                                                         |
| Documentación: `docs/despliegue/` con qué hace cada pieza, cómo actualizar y cómo volver atrás, y un `SECURITY.md`                                                                                                                              | «Que quede bien limpio con todo explicado».                                                                                                                                                                                  |

**Si de verdad fuese un producto comercial**, además de la técnica:

- **Licencias de datos:** el plan de la Fase 10 usa Sentinel-2 cloudless de EOX, que es **CC BY-NC-SA (no comercial)**. Para vender habría que cambiarlo por una fuente con licencia comercial (o pagarla). Google 3D Tiles (Fase 12) tiene sus propias condiciones de uso.
- **Marca:** nada de Zwift (ya es regla del proyecto).
- **RGPD:** mientras todo se quede en el navegador, la empresa no trata datos. Si algún día hay cuentas o sincronización, el pulso es **dato de salud** (categoría especial, art. 9 RGPD): consentimiento explícito, cifrado, contrato de encargado y evaluación de impacto.

## 3. ¿Dónde se guardan todos los datos?

**En el navegador del usuario, en IndexedDB** (librería Dexie, base `rodillo-virtual`). No hay servidor: nada sale del ordenador salvo lo que el usuario exporta.

| Tabla        | Qué guarda                                                                     |
| ------------ | ------------------------------------------------------------------------------ |
| `workouts`   | Sesiones propias creadas en el editor (las de la biblioteca van en el código). |
| `history`    | Resumen de cada sesión: tiempo en zona, carga, kcal, potencia, distancia…      |
| `recordings` | Grabación segundo a segundo de cada sesión (para gráficas y TCX).              |
| `settings`   | Peso, zonas de pulso, FTP, rodillo, rueda, voz, tema.                          |
| `routes`     | Rutas GPX importadas (las 3 inventadas van en el código).                      |
| `inProgress` | La sesión en curso, guardada cada pocos segundos por si se cierra la pestaña.  |
| `plans`      | Planes semanales importados del agente entrenador.                             |

- Cada dirección (`github.io`, `localhost:8080`…) tiene **su propia base**: no se comparten.
- Se pierden si se borran los datos de navegación de Chrome. Protección: **Exportar copia de seguridad** (un JSON con todo) de vez en cuando, fuera del repo.
- `config/athlete.local.json` solo sirve para importar los datos del atleta; no está en git.

## 4. ¿Y si se migra todo a AWS?

**Se puede, y para lo que es hoy la app es sencillo y barato.** Como es una web estática, no hace falta ningún servidor:

```
Usuario → Route 53 (dominio) → CloudFront (CDN + HTTPS, certificado de ACM, cabeceras de seguridad, WAF opcional)
                                   → S3 privado (los archivos de dist/, solo accesible desde CloudFront con OAC)
GitHub Actions → OIDC (sin claves guardadas) → sube dist/ a S3 e invalida la caché de CloudFront
```

- **Infraestructura como código** (Terraform o AWS CDK) en una carpeta `infra/`: todo se crea, se revisa y se borra con un comando.
- **Coste:** con poco tráfico, de céntimos a 1–2 € al mes, más el dominio (~12 €/año).
- **Qué cambia:** `BASE_PATH=/`, el workflow de despliegue (de Pages a S3) y la CSP. Los datos siguen en el navegador: **migrar no mueve datos de nadie**. El usuario exporta la copia en la web vieja y la importa en la nueva.
- **Docker en AWS** (ECS Fargate o App Runner) también funcionaría, pero para una web estática es más caro (~15–30 €/mes) y no aporta nada. Tendría sentido solo con backend.
- **Si algún día hay backend** (cuentas, sincronizar entre ordenadores, ver la sesión en otro dispositivo): Cognito (login), API Gateway + Lambda, DynamoDB cifrado y región UE (`eu-south-2`, España). Eso ya es otro proyecto, con lo del RGPD del punto 2.

**Recomendación:** si se quiere «profesional» sin backend, S3 + CloudFront + Terraform es lo más limpio. Antes de pagar nada, el modo local con Docker cubre el uso personal.

## 5. Ideas para hacerlo más seguro, más bonito y mejor

**Seguridad**

- CSP estricta y el resto de cabeceras (también en Pages, con una `<meta http-equiv="Content-Security-Policy">`, porque Pages no deja poner cabeceras).
- **Copia de seguridad cifrada** opcional (contraseña con WebCrypto, AES-GCM): el JSON lleva pulso y peso.
- **Recordatorio de copia**: aviso suave si hace más de 30 días de la última exportación.
- Validar con un límite de tamaño todo lo que se importa (GPX, `.zwo`, copia, plan) para que un archivo enorme no cuelgue la app.
- Dependabot, CodeQL y `npm audit` en CI; protección de rama en `main` (CI obligatorio).

**Más bonito**

- Pantalla de inicio tipo panel: semana actual, forma y fatiga, próxima sesión del plan.
- Transiciones suaves entre bloques en el player y una cuenta atrás grande en los últimos 5 s.
- Selector de **calidad gráfica** del 3D (baja, media, alta) además de los niveles de paisaje real, para portátiles más flojos.
- Gráfica de zonas tipo «donut» en el resumen y modo daltónico para los colores de zona.

**Mejor**

- Exportar **FIT** además de TCX (Garmin lo prefiere).
- Subida directa a Strava (necesita OAuth y por tanto un pequeño backend; se puede dejar para la versión con AWS).
- Zonas de pulso calculadas a partir de un test (umbral en 30′) en vez de meterlas a mano.

**Decisión del usuario sobre estas ideas (2026-11-27, segunda parte):** le parecen bien todas **menos el modo daltónico**, que no le interesa por ahora.

## 6. ¿Hacer «mi propio rodillo inteligente» con hardware barato y el software de aquí?

La idea: comprar piezas baratas, ponerlas en el rodillo tonto y que la app lo controle, en lugar de comprar un rodillo inteligente. **Depende del tipo de rodillo tonto que se tenga.**

- **De fluido** (resistencia por aceite): la resistencia solo depende de la velocidad y **no hay nada que mover**. Ningún software puede hacer ERG ni simular pendientes. **No es viable.** Lo único que se puede hacer ya está hecho: estimar los vatios con su curva y decirte qué marcha meter.
- **Magnético con palanca de niveles** (un mando en el manillar con un cable): **sí es viable** como proyecto propio.
  - Un **ESP32** (microcontrolador con Bluetooth) mueve la palanca con un **servo o motor paso a paso** y un soporte impreso en 3D.
  - El ESP32 se anuncia como rodillo **FTMS**, así que la app lo controla igual que a uno comprado (Fase 8, sin cambios en la app).
  - Hay proyectos libres que lo hacen con bicis de spinning, por ejemplo SmartSpin2k: sirven de referencia.
  - El firmware no es parte de la web: iría en una carpeta `firmware/` o en otro repo (C++ con Arduino o ESP-IDF).
- **Limitaciones del casero:**
  - pocos niveles, así que el ERG es a saltos y no fino;
  - la potencia **sigue siendo estimada**, y además hay que calibrar una curva por cada nivel;
  - hace falta impresora 3D o alguien que imprima el soporte;
  - lleva muchas horas de montaje y pruebas.
- **¿Es más barato?** En dinero, sí: unos **40–80 € en piezas** (orientativo, hay que comprobar precios), frente a unos **250–400 €** de un rodillo inteligente de rodillo-sobre-rueda nuevo de gama de entrada o **150–250 € de segunda mano** (también orientativo). En tiempo y en calidad, no.
- **Recomendación:**
  - Rodillo de fluido: buscar un rodillo **FTMS de segunda mano**.
  - Rodillo magnético con palanca: el casero es un proyecto bonito y barato, pero hay que tomarlo como proyecto, no como ahorro seguro.
  - Si solo se quieren **vatios reales** (sin control de resistencia), un medidor de potencia también vale con el rodillo tonto.
- **Respuesta del usuario:** **todavía no tiene rodillo** (ni tonto ni inteligente). La pregunta pasa a ser **qué comprar**. Comparación en coste total (precios orientativos; comprobar antes de comprar):

  | Opción                                                     | Coste total aprox.                 | Qué se consigue                                                                                                                                 |
  | ---------------------------------------------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
  | Rodillo de fluido tonto                                    | 80–200 €                           | Sensación de carretera, vatios estimados con su curva (la app ya trae curvas de fluido). Sin control.                                           |
  | Magnético con palanca (nuevo o usado) + ESP32 casero       | 50–150 € + 40–80 € ≈ **100–230 €** | ERG y pendiente a saltos, vatios estimados (hay que meter una curva por nivel: la app hoy solo trae curvas de fluido), muchas horas de montaje. |
  | **Inteligente FTMS de segunda mano** (rodillo sobre rueda) | **150–250 €**                      | Potencia **medida**, ERG fino y simulación de pendiente. La app solo necesita la Fase 8.                                                        |
  | Inteligente FTMS nuevo de gama de entrada                  | 250–400 €                          | Lo mismo con garantía.                                                                                                                          |

- **Conclusión:** sin rodillo todavía, el casero **apenas ahorra** frente a un FTMS de segunda mano y da mucho menos. Recomendación: **FTMS de segunda mano** (que diga «Bluetooth FTMS» en la ficha). El casero queda como proyecto opcional, si apetece cacharrear, no como forma de ahorrar.

## 7. ¿Cómo dejar el GitHub «como el de una empresa»?

- **Presentación:**
  - descripción, temas (_topics_), web y una imagen para compartir el repo;
  - `README` con insignias (CI, despliegue, versión, licencia), capturas o GIF y arranque rápido.
- **Archivos estándar:**
  - `LICENSE`: hay que decidirla. Si es para empresa, «todos los derechos reservados»; si se abre, MIT;
  - `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `SUPPORT.md` y `CHANGELOG.md`.
- **`.github/`:**
  - plantillas de issue en formulario (error, mejora, tarea) y de PR;
  - `CODEOWNERS` y `dependabot.yml`;
  - etiquetas ordenadas (`tipo:`, `área:`, `prioridad:`).
- **Forma de trabajar:**
  - **todo por PR**, que cierra su issue (`Closes #n`), con fusión _squash_ y borrado automático de ramas;
  - CI obligatorio antes de fusionar;
  - comprobación de Conventional Commits en CI;
  - versiones semánticas con **releases** y `CHANGELOG` automáticos (release-please);
  - un **GitHub Project** (tablero Backlog → Listo → En curso → Revisión → Hecho) junto a los milestones.
  - Esto **sustituye** la regla actual de `CLAUDE.md` de hacer push y fast-forward directo a `main`.
- **Seguridad del repo:**
  - escaneo de secretos con bloqueo al subir;
  - alertas de Dependabot y CodeQL;
  - informe privado de vulnerabilidades;
  - insignia de OpenSSF Scorecard.
- **Organización:** crear una **organización gratuita** de GitHub con el nombre de la «empresa» y transferirle el repo. GitHub redirige las URLs viejas; la de Pages cambia.
- **Choque con hacerlo privado:** en el plan gratuito, las **reglas de protección de rama y los rulesets solo funcionan en repos públicos**. Público y profesional sale gratis; privado y profesional necesita GitHub Pro o Team (unos pocos dólares al mes por usuario; comprobar precio). Hay que elegir: **T3 (privado) y T7 (profesional) dependen de esta decisión.**

## 8. ¿Una base de datos centralizada?

**Ya hay una base de datos** (IndexedDB, 7 tablas ordenadas, punto 3). El problema es que vive **dentro de cada navegador**. Centralizarla significa sacarla a un sitio común. Hay tres opciones, de menos a más:

| Opción                                 | Cómo                                                                                                                                                                     | Coste              | A favor                                                                            | En contra                                                                              |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------ | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **A · Carpeta sincronizada**           | Chrome deja a la web escribir en una carpeta que elijas (File System Access API). Tras cada sesión la app guarda sola la copia en, por ejemplo, una carpeta de OneDrive. | 0 €                | Sin servidor ni cuentas; la regla «sin backend» sigue valiendo.                    | Son archivos, no una base de datos consultable.                                        |
| **B · Base de datos propia en Docker** | **PocketBase** (SQLite, API y usuarios en un solo programa) o PostgreSQL con una API pequeña, en el mismo `compose.yaml`. La app sincroniza con ella.                    | 0 € (tu ordenador) | Una base de datos de verdad, consultable y tuya. Encaja con el Docker profesional. | El ordenador tiene que estar encendido; fuera de casa, red privada (p. ej. Tailscale). |
| **C · En la nube**                     | Supabase (PostgreSQL y usuarios, región UE) o AWS (DynamoDB o RDS + Cognito + Lambda, punto 4).                                                                          | 0–25 €/mes         | Desde cualquier sitio; base para un producto.                                      | El pulso es **dato de salud** (RGPD); hay que asegurar mucho más.                      |

- En todas, **Dexie se queda** como copia local, para que la app siga funcionando sin conexión y sincronice al volver la red.
- B y C cambian la regla «sin backend» de `CLAUDE.md`: es una decisión del usuario.
- Tablas de un modelo centralizado:
  - atleta y zonas, sesiones propias y sus bloques;
  - historial, rutas y planes;
  - grabaciones. Son una fila por segundo, unas 3600 por hora: mejor comprimidas por sesión que fila a fila.
- **Recomendación:** A ya (barato y sin riesgo); B si se quiere una base de datos de verdad; C solo si hay producto o empresa.

### 8.1 ¿Con Supabase (opción C) hay que crear un backend?

**No hace falta un backend propio** (ni servidor ni API que programar y mantener). Supabase es un «backend como servicio»:

- **Base de datos:** PostgreSQL. Supabase genera sola una API sobre las tablas, y la app la usa directamente desde el navegador con su librería (`supabase-js`).
- **Usuarios:** login incluido (correo con enlace mágico o contraseña).
- **Seguridad: con políticas RLS** (_Row Level Security_) en cada tabla, por ejemplo «cada usuario solo ve y escribe sus filas». La clave que va en la web es **pública a propósito**: lo que protege los datos son las políticas RLS, así que tienen que estar en todas las tablas y con tests. Este es el punto crítico.
- **Lo único que necesitaría código de servidor** es algo con un secreto, por ejemplo la subida a Strava (OAuth con _client secret_). Se haría con **Edge Functions** de Supabase: funciones pequeñas que corren en su nube, sin servidor que mantener.

**Qué sí hay que hacer:**

- crear el proyecto en **región UE**;
- escribir las tablas y las políticas RLS como migraciones SQL versionadas (carpeta `supabase/` con su CLI);
- añadir el login en la app;
- hacer que Dexie siga como copia local y sincronice (la app tiene que seguir funcionando sin conexión).

**A tener en cuenta:**

- el plan gratuito tiene límites de tamaño, y los proyectos inactivos se pausan tras un tiempo sin uso (comprobar las condiciones actuales);
- el pulso es dato de salud: Supabase actúa como encargado del tratamiento (tiene contrato de encargado, DPA);
- cambia la regla «sin backend, sin cuentas» de `CLAUDE.md`.

**Resumen:** con Supabase no se programa un backend, pero sí se diseña y se asegura la base de datos (tablas, RLS y login). Es la forma más barata y rápida de tener la opción C.
