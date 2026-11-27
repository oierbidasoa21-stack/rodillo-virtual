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

### 8.2 ¿Supabase es la mejor opción para Strava?

Para subir a Strava hace falta guardar un **secreto** (el _client secret_ de la app de Strava) y los **tokens** de cada usuario (el de acceso caduca a las pocas horas y se renueva con otro). Opciones:

| Opción                       | Secreto             | Dónde guardar los tokens       | Comentario                                                                        |
| ---------------------------- | ------------------- | ------------------------------ | --------------------------------------------------------------------------------- |
| **Supabase** (Edge Function) | Secreto de Supabase | Tabla con RLS en la misma base | Todo en un sitio, y sirve después para centralizar los datos (T8).                |
| Cloudflare Workers           | Secreto del Worker  | KV o D1 aparte                 | Muy ligero y barato, pero es otro proveedor más y no sirve para la base de datos. |
| AWS Lambda                   | Secrets Manager     | DynamoDB                       | Más piezas y más configuración para lo mismo.                                     |

**Conclusión: Supabase.** Para solo Strava, Cloudflare sería un poco más ligero, pero como también se quiere centralizar los datos, un solo proveedor para login, base de datos y funciones es más simple y más fácil de asegurar.

A tener en cuenta:

- **Las apps nuevas de la API de Strava suelen empezar limitadas a un solo atleta** hasta que Strava las revisa. Para uso personal basta; para un producto habría que pedir la ampliación y cumplir sus normas de marca. Comprobar las condiciones actuales.
- **El plan gratuito pausa los proyectos inactivos**: si pasa mucho tiempo sin usarse, habrá que reactivarlo.
- **El login de Supabase hace falta** para saber de quién es cada token: una cuenta con enlace mágico al correo.

### 8.3 Si el proyecto se comparte, ¿los demás podrán subir a Strava?

- **Exportar el archivo y subirlo a mano: sí, siempre y para cualquiera.** El TCX funciona hoy (FIT llegará en la Fase 15b). No necesita Supabase ni cuentas, así que tiene que mantenerse como opción base.
- **Subida automática con la integración de Strava:**
  - **Con tu Supabase y tu app de Strava:** al principio solo podrás conectarte tú, porque las apps nuevas de Strava suelen estar limitadas a un atleta. Para más personas hay que pedir a Strava la ampliación, lo que implica revisión, cumplir sus normas de marca y tener política de privacidad. Además, sus datos y sus tokens estarían en tu base: pasarías a ser **responsable de datos de salud de terceros** (RGPD: consentimiento, política de privacidad, contrato con Supabase).
  - **Cada uno con lo suyo** (comparte el repo o la imagen Docker): cada persona crea su app de Strava y su proyecto de Supabase y mete sus claves por configuración. Es más trabajo para ellos, pero tú no guardas datos de nadie.
- **Garmin Connect** es más difícil: su API es para empresas aprobadas. Para Garmin, mejor exportar y subir el archivo.
- **Consecuencia para el diseño (T8):**
  - las claves de Strava y Supabase van por configuración, nunca en el código;
  - la app funciona entera sin ellas (con exportar a mano);
  - la integración queda desactivada si no hay claves.

### 8.4 Strava solo para el usuario, paso a paso, y FIT para el entrenador

**Una sola vez:**

1. Crear una app en la configuración de la API de Strava. Strava da un _client id_ y un _client secret_.
2. Guardar el secreto en Supabase como secreto de la Edge Function (nunca en el repo ni en la web).
3. En la app, botón **«Conectar con Strava»**: se abre la página de Strava, se inicia sesión y se acepta el permiso de subir actividades (`activity:write`). Strava devuelve un código, la Edge Function lo cambia por los tokens y los guarda en la tabla protegida.

**Después de cada sesión:** botón **«Subir a Strava»** (o automático al guardar, si se quiere). La app manda el archivo de la sesión con el token y Strava devuelve el enlace a la actividad.

**Qué datos llegan:** los mismos que lleva el archivo. El TCX actual ya incluye, segundo a segundo, pulso, vatios, cadencia, velocidad, distancia, altitud y, en rutas, posición. Detalles a cuidar:

- **Los vatios son estimados** (rodillo tonto): la descripción de la actividad tiene que decirlo (regla «nunca inventar datos»). Con un rodillo FTMS serían medidos.
- **Marcar la actividad como de interior o virtual**, no como salida real.
- **Rutas inventadas:** su posición pondría un mapa en un sitio que no existe. Mejor subir sin posición, o solo en rutas GPX reales si el usuario quiere.
- **Sesiones con sensores simulados:** no se suben, o se avisa.

**FIT para el entrenador (Fase 15b):** sí. FIT es el formato de Garmin, más compacto y el más aceptado, por ejemplo por TrainingPeaks o intervals.icu.

- Botón **«Descargar FIT»** en el detalle de cada sesión, junto al TCX.
- Se genera en el navegador con la librería oficial de Garmin (FIT SDK de JavaScript), sin Supabase ni cuentas.
- Lleva los mismos datos que el TCX.
- Mientras tanto, el TCX de hoy ya sirve: casi todas las plataformas de entrenadores lo aceptan.

**Decisión (2026-11-27):** subida **automática al guardar** la sesión, con cola y reintento si falla, y desactivable en Ajustes.

~~**¿Hace falta Strava de pago?** No.~~ **Corrección:** **sí, para la API.** La página de la API de Strava dice ahora que está disponible solo para suscriptores (comprobado por el usuario el 2026-11-27). Lo que sigue siendo gratis es **subir un archivo a mano** desde la web de Strava, y la actividad conserva todos los datos del archivo.

Opciones:

- **(a) Suscripción a Strava:** subida automática al guardar, con Supabase como se describe arriba.
- **(b) Sin API, gratis:** al guardar, la app descarga el FIT (o TCX) y muestra un botón «Abrir Strava para subir» que lleva a la página de subida manual. Se sube en unos 20 segundos, sin Supabase ni secretos.
- Para el **entrenador**, el FIT descargado (Fase 15b) sirve igual en los dos casos.

**¿Y pasar por iGPSPORT?** El usuario tiene la app de iGPSPORT conectada a Strava y pregunta si subir a iGPSPORT para que se reenvíe a Strava (búsqueda del 2026-11-27):

- **No hay una API pública documentada de iGPSPORT para subir actividades.** Hay herramientas no oficiales de la comunidad, pero piden tu usuario y contraseña, pueden saltarse sus condiciones y se rompen cuando iGPSPORT cambia algo. **No recomendado.**
- **No consta que iGPSPORT reenvíe a Strava un FIT importado a mano** (su sincronización está pensada para los recorridos de sus ciclocomputadores). Hay que probarlo: exportar el TCX de una sesión, importarlo en iGPSPORT si lo permite y ver si aparece en Strava.
- Aunque funcionara, seguiría siendo manual: no ahorra nada frente a subir a mano directamente a Strava (opción b).
- Dato útil: iGPSPORT tiene integración con TrainingPeaks. Si el entrenador usa TrainingPeaks, también acepta el FIT directamente.

**Decisión del usuario (2026-11-27): opción (b).** Al guardar, la app descarga el archivo (FIT, o TCX mientras no exista FIT) y ofrece «Abrir Strava para subir». Gratis, sin API, sin Supabase. El detalle está en T8 de `pendientes/PENDIENTES.md`; se construye en la Fase 15a.
