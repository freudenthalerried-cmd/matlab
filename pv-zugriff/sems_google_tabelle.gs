/**
 * PV-Daten GoodWe (SEMS-Cloud) -> Google-Tabelle. Läuft bei Google, PC kann aus sein.
 *
 * Einrichten (einmalig):
 * 1. Neue Google-Tabelle anlegen -> Erweiterungen -> Apps Script -> diesen Code einfügen -> Speichern.
 * 2. Zahnrad "Projekteinstellungen" -> Skripteigenschaften hinzufügen:
 *      SEMS_USER = deine SEMS-Mail
 *      SEMS_PWD  = dein SEMS-Passwort
 *      SEMS_STATION (optional, wird sonst automatisch gesucht)
 * 3. Oben Funktion "einrichten" wählen -> Ausführen -> Berechtigungen erlauben.
 *    Danach läuft "abfragen" automatisch alle 10 Minuten.
 * 4. Optional Handy-Ansicht: Bereitstellen -> Neue Bereitstellung -> Web-App
 *    (Ausführen als: ich, Zugriff: nur ich) -> Link am Handy als Lesezeichen.
 *
 * Hinweis: Die SEMS-Schnittstelle ist nicht offiziell und kann sich ändern.
 */

const LOGIN_URL = 'https://www.semsportal.com/api/v2/Common/CrossLogin';
const BLATT = 'Daten';
const SPALTEN = ['Zeit', 'PV (W)', 'Verbrauch (W)', 'Netz (W, + = Einspeisung)', 'Batterie (W)',
  'Batterie (%)', 'Ertrag heute (kWh)', 'Ertrag gesamt (kWh)', 'Status'];

function einrichten() {
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('abfragen').timeBased().everyMinutes(10).create();
  abfragen();
}

function abfragen() {
  const d = holeDaten_();
  const blatt = blatt_();
  blatt.appendRow([new Date(), d.pv, d.verbrauch, d.netz, d.batterie, d.soc, d.heute, d.gesamt, d.status]);
}

// ---------- SEMS ----------

function login_(neu) {
  const cache = CacheService.getScriptCache();
  const alt = !neu && cache.get('sems');
  if (alt) return JSON.parse(alt);
  const p = PropertiesService.getScriptProperties();
  const user = p.getProperty('SEMS_USER'), pwd = p.getProperty('SEMS_PWD');
  if (!user || !pwd) throw new Error('SEMS_USER / SEMS_PWD fehlen in den Skripteigenschaften.');
  const r = post_(LOGIN_URL, { version: 'v2.1.0', client: 'ios', language: 'en' }, { account: user, pwd: pwd });
  if (r.code !== 0 || !r.data) throw new Error('SEMS-Login fehlgeschlagen: ' + (r.msg || JSON.stringify(r)));
  const sitzung = { token: r.data, api: String(r.api || 'https://eu.semsportal.com/api/').replace(/\/?$/, '/') };
  cache.put('sems', JSON.stringify(sitzung), 6 * 3600);
  return sitzung;
}

function station_(s) {
  const p = PropertiesService.getScriptProperties();
  let id = p.getProperty('SEMS_STATION');
  if (id) return id;
  const r = post_(s.api + 'PowerStation/GetPowerStationIdByOwner', s.token, {});
  id = typeof r.data === 'string' ? r.data : (r.data && (r.data.powerStationId || r.data.id));
  if (!id) throw new Error('Anlagen-ID nicht gefunden. SEMS_STATION manuell eintragen (steht in der SEMS-Web-Adresse).');
  p.setProperty('SEMS_STATION', id);
  return id;
}

function holeDaten_() {
  let s = login_(false), r;
  for (let versuch = 0; versuch < 2; versuch++) {
    r = post_(s.api + 'v2/PowerStation/GetMonitorDetailByPowerstationId', s.token, { powerStationId: station_(s) });
    if (r.code === 0 && r.data) break;
    s = login_(true); // Token abgelaufen -> neu anmelden
  }
  if (!r || r.code !== 0 || !r.data) throw new Error('SEMS-Abfrage fehlgeschlagen: ' + (r && r.msg));
  const k = r.data.kpi || {}, f = r.data.powerflow || {}, wr = (r.data.inverter || [])[0] || {};
  const zahl = v => { const n = parseFloat(String(v === undefined ? '' : v).replace(',', '.')); return isNaN(n) ? '' : n; };
  const netz = zahl(f.grid), bat = zahl(f.bettery);
  return {
    pv: zahl(f.pv !== undefined ? f.pv : k.pac),
    verbrauch: zahl(f.load),
    netz: netz === '' ? '' : (Number(f.gridStatus) < 0 ? -netz : netz),
    batterie: bat === '' ? '' : (Number(f.betteryStatus) < 0 ? -bat : bat),
    soc: zahl(f.soc !== undefined ? f.soc : (wr.invert_full || {}).soc),
    heute: zahl(k.power),
    gesamt: zahl(k.total_power),
    status: (r.data.info && r.data.info.status !== undefined) ? r.data.info.status : ''
  };
}

function post_(url, token, body) {
  const res = UrlFetchApp.fetch(url, {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    headers: { Token: JSON.stringify(token), Accept: 'application/json' },
    payload: JSON.stringify(body)
  });
  try { return JSON.parse(res.getContentText()); }
  catch (e) { throw new Error('SEMS antwortet nicht mit JSON (HTTP ' + res.getResponseCode() + ')'); }
}

// ---------- Tabelle & Handy-Ansicht ----------

function blatt_() {
  const ss = SpreadsheetApp.getActive();
  let b = ss.getSheetByName(BLATT);
  if (!b) {
    b = ss.insertSheet(BLATT);
    b.appendRow(SPALTEN);
    b.setFrozenRows(1);
    b.getRange('A:A').setNumberFormat('dd.MM.yyyy HH:mm');
  }
  return b;
}

function doGet() {
  const b = blatt_(), n = b.getLastRow();
  const z = n > 1 ? b.getRange(n, 1, 1, SPALTEN.length).getValues()[0] : [];
  const esc = s => String(s === undefined ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const kacheln = SPALTEN.slice(1, 8).map((t, i) => `<div class=k>${esc(t)}<b>${esc(z[i + 1])}</b></div>`).join('');
  const zeit = z[0] ? Utilities.formatDate(z[0], Session.getScriptTimeZone(), 'dd.MM.yyyy HH:mm') : 'noch keine Daten';
  return HtmlService.createHtmlOutput(`<meta name=viewport content="width=device-width,initial-scale=1">
<style>body{font:15px system-ui,sans-serif;margin:0;padding:14px;background:#eef0ec;color:#1d2622}
.g{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}
.k{background:#fff;border:1px solid #d3d9d4;border-radius:8px;padding:10px}.k b{display:block;font-size:22px}</style>
<h2>☀ PV GoodWe</h2><p>Stand ${esc(zeit)}</p><div class=g>${kacheln}</div>`).setTitle('PV GoodWe');
}
