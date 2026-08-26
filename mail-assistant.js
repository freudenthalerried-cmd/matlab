/* =========================================================
   E-Mail-Assistent
   - lernt aus den eigenen gesendeten E-Mails (Anrede, Grußformel,
     Kopie-Gewohnheiten, Formulierungen je Anliegen)
   - füllt jede Antwort vorab vollständig aus und legt offen, was
     gesichert und was geschätzt ist
   - beantwortet Rückfragen im Chatfenster je E-Mail und baut den
     Entwurf entsprechend um

   Der Assistent arbeitet regelbasiert und ausschließlich mit den Daten
   dieser App – es ist kein Sprachmodell angebunden. Wer ein Modell
   anbinden möchte, stellt window.MailAssistantAI bereit:
     window.MailAssistantAI = {
       draft(context)  -> { core: [Satz, …], bullets: [] } | null
       reply(context)  -> { text, changes } | null
     }
   Liefert die Schnittstelle null oder fehlt sie, greifen die Regeln.
   ========================================================= */

(function () {
  'use strict';

  let env = null;

  function attach(bridge) { env = bridge; }

  const CONFIDENCE = { sure: 'gesichert', likely: 'wahrscheinlich', guess: 'geschätzt' };

  /* ---------------------------------------------------------
     Gelerntes Wissen
     --------------------------------------------------------- */

  function emptyLearning() {
    return {
      contacts: {},
      phrases: {},
      stats: { sent: 0, learnedFrom: 0 },
      // Wie der Absender üblicherweise anredet und grüßt – getrennt nach
      // Kolleginnen und Kollegen im Haus und externen Empfängern.
      style: {
        greetings: { internal: {}, external: {} },
        closings: { internal: {}, external: {} }
      }
    };
  }

  function store() {
    const state = env.getState();
    if (!state.assistant) state.assistant = {};
    const a = state.assistant;
    if (!a.learning) a.learning = emptyLearning();
    if (!a.learning.contacts) a.learning.contacts = {};
    if (!a.learning.phrases) a.learning.phrases = {};
    if (!a.learning.stats) a.learning.stats = { sent: 0, learnedFrom: 0 };
    if (!a.learning.style || !a.learning.style.greetings) {
      a.learning.style = emptyLearning().style;
    }
    if (!a.drafts) a.drafts = {};
    if (!a.chats) a.chats = {};
    return a;
  }

  function contactRecord(email, create) {
    const contacts = store().learning.contacts;
    const key = String(email || '').toLowerCase();
    if (!key) return null;
    if (!contacts[key] && create) {
      contacts[key] = { greeting: '', closing: '', formal: null, cc: {}, count: 0 };
    }
    if (contacts[key] && !contacts[key].cc) contacts[key].cc = {};
    return contacts[key] || null;
  }

  function stats() {
    const learning = store().learning;
    return {
      sent: learning.stats.sent || 0,
      contacts: Object.keys(learning.contacts).length,
      phrases: Object.keys(learning.phrases).reduce((sum, key) => sum + learning.phrases[key].length, 0)
    };
  }

  function resetLearning() {
    const a = store();
    a.learning = emptyLearning();
    a.drafts = {};
    env.save();
  }

  /* ---------------------------------------------------------
     Textanalyse
     --------------------------------------------------------- */

  // Das Komma nach der Anrede fehlt in der Praxis oft – es darf nicht
  // Bedingung sein. Stattdessen begrenzt die Zeilenlänge den Treffer.
  const GREETING_RX = /^\s*(sehr geehrte|guten (?:tag|morgen|abend)|hallo|liebe[rs]?\b|servus|grüß|hi)\b/i;
  const GREETING_MAX = 70;
  const CLOSING_RX = /^\s*(mit freundlichen grüßen|freundliche grüße|beste grüße|liebe grüße|schöne grüße|mit besten grüßen|lg|mfg|viele grüße)\s*[,!]?\s*$/i;

  /**
   * Zeilen des eigenen Texts – ohne zitierte Vornachricht.
   * Blockelemente müssen zu Zeilenumbrüchen werden, sonst liefert
   * textContent die ganze E-Mail als eine einzige Zeile und als
   * „Anrede“ würde der komplette Text gelernt.
   */
  function ownText(html) {
    const doc = new DOMParser().parseFromString('<div>' + (html || '') + '</div>', 'text/html');
    const root = doc.body.firstElementChild;

    root.querySelectorAll('blockquote').forEach((el) => el.remove());
    root.querySelectorAll('br').forEach((el) => el.replaceWith(doc.createTextNode('\n')));
    root.querySelectorAll('p, div, li, h1, h2, h3, tr').forEach((el) => {
      el.appendChild(doc.createTextNode('\n'));
    });

    return (root.textContent || '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
  }

  function extractGreeting(lines) {
    if (!lines.length) return '';
    const first = lines[0].trim();
    return (first.length <= GREETING_MAX && GREETING_RX.test(first)) ? first : '';
  }

  /**
   * Die Grußformel steht vor der Signatur, nicht am Textende – es muss
   * daher der ganze Text von hinten durchsucht werden.
   */
  function closingIndex(lines) {
    for (let i = lines.length - 1; i >= 0; i--) {
      if (CLOSING_RX.test(lines[i])) return i;
    }
    return -1;
  }

  function extractClosing(lines) {
    const index = closingIndex(lines);
    return index >= 0 ? lines[index].replace(/[,!]\s*$/, '').trim() : '';
  }

  /** Die inhaltlichen Sätze zwischen Anrede und Grußformel. */
  function extractCore(lines) {
    const start = extractGreeting(lines) ? 1 : 0;
    const closing = closingIndex(lines);
    const end = closing > start ? closing : lines.length;
    return lines.slice(start, end)
      .filter((line) => line.length > 15 && !/^[-–•]/.test(line))
      .slice(0, 4);
  }

  /**
   * Floskeln und Platzhalter taugen nicht als gelernte Formulierung –
   * sonst besteht die nächste Antwort nur noch aus „Vielen Dank …“.
   */
  const BOILERPLATE_RX = new RegExp(
    '^(vielen dank für (ihre|deine) nachricht'
    + '|danke für die info'
    + '|wir haben (ihre|deine) rückfrage geprüft'
    + '|antwort bitte ergänzen'
    + '|für rückfragen stehen'
    + '|melde dich gerne)', 'i');

  function learnableSentence(core) {
    return core.find((line) => line.length > 25 && !BOILERPLATE_RX.test(line)) || '';
  }

  /**
   * Aus „Hallo Armin,“ wird „Hallo {name},“ – nur so lässt sich eine
   * gelernte Anrede auf andere Empfänger übertragen.
   */
  function templatize(text, recipient) {
    const name = env.displayName(recipient) || '';
    if (!text || !name || name.includes('@')) return text;

    let result = text;
    name.split(/\s+/).filter((part) => part.length > 2).forEach((part) => {
      result = result.replace(new RegExp('\\b' + escapeRegExp(part) + '\\b', 'gi'), '{name}');
    });
    return result.replace(/\{name\}(\s+\{name\})+/g, '{name}');
  }

  function applyTemplate(template, recipient) {
    if (!template) return '';
    if (!template.includes('{name}')) return template;
    const first = firstName(recipient);
    if (!first) return '';        // ohne Namen ist die Vorlage nicht verwendbar
    return template.replace(/\{name\}/g, first);
  }

  function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function bump(bucket, key) {
    if (!key) return;
    bucket[key] = (bucket[key] || 0) + 1;
  }

  /** Die häufigste Vorlage einer Gruppe samt Zählerstand. */
  function mostUsed(bucket) {
    let best = null;
    let total = 0;
    Object.keys(bucket || {}).forEach((key) => {
      total += bucket[key];
      if (!best || bucket[key] > bucket[best]) best = key;
    });
    return best ? { value: best, count: bucket[best], total: total } : null;
  }

  function isFormalGreeting(greeting) {
    if (!greeting) return null;
    if (/^sehr geehrte|^guten (tag|morgen|abend)/i.test(greeting)) return true;
    if (/^(hallo|liebe|servus|hi|grüß)/i.test(greeting)) return false;
    return null;
  }

  /* ---------- Fakten aus der eingehenden Nachricht ---------- */

  function extractFacts(message) {
    const text = env.htmlToText(message.body || '');
    const facts = { dates: [], times: [], amounts: [], questions: [], numbers: [] };

    let rest = text.replace(/\b(\d{1,2}\.\s?\d{1,2}\.(?:\s?\d{2,4})?)/g, (hit) => {
      facts.dates.push(hit.replace(/\s+/g, ''));
      return ' '.repeat(hit.length);
    });

    rest.replace(/\b(\d{1,2}[:.]\d{2})\s*Uhr/gi, (hit, time) => {
      facts.times.push(time.replace('.', ':'));
      return hit;
    });

    text.replace(/(?:€|EUR)\s*([\d.]+,\d{2})|([\d.]+,\d{2})\s*(?:€|EUR)/g, (hit) => {
      facts.amounts.push(hit.trim());
      return hit;
    });

    text.replace(/\b(?:rechnung|nummer|nr\.?|auftrag|bestellung)\s*:?\s*([A-Z0-9][A-Z0-9\-\/]{3,})/gi, (hit, num) => {
      facts.numbers.push(num);
      return hit;
    });

    (text.match(/[^.!?]{12,180}\?/g) || []).forEach((question) => {
      facts.questions.push(question.trim());
    });

    facts.dates = unique(facts.dates).slice(0, 3);
    facts.times = unique(facts.times).slice(0, 2);
    facts.amounts = unique(facts.amounts).slice(0, 2);
    facts.numbers = unique(facts.numbers).slice(0, 2);
    facts.questions = facts.questions.slice(0, 3);
    return facts;
  }

  function unique(list) {
    return list.filter((value, index) => list.indexOf(value) === index);
  }

  /* ---------------------------------------------------------
     Anliegen erkennen
     --------------------------------------------------------- */

  const INTENTS = [
    {
      id: 'termin', label: 'Terminabstimmung',
      words: ['termin', 'besprechung', 'jour fixe', 'treffen', 'begehung', 'vor ort', 'uhr', 'kalender', 'verschieben', 'zeitfenster']
    },
    {
      id: 'unterlagen', label: 'Unterlagen / Dokumente',
      words: ['unterlagen', 'dokument', 'nachweis', 'plan', 'protokoll', 'übermitteln', 'zusenden', 'schicken sie', 'benötigen wir', 'anbei']
    },
    {
      id: 'angebot', label: 'Angebot / Kostenvoranschlag',
      words: ['angebot', 'kostenvoranschlag', 'offerte', 'preis', 'leistungsverzeichnis', 'kalkulation', 'nachlass']
    },
    {
      id: 'rechnung', label: 'Rechnung / Zahlung',
      words: ['rechnung', 'zahlung', 'überweisung', 'betrag', 'mahnung', 'skonto', 'zahlungsziel', 'buchhaltung']
    },
    {
      id: 'erinnerung', label: 'Erinnerung / Urgenz',
      words: ['erinnerung', 'urgenz', 'ausstehend', 'noch keine antwort', 'nochmals', 'wie besprochen erinnere', 'dürfen wir erinnern']
    },
    {
      id: 'uebergabe', label: 'Interne Übergabe',
      words: ['übernehme', 'übergebe', 'zur erledigung', 'zuständig', 'kümmerst du', 'kümmere mich', 'in cc', 'in kopie']
    },
    {
      id: 'frage', label: 'Rückfrage',
      words: ['frage', 'rückfrage', 'können sie', 'könnten sie', 'wäre es möglich', 'wie verhält', 'auskunft']
    }
  ];

  function detectIntent(message) {
    const haystack = ((message.subject || '') + ' ' + env.htmlToText(message.body || '')).toLowerCase();
    let best = { id: 'info', label: 'Allgemeine Information', score: 0, hits: [] };

    INTENTS.forEach((intent) => {
      const hits = intent.words.filter((word) => haystack.includes(word));
      let score = hits.length;
      if ((message.subject || '').toLowerCase().split(/\W+/).some((w) => intent.words.includes(w))) score += 1;
      if (score > best.score) best = { id: intent.id, label: intent.label, score: score, hits: hits };
    });

    if (best.score === 0 && /\?/.test(haystack)) {
      best = { id: 'frage', label: 'Rückfrage', score: 1, hits: ['Fragezeichen im Text'] };
    }
    return best;
  }

  /* ---------------------------------------------------------
     Bausteine für den Entwurf
     --------------------------------------------------------- */

  function firstName(addr) {
    const name = env.displayName(addr) || '';
    if (name.includes('@')) return '';
    return name.split(/\s+/)[0] || '';
  }

  function sameDomain(a, b) {
    const domain = (mail) => String(mail || '').split('@')[1] || '';
    return Boolean(domain(a)) && domain(a) === domain(b);
  }

  function greetingFor(addr, internal) {
    const learned = contactRecord(addr.email, false);
    if (learned && learned.greeting) {
      return {
        text: learned.greeting,
        confidence: CONFIDENCE.sure,
        source: 'gelernt aus ' + learned.count + ' gesendeten E-Mail(en) an ' + env.displayName(addr)
      };
    }
    // Die übliche eigene Anrede für diese Gruppe schlägt jede Annahme.
    const group = internal ? 'internal' : 'external';
    const usual = mostUsed(store().learning.style.greetings[group]);
    if (usual) {
      const text = applyTemplate(usual.value, addr);
      if (text) {
        return {
          text: text,
          confidence: CONFIDENCE.likely,
          source: 'Ihre übliche Anrede an ' + (internal ? 'Kolleginnen und Kollegen' : 'externe Empfänger')
            + ' (' + usual.count + ' von ' + usual.total + ' E-Mails)'
        };
      }
    }

    const name = firstName(addr);
    if (internal && name) {
      return { text: 'Hallo ' + name + ',', confidence: CONFIDENCE.likely, source: 'interne Adresse – persönliche Anrede' };
    }
    return {
      text: 'Sehr geehrte Damen und Herren,',
      confidence: CONFIDENCE.guess,
      source: 'noch keine gelernte Anrede – förmliche Standardanrede gewählt'
    };
  }

  function closingFor(addr, internal) {
    const learned = contactRecord(addr.email, false);
    if (learned && learned.closing) {
      return { text: learned.closing, confidence: CONFIDENCE.sure, source: 'gelernte Grußformel für diesen Kontakt' };
    }
    const group = internal ? 'internal' : 'external';
    const usual = mostUsed(store().learning.style.closings[group]);
    if (usual) {
      return {
        text: usual.value,
        confidence: CONFIDENCE.likely,
        source: 'Ihre übliche Grußformel (' + usual.count + ' von ' + usual.total + ' E-Mails)'
      };
    }

    return internal
      ? { text: 'Liebe Grüße', confidence: CONFIDENCE.guess, source: 'interne Adresse – noch nichts gelernt' }
      : { text: 'Mit freundlichen Grüßen', confidence: CONFIDENCE.guess, source: 'Standard für externe Empfänger' };
  }

  function dateHint(facts) {
    if (!facts.dates.length) return '';
    return facts.dates[0] + (facts.times.length ? ' um ' + facts.times[0] + ' Uhr' : '');
  }

  /** Kerntext je Anliegen – gelernte Formulierungen haben Vorrang. */
  function coreFor(intent, facts, message, internal) {
    const attachments = (message.attachments || []).map((a) => a.name);
    const result = { sentences: [], bullets: [], confidence: CONFIDENCE.likely, source: 'Standardformulierung für „' + intent.label + '“' };

    if (attachments.length) {
      result.sentences.push('vielen Dank für Ihre Nachricht – die übermittelten Unterlagen ('
        + attachments.join(', ') + ') haben wir erhalten.');
    } else {
      result.sentences.push('vielen Dank für Ihre Nachricht.');
    }

    // Eine früher selbst formulierte Antwort auf dasselbe Anliegen ersetzt
    // den Standardsatz – die Eröffnung bleibt erhalten.
    const learned = store().learning.phrases[intent.id] || [];
    if (learned.length) {
      result.sentences.push(learned[learned.length - 1]);
      result.source = 'gelernt aus einer früheren Antwort auf ein gleichartiges Anliegen';
      if (internal) {
        result.sentences = result.sentences.map((s) => s
          .replace(/\bIhre\b/g, 'deine').replace(/\bIhnen\b/g, 'dir').replace(/\bSie\b/g, 'du'));
      }
      return result;
    }

    switch (intent.id) {
      case 'termin': {
        const when = dateHint(facts);
        if (when) {
          result.sentences.push('Der Termin am ' + when + ' passt uns – wir haben ihn so vorgemerkt.');
          result.confidence = CONFIDENCE.guess;
          result.source = 'Datum aus der eingehenden Nachricht übernommen – bitte Zusage prüfen';
        } else {
          result.sentences.push('Für die Terminabstimmung schlagen wir TT.MM.JJJJ um HH:MM Uhr vor.');
          result.confidence = CONFIDENCE.guess;
          result.source = 'kein Datum in der Nachricht gefunden – Platzhalter eingesetzt';
        }
        result.sentences.push('Sollte sich etwas ändern, geben wir rechtzeitig Bescheid.');
        break;
      }
      case 'unterlagen':
        result.sentences.push('Die gewünschten Unterlagen stellen wir zusammen und übermitteln sie bis TT.MM.JJJJ.');
        result.confidence = CONFIDENCE.guess;
        result.source = 'Frist als Platzhalter – bitte eintragen';
        break;
      case 'angebot':
        result.sentences.push('Wir prüfen die Positionen'
          + (facts.amounts.length ? ' und den ausgewiesenen Betrag von ' + facts.amounts[0] : '')
          + ' und melden uns mit einer Rückmeldung.');
        break;
      case 'rechnung':
        result.sentences.push('Die Rechnung'
          + (facts.numbers.length ? ' Nr. ' + facts.numbers[0] : '')
          + (facts.amounts.length ? ' über ' + facts.amounts[0] : '')
          + ' haben wir erhalten und zur weiteren Bearbeitung übernommen.');
        break;
      case 'erinnerung':
        result.sentences = ['vielen Dank für Ihre Erinnerung – bitte entschuldigen Sie die Verzögerung.',
          'Wir kümmern uns umgehend darum und melden uns bis TT.MM.JJJJ mit einer Rückmeldung.'];
        result.confidence = CONFIDENCE.guess;
        result.source = 'Frist als Platzhalter – bitte eintragen';
        break;
      case 'uebergabe':
        result.sentences = ['danke für die Information – ich übernehme das.',
          'Ich melde mich, sobald es etwas Neues gibt, und halte dich in Kopie.'];
        break;
      case 'frage':
        result.sentences.push('Wir haben Ihre Rückfrage geprüft und halten dazu fest:');
        result.bullets = facts.questions.length
          ? facts.questions.map((q) => 'Zu „' + q.replace(/\s+/g, ' ').trim() + '“: Antwort bitte ergänzen.')
          : ['Antwort bitte ergänzen.'];
        result.confidence = CONFIDENCE.guess;
        result.source = 'inhaltliche Antwort kann nicht aus den vorhandenen Daten abgeleitet werden';
        break;
      default:
        result.sentences.push('Wir haben die Information erhalten und melden uns, sobald es etwas Neues gibt.');
    }

    if (internal) {
      result.sentences = result.sentences.map((s) => s
        .replace(/\bIhre\b/g, 'deine').replace(/\bIhnen\b/g, 'dir').replace(/\bSie\b/g, 'du'));
    }
    return result;
  }

  /* ---------- Empfänger und Kopie ---------- */

  function recipientsFor(message, settings) {
    const me = settings.me;
    const to = [message.from];

    const original = (message.to || []).concat(message.cc || []);
    const learned = contactRecord(message.from.email, false);
    const habit = [];
    if (learned) {
      Object.keys(learned.cc).forEach((mail) => {
        if (learned.cc[mail] >= 2) habit.push({ name: '', email: mail, times: learned.cc[mail] });
      });
    }

    const standard = env.parseAddresses(settings.defaultCc);
    if (settings.ccSelf && me.email) standard.push({ name: me.name, email: me.email });

    const exclude = to.slice();
    if (!settings.ccSelf && me.email) exclude.push({ email: me.email });

    const cc = env.dedupeAddresses(original.concat(habit).concat(standard), exclude);

    const sources = [];
    if (original.length) sources.push('ursprüngliche Empfänger übernommen');
    if (habit.length) sources.push('gelernt: ' + habit.map((h) => h.email + ' war ' + h.times + '×  in Kopie').join(', '));
    if (standard.length) sources.push('Standard-CC aus den Einstellungen');

    return {
      to: to,
      cc: cc,
      ccSource: sources.length ? sources.join(' · ') : 'keine Kopie erforderlich',
      ccConfidence: habit.length || standard.length ? CONFIDENCE.sure : CONFIDENCE.likely
    };
  }

  /* ---------------------------------------------------------
     Entwurf erzeugen
     --------------------------------------------------------- */

  function subjectFor(message) {
    const subject = message.subject || '(Kein Betreff)';
    return /^\s*AW:/i.test(subject) ? subject : 'AW: ' + subject;
  }

  function quoteOf(message) {
    const rows = [
      ['Von', env.formatAddress(message.from)],
      ['Gesendet', env.formatFullDate(message.date)],
      ['An', (message.to || []).map(env.formatAddress).join('; ')]
    ];
    if (message.cc && message.cc.length) rows.push(['Cc', message.cc.map(env.formatAddress).join('; ')]);
    rows.push(['Betreff', message.subject || '(Kein Betreff)']);

    return '<p></p><blockquote>'
      + rows.map((r) => '<b>' + env.escapeHtml(r[0]) + ':</b> ' + env.escapeHtml(r[1])).join('<br>')
      + '<hr>' + env.sanitizeHtml(message.body) + '</blockquote>';
  }

  function renderBody(parts) {
    const blocks = [];
    if (parts.greeting) blocks.push('<p>' + env.textToHtml(parts.greeting) + '</p>');
    (parts.core || []).forEach((s) => blocks.push('<p>' + env.textToHtml(s) + '</p>'));
    if (parts.bullets && parts.bullets.length) {
      blocks.push('<ul>' + parts.bullets.map((b) => '<li>' + env.textToHtml(b) + '</li>').join('') + '</ul>');
    }
    (parts.extra || []).forEach((s) => blocks.push('<p>' + env.textToHtml(s) + '</p>'));
    if (parts.closing) {
      blocks.push('<p>' + env.textToHtml(parts.closing) + (parts.signer ? '<br>' + env.textToHtml(parts.signer) : '') + '</p>');
    }
    return blocks.join('') + (parts.quote || '');
  }

  function step(label, value, confidence, source) {
    return { label: label, value: value, confidence: confidence, source: source };
  }

  function prepareDraft(message, options) {
    const settings = env.getState().settings;
    const force = options && options.force;
    const cache = store().drafts[message.id];
    if (cache && !force) return cache;

    const me = settings.me;
    const internal = sameDomain(message.from.email, me.email);
    const facts = extractFacts(message);
    const intent = detectIntent(message);
    const rcpt = recipientsFor(message, settings);
    const greeting = greetingFor(message.from, internal);
    const closing = closingFor(message.from, internal);
    const core = coreFor(intent, facts, message, internal);

    let parts = {
      greeting: greeting.text,
      core: core.sentences.slice(),
      bullets: core.bullets.slice(),
      extra: [],
      closing: closing.text,
      signer: me.name || me.email || '',
      quote: quoteOf(message)
    };

    // Optionale Anbindung eines Sprachmodells
    if (window.MailAssistantAI && typeof window.MailAssistantAI.draft === 'function') {
      try {
        const custom = window.MailAssistantAI.draft({ message: message, intent: intent, facts: facts, settings: settings });
        if (custom && custom.core && custom.core.length) {
          parts.core = custom.core;
          parts.bullets = custom.bullets || [];
          core.source = 'von der angebundenen Modell-Schnittstelle erzeugt';
          core.confidence = CONFIDENCE.likely;
        }
      } catch (err) {
        /* Regelwerk bleibt aktiv */
      }
    }

    const steps = [
      step('Anliegen erkannt', intent.label,
        intent.score >= 2 ? CONFIDENCE.sure : (intent.score ? CONFIDENCE.likely : CONFIDENCE.guess),
        intent.hits.length ? 'Hinweise im Text: ' + intent.hits.slice(0, 4).join(', ') : 'keine eindeutigen Schlüsselwörter gefunden'),
      step('Empfänger', env.formatAddresses(rcpt.to), CONFIDENCE.sure, 'Absender der Nachricht'),
      step('Kopie (CC)', rcpt.cc.length ? env.formatAddresses(rcpt.cc) : '—', rcpt.ccConfidence, rcpt.ccSource),
      step('Betreff', subjectFor(message), CONFIDENCE.sure, 'Betreff der Ursprungsnachricht mit „AW:“'),
      step('Anrede', greeting.text, greeting.confidence, greeting.source),
      step('Text', core.sentences.join(' '), core.confidence, core.source),
      step('Grußformel', closing.text, closing.confidence, closing.source),
      step('Zitat', 'Ursprüngliche Nachricht angehängt', CONFIDENCE.sure, 'Verlauf bleibt nachvollziehbar')
    ];

    const draft = {
      messageId: message.id,
      to: rcpt.to, cc: rcpt.cc, bcc: [],
      subject: subjectFor(message),
      parts: parts,
      body: renderBody(parts),
      steps: steps,
      open: [],
      intent: intent,
      facts: facts,
      internal: internal,
      attachments: []
    };

    draft.open = openPoints(draft, message);
    store().drafts[message.id] = draft;
    env.save();
    return draft;
  }

  /** Was der Assistent geraten hat und der Mensch prüfen sollte. */
  function openPoints(draft, message) {
    const parts = draft.parts;
    const text = parts.core.join(' ') + ' ' + parts.bullets.join(' ');
    const open = [];

    if (/TT\.MM\.JJJJ|HH:MM/.test(text)) open.push('Platzhalter für Datum/Uhrzeit ersetzen');
    if (/Antwort bitte ergänzen/i.test(text)) open.push('Inhaltliche Antwort auf die Rückfrage(n) ergänzen');
    if (draft.facts.amounts.length) open.push('Betrag ' + draft.facts.amounts[0] + ' gegen den Beleg prüfen');
    if (/anbei|beiliegend|im anhang/i.test(text + ' ' + parts.extra.join(' '))
      && !(message && (message.attachments || []).length)) {
      open.push('Auf einen Anhang verwiesen – Datei noch anfügen');
    }
    return open;
  }

  /**
   * Nach einer Änderung im Chat müssen Nachweisliste und offene Punkte
   * mitwandern, sonst zeigt das Panel weiter den ursprünglichen Stand.
   */
  function restate(draft) {
    const current = {
      'Empfänger': env.formatAddresses(draft.to),
      'Kopie (CC)': draft.cc.length ? env.formatAddresses(draft.cc) : '—',
      'Betreff': draft.subject,
      'Anrede': draft.parts.greeting,
      'Text': draft.parts.core.join(' '),
      'Grußformel': draft.parts.closing
    };

    draft.steps.forEach((entry) => {
      if (!(entry.label in current) || current[entry.label] === entry.value) return;
      entry.value = current[entry.label];
      entry.confidence = CONFIDENCE.sure;
      entry.source = 'im Chat angepasst';
    });

    const message = (env.getState().messages || []).find((m) => m.id === draft.messageId);
    draft.open = openPoints(draft, message);
    return draft;
  }

  function refresh(draft) {
    draft.body = renderBody(draft.parts);
    restate(draft);
    store().drafts[draft.messageId] = draft;
    env.save();
    return draft;
  }

  /* ---------------------------------------------------------
     Lernen aus gesendeten Nachrichten
     --------------------------------------------------------- */

  function learnFromSent(sent, source) {
    const learning = store().learning;
    const lines = ownText(sent.body);
    const greeting = extractGreeting(lines);
    const closing = extractClosing(lines);
    const core = extractCore(lines);
    const notes = [];

    learning.stats.sent = (learning.stats.sent || 0) + 1;

    const me = env.getState().settings.me;
    const style = learning.style;

    (sent.to || []).forEach((addr) => {
      const record = contactRecord(addr.email, true);
      if (!record) return;
      record.count = (record.count || 0) + 1;

      // Stil je Gruppe mitzählen, damit neue Empfänger davon profitieren.
      const group = sameDomain(addr.email, me.email) ? 'internal' : 'external';
      bump(style.greetings[group], templatize(greeting, addr));
      bump(style.closings[group], closing);

      if (greeting && record.greeting !== greeting) {
        record.greeting = greeting;
        notes.push('Anrede „' + greeting + '“ für ' + env.displayName(addr));
      }
      if (closing && record.closing !== closing) {
        record.closing = closing;
        notes.push('Grußformel „' + closing + '“ für ' + env.displayName(addr));
      }
      const formal = isFormalGreeting(greeting);
      if (formal !== null) record.formal = formal;

      (sent.cc || []).forEach((cc) => {
        const key = cc.email.toLowerCase();
        record.cc[key] = (record.cc[key] || 0) + 1;
        if (record.cc[key] === 2) notes.push(key + ' steht bei ' + env.displayName(addr) + ' regelmäßig in Kopie');
      });
    });

    if (source && core.length) {
      const intent = detectIntent(source).id;
      const bucket = learning.phrases[intent] || (learning.phrases[intent] = []);
      const sentence = learnableSentence(core);
      if (sentence && !bucket.includes(sentence)) {
        bucket.push(sentence);
        while (bucket.length > 5) bucket.shift();
        learning.stats.learnedFrom = (learning.stats.learnedFrom || 0) + 1;
        notes.push('Formulierung für „' + (INTENTS.find((i) => i.id === intent) || { label: 'Allgemein' }).label + '“');
      }
      // Der vorbereitete Entwurf ist verbraucht – beim nächsten Mal neu rechnen.
      delete store().drafts[source.id];
    }

    env.save();
    return notes;
  }

  /* ---------------------------------------------------------
     Chat je E-Mail
     --------------------------------------------------------- */

  function chatLog(messageId) {
    const chats = store().chats;
    if (!chats[messageId]) chats[messageId] = [];
    return chats[messageId];
  }

  function pushChat(messageId, role, text) {
    const log = chatLog(messageId);
    log.push({ role: role, text: text, time: new Date().toISOString() });
    while (log.length > 100) log.shift();
    env.save();
    return log;
  }

  function setFormality(draft, formal) {
    const parts = draft.parts;
    const name = firstName(draft.to[0]);

    if (formal) {
      parts.greeting = name ? 'Guten Tag ' + name + ',' : 'Sehr geehrte Damen und Herren,';
      parts.closing = 'Mit freundlichen Grüßen';
      const map = [[/\bdeine\b/gi, 'Ihre'], [/\bdein\b/gi, 'Ihr'], [/\bdir\b/gi, 'Ihnen'], [/\bdich\b/gi, 'Sie'], [/\bdu\b/gi, 'Sie']];
      parts.core = parts.core.map((s) => map.reduce((acc, m) => acc.replace(m[0], m[1]), s));
    } else {
      parts.greeting = name ? 'Hallo ' + name + ',' : 'Hallo,';
      parts.closing = 'Liebe Grüße';
      const map = [[/\bIhre\b/g, 'deine'], [/\bIhr\b/g, 'dein'], [/\bIhnen\b/g, 'dir'], [/\bSie\b/g, 'du']];
      parts.core = parts.core.map((s) => map.reduce((acc, m) => acc.replace(m[0], m[1]), s));
    }

    // Vorliebe je Kontakt merken
    draft.to.forEach((addr) => {
      const record = contactRecord(addr.email, true);
      if (record) {
        record.formal = formal;
        record.greeting = parts.greeting;
        record.closing = parts.closing;
      }
    });
  }

  function findAddress(text) {
    const mail = (text.match(/[^\s;,<>]+@[^\s;,<>]+\.[^\s;,<>]+/) || [])[0];
    if (mail) return { name: '', email: mail };

    const contacts = env.getState().contacts || [];
    const cleaned = text.toLowerCase().replace(/[^\wäöüß\s@.-]/gi, ' ');
    const hit = contacts.find((c) => {
      const name = (c.name || '').toLowerCase();
      if (!name) return false;
      return name.split(/\s+/).some((part) => part.length > 2 && cleaned.includes(part));
    });
    return hit ? { name: hit.name, email: hit.email } : null;
  }

  const RULES = [
    {
      id: 'hilfe',
      test: (t) => /^(hilfe|was kannst du|befehle)\b/.test(t),
      run: () => ({
        reply: 'Ich habe den Entwurf bereits vollständig vorbereitet. Sie können mir sagen: '
          + '„kürzer“, „ausführlicher“, „förmlich“, „locker“, „Betreff: …“, „setz Armin in Kopie“, „kein CC“, '
          + '„Termin am 12.09. bestätigen“, „Anhang erwähnen“, „warum?“ oder „neu erstellen“. '
          + 'Jeder andere Text wird als Inhalt in den Entwurf übernommen.'
      })
    },
    {
      id: 'warum',
      test: (t) => /\b(warum|wieso|weshalb|begründ|erklär|woher weißt)\b/.test(t),
      run: (ctx) => ({
        reply: 'So bin ich zu dem Entwurf gekommen:\n'
          + ctx.draft.steps.map((s) => '• ' + s.label + ': ' + s.value + ' (' + s.confidence + ' – ' + s.source + ')').join('\n')
          + (ctx.draft.open.length ? '\nOffen bleibt: ' + ctx.draft.open.join('; ') : '\nOffene Punkte sehe ich keine.')
      })
    },
    {
      id: 'neu',
      test: (t) => /^(neu|nochmal|neu erstellen|entwurf neu|zurücksetzen|von vorne)\b/.test(t),
      run: (ctx) => {
        const fresh = prepareDraft(ctx.message, { force: true });
        ctx.replaceDraft(fresh);
        return { reply: 'Entwurf neu aufgebaut – auf Basis des aktuellen Wissensstands.', changed: true };
      }
    },
    {
      id: 'kein-cc',
      test: (t) => /(kein cc|ohne cc|cc (entfernen|raus|löschen|leeren)|niemanden in kopie)/.test(t),
      run: (ctx) => {
        ctx.draft.cc = [];
        return { reply: 'Die Kopie-Empfänger sind entfernt.', changed: true };
      }
    },
    {
      id: 'cc',
      test: (t) => /\b(cc|kopie)\b/.test(t),
      run: (ctx, text) => {
        const addr = findAddress(text);
        if (!addr) {
          return { reply: 'Wen soll ich in Kopie setzen? Nennen Sie mir einen Namen aus dem Adressbuch oder eine E-Mail-Adresse.' };
        }
        ctx.draft.cc = env.dedupeAddresses(ctx.draft.cc.concat([addr]), ctx.draft.to);
        return { reply: env.formatAddress(addr) + ' steht jetzt in Kopie. Ich merke mir das für diesen Empfänger.', changed: true, learn: addr };
      }
    },
    {
      id: 'betreff',
      test: (t) => /^betreff\s*[:\-]?\s*.+/.test(t),
      run: (ctx, text) => {
        const value = text.replace(/^betreff\s*[:\-]?\s*/i, '').trim();
        ctx.draft.subject = value;
        return { reply: 'Betreff geändert auf „' + value + '“.', changed: true };
      }
    },
    {
      id: 'kuerzer',
      test: (t) => /\b(kürzer|kurz fassen|knapper|zu lang|straffen)\b/.test(t),
      run: (ctx) => {
        const parts = ctx.draft.parts;
        if (parts.core.length <= 1 && !parts.extra.length) {
          return { reply: 'Der Entwurf besteht bereits nur aus einem Satz – kürzer wird er nicht sinnvoll.' };
        }
        parts.extra = [];
        parts.core = parts.core.slice(0, 1);
        return { reply: 'Text auf das Wesentliche gekürzt.', changed: true };
      }
    },
    {
      id: 'laenger',
      test: (t) => /\b(länger|ausführlicher|mehr detail|genauer|ergänzen)\b/.test(t),
      run: (ctx) => {
        const line = ctx.draft.internal
          ? 'Melde dich gerne, wenn du dazu noch etwas brauchst.'
          : 'Für Rückfragen stehen wir Ihnen jederzeit gerne zur Verfügung.';
        if (!ctx.draft.parts.extra.includes(line)) ctx.draft.parts.extra.push(line);
        return { reply: 'Ich habe einen abschließenden Satz ergänzt.', changed: true };
      }
    },
    {
      id: 'foermlich',
      test: (t) => /\b(förmlich|formell|siezen|sie-form|höflicher|offizieller)\b/.test(t),
      run: (ctx) => {
        setFormality(ctx.draft, true);
        return { reply: 'Auf die förmliche Sie-Form umgestellt – ich merke mir das für diesen Kontakt.', changed: true };
      }
    },
    {
      id: 'locker',
      test: (t) => /\b(locker|duzen|du-form|persönlicher|lockerer|kollegial)\b/.test(t),
      run: (ctx) => {
        setFormality(ctx.draft, false);
        return { reply: 'Auf die persönliche Du-Form umgestellt – ich merke mir das für diesen Kontakt.', changed: true };
      }
    },
    {
      id: 'termin',
      test: (t) => /\b(termin|am)\b/.test(t) && /\d{1,2}\.\s?\d{1,2}\./.test(t),
      run: (ctx, text) => {
        const date = (text.match(/\d{1,2}\.\s?\d{1,2}\.(?:\s?\d{2,4})?/) || [])[0].replace(/\s+/g, '');
        const time = (text.match(/\d{1,2}[:.]\d{2}/) || [])[0];
        const when = date + (time ? ' um ' + time.replace('.', ':') + ' Uhr' : '');
        const cancel = /\b(absagen|nicht|verschieben|passt nicht)\b/.test(text);
        const line = cancel
          ? 'Der Termin am ' + when + ' passt uns leider nicht – wir schlagen einen Ersatztermin vor.'
          : 'Den Termin am ' + when + ' bestätigen wir hiermit.';
        ctx.draft.parts.core = [ctx.draft.parts.core[0] || 'vielen Dank für Ihre Nachricht.', line];
        return { reply: cancel ? 'Absage zum ' + when + ' eingebaut.' : 'Terminbestätigung für den ' + when + ' eingebaut.', changed: true };
      }
    },
    {
      id: 'anhang',
      test: (t) => /\b(anhang|anlage|beilage|beigefügt)\b/.test(t),
      run: (ctx) => {
        const line = 'Die Unterlagen finden Sie im Anhang.';
        if (!ctx.draft.parts.extra.includes(line)) ctx.draft.parts.extra.push(line);
        return {
          reply: 'Hinweis auf den Anhang ergänzt. Denken Sie daran, die Datei im Entwurfsfenster tatsächlich anzufügen – '
            + 'ich kann keine Dateien von mir aus hinzufügen.',
          changed: true
        };
      }
    },
    {
      id: 'zusage',
      test: (t) => /\b(zusagen|passt so|einverstanden|bestätigen|freigeben)\b/.test(t),
      run: (ctx) => {
        const line = ctx.draft.internal ? 'Passt für uns – wir machen das so.' : 'Wir bestätigen dies hiermit.';
        ctx.draft.parts.core = [ctx.draft.parts.core[0] || 'vielen Dank für Ihre Nachricht.', line];
        return { reply: 'Zusage eingebaut.', changed: true };
      }
    },
    {
      id: 'absage',
      test: (t) => /\b(absagen|ablehnen|leider nicht|passt nicht)\b/.test(t),
      run: (ctx) => {
        const line = 'Leider können wir dem in dieser Form nicht zustimmen – wir melden uns mit einem Gegenvorschlag.';
        ctx.draft.parts.core = [ctx.draft.parts.core[0] || 'vielen Dank für Ihre Nachricht.', line];
        return { reply: 'Absage eingebaut – bitte den Grund noch ergänzen.', changed: true };
      }
    },
    {
      id: 'freitext',
      test: () => true,
      run: (ctx, text) => {
        const sentence = text.trim().replace(/\s+/g, ' ');
        const value = sentence.charAt(0).toUpperCase() + sentence.slice(1)
          + (/[.!?]$/.test(sentence) ? '' : '.');
        ctx.draft.parts.core.push(value);
        return { reply: 'Ich habe das als Satz in den Entwurf übernommen. Sagen Sie „kürzer“, „förmlich“ oder „warum?“, wenn ich etwas anpassen soll.', changed: true };
      }
    }
  ];

  function chat(message, text) {
    const draft = prepareDraft(message);
    const clean = String(text || '').trim();
    if (!clean) return null;

    pushChat(message.id, 'user', clean);

    const ctx = {
      message: message,
      draft: draft,
      replaceDraft: (fresh) => { ctx.draft = fresh; }
    };

    let result = null;
    if (window.MailAssistantAI && typeof window.MailAssistantAI.reply === 'function') {
      try {
        result = window.MailAssistantAI.reply({ message: message, draft: draft, text: clean });
      } catch (err) {
        result = null;
      }
    }

    if (!result) {
      const lower = clean.toLowerCase();
      const rule = RULES.find((r) => r.test(lower));
      result = rule.run(ctx, clean);
    }

    if (result.changed) refresh(ctx.draft);
    if (result.learn) {
      ctx.draft.to.forEach((addr) => {
        const record = contactRecord(addr.email, true);
        if (record) record.cc[result.learn.email.toLowerCase()] = (record.cc[result.learn.email.toLowerCase()] || 0) + 1;
      });
      env.save();
    }

    pushChat(message.id, 'assistant', result.reply);
    return { reply: result.reply, draft: ctx.draft, changed: Boolean(result.changed) };
  }

  function greetChat(message) {
    const log = chatLog(message.id);
    if (log.length) return log;
    const draft = prepareDraft(message);
    const known = stats();
    pushChat(message.id, 'assistant',
      'Ich habe die Antwort bereits vollständig vorbereitet: Anliegen „' + draft.intent.label + '“, '
      + (draft.cc.length ? draft.cc.length + ' Empfänger in Kopie' : 'ohne Kopie') + ', Anrede, Text und Grußformel ausgefüllt.'
      + (known.sent ? ' Grundlage sind ' + known.sent + ' gesendete E-Mail(en), aus denen ich gelernt habe.' : '')
      + (draft.open.length ? '\nBitte prüfen Sie noch: ' + draft.open.join('; ') + '.' : '')
      + '\nSagen Sie mir, was ich ändern soll – oder „warum?“ für meine Begründung.');
    return chatLog(message.id);
  }

  window.MailAssistant = {
    attach: attach,
    prepareDraft: prepareDraft,
    refresh: refresh,
    learnFromSent: learnFromSent,
    chat: chat,
    chatLog: chatLog,
    greetChat: greetChat,
    stats: stats,
    resetLearning: resetLearning,
    detectIntent: detectIntent
  };
})();
