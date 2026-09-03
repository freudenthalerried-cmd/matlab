/* eslint-env browser */
/**
 * Die Oberfläche des Shops — Suche, Filter, Warenkorb, Kasse.
 *
 * Läuft auf jeder Seite. Was sie tut, hängt daran, welche Anker die Seite
 * mitbringt; fehlt einer, passiert nichts. So bleibt eine Wissensseite eine
 * Wissensseite und bekommt trotzdem Suchfeld und Korbzähler.
 *
 * Gerechnet wird hier **nichts**. Preise, Fracht und Summen kommen aus
 * `shopkern.js` und dem Rechenkern, die beide oben im selben Skript stehen.
 */
(function () {
  'use strict';
  var D = window.__SHOP__;
  if (!D) return;

  var speicher = (function () {
    try { return window.localStorage; } catch (e) { return null; }
  })();

  var korb = ladeKorb(speicher);
  var index = baueSuchindex({ artikel: D.artikel, seiten: D.seiten, suchwoerter: D.suchwoerter || [] });
  var artikelNach = {};
  D.artikel.forEach(function (a) { artikelNach[a.sku] = a; });

  var bereinigt = bereinige(korb, D.artikel);
  if (bereinigt.entfallen.length) {
    korb = bereinigt.zeilen;
    speichereKorb(speicher, korb);
  }

  /* ---------------- Werkzeuge ---------------- */

  function el(tag, klasse, text) {
    var n = document.createElement(tag);
    if (klasse) n.className = klasse;
    if (text !== undefined && text !== null) n.textContent = String(text);
    return n;
  }
  function leere(n) { while (n.firstChild) n.removeChild(n.firstChild); }
  function eur(n) { return EUR(n); }
  function ziel(id) { return document.getElementById(id); }

  /**
   * Der Erläuterungstext der Frachtzeile.
   *
   * **Berichtigt am 30.08.** Hier stand `teillieferungen[0].frachtGrund` —
   * der Grund der **ersten** Teillieferung neben der **Summe aller**. Bei
   * einem Korb aus zwei Sortimenten stand damit eine Begründung an einer
   * Zahl, die sie nicht erklärt. Heute führt der Katalog einen Lieferanten;
   * mit der Artikelliste des Auftraggebers kommt der zweite.
   */
  function frachtGrundText(rechnung) {
    var teile = rechnung.teillieferungen;
    if (teile.length === 1) return teile[0].frachtGrund;
    var stuecke = [];
    for (var i = 0; i < teile.length; i++) stuecke.push(eur(teile[i].frachtNetto));
    return teile.length + ' getrennte Lieferungen: ' + stuecke.join(' + ');
  }
  function pfad(kennung) {
    // Zwei Ausgabefassungen: Dateien mit .html, Einzeldatei mit Raute.
    if (D.adressform === 'raute') return '#' + kennung;
    var tiefe = D.tiefe ? '../' : '';
    return tiefe + (kennung === 'index' ? 'index.html' : kennung + '.html');
  }

  function sichern() {
    if (!speichereKorb(speicher, korb)) meldeSpeicherproblem();
    zeichneZaehler();
  }

  var speicherGemeldet = false;
  function meldeSpeicherproblem() {
    if (speicherGemeldet) return;
    speicherGemeldet = true;
    // Still scheitern wäre der schlechtere Weg: Der Kunde legt weiter ein und
    // findet den Korb beim nächsten Aufruf leer.
    var b = el('div', 'antwort', 'Der Warenkorb kann in diesem Browser nicht '
      + 'gespeichert werden — er gilt nur für diese Seite. Meist liegt es an '
      + 'einem privaten Fenster oder an gesperrten Seitendaten.');
    var h = document.querySelector('h1');
    if (h && h.parentNode) h.parentNode.insertBefore(b, h.nextSibling);
  }

  /* ---------------- Kopfleiste ---------------- */

  function zeichneZaehler() {
    var n = korbPositionen(korb);
    [].forEach.call(document.querySelectorAll('[data-korbzaehler]'), function (z) {
      z.textContent = n ? String(n) : '';
      z.hidden = !n;
    });
  }

  /**
   * Suchfeld mit Vorschlägen.
   *
   * Mit Tastatur bedienbar, und das ist keine Kür: Wer einen Suchvorschlag
   * nur mit der Maus erreichen kann, für den ist die Liste eine Zierde. Pfeil
   * ab und auf wählen, Eingabe folgt der Auswahl, Esc schließt. Ohne Auswahl
   * führt die Eingabetaste auf die Suchseite — das bleibt der Weg für den,
   * der einfach tippt und drückt.
   *
   * Die ARIA-Rollen sind nicht dekorativ: Ohne `role="listbox"` und
   * `aria-activedescendant` liest ein Vorleseprogramm die Vorschläge gar
   * nicht vor, weil sie nach dem Tippen einfach im Dokument erscheinen.
   */
  function baueSuchfeld() {
    var feld = ziel('suchfeld');
    if (!feld) return;
    var liste = ziel('suchvorschlag');
    var offen = false;
    var wahl = -1;

    feld.setAttribute('role', 'combobox');
    feld.setAttribute('aria-expanded', 'false');
    feld.setAttribute('aria-autocomplete', 'list');
    if (liste) {
      liste.setAttribute('role', 'listbox');
      liste.setAttribute('aria-label', 'Suchvorschläge');
      feld.setAttribute('aria-controls', liste.id);
    }

    function eintraege() {
      return liste ? [].slice.call(liste.querySelectorAll('.vorschlag')) : [];
    }

    function schliesse() {
      if (liste) { leere(liste); liste.hidden = true; }
      offen = false;
      wahl = -1;
      feld.setAttribute('aria-expanded', 'false');
      feld.removeAttribute('aria-activedescendant');
    }

    function markiere(neu) {
      var e = eintraege();
      if (!e.length) return;
      // Umlaufend: Von der letzten Zeile eine weiter landet wieder oben.
      // Am Ende steckenzubleiben ist die häufigste Art, eine Tastaturliste
      // unbrauchbar zu machen.
      wahl = (neu + e.length) % e.length;
      e.forEach(function (n, i) {
        var aktiv = i === wahl;
        n.classList.toggle('gewaehlt', aktiv);
        n.setAttribute('aria-selected', aktiv ? 'true' : 'false');
        if (aktiv) {
          feld.setAttribute('aria-activedescendant', n.id);
          if (n.scrollIntoView) n.scrollIntoView({ block: 'nearest' });
        }
      });
    }

    function zurSuchseite() {
      location.href = pfad('suche') + '?q=' + encodeURIComponent(feld.value);
    }

    feld.addEventListener('input', function () {
      if (!liste) return;
      var t = suche(index, feld.value, { grenze: 8 });
      leere(liste);
      wahl = -1;
      feld.removeAttribute('aria-activedescendant');
      if (!feld.value.trim()) { schliesse(); return; }

      // **Auch die Vorschlagsliste antwortet auf einen Vertipper.**
      //
      // Die Suchseite tut das seit heute; die meisten Kunden kommen aber gar
      // nicht dorthin — sie tippen ins Feld und sehen nichts. Ein leeres
      // Fenster sagt „gibt es nicht", und das ist bei „kanalror" falsch.
      //
      // Die Zeile ist als Vorschlag gekennzeichnet und führt zur **Suche
      // nach dem vorgeschlagenen Wort**, nicht zu einem Artikel: Der Shop
      // behauptet nicht, das Getippte zu führen.
      if (!t.length) {
        var nahe = meintenSie(index, feld.value);
        if (!nahe.length) { schliesse(); return; }
        nahe.forEach(function (w, i) {
          var a = el('a', 'vorschlag');
          a.href = pfad('suche') + '?q=' + encodeURIComponent(w);
          a.id = 'vorschlag-' + i;
          a.setAttribute('role', 'option');
          a.setAttribute('aria-selected', 'false');
          a.appendChild(el('span', 'v-t', w));
          a.appendChild(el('span', 'v-a', 'Meinten Sie das?'));
          liste.appendChild(a);
        });
        liste.hidden = false;
        offen = true;
        feld.setAttribute('aria-expanded', 'true');
        return;
      }

      t.forEach(function (e, i) {
        var a = el('a', 'vorschlag');
        a.href = pfad(e.id);
        a.id = 'vorschlag-' + i;
        a.setAttribute('role', 'option');
        a.setAttribute('aria-selected', 'false');
        a.appendChild(el('span', 'v-t', e.titel));
        a.appendChild(el('span', 'v-a', e.art === 'artikel'
          ? (e.vkNetto !== null ? eur(e.vkNetto) + ' netto · ' + e.gruppe : e.gruppe)
          : (e.art === 'wissen' ? 'Wissen' : e.art === 'system' ? 'Systemliste' : 'Sortiment')));
        liste.appendChild(a);
      });
      liste.hidden = false;
      offen = true;
      feld.setAttribute('aria-expanded', 'true');
    });

    feld.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') { schliesse(); return; }
      if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
        var e = eintraege();
        if (!offen || !e.length) return;
        ev.preventDefault();
        // Aus dem Zustand „nichts gewählt" führt Pfeil ab auf die erste und
        // Pfeil auf auf die **letzte** Zeile. Ohne diesen Sonderfall rechnet
        // -1 minus 1 modulo Länge auf die vorletzte — ein Versatz um eins,
        // den die Probe gefunden hat und das Auge nicht.
        if (wahl === -1) markiere(ev.key === 'ArrowDown' ? 0 : e.length - 1);
        else markiere(wahl + (ev.key === 'ArrowDown' ? 1 : -1));
        return;
      }
      if (ev.key === 'Enter') {
        ev.preventDefault();
        var e = eintraege();
        if (offen && wahl >= 0 && e[wahl]) location.href = e[wahl].href;
        else zurSuchseite();
      }
    });

    document.addEventListener('click', function (ev) {
      if (offen && !feld.contains(ev.target) && liste && !liste.contains(ev.target)) schliesse();
    });
  }

  /* ---------------- In den Warenkorb ---------------- */

  /**
   * **Umgestellt am 2. September auf Stellvertretung.**
   *
   * Vorher hat diese Funktion jeden vorhandenen Knopf einzeln verdrahtet. Das
   * hielt, solange die Knöpfe im gelieferten HTML standen. Seit die
   * Artikelkachel einen eigenen Knopf trägt, entstehen sie **nach** dem
   * Verdrahten — der Filter zeichnet das Raster neu — und ein Knopf ohne
   * Behandler sieht aus wie einer, der nicht funktioniert.
   *
   * Ein einziger Behandler am Dokument trifft auch, was später entsteht. Die
   * Wache dagegen, ihn bei jedem Rautenwechsel ein zweites Mal anzuhängen:
   * Ein doppelter Behandler legt jede Menge zweimal in den Korb.
   */
  var korbknoepfeVerdrahtet = false;

  function baueKorbknoepfe() {
    if (korbknoepfeVerdrahtet) return;
    korbknoepfeVerdrahtet = true;
    document.addEventListener('click', function (ev) {
      var knopf = ev.target && ev.target.closest ? ev.target.closest('[data-legen]') : null;
      if (!knopf) return;
      var sku = knopf.getAttribute('data-legen');
      // **Zuerst die eigene Zeile, dann die Kennung.** Bis zum 02.09. hing
      // die Zuordnung allein an `data-menge` und damit an einer Kennung, die
      // auf einer Seite eindeutig sein muss. Seit die Kachel ein Mengenfeld
      // trägt, steht derselbe Artikel auf einer Artikelseite in zwei Listen —
      // „Verwandt" und „Mitverbaut" — und die Kennung gab es zweimal.
      // `getElementById` liefert die erste: Der zweite Knopf legte die Menge
      // des ersten Feldes in den Korb. Gefunden von der Probe, die nach
      // doppelten Kennungen sucht.
      var zeile = knopf.closest ? knopf.closest('.legen') : null;
      var mengenfeld = (zeile && zeile.querySelector('input[type=number]'))
        || document.getElementById(knopf.getAttribute('data-menge') || '');
      // `parseInt` hat hier bis zum 29.08. gestanden und aus „0,75 m²" eine
      // 0 gemacht, die dann auf 1 gehoben wurde: Der Knopf legte einen
      // ganzen Quadratmeter in den Korb, den es als Platte nicht gibt.
      var artikel = (D.artikel || []).filter(function (x) { return x.sku === sku; })[0];
      var schritt = mengenschritt(artikel) || 1;
      var menge = mengenfeld ? parseFloat(String(mengenfeld.value).replace(',', '.')) : schritt;
      if (!Number.isFinite(menge) || menge <= 0) menge = schritt;
      menge = Math.round(Math.ceil(Math.round((menge / schritt) * 1e6) / 1e6) * schritt * 100) / 100;
      korb = legeInKorb(korb, sku, menge);
      sichern();
      knopf.textContent = String(menge).replace('.', ',') + '× im Warenkorb';
      knopf.classList.add('getan');
      window.setTimeout(function () {
        knopf.textContent = 'In den Warenkorb';
        knopf.classList.remove('getan');
      }, 2200);
    });
  }

  /* ---------------- Filter und Sortierung ---------------- */

  function baueRasterfilter() {
    var leiste = ziel('filterleiste');
    var raster = ziel('warenraster');
    if (!leiste || !raster) return;

    var alle = D.artikel.filter(function (a) {
      var g = raster.getAttribute('data-gruppe');
      return !g || a.gruppe === g;
    });
    var werte = filterwerte(alle);
    var zustand = { gruppe: raster.getAttribute('data-gruppe') || '', suchtauglich: false, ohneSperrgut: false, sortierung: 'name', preisBis: null };

    function auswahl(beschriftung, optionen, beiWahl) {
      var wrap = el('label', 'f');
      wrap.appendChild(el('span', 'f-b', beschriftung));
      var s = el('select');
      optionen.forEach(function (o) {
        var opt = el('option', null, o.text);
        opt.value = o.id;
        s.appendChild(opt);
      });
      s.addEventListener('change', function () { beiWahl(s.value); zeichne(); });
      wrap.appendChild(s);
      return wrap;
    }

    function schalter(beschriftung, beiWahl) {
      var wrap = el('label', 'f f-schalter');
      var c = document.createElement('input');
      c.type = 'checkbox';
      c.addEventListener('change', function () { beiWahl(c.checked); zeichne(); });
      wrap.appendChild(c);
      wrap.appendChild(el('span', null, beschriftung));
      return wrap;
    }

    if (!raster.getAttribute('data-gruppe')) {
      var gruppen = [{ id: '', text: 'Alle Warengruppen' }].concat(
        werte.gruppen.map(function (g) { return { id: g, text: g }; }));
      leiste.appendChild(auswahl('Warengruppe', gruppen, function (v) { zustand.gruppe = v; }));
    }
    leiste.appendChild(auswahl('Sortierung', SORTIERUNGEN, function (v) { zustand.sortierung = v; }));
    leiste.appendChild(schalter('nur mit Preisvorteil', function (v) { zustand.suchtauglich = v; }));
    if (werte.mitSperrgut) {
      leiste.appendChild(schalter('ohne palettierte Ware', function (v) { zustand.ohneSperrgut = v; }));
    }
    var zaehler = el('span', 'f-zahl');
    leiste.appendChild(zaehler);

    function zeichne() {
      var liste = sortiere(filtere(alle, zustand), zustand.sortierung);
      leere(raster);
      liste.forEach(function (a) { raster.appendChild(karte(a)); });
      zaehler.textContent = liste.length === alle.length
        ? liste.length + ' Artikel'
        : liste.length + ' von ' + alle.length + ' Artikeln';
      if (!liste.length) {
        var leerHinweis = el('p', 'antwort', 'Kein Artikel passt zu dieser Auswahl. '
          + 'Der Katalog umfasst ' + alle.length + ' Artikel — wir erfinden keine dazu.');
        raster.appendChild(leerHinweis);
      }
    }
    zeichne();
  }

  /**
   * Die Artikelkachel.
   *
   * **Umgebaut am 2. September.** Sie war ein Verweiselement um die ganze
   * Kachel; ein Knopf darin wäre ein Bedienelement in einem Bedienelement
   * gewesen. Jetzt: ein Kopfbereich, der verlinkt, darunter Preis und eine
   * Legen-Zeile. Gemessen war der Preis des Fehlens — wer aus einer Anzeige
   * mit drei Positionen im Kopf kam, ging neun Schritte statt fünf.
   *
   * Die Legen-Zeile bedient sich derselben Verdrahtung wie die Artikelseite
   * (`data-legen` und `data-menge`, siehe `baueKorbknoepfe`). Eine zweite
   * Mengenrechnung neben der dort stehenden wäre die sicherste Art, in Korb
   * und Karte zwei verschiedene Mengen zu erzeugen.
   */
  function karte(a) {
    var w = el('div', 'karte');
    var kopf = el('a', 'kopf');
    kopf.href = pfad('artikel/' + a.sku);
    if (D.bilder && D.bilder[a.sku]) {
      var b = el('span', 'bild');
      b.innerHTML = D.bilder[a.sku];
      kopf.appendChild(b);
    }
    kopf.appendChild(el('span', 'nr', a.lieferantenArtikelnummer || ''));
    kopf.appendChild(el('span', 't', a.bezeichnung));
    w.appendChild(kopf);
    var v = vorteil(a);
    if (v !== null && v >= 5) w.appendChild(el('span', 'marker vorteil', v + ' % unter Liste'));
    if (a.amListendeckel) w.appendChild(el('span', 'marker beipack', 'Beipack'));
    if (a.sperrgut) w.appendChild(el('span', 'marker sperrig', 'palettiert'));
    var p = el('span', 'preis', a.vkNetto === null ? 'Preis auf Anfrage' : eur(a.vkNetto));
    if (a.vkNetto !== null) {
      p.appendChild(el('span', 'eh', ' je ' + (D.einheiten[a.einheit] || a.einheit) + ', netto'));
    }
    w.appendChild(p);
    // Ohne rechenbaren Preis kein Knopf: Was der Shop nicht rechnen kann, legt
    // er auch nicht in einen Korb, der eine Summe bildet.
    if (a.vkNetto !== null) w.appendChild(legenzeile(a));
    return w;
  }

  /** Mengenfeld und Knopf einer Kachel — dieselben Haken wie die Artikelseite. */
  function legenzeile(a) {
    var einheit = D.einheiten[a.einheit] || a.einheit;
    var schritt = mengenschritt(a);
    var wert = schritt === null ? 1 : schritt;
    var zeile = el('div', 'legen legen-klein');
    var feld = document.createElement('input');
    feld.type = 'number';
    // Bewusst **ohne** Kennung: Der Knopf findet sein Feld in seiner eigenen
    // Zeile. Eine Kennung je Artikel wäre auf einer Seite mit zwei Listen
    // desselben Artikels doppelt.
    feld.min = String(wert);
    feld.max = '999';
    if (schritt) feld.step = String(wert);
    feld.value = String(wert);
    feld.setAttribute('inputmode', 'decimal');
    // Elf Knöpfe, die alle „In den Warenkorb" heißen, sind für eine
    // Vorleseausgabe elf gleiche Knöpfe. Der Name des Artikels gehört dazu.
    feld.setAttribute('aria-label', 'Menge in ' + einheit + ' für ' + a.bezeichnung);
    var knopf = el('button', 'knopf', 'In den Warenkorb');
    knopf.type = 'button';
    knopf.setAttribute('data-legen', a.sku);
    knopf.setAttribute('aria-label', a.bezeichnung + ' in den Warenkorb');
    zeile.appendChild(feld);
    zeile.appendChild(knopf);
    return zeile;
  }

  /* ---------------- Suchergebnisseite ---------------- */

  function baueSuchseite() {
    var z = ziel('suche-ziel');
    if (!z) return;
    var frage = '';
    try { frage = new URLSearchParams(location.search).get('q') || ''; } catch (e) { frage = ''; }
    if (!frage && location.hash.indexOf('?q=') > -1) {
      frage = decodeURIComponent(location.hash.split('?q=')[1] || '');
    }
    var feld = ziel('suchfeld');
    if (feld && frage) feld.value = frage;

    var kopf = ziel('suche-kopf');
    var t = frage ? suche(index, frage, { grenze: 60 }) : [];
    if (kopf) {
      kopf.textContent = !frage
        ? 'Geben Sie oben einen Suchbegriff ein.'
        : t.length
          ? t.length + ' Treffer für „' + frage + '"'
          : 'Kein Treffer für „' + frage + '".';
    }
    leere(z);

    var waren = t.filter(function (e) { return e.art === 'artikel'; });
    var rest = t.filter(function (e) { return e.art !== 'artikel'; });

    if (waren.length) {
      z.appendChild(el('h2', null, waren.length + ' Artikel'));
      var r = el('div', 'raster');
      waren.forEach(function (e) { r.appendChild(karte(artikelNach[e.sku])); });
      z.appendChild(r);
    }
    if (rest.length) {
      z.appendChild(el('h2', null, 'Seiten dazu'));
      var k = el('div', 'kacheln');
      rest.forEach(function (e) {
        var a = el('a', 'kachel');
        a.href = pfad(e.id);
        a.appendChild(el('span', 'k', e.art === 'wissen' ? 'Wissen'
          : e.art === 'system' ? 'Systemliste' : 'Sortiment'));
        a.appendChild(el('span', 't', e.titel));
        a.appendChild(el('span', 'b', e.zusatz || ''));
        k.appendChild(a);
      });
      z.appendChild(k);
    }
    if (frage && !t.length) {
      // „Meinten Sie …?" — ein Vorschlag, keine stille Ersetzung. Der Shop
      // sucht nicht heimlich nach etwas anderem; er fragt, und der Kunde
      // klickt. Ist nichts nah genug, schweigt er.
      var vorschlaege = meintenSie(index, frage);
      if (vorschlaege.length) {
        var p = el('p', 'antwort');
        p.appendChild(document.createTextNode('Meinten Sie: '));
        vorschlaege.forEach(function (w, i) {
          if (i) p.appendChild(document.createTextNode(i === vorschlaege.length - 1 ? ' oder ' : ', '));
          var a = el('a', null, w);
          a.href = pfad('suche') + '?q=' + encodeURIComponent(w);
          a.addEventListener('click', function () { setTimeout(baueSuchseite, 0); });
          p.appendChild(a);
        });
        p.appendChild(document.createTextNode('?'));
        z.appendChild(p);
      }
      // Wo wir es genauer wissen, sagen wir es genauer. Für 23 Wörter steht
      // im Register, was wir nicht führen und was daneben steht — das ist
      // eine bessere Auskunft als der allgemeine Satz darunter, und sie
      // stammt aus einer redaktionellen Entscheidung, nicht aus einer
      // Ähnlichkeitsrechnung.
      var gesucht = wortstaemme(frage);
      var bekannt = (D.nichtGefuehrt || []).filter(function (n) {
        return gesucht.indexOf(n.wort.toLowerCase()) >= 0
          || wortstaemme(n.wort).some(function (w) { return gesucht.indexOf(w) >= 0; });
      });
      if (bekannt.length) {
        var wir = el('p', 'antwort');
        wir.appendChild(el('strong', null, 'Das führen wir nicht. '));
        wir.appendChild(document.createTextNode(bekannt[0].antwort));
        z.appendChild(wir);
      }
      z.appendChild(el('p', 'antwort', 'Der Katalog umfasst ' + D.artikel.length
        + ' Artikel aus dem laufenden Einkauf. Was nicht darin steht, führen wir nicht — '
        + 'wir zeigen lieber nichts als etwas Erfundenes.'));
    }
  }

  /* ---------------- Warenkorbseite ---------------- */

  function baueKorbseite() {
    var z = ziel('warenkorb-ziel');
    if (!z) return;

    function zeichne() {
      leere(z);
      if (!korb.length) {
        z.appendChild(el('p', 'lede', 'Der Warenkorb ist leer.'));
        var a = el('a', 'knopf');
        a.href = pfad('index');
        a.textContent = 'Zum Sortiment';
        z.appendChild(a);
        return;
      }

      var rechnung;
      try {
        rechnung = kundenWarenkorb(korb, {
          artikel: D.artikel,
          lieferanten: D.lieferanten,
          mindestbestellwertNetto: D.mindestbestellwertNetto,
        });
      } catch (e) {
        z.appendChild(el('p', 'antwort', 'Der Warenkorb lässt sich nicht rechnen: ' + e.message));
        return;
      }

      rechnung.teillieferungen.forEach(function (t) {
        var block = el('div', 'korbblock');
        block.appendChild(el('h2', null, t.positionen.length + ' Positionen'));
        t.positionen.forEach(function (p) { block.appendChild(korbzeile(p, zeichne)); });
        z.appendChild(block);
      });

      var tafel = el('div', 'preistafel');
      // Das Gewicht steht dabei, weil es entscheidet, wie geliefert wird —
      // und weil ein Kunde wissen muss, was auf seine Baustelle kommt. Wo es
      // fehlt, steht das dort, statt eine Untergrenze als Summe auszugeben.
      var gewichtText = rechnung.positionenOhneGewicht
        ? (rechnung.gewichtKg > 0 ? 'mindestens, ' : '')
          + rechnung.positionenOhneGewicht + ' Position'
          + (rechnung.positionenOhneGewicht === 1 ? '' : 'en') + ' ohne belegtes Gewicht'
        : 'aus den Lieferscheinen';
      [['Warenwert', eur(rechnung.warenwertNetto), 'netto'],
       ['Fracht', eur(rechnung.frachtNetto), frachtGrundText(rechnung)],
       ['Gewicht', String(rechnung.gewichtKg).replace('.', ',') + ' kg', gewichtText],
       ['Netto gesamt', eur(rechnung.nettoGesamt), 'zuzüglich ' + ustText() + ' USt'],
       ['Brutto', eur(rechnung.bruttoGesamt), 'inkl. ' + eur(rechnung.ustBetrag) + ' USt']
      ].forEach(function (r) {
        var d = el('div');
        d.appendChild(el('span', 'k', r[0]));
        d.appendChild(el('span', 'w', r[1]));
        d.appendChild(el('span', 'e', r[2]));
        tafel.appendChild(d);
      });
      z.appendChild(tafel);

      // Gate 25. Der Hinweis steht schon im Warenkorb und nicht erst in der
      // Kasse: Wer erst nach der Wahl von Bezirk und Zahlungsart erfährt,
      // dass die Menge nicht reicht, hat drei Schritte umsonst gemacht.
      // Der Fehlbetrag steht in seiner eigenen Währung, dem Warenwert; was
      // die Grenze trägt — Palette, Anfahrt, Spanne — geht ihn nichts an.
      zeigeMindestwert(z, rechnung);

      rechnung.offen.forEach(function (o) { z.appendChild(el('p', 'antwort', o)); });

      // Die unangenehme Zahl zuerst. Wenn die Fracht die Ware übersteigt,
      // steht das auf der Seite und nicht erst auf der Rechnung — dieselbe
      // Haltung wie bei der Gebühr, die im Angebot gefehlt hat.
      if (rechnung.frachtNetto > rechnung.warenwertNetto) {
        var warnung = el('p', 'antwort');
        warnung.appendChild(el('strong', null, 'Die Fracht kostet hier mehr als die Ware. '));
        warnung.appendChild(document.createTextNode(
          'Bei ' + eur(rechnung.warenwertNetto) + ' Warenwert kommen ' + eur(rechnung.frachtNetto)
          + ' Fracht dazu. Das lohnt sich für Sie nicht — legen Sie zusammen, was ohnehin '
          + 'gebraucht wird, oder holen Sie die Kleinmenge im Fachhandel vor Ort. '
          + 'Wir sagen das lieber hier als auf der Rechnung.'));
        z.appendChild(warnung);
      }

      var hinweis = el('p', 'antwort');
      hinweis.appendChild(el('strong', null, 'Die Fracht fällt je Lieferung an, ohne Frei-Haus-Schwelle. '));
      hinweis.appendChild(document.createTextNode(
        // **Berichtigt am 01.09.** Hier stand: „Das steht auf jedem unserer
        // Lieferantenbelege, auch auf den großen." Diese Aussage ist am
        // 27. August zurückgenommen worden — Fracht steht auf drei von
        // fünfzehn Rechnungen, elf lauten „Abholung Kunde". Der Satz hat
        // sechs Tage länger überlebt als in den übrigen Texten, weil diese
        // Datei im Wurzelverzeichnis liegt und durch alle vier Bestände des
        // Widerrufsprüfers fiel. Ausgerechnet die Datei, die im Browser des
        // Kunden läuft.
        // **Quelle und Stand ergänzt am 2. September.** Die beiden Beträge
        // stammen aus den eigenen Lieferantenrechnungen; die Wissensseite
        // `warum-keine-gratislieferung` nennt beides seit jeher, dieser Satz
        // nicht — weil kein Inhaltsprüfer ihn las. Seit `pruefe-oberflaeche`
        // liest ihn einer.
        'Der zugestellte Beleg über 1.934 € netto trägt dieselbe Pauschale wie der über 614 € — '
        + 'die Fracht hängt an der Fahrt, nicht am Warenwert. '
        + 'Quelle: eigene Lieferantenrechnungen, Stand: 2026-08-31. '
        + 'Deshalb weisen wir sie getrennt aus, statt sie in die Preise zu rechnen.'));
      z.appendChild(hinweis);

      var weiter = el('a', 'knopf gross');
      weiter.href = pfad('kasse');
      weiter.textContent = 'Weiter zu Lieferadresse und Anfrage';
      z.appendChild(weiter);
    }

    function korbzeile(p, neu) {
      var zeile = el('div', 'korbzeile');
      if (D.bilder && D.bilder[p.sku]) {
        var b = el('span', 'kz-bild');
        b.innerHTML = D.bilder[p.sku];
        zeile.appendChild(b);
      }
      var mitte = el('span', 'kz-mitte');
      var link = el('a', 'kz-t', p.bezeichnung);
      link.href = pfad('artikel/' + p.sku);
      mitte.appendChild(link);
      var schritt = mengenschritt(p);
      // Was hinter der Zahl steckt: Bei Gebindeware sagt „5,25" allein nicht,
      // dass es sieben Platten sind. Der Kunde bestellt Platten, nicht
      // Quadratmeter — die Rechnung führt Quadratmeter.
      var zahlwerk = gebindezahl(p.menge, schritt);
      // **Berichtigt am 31.08.** Hier stand `p.einheit === 'KG' ? 'kg' : 'm²'`
      // — zweimal, drei Zeilen unter der Zeile, die dieselbe Auskunft bereits
      // aus `D.einheiten` nimmt. Solange nur Kilogramm und Quadratmeter einen
      // Gebindeschritt hatten, war die Fallunterscheidung vollständig. Mit den
      // laufenden Metern seit dem 30.08. behauptete der Korb „2 Einheiten zu
      // 2,55 m²" für eine Leiste, die in Metern verkauft wird.
      //
      // Zwei Wege zur selben Auskunft, und der kürzere gewinnt — hier sogar
      // drei Zeilen unter dem Kommentar, der genau das verbietet.
      var einheitText = D.einheiten[p.einheit] || p.einheit;
      mitte.appendChild(el('span', 'kz-e', eur(p.vkNetto) + ' je '
        + einheitText + ', netto'
        + (zahlwerk ? ' · ' + zahlwerk.stueck + ' Einheit' + (zahlwerk.stueck === 1 ? '' : 'en')
            + ' zu ' + String(schritt).replace('.', ',')
            + ' ' + einheitText : '')
        + (p.sperrgut ? ' · palettiert, Kranentladung je Hub' : '')));
      zeile.appendChild(mitte);

      // Der Gebindeschritt gilt auch hier. Ihn nur auf der Artikelseite zu
      // setzen hieße: Der Kunde legt ein Gebinde in den Korb und schreibt es
      // im Korb auf 7 kg herunter — dieselbe unlieferbare Menge, einen
      // Klick später. Die Regel steht in gebinde.js, nicht zweimal.
      var menge = document.createElement('input');
      menge.type = 'number';
      menge.min = String(schritt || 1);
      menge.max = '999';
      if (schritt) menge.step = String(schritt);
      menge.value = String(p.menge);
      menge.className = 'kz-menge';
      menge.setAttribute('aria-label', 'Menge ' + p.bezeichnung
        + (schritt ? ', ganze Einheiten zu ' + String(schritt).replace('.', ',') + ' ' + einheitText : ''));
      menge.addEventListener('change', function () {
        var m = parseFloat(String(menge.value).replace(',', '.'));
        if (!Number.isFinite(m) || m <= 0) m = schritt || 1;
        if (schritt) {
          // Auf die nächste ganze Einheit aufrunden — nicht ab. Wer 5 m²
          // eintippt und Platten zu 0,75 m² kauft, braucht sieben Platten;
          // ihm sechs zu geben wäre stillschweigend zu wenig.
          m = Math.ceil(Math.round((m / schritt) * 1e6) / 1e6) * schritt;
        } else {
          m = Math.ceil(m);
        }
        m = Math.round(m * 100) / 100;
        korb = setzeMenge(korb, p.sku, m);
        sichern();
        neu();
      });
      zeile.appendChild(menge);
      zeile.appendChild(el('span', 'kz-summe', eur(p.zeilensummeNetto)));

      var weg = el('button', 'kz-weg', 'entfernen');
      weg.type = 'button';
      weg.addEventListener('click', function () {
        korb = setzeMenge(korb, p.sku, 0);
        sichern();
        neu();
      });
      zeile.appendChild(weg);
      return zeile;
    }

    zeichne();
  }

  /* ---------------- Kasse ---------------- */

  /**
   * Der Hinweis zu Gate 25 — einmal geschrieben, an beiden Stellen gezeigt.
   * Zwei Fassungen desselben Satzes wären zwei Fassungen derselben Grenze.
   */
  function zeigeMindestwert(z, rechnung) {
    var mbw = rechnung.mindestbestellwert;
    if (!mbw || mbw.erfuellt) return false;
    var sperre = el('div', 'antwort mindestwert');
    sperre.appendChild(el('strong', null, 'Der Warenkorb ist noch zu klein. '));
    sperre.appendChild(document.createTextNode(mbw.grund));
    z.appendChild(sperre);
    return true;
  }

  function baueKasse() {
    var z = ziel('kasse-ziel');
    if (!z) return;
    if (!korb.length) {
      z.appendChild(el('p', 'lede', 'Der Warenkorb ist leer.'));
      return;
    }

    var rechnung;
    try {
      rechnung = kundenWarenkorb(korb, {
        artikel: D.artikel,
        lieferanten: D.lieferanten,
        mindestbestellwertNetto: D.mindestbestellwertNetto,
      });
    } catch (e) {
      z.appendChild(el('p', 'antwort', 'Der Warenkorb lässt sich nicht rechnen: ' + e.message));
      return;
    }

    var form = el('form', 'kasse');
    form.appendChild(el('h2', null, 'Wohin wird geliefert?'));

    var bezirkWahl = el('label', 'f');
    bezirkWahl.appendChild(el('span', 'f-b', 'Bezirk der Baustelle'));
    var sel = el('select');
    var leerOpt = el('option', null, 'bitte wählen');
    leerOpt.value = '';
    sel.appendChild(leerOpt);
    D.bezirke.forEach(function (b) {
      var o = el('option', null, b);
      o.value = b;
      sel.appendChild(o);
    });
    var andererOpt = el('option', null, 'ein anderer Bezirk');
    andererOpt.value = '__anderer__';
    sel.appendChild(andererOpt);
    bezirkWahl.appendChild(sel);
    form.appendChild(bezirkWahl);

    var gebietsantwort = el('p', 'gebiet');
    form.appendChild(gebietsantwort);

    form.appendChild(el('h2', null, 'Wie möchten Sie zahlen?'));
    var zahlliste = el('div', 'zahlwege');
    D.zahlwege.forEach(function (w, i) {
      var lab = el('label', 'zw');
      var r = document.createElement('input');
      r.type = 'radio';
      r.name = 'zahlweg';
      r.value = w.id;
      if (i === 0) r.checked = true;
      lab.appendChild(r);
      var t = el('span', 'zw-t');
      t.appendChild(el('strong', null, w.name));
      t.appendChild(el('span', 'zw-g', w.kunde));
      lab.appendChild(t);
      zahlliste.appendChild(lab);
    });
    form.appendChild(zahlliste);
    z.appendChild(form);

    var tafel = el('div', 'preistafel');
    [['Positionen', String(rechnung.positionen), rechnung.positionen === 1 ? 'im Warenkorb' : 'verschiedene Artikel'],
     ['Warenwert', eur(rechnung.warenwertNetto), 'netto'],
     ['Fracht', eur(rechnung.frachtNetto), frachtGrundText(rechnung)],
     ['Brutto gesamt', eur(rechnung.bruttoGesamt), 'inkl. ' + eur(rechnung.ustBetrag) + ' USt']
    ].forEach(function (r) {
      var d = el('div');
      d.appendChild(el('span', 'k', r[0]));
      d.appendChild(el('span', 'w', r[1]));
      d.appendChild(el('span', 'e', r[2]));
      tafel.appendChild(d);
    });
    z.appendChild(tafel);

    // Gate 25, ein zweites Mal — hier ist es die Sperre und nicht nur der
    // Hinweis: Unter der Grenze erzeugt `baueKundenanfrage` keinen Text mehr.
    zeigeMindestwert(z, rechnung);

    // Bis zum 29.08. begann dieser Kasten mit „Hier endet die Vorschau." und
    // zählte danach fest auf, was fehlt. Beides war zu ändern: Der Satz
    // kündigt ein Ende über dem einzigen Weg an, der weiterführt — und die
    // Aufzählung stand im Quelltext, nicht in den Daten. Sie hätte auch dann
    // noch „Impressum unvollständig" behauptet, wenn der Auftraggeber es
    // längst vervollständigt hat. Jetzt kommt sie aus derselben Rechnung wie
    // `npm run startklar`.
    //
    // **Berichtigt am 3. September.** Hier stand `'Es fehlt ' + fehlt.join()`
    // — Einzahl vor einer Aufzählung, die heute fünf Punkte trägt. Der Fuß und
    // die Startseite bilden denselben Satz und beugen ihn richtig; diese
    // dritte Stelle hatte die Liste, aber nicht die Regel. Sie bekommt den
    // Satz jetzt fertig aus `fehltSatz()`, damit es ihn nicht dreimal gibt.
    var stand = D.bestellung || { moeglich: false, fehlt: [], satz: '' };
    if (!stand.moeglich) {
      var abschluss = el('div', 'antwort');
      abschluss.appendChild(el('strong', null, 'Bestellen können Sie hier nicht. '));
      abschluss.appendChild(document.createTextNode(
        (stand.satz ? stand.satz.charAt(0).toUpperCase() + stand.satz.slice(1) + '. ' : '')
        + 'Diese Seite rechnet die Bestellung durch, sie löst keine aus. '
        + 'Mitnehmen können Sie die fertige Anfrage darunter.'));
      z.appendChild(abschluss);
    }

    // Der Weg, der auch ohne Zahlungsanbieter funktioniert: die fertige,
    // gerechnete Liste zum Kopieren. Sie erscheint erst, wenn ein Bezirk
    // gewählt ist — ohne Bezirk ist weder Gate 23 geprüft noch der Text
    // vollständig. Gesendet wird hier nichts; das entscheidet der Kunde in
    // seinem eigenen Programm.
    var anfrageKasten = el('div', 'kasse anfrage');
    z.appendChild(anfrageKasten);

    function zeichneAnfrage(wahl) {
      leere(anfrageKasten);
      anfrageKasten.appendChild(el('h2', null, 'Anfrage stellen'));
      if (!wahl) {
        anfrageKasten.appendChild(el('p', 'lede',
          'Wählen Sie oben den Bezirk der Baustelle — danach steht hier die '
          + 'fertige Liste zum Kopieren.'));
        return;
      }
      if (wahl === '__anderer__') {
        // Nicht die allgemeine Aufforderung: Wer „ein anderer Bezirk" gewählt
        // hat, hat gewählt. Ihm zu sagen, er solle wählen, sähe aus, als hätte
        // die Seite die Eingabe verloren. Hier steht der Grund.
        anfrageKasten.appendChild(el('p', 'gebiet nein',
          'Außerhalb des Liefergebiets — dorthin können wir keine Anfrage '
          + 'annehmen. Wir liefern nach ' + D.bezirke.join(', ') + '.'));
        return;
      }
      var a = baueKundenanfrage({
        rechnung: rechnung,
        bezirk: wahl,
        betreiber: D.betreiber || {},
        einheiten: D.einheiten || {},
      });
      if (!a.moeglich) {
        anfrageKasten.appendChild(el('p', 'gebiet nein', a.hindernis));
        return;
      }
      // **Berichtigt am 2. September.** Hier stand „wir melden uns mit Preis,
      // Verfügbarkeit und Termin zurück". Der Preis steht auf derselben Seite
      // und im Text darunter — ihn als offen anzukündigen nimmt der ganzen
      // Preistransparenz den Boden, mit der dieser Shop wirbt. Bestätigt wird
      // er, genannt ist er längst.
      //
      // Die Zeitangabe fehlt und wird nicht erfunden: `antwortzeitWerktage`
      // steht in den Betreiberdaten auf `null`, und `npm run startklar` führt
      // sie als offenen Punkt. Sobald sie entschieden ist, steht sie hier.
      var zeit = (D.betreiber || {}).antwortzeitWerktage;
      var rueckmeldung = typeof zeit === 'number' && zeit > 0
        ? ' — wir bestätigen Preis, Verfügbarkeit und Termin innerhalb von '
          + zeit + (zeit === 1 ? ' Werktag.' : ' Werktagen.')
        : ' — wir bestätigen Preis, Verfügbarkeit und Termin.';
      anfrageKasten.appendChild(el('p', 'lede',
        'Diese Liste ist eine Anfrage, keine Bestellung. Kopieren Sie sie in '
        + 'eine Mail' + rueckmeldung));

      var feld = document.createElement('textarea');
      feld.readOnly = true;
      feld.rows = 14;
      feld.className = 'anfragetext';
      feld.value = a.text;
      anfrageKasten.appendChild(feld);

      var reihe = el('div', 'anfrage-knoepfe');
      var kopieren = el('button', 'knopf', 'Text kopieren');
      kopieren.type = 'button';
      var rueckmeldung = el('span', 'anfrage-echo');
      kopieren.addEventListener('click', function () {
        // `select()` und `execCommand` sind der Weg, der ohne Berechtigung
        // und ohne sicheren Ursprung funktioniert. Die Zwischenablage-API
        // ist der bessere Weg, wo es sie gibt — und sie fehlt genau dort,
        // wo jemand die Datei lokal öffnet.
        var geschafft = false;
        try {
          feld.focus();
          feld.select();
          geschafft = document.execCommand('copy');
        } catch (e) { geschafft = false; }
        if (!geschafft && navigator.clipboard) {
          navigator.clipboard.writeText(a.text).then(function () {
            rueckmeldung.textContent = 'Kopiert.';
          }, function () {
            rueckmeldung.textContent = 'Kopieren ging nicht — der Text ist markiert, bitte mit Strg+C.';
          });
          return;
        }
        rueckmeldung.textContent = geschafft
          ? 'Kopiert.'
          : 'Kopieren ging nicht — der Text ist markiert, bitte mit Strg+C.';
      });
      reihe.appendChild(kopieren);

      var mail = mailtoAdresse(a);
      if (mail) {
        var link = document.createElement('a');
        link.className = 'knopf';
        link.href = mail;
        link.textContent = 'Als Mail öffnen';
        reihe.appendChild(link);
      }
      reihe.appendChild(rueckmeldung);
      anfrageKasten.appendChild(reihe);

      // Warum kein Mailknopf da ist, steht dabei. Ein fehlender Knopf ohne
      // Begründung sieht aus wie ein Fehler; mit Begründung ist er ein
      // offener Punkt, den jemand schließen kann.
      for (var i = 0; i < a.hinweise.length; i++) {
        anfrageKasten.appendChild(el('p', 'anfrage-hinweis', a.hinweise[i]));
      }
      if (!mail && a.empfaenger) {
        anfrageKasten.appendChild(el('p', 'anfrage-hinweis',
          'Für den Mailknopf ist die Liste zu lang — Mailprogramme kürzen sie '
          + 'stillschweigend. Bitte den Text kopieren.'));
      }
    }

    zeichneAnfrage('');

    function pruefe() {
      var wahl = sel.value;
      leere(gebietsantwort);
      if (!wahl) { gebietsantwort.className = 'gebiet'; return; }
      if (wahl === '__anderer__') {
        gebietsantwort.className = 'gebiet nein';
        gebietsantwort.textContent = 'Außerhalb des Liefergebiets. Wir liefern nach '
          + D.bezirke.join(', ') + '. Eine Bestellung können wir dorthin nicht annehmen — '
          + 'die Fracht trägt sie nicht.';
        return;
      }
      // Die Antwort kommt aus liefergebiet.js — dieselbe Funktion, die
      // Gate 23 im Rechenkern durchsetzt. Eine zweite Bezirksliste in der
      // Oberfläche wäre die sicherste Art, beide auseinanderlaufen zu lassen.
      var ergebnis = pruefeLieferort({ land: 'AT', bezirk: wahl });
      gebietsantwort.className = 'gebiet ' + (ergebnis.liefern ? 'ja' : 'nein');
      gebietsantwort.textContent = ergebnis.liefern
        ? 'Wir liefern nach ' + wahl + '.'
        : ergebnis.grund;
    }
    sel.addEventListener('change', function () { pruefe(); zeichneAnfrage(sel.value); });
  }

  /* ---------------- Start ---------------- */

  /**
   * Wird bei jedem Seitenwechsel neu aufgerufen.
   *
   * Die Einzeldateifassung tauscht bei einem Rautenwechsel das ganze
   * `innerHTML` aus — die Ereignisbehandler des vorigen Inhalts sind danach
   * weg. Eine Oberfläche, die sich nur einmal verdrahtet, funktioniert dort
   * genau auf der ersten Seite. Alle Bauer suchen ihre Anker selbst und tun
   * nichts, wenn keiner da ist; deshalb ist mehrfaches Aufrufen harmlos.
   */
  function start() {
    zeichneZaehler();
    baueSuchfeld();
    baueKorbknoepfe();
    baueRasterfilter();
    baueSuchseite();
    baueKorbseite();
    baueKasse();
  }

  window.__SHOP_START__ = start;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
}());
