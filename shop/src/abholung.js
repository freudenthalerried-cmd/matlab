/**
 * Selbstabholung — eine Zusage ohne Ort.
 *
 * **Der Anlass, 6. September 2026.** Fünf Stellen sagen dem Kunden, er könne
 * selbst abholen:
 *
 * * die Fragen und Antworten: *„Ja, ausdrücklich vorgesehen. Wer selbst
 *   abholt, zahlt keine Fracht."*
 * * die Lieferseite, mit eigener Überschrift: *„Ausdrücklich vorgesehen und
 *   nicht schlechter gestellt."*
 * * zweimal der Rat, unterhalb des Mindestbestellwerts sei Abholung *„der
 *   bessere Weg"*
 * * die AGB, Punkt 12: *„Abholung am Betriebssitz ist davon unberührt."*
 *
 * Der Gründungsparameter dieses Vorhabens lautet **„Reines Streckengeschäft,
 * kein eigenes Warenlager"**, und Punkt 4 derselben AGB sagt „Direktversand
 * durch den Hersteller".
 *
 * > **Punkt 4 sagt Direktversand vom Hersteller, Punkt 12 sagt Abholung am
 * > Betriebssitz — in derselben Datei, acht Punkte auseinander.** Ware, die
 * > direkt vom Lieferanten zur Baustelle geht, liegt nie in Marwach 5. Wer
 * > dort hinfährt, steht vor einer Adresse ohne Lager.
 *
 * ## Was belegt ist — und was nicht
 *
 * Abgeholt wird sehr wohl, und das steht seit dem 27. August in den
 * Lieferantendaten: **elf von fünfzehn Rechnungen lauten „Abholung Kunde"**,
 * eine „Retour durch Kunde". Abholort ist das **Lager Mauthausen** des
 * Lieferanten, und „Kunde" ist dort **der Auftraggeber selbst**.
 *
 * Ob ein Kunde des Shops dort abholen darf, ist eine Frage an den Lieferanten
 * und **nie gestellt worden**. Sie steht seit heute als sechste im Brief.
 *
 * ## Die Entscheidung — Gate 28
 *
 * **Abholung wird nicht zugesagt, solange sie nicht bestätigt ist.** Nicht
 * „vielleicht", nicht „auf Anfrage": Eine Zusage, deren Ort es nicht gibt,
 * kostet den Kunden die Fahrt und den Shop den Kunden.
 *
 * Und sie ist **kein Weg unter dem Mindestbestellwert**. Der Rat „darunter ist
 * Selbstabholung der bessere Weg" zeigte auf eine Tür, die zu sein könnte —
 * dieselbe Familie wie „Bestellen ist möglich", nur eine Ebene weiter außen.
 *
 * Der Satz wird **abgeleitet**: Sobald `abholungDurchKunden` beim Lieferanten
 * auf `true` steht, sagt der Shop es wieder — mit dem Ort, den die Antwort
 * nennt.
 */

/**
 * Die Abhollage über alle Lieferanten des Katalogs.
 *
 * Zugesagt wird nur, wenn **jeder** Lieferant sie erlaubt: Ein Warenkorb kann
 * Ware mehrerer Lieferanten enthalten, und eine Zusage, die für einen Teil
 * gilt, ist auf der Seite eine Zusage für alles.
 */
export function abholungslage(lieferanten = []) {
  const liste = (lieferanten ?? []).filter(Boolean);
  if (!liste.length) return { abholungDurchKunden: null };
  const alle = liste.every((l) => l.abholungDurchKunden === true);
  if (!alle) return { abholungDurchKunden: null };
  return {
    abholungDurchKunden: true,
    abholortName: liste.length === 1 ? (liste[0].abholortName ?? null) : null,
  };
}

/** Was der Shop über Abholung sagen darf. */
export function abholungssatz(lieferant = {}) {
  const erlaubt = lieferant?.abholungDurchKunden;
  if (erlaubt === true) {
    const ort = lieferant?.abholortName ?? 'beim Lieferanten';
    return `Abholung ist möglich: ${ort}. Wer selbst abholt, zahlt keine Fracht.`;
  }
  return 'Abholung können wir derzeit nicht zusagen. Die Ware geht im Streckengeschäft direkt '
    + 'vom Lieferanten zur Baustelle; ein eigenes Lager gibt es nicht, und ob unsere Kunden '
    + 'beim Lieferanten abholen dürfen, ist dort angefragt und noch nicht beantwortet.';
}

/**
 * Behauptet ein Text eine Abholmöglichkeit?
 *
 * **Erweitert am 10. September 2026.** Die Reichweitenmessung
 * (`npm run pruefe-umschreibung`) hat dieses Muster gegen acht Sätze
 * gehalten, die alle dasselbe zusagen. Es fing **zwei** — die beiden, gegen
 * die es geschrieben wurde. Durch gingen die Formulierungen, die ein
 * Shoptext zuerst wählt:
 *
 * > „Sie **können** die Ware bei uns **abholen**." · „**Selbstabholer
 * > sparen** die Frachtpauschale." · „Abholung **nach Vereinbarung**." ·
 * > „Gerne stellen wir Ihre Bestellung **zur Abholung bereit**." · „Ware kann
 * > **am Lager übernommen** werden." · „Auf Wunsch **holen Sie selbst ab**."
 *
 * Diese Zusage ist keine Formalie: Der Shop hat **kein eigenes Lager**, und
 * ob Kunden beim Lieferanten abholen dürfen, ist dort angefragt und
 * unbeantwortet (Frage 6 in `src/lieferantenanfrage.js`). Wer einem Bauleiter
 * die Abholung zusagt, schickt ihn zu einem Tor, das ihn nicht kennt.
 *
 * Nicht aufgenommen: das bloße Wort **Selbstabholer**. Es steht in der AGB in
 * einem Berichtigungsvermerk — *„Bis zum 6. September nahm dieser Punkt die
 * Grenze für Selbstabholer ausdrücklich zurück"* —, und das ist die
 * Rücknahme der Zusage, nicht sie selbst. Verlangt wird deshalb ein Verb, das
 * etwas verspricht.
 *
 * Über 111 Kundenflächen erzeugt die erweiterte Fassung null Fehltreffer.
 */
export const ZUSAGE = /(?:Abholung|abholen)[^.!?]{0,60}(?:ausdrücklich vorgesehen|ist möglich|möglich\b)|selbst abholt, zahlt keine Fracht|Selbstabholung (?:ist|w(?:ä|ae)re|der bessere Weg)|Abholung am Betriebssitz|(?:k(?:ö|oe)nnen|k(?:ö|oe)nnt?|d(?:ü|ue)rfen)\s+(?:Sie\s+)?[^.!?]{0,40}?abholen|Selbstabholer\s+(?:sparen|zahlen|erhalten|bekommen)|Abholung\s+nach Vereinbarung|zur\s+Abholung\s+(?:bereit|bereitstellen|bereitgestellt)|am\s+Lager\s+(?:ü|ue)bernommen|holen\s+Sie\s+selbst\s+ab/i;

/**
 * Verneinungen links vom Treffer, im selben Satz.
 *
 * *„Sie können die Ware **nicht** bei uns abholen"* ist die richtige Auskunft
 * und das Gegenteil einer Zusage. Dieselbe Überlegung wie bei den
 * Vorratsworten in `inhaltspruefung.js`: Rechts zu suchen wäre falsch —
 * „Abholung möglich, nicht am Betriebssitz" wäre trotzdem eine Zusage.
 */
export const VERNEINT = /\b(?:nicht|kein|keine|keinen|keinem|keiner|weder|ohne|offen|angefragt|unbeantwortet)\b[^.!?]{0,80}$/i;

/** Sätze eines Textes — über Zeilenumbrüche hinweg, wie im Markdown üblich. */
export function saetzeVon(text) {
  return String(text ?? '').replace(/\s+/g, ' ').split(/(?<=[.!?])\s+/);
}

/**
 * @param {object} eingabe
 * @param {{name: string, text: string}[]} eingabe.texte
 * @param {boolean|null} eingabe.zugesagt   `abholungDurchKunden` des Lieferanten
 * @param {number} [eingabe.mindestens]
 */
export function abholungsbefund({ texte, zugesagt, mindestens = 3 }) {
  const meldungen = [];
  const gepruefte = texte ?? [];

  if (gepruefte.length < mindestens) {
    meldungen.push({
      regel: 'zu-wenig-texte',
      text: `nur ${gepruefte.length} Texte gemessen — darüber lässt sich nichts aussagen`,
    });
  }

  if (zugesagt !== true) {
    // **Satzweise seit dem 10. September.** Vorher lief das Muster über den
    // ganzen Text, und eine Verneinung war nicht zu sehen. Mit dem
    // erweiterten Muster wäre „Sie können die Ware nicht bei uns abholen"
    // eine Zusage geworden — der Prüfer hätte genau den Satz gemeldet, der
    // die Sache richtig sagt.
    for (const t of gepruefte) {
      for (const satz of saetzeVon(t.text)) {
        const treffer = ZUSAGE.exec(satz);
        if (!treffer) continue;
        // Gesucht wird links vom **Verb**, nicht links vom Treffer: Die
        // Verneinung steht mitten im Treffer („Sie können die Ware **nicht**
        // bei uns abholen"), und links vom Treffer wäre sie unsichtbar. Bis
        // zum Verb und nicht bis zum Treffer-Ende — sonst deckte „zahlt
        // **keine** Fracht" die Zusage, die davorsteht.
        const kern = /abhol|(?:ü|ue)bernomm/i.exec(satz.slice(treffer.index));
        const bis = treffer.index + (kern ? kern.index : 0);
        if (VERNEINT.test(satz.slice(0, bis))) continue;
        meldungen.push({
          regel: 'abholung-zugesagt-ohne-ort',
          wo: t.name,
          text: `${t.name} sagt Abholung zu, bestätigt ist sie nicht: „${treffer[0].slice(0, 80)}"`,
        });
      }
    }
  }

  return {
    geprueft: gepruefte.length,
    zugesagt: zugesagt === true,
    meldungen,
    sauber: meldungen.length === 0,
  };
}
