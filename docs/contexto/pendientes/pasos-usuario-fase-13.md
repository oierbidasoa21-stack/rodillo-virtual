# Fase 13 · Lo que tienes que hacer tú en GitHub

Estos ajustes solo los puede cambiar el dueño del repositorio desde la web de GitHub: los agentes no tienen permiso. Son unos 15 minutos. Hazlos en orden, **cuando el coordinador te diga que los PR de la Fase 13 están fusionados** (cada apartado dice de qué PR depende).

Todo se hace en https://github.com/oierbidasoa21-stack/rodillo-virtual, con tu sesión iniciada. Los nombres de los menús están en inglés porque así sale GitHub.

---

## 1. Presentación del repo (issue #38)

1. En la página principal del repo, a la derecha, junto a **About**, pulsa el engranaje ⚙️.
2. **Description:** `Entrenamiento en rodillo en el navegador: sesiones por zonas de pulso, sensores Bluetooth, rutas en 3D. Sin servidor, los datos se quedan en tu ordenador.`
3. **Website:** marca **Use your GitHub Pages website**.
4. **Topics** (escribe cada uno y pulsa Enter): `cycling`, `indoor-training`, `web-bluetooth`, `pwa`, `react`, `typescript`, `threejs`, `heart-rate`, `vite`.
5. Deja marcados **Releases** y **Deployments**; desmarca **Packages** si no hay paquetes. Pulsa **Save changes**.
6. **Imagen para compartir:** ve a **Settings → General**, baja a **Social preview**, pulsa **Edit → Upload an image…** y elige `.github/social-preview.png` del repo (descárgala antes desde GitHub: ábrela y pulsa el botón de descargar). Esta imagen llega con el PR del issue #38.

## 2. Pull requests y ramas (issue #41)

1. **Settings → General**, apartado **Pull Requests**:
   - desmarca **Allow merge commits**;
   - marca **Allow squash merging** y, en su desplegable, elige **Default to pull request title**;
   - desmarca **Allow rebase merging**;
   - marca **Always suggest updating pull request branches**;
   - marca **Automatically delete head branches**.
2. Los cambios se guardan solos.

## 3. Reglas de `main` (issue #41)

Hazlo **después** de que estén fusionados los PR de commitlint (#42) y CodeQL (#44), para que sus comprobaciones salgan en la lista.

1. **Settings → Rules → Rulesets → New ruleset → New branch ruleset**.
2. **Ruleset name:** `main`.
3. **Enforcement status:** **Active**.
4. **Bypass list:** déjala vacía (así nadie, ni tú, puede saltarse las reglas sin querer).
5. **Target branches → Add target → Include default branch**.
6. En **Rules**, marca:
   - **Restrict deletions**;
   - **Require linear history**;
   - **Require a pull request before merging**. Dentro: **Required approvals: 0** (el coordinador revisa, pero GitHub no deja aprobar tu propio PR, y los agentes trabajan con tu cuenta); marca **Dismiss stale pull request approvals when new commits are pushed** y, en **Allowed merge methods**, deja solo **Squash**;
   - **Require status checks to pass**. Marca **Require branches to be up to date before merging** y, con **Add checks**, añade: `Lint, test and build`, `Docker image builds`, `Conventional Commits` y `CodeQL`. Si alguna no sale al buscarla, es que todavía no se ha ejecutado nunca: espera a que pase en un PR y vuelve;
   - **Block force pushes**.
7. Pulsa **Create**.

A partir de aquí nadie puede subir directo a `main`: todo entra por PR con CI en verde.

## 4. Permisos de GitHub Actions (issues #42 y #43)

1. **Settings → Actions → General**.
2. En **Workflow permissions**, deja **Read repository contents and packages permissions** (cada workflow pide lo que necesita).
3. Marca **Allow GitHub Actions to create and approve pull requests**. Lo necesita release-please para abrir el PR de cada versión.
4. Pulsa **Save**.

## 5. Seguridad (issue #44)

1. **Settings → Advanced Security** (en algunas cuentas se llama **Code security**).
2. Activa (**Enable**) cada uno de estos:
   - **Private vulnerability reporting**: así funciona el botón «Report a vulnerability» de `SECURITY.md`;
   - **Dependency graph** (suele venir activado);
   - **Dependabot alerts**;
   - **Dependabot security updates**;
   - **Secret Protection** (o **Secret scanning**) y, dentro, **Push protection**: bloquea un push si lleva una contraseña o una clave.
3. En **Code scanning → CodeQL analysis**, **no** actives la configuración por defecto (**Default setup**): el repo ya trae su propio workflow de CodeQL, y las dos a la vez chocan. Si ya estaba activada, pulsa **⋯ → Disable CodeQL**.

## 6. Tablero de GitHub Projects (issue #43)

Los agentes no pueden crear tableros en tu cuenta. Es un momento:

1. En tu perfil de GitHub (no en el repo), pestaña **Projects → New project**.
2. Elige la plantilla **Board** y ponle de nombre `Rodillo Virtual`. Pulsa **Create project**.
3. Las columnas vienen como _Todo / In Progress / Done_. Renómbralas y añade las que faltan para que queden así: **Backlog → Listo → En curso → Revisión → Hecho** (en cada columna, **⋯ → Rename**; para añadir, el **+** de la derecha).
4. Arriba a la derecha, **⋯ → Settings → Manage access**: déjalo **Private**, o **Public** si quieres que se vea con el repo.
5. Vuelve al repo: pestaña **Projects → Link a project** y elige `Rodillo Virtual`.
6. En el tablero, **⋯ → Workflows** y activa:
   - **Auto-add to project**, con el filtro `is:issue,pr is:open repo:oierbidasoa21-stack/rodillo-virtual`;
   - **Item closed** → mueve a **Hecho**;
   - **Pull request merged** → mueve a **Hecho**.
7. Los issues que ya existen se añaden desde el tablero: **+ Add item → Add item from repository**, elige el repo, marca todos y pulsa **Add selected items**.

## 7. Comprobar los milestones (issue #43)

Cuando se fusione el PR del issue #43, el workflow **Milestones** se ejecuta solo una vez y crea los milestones de cada fase con sus issues dentro. Para comprobarlo:

1. Pestaña **Issues → Milestones**: tiene que haber uno por fase (9, 13, 14, 15a, 15b, Datos en Supabase y Tareas sueltas, además de los que ya había).
2. Si falta algo, pestaña **Actions → Milestones → Run workflow → Run workflow**.

---

Cuando termines, díselo al coordinador para que marque la Fase 13 como cerrada.
