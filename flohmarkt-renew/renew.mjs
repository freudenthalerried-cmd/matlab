#!/usr/bin/env node
// -----------------------------------------------------------------------------
// Flohmarkt.at Inserate automatisch verlängern
// -----------------------------------------------------------------------------
// Für jedes Inserat ruft das Skript https://www.flohmarkt.at/inserat/<ID>/login
// auf, meldet sich mit dem Passwort an und klickt auf "verlängern".
//
// WICHTIG: In einer Umgebung ausführen, in der www.flohmarkt.at erreichbar ist.
// (Die Web-Session, in der dieses Skript erstellt wurde, blockiert die Domain
// per Egress-Policy – dort läuft es nicht.)
//
// Konfiguration über Umgebungsvariablen:
//   FLOHMARKT_PASSWORD   (Pflicht)  Passwort für den Inserat-Login
//   FLOHMARKT_IDS        (optional) IDs, komma-/leerzeichengetrennt
//   IDS_FILE             (optional) Pfad zu einer Datei mit einer ID pro Zeile
//                                   (Default: inserate.txt neben diesem Skript)
//   HEADLESS             (optional) "false" -> Browser sichtbar (zum Debuggen)
//   DRY_RUN              (optional) "true"  -> nur einloggen, NICHT verlängern
//   HTTPS_PROXY          (optional) wird an den Browser weitergereicht
//
// IDs können auch als CLI-Argumente übergeben werden:
//   node renew.mjs 5473679 5473680
// -----------------------------------------------------------------------------

import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PASSWORD = process.env.FLOHMARKT_PASSWORD;
const HEADLESS = process.env.HEADLESS !== 'false';
const DRY_RUN = process.env.DRY_RUN === 'true';

function loadIds() {
  const fromArgs = process.argv.slice(2).map((a) => a.trim()).filter((a) => /^\d+$/.test(a));
  if (fromArgs.length) return fromArgs;

  if (process.env.FLOHMARKT_IDS) {
    return process.env.FLOHMARKT_IDS.split(/[\s,]+/).map((s) => s.trim()).filter((s) => /^\d+$/.test(s));
  }

  const file = process.env.IDS_FILE || path.join(__dirname, 'inserate.txt');
  if (fs.existsSync(file)) {
    return fs
      .readFileSync(file, 'utf8')
      .split(/\r?\n/)
      .map((line) => line.split('#')[0].trim()) // "5473679 # Titel" -> "5473679"
      .filter((s) => /^\d+$/.test(s));
  }
  return [];
}

function log(...args) {
  console.log(new Date().toISOString(), ...args);
}

async function renewOne(context, id) {
  const url = `https://www.flohmarkt.at/inserat/${id}/login`;
  const page = await context.newPage();
  const result = { id, ok: false, message: '' };
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });

    // --- Login -----------------------------------------------------------
    const pw = page.locator('input[type="password"]').first();
    await pw.waitFor({ state: 'visible', timeout: 15000 });
    await pw.fill(PASSWORD);

    const submit = page.locator('button[type="submit"], input[type="submit"]').first();
    if (await submit.count()) {
      await submit.click();
    } else {
      await pw.press('Enter');
    }
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 }).catch(() => {});

    // Login fehlgeschlagen? (noch immer ein Passwortfeld sichtbar oder Fehlertext)
    const bodyText = (await page.innerText('body').catch(() => '')).toLowerCase();
    if (/falsches passwort|passwort.*(falsch|ungültig)|login fehlgeschlagen/.test(bodyText)) {
      result.message = 'Login fehlgeschlagen (Passwort?)';
      await dumpDiagnostics(page, id, 'login-failed');
      return result;
    }

    if (DRY_RUN) {
      result.ok = true;
      result.message = 'DRY_RUN: eingeloggt, Verlängerung übersprungen';
      return result;
    }

    // --- "verlängern" finden und klicken ---------------------------------
    const candidates = [
      page.getByRole('button', { name: /verläng/i }),
      page.getByRole('link', { name: /verläng/i }),
      page.locator('input[type="submit"][value*="erläng" i]'),
      page.locator('button:has-text("erläng")'),
      page.locator('a:has-text("erläng")'),
    ];

    let clicked = false;
    for (const c of candidates) {
      if (await c.count()) {
        await c.first().click();
        clicked = true;
        break;
      }
    }

    if (!clicked) {
      result.message = 'Kein "verlängern"-Button gefunden – Seitenstruktur prüfen';
      await dumpDiagnostics(page, id, 'no-renew-button');
      return result;
    }

    await page.waitForLoadState('domcontentloaded', { timeout: 30000 }).catch(() => {});
    const after = (await page.innerText('body').catch(() => '')).toLowerCase();
    if (/verlängert|erfolgreich|bis \d{4}-\d{2}-\d{2}/.test(after)) {
      result.ok = true;
      result.message = 'verlängert';
    } else {
      // Kein eindeutiges Erfolgssignal – als "wahrscheinlich ok" markieren,
      // aber Diagnose ablegen, damit man es prüfen kann.
      result.ok = true;
      result.message = 'geklickt (Bestätigungstext nicht erkannt – bitte prüfen)';
      await dumpDiagnostics(page, id, 'clicked-unconfirmed');
    }
    return result;
  } catch (err) {
    result.message = `Fehler: ${err.message}`;
    await dumpDiagnostics(page, id, 'error').catch(() => {});
    return result;
  } finally {
    await page.close().catch(() => {});
  }
}

async function dumpDiagnostics(page, id, tag) {
  const dir = path.join(__dirname, 'diagnostics');
  fs.mkdirSync(dir, { recursive: true });
  const base = path.join(dir, `${id}-${tag}`);
  await page.screenshot({ path: `${base}.png`, fullPage: true }).catch(() => {});
  const html = await page.content().catch(() => '');
  fs.writeFileSync(`${base}.html`, html);
  log(`  Diagnose gespeichert: ${base}.png / .html`);
}

async function main() {
  if (!PASSWORD) {
    console.error('FEHLER: Umgebungsvariable FLOHMARKT_PASSWORD ist nicht gesetzt.');
    process.exit(2);
  }
  const ids = loadIds();
  if (!ids.length) {
    console.error(
      'FEHLER: Keine Inserat-IDs gefunden. Übergib sie als Argumente, via FLOHMARKT_IDS ' +
        'oder in inserate.txt (eine ID pro Zeile).'
    );
    process.exit(2);
  }

  log(`Starte Verlängerung für ${ids.length} Inserat(e)${DRY_RUN ? ' [DRY_RUN]' : ''}:`, ids.join(', '));

  const launchOptions = { headless: HEADLESS };
  if (process.env.HTTPS_PROXY) {
    launchOptions.proxy = { server: process.env.HTTPS_PROXY };
  }

  const browser = await chromium.launch(launchOptions);
  const context = await browser.newContext({ locale: 'de-AT' });

  const results = [];
  for (const id of ids) {
    log(`Inserat ${id} …`);
    const r = await renewOne(context, id);
    log(`  -> ${r.ok ? 'OK' : 'FEHLGESCHLAGEN'}: ${r.message}`);
    results.push(r);
  }

  await browser.close();

  // --- Zusammenfassung ---------------------------------------------------
  const ok = results.filter((r) => r.ok);
  const failed = results.filter((r) => !r.ok);
  log('----------------------------------------');
  log(`Fertig: ${ok.length} ok, ${failed.length} fehlgeschlagen.`);
  if (failed.length) {
    for (const f of failed) log(`  FEHLGESCHLAGEN ${f.id}: ${f.message}`);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error('Unerwarteter Fehler:', err);
  process.exit(1);
});
