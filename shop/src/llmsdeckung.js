/**
 * Steht jede gebaute Seite in der Datei, die für Maschinen gemacht ist?
 *
 * **Der Anlass, 6. September 2026.** `llms.txt` ist das Verzeichnis, das
 * dieser Shop Assistenten hinhält — der Kanal, über den der Auftraggeber
 * ausdrücklich beworben werden will. Gezählt, was darin steht und was der Bau
 * hergibt:
 *
 * ```
 * gebaute Seiten:              82
 * in llms.txt genannt:         70   (13 Wissen, 4 Systemlisten, 7 Gruppen, 46 Artikel)
 * nicht genannt:               12
 * ```
 *
 * Vier davon waren die **Rechtsseiten**: Wer einen Assistenten fragt, unter
 * welchen Bedingungen dieser Händler liefert oder wie lange die Rügefrist
 * läuft, bekam von dieser Datei keine Antwort — und ein Assistent, der nichts
 * findet, antwortet mit dem, was bei einem Baustoffhändler üblich ist. Sie
 * stehen seither drin.
 *
 * Die übrigen acht fehlen mit Absicht. Und genau dafür gibt es dieses Modul:
 *
 * > **Eine Auslassung ohne Grund ist von einer vergessenen Seite nicht zu
 * > unterscheiden.**
 *
 * Dieselbe Bauart wie das Prüferregister, das Erzeugnisregister und die
 * Warenkorbdeckung: eine Liste, ein Pflichtgrund, ein Prüfer, der beides gegen
 * die Wirklichkeit hält — **in beide Richtungen**. Ein Eintrag für eine Seite,
 * die es nicht mehr gibt, ist derselbe Fehler wie eine Seite ohne Eintrag.
 */

/**
 * Seiten, die absichtlich nicht in `llms.txt` stehen — mit dem Grund.
 *
 * Der Grund ist Pflicht, aus demselben Grund wie im Gegenproben- und im
 * Ausfuhrregister: Wer hier etwas einträgt, das dort hingehörte, soll beim
 * Schreiben des Grundes merken, dass er keinen hat.
 */
export const OHNE_EINTRAG = Object.freeze([
  Object.freeze({
    seite: 'index',
    warum: 'Die Startseite ist der Gegenstand dieser Datei, nicht ein Eintrag in ihr — die '
      + 'Kopfzeile nennt Firma, Ort und Liefergebiet und steht über allem anderen.',
  }),
  Object.freeze({
    seite: '404',
    warum: 'Die Fehlerseite ist kein Ziel, sondern die Antwort auf eine Adresse, die es nicht '
      + 'gibt. Sie steht aus demselben Grund auch nicht in der Sitemap.',
  }),
  Object.freeze({
    seite: 'suche',
    warum: 'Eine Bedienfläche ohne eigenen Inhalt: Was sie zeigt, entsteht erst aus der Eingabe '
      + 'des Besuchers. Ein Assistent, der die Artikelliste dieser Datei hat, braucht sie nicht.',
  }),
  Object.freeze({
    seite: 'warenkorb',
    warum: 'Eine Bedienfläche ohne eigenen Inhalt — der Korb liegt im Browser des Besuchers. '
      + 'Der Weg von dort zur Anfrage steht oben im Abschnitt „Was hier möglich ist".',
  }),
  Object.freeze({
    seite: 'wissen/index',
    warum: 'Eine Übersicht über genau die Seiten, die der Abschnitt „Wissen" einzeln nennt. Sie '
      + 'zusätzlich zu führen hieße, dieselben Seiten zweimal anzubieten.',
  }),
  Object.freeze({
    seite: 'rechtliches/index',
    warum: 'Eine Übersicht über genau die Seiten, die der Abschnitt „Rechtliches" einzeln nennt '
      + '— dieselbe Doppelung wie bei der Wissensübersicht.',
  }),
]);

/** Ab wann ein Grund einer ist. */
export const MINDESTGRUND = 40;

/**
 * @param {object} eingabe
 * @param {string[]} eingabe.seiten     Kennungen aller gebauten Seiten, z. B. `wissen/xps-oder-eps`
 * @param {string[]} eingabe.genannt    Kennungen, die in llms.txt vorkommen
 * @param {{seite: string, warum: string}[]} eingabe.ohneEintrag
 * @param {number} [eingabe.mindestens] ab wie vielen Seiten die Aussage trägt
 */
export function llmsbefund({ seiten, genannt, ohneEintrag, mindestens = 40 }) {
  const meldungen = [];
  const alle = [...new Set((seiten ?? []).filter(Boolean))];
  const drin = new Set((genannt ?? []).filter(Boolean));
  const begruendet = new Map((ohneEintrag ?? []).map((o) => [o.seite, o]));

  if (alle.length < mindestens) {
    meldungen.push({
      regel: 'zu-wenig-seiten',
      text: `nur ${alle.length} gebaute Seiten — darüber lässt sich nichts aussagen`,
    });
  }

  for (const seite of alle) {
    const grund = begruendet.get(seite);
    if (drin.has(seite) && grund) {
      meldungen.push({
        regel: 'genannt-und-begruendet-ausgelassen',
        seite,
        text: `„${seite}" steht in llms.txt und zugleich unter den begründeten Auslassungen`,
      });
      continue;
    }
    if (drin.has(seite)) continue;
    if (!grund) {
      meldungen.push({
        regel: 'seite-ohne-eintrag',
        seite,
        text: `„${seite}" ist gebaut, steht nicht in llms.txt und hat keinen Grund dafür`,
      });
      continue;
    }
    if (!grund.warum || grund.warum.length < MINDESTGRUND) {
      meldungen.push({
        regel: 'auslassung-ohne-grund',
        seite,
        text: `die Auslassung von „${seite}" ist nicht begründet`,
      });
    }
  }

  for (const seite of begruendet.keys()) {
    if (!alle.includes(seite)) {
      meldungen.push({
        regel: 'grund-fuer-nichts',
        seite,
        text: `für „${seite}" steht ein Grund im Register, gebaut wird die Seite nicht`,
      });
    }
  }

  return {
    seiten: alle.length,
    genannt: alle.filter((s) => drin.has(s)).length,
    ausgelassen: begruendet.size,
    meldungen,
    sauber: meldungen.length === 0,
  };
}
