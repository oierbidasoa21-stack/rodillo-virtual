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
