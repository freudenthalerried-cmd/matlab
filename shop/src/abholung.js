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

/** Behauptet ein Text eine Abholmöglichkeit? */
export const ZUSAGE = /(?:Abholung|abholen)[^.!?]{0,60}(?:ausdrücklich vorgesehen|ist möglich|möglich\b)|selbst abholt, zahlt keine Fracht|Selbstabholung (?:ist|der bessere Weg)|Abholung am Betriebssitz/i;

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
    for (const t of gepruefte) {
      const treffer = ZUSAGE.exec(t.text ?? '');
      if (treffer) {
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
