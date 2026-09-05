/**
 * Das Crawler-Register.
 *
 * Die beiden tragenden Proben sind die auf den **alten** Stand: Ein Prüfer,
 * der nur den heutigen, berichtigten Bestand grün meldet, hat nichts gezeigt.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  KENNUNGEN, ANBIETER, ZWECKE, ZUGAENGE,
  pruefeRegister, anbieterOhneAusweg, ungleicheTrainingssperren, pruefeCrawler,
  vergleicheMitDatei, kennungenNach,
} from '../src/crawler.js';
import { robotsTxt, SUCH_CRAWLER, TRAININGS_CRAWLER } from '../src/maschinenlesbar.js';

const grund = 'Ein Grund, der lang genug ist, um die Formprüfung zu bestehen — nur zum Nachbau.';
const k = (kennung, anbieter, zweck, zugang) =>
  Object.freeze({ kennung, anbieter, zweck, zugang, warum: grund });

/** Der Stand bis zum 2. September, aus den beiden flachen Listen nachgebaut. */
const ALT_ANBIETER = Object.freeze([
  Object.freeze({ name: 'OpenAI', beantwortetFragen: true, trainingskennung: 'GPTBot' }),
  Object.freeze({ name: 'Anthropic', beantwortetFragen: true, trainingskennung: 'ClaudeBot' }),
  Object.freeze({ name: 'Google', beantwortetFragen: true, trainingskennung: 'Google-Extended' }),
  Object.freeze({ name: 'Apple', beantwortetFragen: true, trainingskennung: null }),
  Object.freeze({ name: 'Common Crawl', beantwortetFragen: false, trainingskennung: 'CCBot' }),
]);
const ALT = Object.freeze([
  k('OAI-SearchBot', 'OpenAI', 'suche', 'erlaubt'),
  k('Claude-SearchBot', 'Anthropic', 'suche', 'erlaubt'),
  k('Applebot', 'Apple', 'suche', 'erlaubt'),
  k('GPTBot', 'OpenAI', 'training', 'gesperrt'),
  k('ClaudeBot', 'Anthropic', 'training', 'gesperrt'),
  k('Google-Extended', 'Google', 'training', 'gesperrt'),
  k('CCBot', 'Common Crawl', 'training', 'gesperrt'),
]);

test('der heutige Bestand ist widerspruchsfrei', () => {
  assert.deepEqual(pruefeCrawler(), []);
  assert.ok(KENNUNGEN.length >= 10, 'das Register ist gefüllt');
  assert.ok(ANBIETER.length >= 5, 'die Anbieterliste ist gefüllt');
});

test('eine Sperre ohne erlaubte Geschwisterkennung wird als Ausschluss gemeldet', () => {
  const befunde = anbieterOhneAusweg(ALT, ALT_ANBIETER);
  assert.equal(befunde.length, 1, 'genau ein Anbieter ohne Ausweg');
  assert.match(befunde[0], /^Google:/);
  assert.match(befunde[0], /nicht sein Training/);
});

test('ein Archiv ohne Suchkennung ist kein Ausschluss', () => {
  // Common Crawl beantwortet niemandem eine Frage. Dieselbe Sperre, ein
  // anderer Sachverhalt — würde die Regel auch hier anschlagen, wäre sie
  // nutzlos, weil sie jede Trainingssperre verböte.
  const nurArchiv = ALT.filter((e) => e.anbieter === 'Common Crawl');
  const nurCc = ALT_ANBIETER.filter((a) => a.name === 'Common Crawl');
  assert.deepEqual(anbieterOhneAusweg(nurArchiv, nurCc), []);
});

test('eine fehlende Trainingskennung fällt auf, statt still zu gelten', () => {
  const befunde = ungleicheTrainingssperren(ALT, ALT_ANBIETER);
  assert.equal(befunde.length, 1);
  assert.match(befunde[0], /^Apple:/);
});

test('eine erlaubte Trainingskennung neben gesperrten wird gemeldet', () => {
  const gemischt = ALT.map((e) => (e.kennung === 'GPTBot' ? { ...e, zugang: 'erlaubt' } : e));
  const befunde = ungleicheTrainingssperren(gemischt, ALT_ANBIETER);
  assert.ok(befunde.some((b) => /^OpenAI: GPTBot ist erlaubt/.test(b)));
});

test('ein Eintrag ohne Grund kommt nicht durch', () => {
  const ohne = [{ kennung: 'X', anbieter: 'OpenAI', zweck: 'suche', zugang: 'erlaubt', warum: 'kurz' }];
  assert.ok(pruefeRegister(ohne, ANBIETER).some((b) => /ohne belastbaren Grund/.test(b)));
});

test('unbekannter Zweck, unbekannter Zugang, unbekannter Anbieter, Doppeleintrag', () => {
  const kaputt = [
    { kennung: 'A', anbieter: 'OpenAI', zweck: 'traning', zugang: 'erlaubt', warum: grund },
    { kennung: 'B', anbieter: 'OpenAI', zweck: 'suche', zugang: 'vielleicht', warum: grund },
    { kennung: 'C', anbieter: 'Yahoo', zweck: 'suche', zugang: 'erlaubt', warum: grund },
    { kennung: 'C', anbieter: 'OpenAI', zweck: 'suche', zugang: 'erlaubt', warum: grund },
  ];
  const befunde = pruefeRegister(kaputt, ANBIETER);
  assert.ok(befunde.some((b) => /unbekannter Zweck/.test(b)));
  assert.ok(befunde.some((b) => /unbekannter Zugang/.test(b)));
  assert.ok(befunde.some((b) => /ist nicht geführt/.test(b)));
  assert.ok(befunde.some((b) => /steht zweimal/.test(b)));
});

test('jeder Zweck und jeder Zugang im Register ist einer der bekannten', () => {
  // Die Zusicherung steht **vor** der Schleife: Wäre das Register leer, liefe
  // sie durch und meldete Grün.
  assert.ok(KENNUNGEN.length >= 10, 'das Register ist gefüllt');
  for (const e of KENNUNGEN) {
    assert.ok(ZWECKE.includes(e.zweck), `${e.kennung}: ${e.zweck}`);
    assert.ok(ZUGAENGE.includes(e.zugang), `${e.kennung}: ${e.zugang}`);
  }
  assert.ok(kennungenNach('nutzer').length >= 3, 'die vom Menschen ausgelösten Abrufe sind benannt');
});

test('die gerenderte robots.txt gibt genau das Register wieder', () => {
  const txt = robotsTxt({ sitemap: 'https://bauversand.com/sitemap.xml' });
  assert.deepEqual(vergleicheMitDatei(txt), []);
  assert.match(txt, /User-agent: \*\nAllow: \//);
  assert.match(txt, /^Sitemap: https:\/\/bauversand\.com\/sitemap\.xml$/m);
});

test('eine Zeile, die niemand eingetragen hat, wird gemeldet', () => {
  // Die wichtigere Richtung: Eine Kennung in der Datei, die im Register fehlt,
  // ist eine Entscheidung, die niemand getroffen hat.
  const txt = robotsTxt() + '\nUser-agent: Bytespider\nDisallow: /\n';
  const befunde = vergleicheMitDatei(txt);
  assert.equal(befunde.length, 1);
  assert.match(befunde[0], /^Bytespider: steht in robots\.txt, aber in keinem Registereintrag/);
});

test('die abgeleiteten Listen bleiben Sichten auf dasselbe Register', () => {
  assert.deepEqual([...SUCH_CRAWLER], kennungenNach('suche').map((e) => e.kennung));
  assert.deepEqual([...TRAININGS_CRAWLER], kennungenNach('training').map((e) => e.kennung));
  assert.ok(SUCH_CRAWLER.includes('Google-Extended'),
    'Google-Extended ist die Kennung, über die der Assistent liest — keine Trainingszeile');
});

test('die Übersteuerung sperrt, ohne das Register umzuschreiben', () => {
  const zu = robotsTxt({ suche: false });
  assert.ok(SUCH_CRAWLER.length >= 3, 'die abgeleitete Liste ist gefüllt');
  for (const bot of SUCH_CRAWLER) {
    assert.match(zu, new RegExp(`User-agent: ${bot}\\nDisallow: /`), `${bot} ist gesperrt`);
  }
  // Und das Register selbst bleibt unberührt.
  assert.equal(KENNUNGEN.find((e) => e.kennung === 'OAI-SearchBot').zugang, 'erlaubt');
});
