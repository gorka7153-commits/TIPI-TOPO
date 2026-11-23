# TOPO DONOSTIA — Guía para ponerla en marcha

*Tu próximo Topo, en un clic.* Una iniciativa de Caravanserai Café · Donostia.
Aplicación independiente y no oficial. Los horarios proceden de Euskotren (datos abiertos).

No hace falta saber programar. Necesitas unos 20 minutos y una cuenta gratuita de GitHub.

---

## Cómo funciona (en una frase)

Cada madrugada, un "robot" gratuito de GitHub descarga los horarios oficiales de Euskotren (formato GTFS), comprueba que son válidos para hoy y los guarda en `data/horarios.json`. La aplicación solo enseña esos horarios oficiales. Si no hay horarios oficiales, lo dice claramente y no inventa nada.

---

## 1. Publicarla gratis en Internet (GitHub Pages)

1. Entra en **https://github.com** y crea una cuenta gratuita (botón *Sign up*).
2. Arriba a la derecha pulsa **+** → **New repository**.
   - *Repository name*: `topo-donostia`
   - Marca **Public**.
   - Pulsa **Create repository**.
3. En la página que aparece, pulsa el enlace **uploading an existing file**.
4. Descomprime el ZIP que te he dado en tu ordenador. Abre la carpeta `topo-donostia` y **arrastra a la web todo su contenido**: `index.html`, `app.js`, `gtfs-core.js`, `sw.js`, `manifest.webmanifest`, `LEEME.md` y las carpetas `icons` y `scripts`.
   Abajo pulsa **Commit changes**.
5. Ahora el robot (este archivo suele quedarse fuera al arrastrar porque su carpeta está oculta):
   - Pulsa **Add file** → **Create new file**.
   - En el nombre escribe exactamente: `.github/workflows/actualizar-horarios.yml`
   - Abre en tu ordenador el archivo `.github/workflows/actualizar-horarios.yml` del ZIP (con el Bloc de notas o TextEdit), copia todo su texto y pégalo.
     (Si no ves la carpeta `.github`, está oculta: en Mac pulsa ⌘+Mayús+. en el Finder; en Windows, *Vista → Elementos ocultos*.)
   - Pulsa **Commit changes**.
6. Lanza el robot por primera vez:
   - Pestaña **Actions** (arriba). Si te pregunta, pulsa *I understand… enable them*.
   - A la izquierda, **Actualizar horarios oficiales** → botón **Run workflow** → **Run workflow**.
   - Espera 1–2 minutos. Si sale un **círculo verde ✓**, ya tienes los horarios oficiales.
   - Si sale una **cruz roja ✗**, mira el apartado 4 (*Si algo falla*).
7. Activa la web:
   - Pestaña **Settings** → a la izquierda **Pages**.
   - En *Source* elige **Deploy from a branch**; en *Branch* elige **main** y **/(root)** → **Save**.
   - Espera 1–2 minutos y recarga. Arriba aparecerá tu dirección, del tipo
     **https://TU-USUARIO.github.io/topo-donostia/**
8. Abre esa dirección en el móvil. Ese es el enlace público que puedes compartir (o convertir en código QR para el café).

## 2. Instalarla en la pantalla de inicio del móvil

**Android (Chrome)**
1. Abre tu dirección en Chrome.
2. Menú **⋮** (arriba a la derecha) → **Instalar aplicación** o **Añadir a pantalla de inicio**.
3. Aparecerá el icono rojo del túnel. Se abre a pantalla completa, como una app.

**iPhone (Safari)**
1. Abre tu dirección en **Safari** (en iPhone tiene que ser Safari).
2. Botón **Compartir** (el cuadrado con una flecha hacia arriba).
3. Baja y pulsa **Añadir a pantalla de inicio** → **Añadir**.

Después de abrirla una vez con conexión, funciona también **sin conexión** con los últimos horarios guardados (avisa de que pueden estar desactualizados).

## 3. Uso

- Elige **Desde** y **Hasta**, el día (**Hoy**, **Mañana**, **Otro día**) y pulsa **¿CUÁNDO SALE MI TOPO?**
- Verás los 5 próximos trenes: salida, llegada, duración, línea y, si hace falta, dónde cambiar de tren.
- **★ Guardar trayecto**: queda arriba como acceso rápido, con el próximo tren de hoy.
- **⇄ Ver la vuelta**: invierte el trayecto.
- **ES / EU**: cambia el idioma.
- La app recuerda la última búsqueda.
- El punto de color en *Sobre los horarios* indica: **verde** = horarios al día; **amarillo** = sin conexión o sin comprobar desde hace días; **rojo** = sin horarios o caducados.

## 4. Si algo falla

- **El robot sale en rojo ✗**: entra en la ejecución, abre el paso *Descargar y comprobar el GTFS oficial* y lee las líneas que empiezan por ✗. Indican qué fuente de Euskotren no respondió o por qué no se aceptó (por ejemplo, "no cubre la fecha de hoy"). La app sigue mostrando los últimos horarios buenos.
- **Fuente de reserva (opcional)**: el Punto de Acceso Nacional del Ministerio de Transportes publica el mismo GTFS de Euskotren, pero pide registro gratuito.
  1. Regístrate en https://nap.transportes.gob.es y consigue tu clave de API.
  2. En GitHub: **Settings → Secrets and variables → Actions → New repository secret**.
     Nombre: `NAP_API_KEY`. Valor: tu clave. **Add secret**.
  3. Vuelve a lanzar el robot (paso 1.6).
- **El robot da error de permisos al guardar ("push")**: **Settings → Actions → General → Workflow permissions → Read and write permissions → Save**, y vuelve a lanzarlo.
- **GitHub pausa el robot**: si el proyecto pasa mucho tiempo sin actividad, GitHub puede desactivar las tareas programadas y te avisa por correo. Entra en **Actions** y pulsa **Enable workflow**.
- **Prueba rápida sin publicar**: en la app, *Sobre los horarios → Cargar horarios a mano*, y elige el archivo GTFS oficial de Euskotren (.zip). Se procesa en el propio móvil.

## 5. Qué hace y qué no hace todavía (MVP)

Hace:
- Horarios **programados oficiales** de Euskotren para toda la red ferroviaria de Donostialdea (de Lasarte-Oria a Hendaia). Las estaciones y líneas se leen del archivo oficial, así que la red nueva del 21/11/2026 (Bentaberri, Kontxa-Zentroa, Amara soterrada; líneas T0, T1 y E1) aparece automáticamente en cuanto Euskotren la publica.
- Laborables, sábados, domingos y festivos según el calendario oficial; trenes pasada la medianoche; trayectos con un cambio de tren.

Pendiente (está señalado en la propia app):
- **Tiempo real** (retrasos) y **avisos de incidencias**: Euskotren los publica en formato GTFS-Realtime, pero ese formato no puede leerse directamente desde el navegador. Requiere un pequeño servidor intermedio. Mientras tanto, la app enlaza a euskotren.eus.
- Revisión de los textos en euskera por una persona nativa.

## Fuentes de datos

- Open Data Euskadi / MovEuskadi (índice GTFS): https://opendata.euskadi.eus/transport/moveuskadi/data-index-gtfs.json — licencia CC BY 4.0
- Euskotren (descarga directa): https://gtfs.euskotren.eus/Euskotren_gtfs.zip
- Punto de Acceso Nacional (con registro): https://nap.transportes.gob.es — fichero 1263 (Euskotren)

## Archivos del proyecto

| Archivo | Para qué sirve |
|---|---|
| `index.html` | La pantalla de la app y su diseño |
| `app.js` | Botones, idiomas, favoritos, carga de datos |
| `gtfs-core.js` | Lee el GTFS oficial y calcula los trenes |
| `sw.js`, `manifest.webmanifest`, `icons/` | Instalación en el móvil y uso sin conexión |
| `scripts/actualizar-horarios.mjs` | El robot que descarga y comprueba los horarios |
| `.github/workflows/actualizar-horarios.yml` | Le dice a GitHub que ejecute el robot cada día |
| `data/horarios.json` | Lo crea el robot. No lo edites a mano |
