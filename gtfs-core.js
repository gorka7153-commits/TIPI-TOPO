// TOPO DONOSTIA — motor de horarios.
// Lee el GTFS oficial de Euskotren y calcula trayectos. Funciona igual en el
// navegador y en Node (lo usa el robot de actualización diaria).
// No contiene ningún horario: todo sale del archivo oficial.

// Zona de la red que se muestra: Donostialdea, de Lasarte-Oria a Hendaia.
// Se incluyen todas las estaciones ferroviarias de Euskotren dentro de este
// rectángulo (así entran estaciones nuevas sin tocar el código).
export const ZONA = { latMin: 43.24, latMax: 43.40, lonMin: -2.045, lonMax: -1.75 };

const ARCHIVOS = ['stops.txt', 'routes.txt', 'trips.txt', 'stop_times.txt',
  'calendar.txt', 'calendar_dates.txt', 'feed_info.txt', 'agency.txt'];

// ---------- ZIP (sin librerías) ----------
export async function descomprimir(bytes, inflarRaw) {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let fin = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65558); i--) {
    if (dv.getUint32(i, true) === 0x06054b50) { fin = i; break; }
  }
  if (fin < 0) throw new Error('El archivo no es un ZIP válido');
  const total = dv.getUint16(fin + 10, true);
  let p = dv.getUint32(fin + 16, true);
  const dec = new TextDecoder();
  const salida = {};
  for (let k = 0; k < total; k++) {
    if (dv.getUint32(p, true) !== 0x02014b50) throw new Error('ZIP dañado');
    const metodo = dv.getUint16(p + 10, true);
    const tam = dv.getUint32(p + 20, true);
    const ln = dv.getUint16(p + 28, true), le = dv.getUint16(p + 30, true), lc = dv.getUint16(p + 32, true);
    const local = dv.getUint32(p + 42, true);
    const nombre = dec.decode(bytes.subarray(p + 46, p + 46 + ln)).split('/').pop();
    p += 46 + ln + le + lc;
    if (!ARCHIVOS.includes(nombre)) continue;
    const ini = local + 30 + dv.getUint16(local + 26, true) + dv.getUint16(local + 28, true);
    const datos = bytes.subarray(ini, ini + tam);
    if (metodo === 0) salida[nombre] = datos;
    else if (metodo === 8) salida[nombre] = await inflarRaw(datos);
    else throw new Error('Compresión ZIP no soportada: ' + metodo);
  }
  return salida;
}

// ---------- CSV ----------
function leerCSV(bytes, alFila) {
  if (!bytes) return;
  let t = typeof bytes === 'string' ? bytes : new TextDecoder('utf-8').decode(bytes);
  if (t.charCodeAt(0) === 0xfeff) t = t.slice(1);
  let cab = null, campo = '', fila = [], q = false;
  const cerrar = () => {
    fila.push(campo); campo = '';
    if (!cab) cab = Object.fromEntries(fila.map((h, i) => [h.trim(), i]));
    else if (fila.length > 1 || fila[0] !== '') alFila(fila, cab);
    fila = [];
  };
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) {
      if (c === '"') { if (t[i + 1] === '"') { campo += '"'; i++; } else q = false; }
      else campo += c;
    } else if (c === '"') q = true;
    else if (c === ',') { fila.push(campo); campo = ''; }
    else if (c === '\n') cerrar();
    else if (c !== '\r') campo += c;
  }
  if (campo !== '' || fila.length) cerrar();
}
const col = (f, cab, n) => (cab[n] === undefined ? '' : (f[cab[n]] || '').trim());

const minutos = (hms) => {
  if (!hms) return null;
  const [h, m] = hms.split(':').map(Number);
  return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : null;
};
export const normalizar = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, ' ').trim();

// ---------- Construcción del modelo compacto ----------
export function construirModelo(arch, origen = '') {
  if (!arch['stops.txt'] || !arch['stop_times.txt'] || !arch['trips.txt']) {
    throw new Error('Faltan archivos GTFS (stops, trips o stop_times)');
  }
  // Paradas → estaciones (agrupadas por estación padre y por nombre)
  const paradas = new Map();
  leerCSV(arch['stops.txt'], (f, c) => paradas.set(col(f, c, 'stop_id'), {
    nombre: col(f, c, 'stop_name'), lat: +col(f, c, 'stop_lat'), lon: +col(f, c, 'stop_lon'),
    padre: col(f, c, 'parent_station'),
  }));
  const dentro = (p) => p.lat >= ZONA.latMin && p.lat <= ZONA.latMax && p.lon >= ZONA.lonMin && p.lon <= ZONA.lonMax;
  const estaciones = [], idxPorClave = new Map(), estDeParada = new Map();
  for (const [id, p] of paradas) {
    const raiz = (p.padre && paradas.get(p.padre)) || p;
    if (!dentro(raiz) || !raiz.nombre) continue;
    const clave = normalizar(raiz.nombre);
    if (!idxPorClave.has(clave)) {
      idxPorClave.set(clave, estaciones.length);
      estaciones.push({ n: raiz.nombre, la: raiz.lat, lo: raiz.lon });
    }
    estDeParada.set(id, idxPorClave.get(clave));
  }

  // Líneas (se descartan autobuses)
  const lineas = new Map();
  leerCSV(arch['routes.txt'], (f, c) => {
    const tipo = +col(f, c, 'route_type');
    if (tipo === 3 || tipo === 11 || (tipo >= 700 && tipo < 800)) return;
    lineas.set(col(f, c, 'route_id'), {
      s: col(f, c, 'route_short_name'), l: col(f, c, 'route_long_name'),
      c: col(f, c, 'route_color'), t: col(f, c, 'route_text_color'),
    });
  });

  const viajesInfo = new Map();
  leerCSV(arch['trips.txt'], (f, c) => {
    const r = col(f, c, 'route_id');
    if (!lineas.has(r)) return;
    viajesInfo.set(col(f, c, 'trip_id'), { r, v: col(f, c, 'service_id'), h: col(f, c, 'trip_headsign') });
  });

  const paradasViaje = new Map();
  leerCSV(arch['stop_times.txt'], (f, c) => {
    const tid = col(f, c, 'trip_id');
    if (!viajesInfo.has(tid)) return;
    const e = estDeParada.get(col(f, c, 'stop_id'));
    if (e === undefined) return;
    const llega = minutos(col(f, c, 'arrival_time')), sale = minutos(col(f, c, 'departure_time'));
    if (llega === null && sale === null) return;
    let a = paradasViaje.get(tid);
    if (!a) paradasViaje.set(tid, a = []);
    a.push([+col(f, c, 'stop_sequence'), e, llega ?? sale, sale ?? llega]);
  });

  const usadasLinea = new Map(), usadosServicio = new Set(), usadasEst = new Set();
  const viajes = [];
  for (const [tid, filas] of paradasViaje) {
    filas.sort((x, y) => x[0] - y[0]);
    const st = [], ar = [], dp = [];
    for (const [, e, a, d] of filas) {
      if (st.length && st[st.length - 1] === e) { dp[dp.length - 1] = d; continue; }
      st.push(e); ar.push(a); dp.push(d);
    }
    if (st.length < 2) continue;
    const info = viajesInfo.get(tid);
    if (!usadasLinea.has(info.r)) usadasLinea.set(info.r, usadasLinea.size);
    usadosServicio.add(info.v);
    st.forEach((e) => usadasEst.add(e));
    const v = { r: usadasLinea.get(info.r), v: info.v, h: info.h, st, dp };
    if (ar.some((x, i) => x !== dp[i])) v.ar = ar;
    viajes.push(v);
  }
  if (!viajes.length) throw new Error('El archivo no contiene trenes en la zona de Donostialdea');

  // Re-indexar estaciones usadas, ordenadas de oeste a este
  const orden = [...usadasEst].sort((a, b) => estaciones[a].lo - estaciones[b].lo);
  const nuevo = new Map(orden.map((e, i) => [e, i]));
  for (const v of viajes) v.st = v.st.map((e) => nuevo.get(e));

  // Calendario
  const servicios = {};
  leerCSV(arch['calendar.txt'], (f, c) => {
    const id = col(f, c, 'service_id');
    if (!usadosServicio.has(id)) return;
    const d = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      .map((n) => col(f, c, n) === '1' ? '1' : '0').join('');
    servicios[id] = { d, s: col(f, c, 'start_date'), e: col(f, c, 'end_date'), a: [], x: [] };
  });
  leerCSV(arch['calendar_dates.txt'], (f, c) => {
    const id = col(f, c, 'service_id');
    if (!usadosServicio.has(id)) return;
    const s = servicios[id] || (servicios[id] = { d: '0000000', s: '', e: '', a: [], x: [] });
    (col(f, c, 'exception_type') === '1' ? s.a : s.x).push(col(f, c, 'date'));
  });

  let feed = {};
  leerCSV(arch['feed_info.txt'], (f, c) => {
    feed = { inicio: col(f, c, 'feed_start_date'), fin: col(f, c, 'feed_end_date'),
      version: col(f, c, 'feed_version'), editor: col(f, c, 'feed_publisher_name') };
  });
  // Rango real de fechas con servicio
  const fechas = [];
  for (const s of Object.values(servicios)) { if (s.s) fechas.push(s.s, s.e); fechas.push(...s.a); }
  fechas.sort();
  feed.desde = fechas[0] || feed.inicio || '';
  feed.hasta = fechas[fechas.length - 1] || feed.fin || '';

  const lineasArr = [];
  for (const [rid, i] of usadasLinea) lineasArr[i] = lineas.get(rid);

  return {
    v: 1, generado: new Date().toISOString(), origen, feed,
    estaciones: orden.map((e) => estaciones[e]),
    lineas: lineasArr, servicios, viajes,
  };
}

// ---------- Fechas ----------
export const ymd = (d) => d.toISOString().slice(0, 10).replace(/-/g, '');
export const desdeYmd = (s) => new Date(Date.UTC(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8)));
export const sumarDias = (s, n) => { const d = desdeYmd(s); d.setUTCDate(d.getUTCDate() + n); return ymd(d); };
export const diaSemana = (s) => desdeYmd(s).getUTCDay(); // 0 = domingo

// Hora actual en Donostia, sea cual sea la zona horaria del móvil
export function ahoraDonostia(fecha = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(fecha).map((x) => [x.type, x.value]));
  return { fecha: p.year + p.month + p.day, min: +p.hour * 60 + +p.minute };
}

export function serviciosActivos(m, f) {
  const w = diaSemana(f), act = new Set();
  for (const [id, s] of Object.entries(m.servicios)) {
    let on = s.s && f >= s.s && f <= s.e && s.d[w] === '1';
    if (s.a.includes(f)) on = true;
    if (s.x.includes(f)) on = false;
    if (on) act.add(id);
  }
  return act;
}

const mismoConjunto = (a, b) => a.size === b.size && [...a].every((x) => b.has(x));

// Tipo de día según los propios datos oficiales
export function tipoDia(m, f) {
  if (!m.feed.desde || f < m.feed.desde || f > m.feed.hasta) return 'sinDatos';
  const act = serviciosActivos(m, f);
  if (!act.size) return 'sinServicio';
  const w = diaSemana(f);
  if (w === 0) return 'domingo';
  if (w === 6) return 'sabado';
  for (let k = 1; k <= 7; k++) { // un laborable con horario de domingo = festivo
    const dom = sumarDias(f, ((7 - w) % 7) + 7 * (k - 1));
    if (dom > m.feed.hasta) break;
    if (!mismoConjunto(serviciosActivos(m, dom), act)) break;
    return 'festivo';
  }
  return 'laborable';
}

// ---------- Cálculo de trayectos ----------
function viajesDelDia(m, f) {
  const hoy = serviciosActivos(m, f), ayer = serviciosActivos(m, sumarDias(f, -1));
  const lista = [];
  for (const v of m.viajes) {
    if (hoy.has(v.v)) lista.push({ v, off: 0 });
    if (ayer.has(v.v) && v.dp[v.dp.length - 1] >= 1440) lista.push({ v, off: -1440 }); // trenes después de medianoche
  }
  return lista;
}

function conexiones(lista, a, b) {
  const r = [];
  for (const { v, off } of lista) {
    const i = v.st.indexOf(a);
    if (i < 0) continue;
    const j = v.st.indexOf(b, i + 1);
    if (j < 0) continue;
    const sale = v.dp[i] + off, llega = (v.ar ? v.ar[j] : v.dp[j]) + off;
    if (sale < 0) continue;
    r.push({ sale, llega, v, i, j });
  }
  return r.sort((x, y) => x.sale - y.sale || x.llega - y.llega);
}

export function buscarTrayectos(m, origen, destino, f, { desde = 0, max = 5, cambioMin = 2 } = {}) {
  if (origen === destino) return [];
  const lista = viajesDelDia(m, f);
  const cand = conexiones(lista, origen, destino).map((c) => ({ sale: c.sale, llega: c.llega, tramos: [c] }));

  for (let x = 0; x < m.estaciones.length; x++) {
    if (x === origen || x === destino) continue;
    const t1 = conexiones(lista, origen, x);
    if (!t1.length) continue;
    const t2 = conexiones(lista, x, destino);
    if (!t2.length) continue;
    const mejor = new Array(t2.length); // mínima llegada desde el índice k en adelante
    for (let k = t2.length - 1; k >= 0; k--) {
      mejor[k] = k === t2.length - 1 || t2[k].llega <= t2[mejor[k + 1]].llega ? k : mejor[k + 1];
    }
    for (const a of t1) {
      let lo = 0, hi = t2.length;
      while (lo < hi) { const md = (lo + hi) >> 1; if (t2[md].sale < a.llega + cambioMin) lo = md + 1; else hi = md; }
      if (lo >= t2.length) continue;
      const b = t2[mejor[lo]];
      if (b.v === a.v) continue;
      cand.push({ sale: a.sale, llega: b.llega, tramos: [a, b] });
    }
  }

  // Quedarse solo con opciones razonables: nadie sale más tarde y llega antes
  cand.sort((p, q) => q.sale - p.sale || p.llega - q.llega || p.tramos.length - q.tramos.length);
  const utiles = [];
  let minLlega = Infinity;
  for (const c of cand) if (c.llega < minLlega) { utiles.push(c); minLlega = c.llega; }
  utiles.reverse();

  return utiles.filter((c) => c.sale >= desde).slice(0, max).map((c) => ({
    sale: c.sale, llega: c.llega, duracion: c.llega - c.sale,
    tramos: c.tramos.map((t) => ({
      linea: m.lineas[t.v.r], destinoTren: t.v.h || m.estaciones[t.v.st[t.v.st.length - 1]].n,
      desde: t.v.st[t.i], hasta: t.v.st[t.j], sale: t.sale, llega: t.llega,
    })),
  }));
}

// Validación básica de un modelo recién construido
export function validarModelo(m, hoy) {
  const errores = [];
  if (m.estaciones.length < 8) errores.push('muy pocas estaciones (' + m.estaciones.length + ')');
  if (m.viajes.length < 50) errores.push('muy pocos trenes (' + m.viajes.length + ')');
  if (hoy && (hoy < m.feed.desde || hoy > m.feed.hasta)) errores.push('no cubre la fecha de hoy');
  return errores;
}
