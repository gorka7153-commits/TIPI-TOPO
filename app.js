// TOPO DONOSTIA — interfaz
import {
  descomprimir, construirModelo, validarModelo, buscarTrayectos, tipoDia,
  ahoraDonostia, sumarDias, desdeYmd, normalizar,
} from './gtfs-core.js';

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

// ---------- Textos ES / EU ----------
const T = {
  es: {
    subtitulo: 'Tu próximo Topo, en un clic.', origen: 'Desde', destino: 'Hasta', elegir: 'Elige estación',
    intercambiar: 'Intercambiar origen y destino', hoy: 'Hoy', manana: 'Mañana', otroDia: 'Otro día',
    boton: '¿CUÁNDO SALE MI TOPO?', favoritos: 'Tus trayectos', infoTitulo: 'Sobre los horarios',
    tiempoReal: 'Tiempo real (retrasos): integración pendiente. Las horas son las programadas por Euskotren.',
    avisos: 'Avisos e incidencias:', instalarTit: 'Ponerla en la pantalla de inicio',
    instalarAnd: '<b>Android (Chrome):</b> menú ⋮ → «Añadir a pantalla de inicio» o «Instalar aplicación».',
    instalarIos: '<b>iPhone (Safari):</b> botón Compartir (cuadrado con flecha) → «Añadir a pantalla de inicio».',
    manualTit: 'Cargar horarios a mano',
    manualTxt: 'Solo si lo necesitas: elige el archivo GTFS oficial de Euskotren (.zip). Se procesa en tu móvil y se guarda para usarlo sin conexión.',
    cargarZip: 'Cargar archivo oficial (.zip)', noOficial: 'Aplicación independiente y no oficial. Horarios: Euskotren (datos abiertos).',
    iniciativa: 'Una iniciativa de Caravanserai Café · Donostia',
    pendTitulo: 'Horarios oficiales: integración pendiente',
    pendTexto: 'Esta copia de la aplicación todavía no tiene los horarios oficiales de Euskotren. No se muestran horarios inventados.',
    pendComo: 'Cuando la publiques con la guía, se cargarán solos cada día. Mientras tanto, puedes cargar a mano el archivo oficial (GTFS, .zip) de Euskotren:',
    programado: 'Horario programado · no es tiempo real', directo: 'Directo', dir: 'Dirección',
    saleEn: (n) => n <= 0 ? 'Sale ahora' : `Sale en ${n} min`, min: 'min',
    cambio: (e, a, b, w) => `Cambio de tren en ${e}: llegas ${a}, sales ${b} (${w} min)`,
    tipos: { laborable: 'Laborable', sabado: 'Sábado', domingo: 'Domingo', festivo: 'Festivo (horario especial)', sinServicio: 'Sin servicio', sinDatos: 'Sin horarios publicados' },
    guardarFav: '★ Guardar trayecto', quitarFav: '★ Quitar de tus trayectos', vuelta: '⇄ Ver la vuelta', verMas: 'Ver más trenes',
    noQuedan: 'No quedan más trenes hoy en este trayecto.', verManana: 'Ver los primeros de mañana',
    noTrenes: 'No hay trenes en este trayecto para esta fecha.',
    sinDatosFecha: (h) => `Euskotren todavía no ha publicado horarios para esta fecha (disponibles hasta el ${h}).`,
    mismaEst: 'Elige dos estaciones distintas.', faltaEst: 'Elige la estación de salida y la de llegada.',
    estadoOk: (d, h, c) => `Horarios oficiales de Euskotren, válidos del ${d} al ${h}. Comprobados el ${c}.`,
    estadoManual: (d, h, c) => `Horarios oficiales cargados a mano el ${c}, válidos del ${d} al ${h}.`,
    viejo: 'Atención: hace días que no se comprueban. Pueden estar desactualizados.',
    sinConexion: 'Sin conexión: usando los horarios guardados en este móvil. Pueden estar desactualizados.',
    caducado: 'Estos horarios ya han caducado. Actualízalos antes de viajar.',
    sinHorarios: 'Aún no hay horarios oficiales cargados.',
    procesando: 'Procesando el archivo oficial…', errorZip: 'No se ha podido leer el archivo: ',
    cargado: (n, v) => `Listo: ${n} estaciones y ${v} trenes cargados.`, sinCompat: 'Tu navegador es demasiado antiguo para leer el archivo.',
  },
  eu: {
    subtitulo: 'Zure hurrengo Topoa, klik batean.', origen: 'Nondik', destino: 'Nora', elegir: 'Aukeratu geltokia',
    intercambiar: 'Jatorria eta helmuga trukatu', hoy: 'Gaur', manana: 'Bihar', otroDia: 'Beste egun bat',
    boton: 'NOIZ IRTETEN DA NIRE TOPOA?', favoritos: 'Zure ibilbideak', infoTitulo: 'Ordutegiei buruz',
    tiempoReal: 'Denbora errealeko informazioa (atzerapenak): integratzeko dago. Orduak Euskotrenek programatutakoak dira.',
    avisos: 'Abisuak eta gorabeherak:', instalarTit: 'Hasierako pantailan jarri',
    instalarAnd: '<b>Android (Chrome):</b> ⋮ menua → «Gehitu hasierako pantailan» edo «Instalatu aplikazioa».',
    instalarIos: '<b>iPhone (Safari):</b> Partekatu botoia (gezidun karratua) → «Gehitu hasierako pantailan».',
    manualTit: 'Ordutegiak eskuz kargatu',
    manualTxt: 'Behar baduzu bakarrik: aukeratu Euskotrenen GTFS fitxategi ofiziala (.zip). Zure mugikorrean prozesatzen da eta konexiorik gabe erabiltzeko gordetzen da.',
    cargarZip: 'Kargatu fitxategi ofiziala (.zip)', noOficial: 'Aplikazio independentea eta ez-ofiziala. Ordutegiak: Euskotren (datu irekiak).',
    iniciativa: 'Caravanserai Café-ren ekimena · Donostia',
    pendTitulo: 'Ordutegi ofizialak: integratzeko daude',
    pendTexto: 'Aplikazioaren kopia honek ez ditu oraindik Euskotrenen ordutegi ofizialak. Ez da asmatutako ordutegirik erakusten.',
    pendComo: 'Gidaren arabera argitaratzen duzunean, egunero kargatuko dira bere kasa. Bitartean, Euskotrenen fitxategi ofiziala (GTFS, .zip) eskuz kargatu dezakezu:',
    programado: 'Programatutako ordutegia · ez da denbora errealekoa', directo: 'Zuzena', dir: 'Norantza',
    saleEn: (n) => n <= 0 ? 'Orain irteten da' : `${n} min barru irteten da`, min: 'min',
    cambio: (e, a, b, w) => `Tren aldaketa ${e} geltokian: ${a}etan iritsi, ${b}etan irten (${w} min)`,
    tipos: { laborable: 'Astegunekoa', sabado: 'Larunbata', domingo: 'Igandea', festivo: 'Jaieguna (ordutegi berezia)', sinServicio: 'Zerbitzurik ez', sinDatos: 'Ordutegirik argitaratu gabe' },
    guardarFav: '★ Ibilbidea gorde', quitarFav: '★ Kendu zure ibilbideetatik', vuelta: '⇄ Itzulera ikusi', verMas: 'Tren gehiago ikusi',
    noQuedan: 'Gaur ez dago tren gehiagorik ibilbide honetan.', verManana: 'Biharko lehenak ikusi',
    noTrenes: 'Ez dago trenik ibilbide honetan data honetarako.',
    sinDatosFecha: (h) => `Euskotrenek ez du oraindik data honetarako ordutegirik argitaratu (${h} arte daude eskuragarri).`,
    mismaEst: 'Aukeratu bi geltoki desberdin.', faltaEst: 'Aukeratu irteera- eta helmuga-geltokiak.',
    estadoOk: (d, h, c) => `Euskotrenen ordutegi ofizialak, ${d}-(e)tik ${h} arte baliozkoak. Egiaztatua: ${c}.`,
    estadoManual: (d, h, c) => `Eskuz kargatutako ordutegi ofizialak (${c}), ${d}-(e)tik ${h} arte baliozkoak.`,
    viejo: 'Kontuz: duela egun batzuk egiaztatu ziren azkenekoz. Zaharkituta egon daitezke.',
    sinConexion: 'Konexiorik gabe: mugikor honetan gordetako ordutegiak erabiltzen. Zaharkituta egon daitezke.',
    caducado: 'Ordutegi hauek iraungita daude. Eguneratu bidaiatu aurretik.',
    sinHorarios: 'Oraindik ez dago ordutegi ofizialik kargatuta.',
    procesando: 'Fitxategi ofiziala prozesatzen…', errorZip: 'Ezin izan da fitxategia irakurri: ',
    cargado: (n, v) => `Prest: ${n} geltoki eta ${v} tren kargatuta.`, sinCompat: 'Zure nabigatzailea zaharregia da fitxategia irakurtzeko.',
  },
};

// ---------- Almacenamiento local ----------
const LS = {
  get(k, d) { try { const v = localStorage.getItem('topo.' + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('topo.' + k, JSON.stringify(v)); } catch { /* sin almacenamiento */ } },
};
const IDB = {
  abrir() {
    return new Promise((ok, mal) => {
      const r = indexedDB.open('topo-donostia', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('kv');
      r.onsuccess = () => ok(r.result); r.onerror = () => mal(r.error);
    });
  },
  async get(k) {
    try { const db = await this.abrir(); return await new Promise((ok) => { const q = db.transaction('kv').objectStore('kv').get(k); q.onsuccess = () => ok(q.result); q.onerror = () => ok(undefined); }); } catch { return undefined; }
  },
  async set(k, v) {
    try { const db = await this.abrir(); await new Promise((ok) => { const tx = db.transaction('kv', 'readwrite'); tx.objectStore('kv').put(v, k); tx.oncomplete = ok; tx.onerror = ok; }); } catch { /* sin almacenamiento */ }
  },
};

// ---------- Estado ----------
const E = {
  lang: LS.get('lang', (navigator.language || '').startsWith('eu') ? 'eu' : 'es'),
  modelo: null, red: 'ok', // 'ok' | 'sinArchivo' | 'sinConexion'
  dia: 0, fecha: null, max: 5, favs: LS.get('favs', []),
};
const t = (k) => T[E.lang][k];

const hhmm = (m) => {
  const d = Math.floor(m / 1440), r = m % 1440;
  return `${String(Math.floor(r / 60)).padStart(2, '0')}:${String(r % 60).padStart(2, '0')}` + (d ? '<span class="mas1">+1</span>' : '');
};
// Fechas con nombres propios (no todos los navegadores traen el euskera)
const DIAS = {
  es: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'],
  eu: ['igandea', 'astelehena', 'asteartea', 'asteazkena', 'osteguna', 'ostirala', 'larunbata'],
};
const MESES = {
  es: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
  eu: ['urtarrilak', 'otsailak', 'martxoak', 'apirilak', 'maiatzak', 'ekainak', 'uztailak', 'abuztuak', 'irailak', 'urriak', 'azaroak', 'abenduak'],
};
const fechaLarga = (f) => {
  const d = desdeYmd(f), w = DIAS[E.lang][d.getUTCDay()], mes = MESES[E.lang][d.getUTCMonth()], n = d.getUTCDate();
  return E.lang === 'eu' ? `${w}, ${mes} ${n}` : `${w}, ${n} de ${mes}`;
};
const fechaCorta = (f) => (E.lang === 'eu' ? `${f.slice(0, 4)}/${f.slice(4, 6)}/${f.slice(6, 8)}` : `${f.slice(6, 8)}/${f.slice(4, 6)}/${f.slice(0, 4)}`);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function idxEstacion(nombre) {
  if (!E.modelo || !nombre) return -1;
  const k = normalizar(nombre);
  return E.modelo.estaciones.findIndex((e) => normalizar(e.n) === k);
}

// ---------- Idioma ----------
function aplicarIdioma() {
  document.documentElement.lang = E.lang;
  $$('[data-i18n]').forEach((el) => { el.innerHTML = t(el.dataset.i18n); });
  $$('[data-i18n-aria]').forEach((el) => el.setAttribute('aria-label', t(el.dataset.i18nAria)));
  $$('.idioma button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === E.lang)));
  rellenarSelects(); pintarEstado(); pintarFavs();
  if (!$('#resultados').classList.contains('oculto')) buscar(false);
}

// ---------- Selectores ----------
function rellenarSelects() {
  const ult = LS.get('ultima', null);
  for (const id of ['origen', 'destino']) {
    const s = $('#' + id), actual = s.value || (ult && ult[id]) || '';
    const ops = E.modelo ? E.modelo.estaciones.map((e) => `<option value="${esc(e.n)}">${esc(e.n)}</option>`).join('') : '';
    s.innerHTML = `<option value="">${t('elegir')}</option>` + ops;
    if (idxEstacion(actual) >= 0) s.value = E.modelo.estaciones[idxEstacion(actual)].n;
    s.disabled = !E.modelo;
  }
  $('#buscar').disabled = !E.modelo;
  $('#intercambiar').disabled = !E.modelo;
}

function fechaElegida() {
  const hoy = ahoraDonostia().fecha;
  if (E.dia === 'otro') {
    const v = $('#otraFecha').value;
    return v ? v.replace(/-/g, '') : hoy;
  }
  return sumarDias(hoy, E.dia);
}

// ---------- Búsqueda ----------
function buscar(desplazar = true) {
  const caja = $('#resultados');
  caja.classList.remove('oculto');
  const o = idxEstacion($('#origen').value), d = idxEstacion($('#destino').value);
  if (o < 0 || d < 0) { caja.innerHTML = `<p class="mensaje">${t('faltaEst')}</p>`; return; }
  if (o === d) { caja.innerHTML = `<p class="mensaje">${t('mismaEst')}</p>`; return; }
  LS.set('ultima', { origen: $('#origen').value, destino: $('#destino').value });

  const m = E.modelo, f = fechaElegida(), ahora = ahoraDonostia();
  const esHoy = f === ahora.fecha;
  const tipo = tipoDia(m, f);
  const lista = buscarTrayectos(m, o, d, f, { desde: esHoy ? ahora.min : 0, max: E.max });
  const esFav = E.favs.some((x) => normalizar(x[0]) === normalizar(m.estaciones[o].n) && normalizar(x[1]) === normalizar(m.estaciones[d].n));

  let html = `<h2>${esc(m.estaciones[o].n)} → ${esc(m.estaciones[d].n)}</h2>
    <p class="sub">${esc(fechaLarga(f))} · ${t('tipos')[tipo]}</p>
    <span class="chip prog">${t('programado')}</span>`;

  if (tipo === 'sinDatos') {
    html += `<p class="mensaje">${t('sinDatosFecha')(m.feed.hasta ? fechaCorta(m.feed.hasta) : '—')}</p>`;
  } else if (!lista.length) {
    html += `<div class="mensaje">${esHoy ? t('noQuedan') : t('noTrenes')}${esHoy ? `<button type="button" class="sec" id="verManana">${t('verManana')}</button>` : ''}</div>`;
  } else {
    html += '<ol class="trenes">' + lista.map((j, n) => {
      const primero = n === 0 && esHoy;
      const tr = j.tramos;
      const lineas = tr.map((x) => {
        const c = x.linea.c ? `style="background:#${esc(x.linea.c)};color:#${esc(x.linea.t || 'fff')}"` : '';
        return `<span class="ln" ${c}>${esc(x.linea.s || x.linea.l || 'Euskotren')}</span>`;
      }).join(' ');
      const cambios = tr.slice(1).map((x, k) => `<div class="cambio">${t('cambio')(esc(m.estaciones[x.desde].n), hhmm(tr[k].llega), hhmm(x.sale), x.sale - tr[k].llega)}</div>`).join('');
      return `<li class="tren${primero ? ' primero' : ''}">
        <div class="horas"><span class="sale">${hhmm(j.sale)}</span><span class="flecha" aria-hidden="true">→</span><span class="llega">${hhmm(j.llega)}</span></div>
        <div class="meta">${lineas}<span>${j.duracion} ${t('min')}</span>${tr.length === 1 ? `<span>· ${t('dir')} ${esc(tr[0].destinoTren)}</span>` : ''}</div>
        ${cambios}
        ${primero ? `<span class="cuenta">${t('saleEn')(j.sale - ahora.min)}</span>` : ''}
      </li>`;
    }).join('') + '</ol>';
    if (lista.length === E.max) html += `<button type="button" class="sec" id="verMas" style="width:100%;margin-top:10px">${t('verMas')}</button>`;
  }
  html += `<div class="acciones"><button type="button" class="sec" id="favBtn">${esFav ? t('quitarFav') : t('guardarFav')}</button>
    <button type="button" class="sec" id="vueltaBtn">${t('vuelta')}</button></div>`;
  caja.innerHTML = html;

  $('#verMas')?.addEventListener('click', () => { E.max += 5; buscar(false); });
  $('#verManana')?.addEventListener('click', () => { elegirDia(1); buscar(false); });
  $('#vueltaBtn').addEventListener('click', () => { intercambiar(); buscar(true); });
  $('#favBtn').addEventListener('click', () => {
    const par = [m.estaciones[o].n, m.estaciones[d].n];
    E.favs = esFav ? E.favs.filter((x) => !(normalizar(x[0]) === normalizar(par[0]) && normalizar(x[1]) === normalizar(par[1]))) : [...E.favs, par];
    LS.set('favs', E.favs); pintarFavs(); buscar(false);
  });
  if (desplazar) caja.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
}

function intercambiar() {
  const o = $('#origen'), d = $('#destino'), v = o.value;
  o.value = d.value; d.value = v;
}

function elegirDia(dia) {
  E.dia = dia; E.max = 5;
  $$('.dias button').forEach((b) => b.setAttribute('aria-pressed', String(String(dia) === b.dataset.dia)));
  $('#otraFecha').classList.toggle('oculto', dia !== 'otro');
}

// ---------- Favoritos (con el próximo tren de hoy) ----------
function pintarFavs() {
  const caja = $('#favs');
  const validos = E.modelo ? E.favs.filter((x) => idxEstacion(x[0]) >= 0 && idxEstacion(x[1]) >= 0) : [];
  caja.classList.toggle('oculto', !validos.length);
  if (!validos.length) { caja.innerHTML = ''; return; }
  const ahora = ahoraDonostia();
  caja.innerHTML = `<h2>${t('favoritos')}</h2>` + validos.map((x, i) => {
    const sig = buscarTrayectos(E.modelo, idxEstacion(x[0]), idxEstacion(x[1]), ahora.fecha, { desde: ahora.min, max: 1 })[0];
    return `<button type="button" class="fav" data-i="${i}">${esc(x[0])} → ${esc(x[1])}<small>${sig ? hhmm(sig.sale) + ' · ' + t('saleEn')(sig.sale - ahora.min) : t('noQuedan')}</small></button>`;
  }).join('');
  caja.querySelectorAll('.fav').forEach((b) => b.addEventListener('click', () => {
    const x = validos[+b.dataset.i];
    $('#origen').value = E.modelo.estaciones[idxEstacion(x[0])].n;
    $('#destino').value = E.modelo.estaciones[idxEstacion(x[1])].n;
    elegirDia(0); buscar(true);
  }));
}

// ---------- Estado de los datos ----------
function pintarEstado() {
  const m = E.modelo, punto = $('#punto'), txt = $('#estadoDatos');
  $('#pendiente').classList.toggle('oculto', !!m);
  if (!m) { punto.className = 'punto rojo'; txt.textContent = t('sinHorarios'); return; }
  const hoy = ahoraDonostia().fecha;
  const comprobado = m.generado ? m.generado.slice(0, 10).replace(/-/g, '') : hoy;
  const base = (m.manual ? t('estadoManual') : t('estadoOk'))(fechaCorta(m.feed.desde), fechaCorta(m.feed.hasta), fechaCorta(comprobado));
  const avisos = [];
  let color = 'punto';
  if (E.red === 'sinConexion') { avisos.push(t('sinConexion')); color = 'punto amarillo'; }
  if (sumarDias(comprobado, 3) < hoy) { avisos.push(t('viejo')); color = 'punto amarillo'; }
  if (m.feed.hasta && m.feed.hasta < hoy) { avisos.push(t('caducado')); color = 'punto rojo'; }
  punto.className = color;
  txt.innerHTML = esc(base) + avisos.map((a) => `<br><b>${esc(a)}</b>`).join('');
}

// ---------- Carga de datos ----------
async function cargarDatos() {
  let m = null;
  try {
    const r = await fetch('data/horarios.json', { cache: 'no-cache' });
    if (r.ok) { m = await r.json(); IDB.set('modelo', m); } else E.red = 'sinArchivo';
  } catch { E.red = 'sinConexion'; }
  if (!m) m = await IDB.get('modelo');
  E.modelo = m || null;
}

async function cargarZip(archivo) {
  const txt = $('#estadoDatos');
  if (!('DecompressionStream' in window)) { txt.textContent = t('sinCompat'); return; }
  txt.textContent = t('procesando');
  try {
    const bytes = new Uint8Array(await archivo.arrayBuffer());
    const inflar = async (d) => new Uint8Array(await new Response(new Blob([d]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer());
    const arch = await descomprimir(bytes, inflar);
    const m = construirModelo(arch, archivo.name);
    const err = validarModelo(m);
    if (err.length) throw new Error(err.join('; '));
    m.manual = true;
    E.modelo = m; E.red = 'ok';
    await IDB.set('modelo', m);
    rellenarSelects(); pintarEstado(); pintarFavs();
    txt.innerHTML += `<br><b>${esc(t('cargado')(m.estaciones.length, m.viajes.length))}</b>`;
    $('#buscador').scrollIntoView({ block: 'start' });
  } catch (e) {
    pintarEstado();
    txt.innerHTML += `<br><b>${esc(t('errorZip') + e.message)}</b>`;
  }
}

// ---------- Inicio ----------
$$('.idioma button').forEach((b) => b.addEventListener('click', () => { E.lang = b.dataset.lang; LS.set('lang', E.lang); aplicarIdioma(); }));
$$('.dias button').forEach((b) => b.addEventListener('click', () => {
  elegirDia(b.dataset.dia === 'otro' ? 'otro' : +b.dataset.dia);
  if (E.dia === 'otro') { const i = $('#otraFecha'); if (!i.value) i.value = new Date().toISOString().slice(0, 10); i.focus(); }
}));
$('#otraFecha').addEventListener('change', () => { E.max = 5; });
$('#intercambiar').addEventListener('click', () => { intercambiar(); if (!$('#resultados').classList.contains('oculto')) buscar(false); });
$('#buscar').addEventListener('click', () => { E.max = 5; buscar(true); });
$$('.entradaZip').forEach((i) => i.addEventListener('change', () => { if (i.files[0]) cargarZip(i.files[0]); i.value = ''; }));

aplicarIdioma();
await cargarDatos();
aplicarIdioma();

// Actualiza la cuenta atrás cada 30 segundos
setInterval(() => {
  if (document.hidden || !E.modelo) return;
  pintarFavs();
  if (!$('#resultados').classList.contains('oculto') && E.dia === 0) buscar(false);
}, 30000);

if ('serviceWorker' in navigator) {
  try { navigator.serviceWorker.register('sw.js').catch(() => {}); } catch { /* vista previa sin service worker */ }
}
