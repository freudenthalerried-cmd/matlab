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
    var n = korbAnzahl(korb);
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

  function baueKorbknoepfe() {
    [].forEach.call(document.querySelectorAll('[data-legen]'), function (knopf) {
      knopf.addEventListener('click', function () {
        var sku = knopf.getAttribute('data-legen');
        var mengenfeld = document.getElementById(knopf.getAttribute('data-menge') || '');
        var menge = mengenfeld ? parseInt(mengenfeld.value, 10) : 1;
        if (!Number.isInteger(menge) || menge < 1) menge = 1;
        korb = legeInKorb(korb, sku, menge);
        sichern();
        knopf.textContent = menge + '× im Warenkorb';
        knopf.classList.add('getan');
        window.setTimeout(function () {
          knopf.textContent = 'In den Warenkorb';
          knopf.classList.remove('getan');
        }, 2200);
      });
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

  function karte(a) {
    var w = el('a', 'karte');
    w.href = pfad('artikel/' + a.sku);
    if (D.bilder && D.bilder[a.sku]) {
      var b = el('span', 'bild');
      b.innerHTML = D.bilder[a.sku];
      w.appendChild(b);
    }
    w.appendChild(el('span', 'nr', a.lieferantenArtikelnummer || ''));
    w.appendChild(el('span', 't', a.bezeichnung));
    var v = vorteil(a);
    if (v !== null && v >= 5) w.appendChild(el('span', 'marker vorteil', v + ' % unter Liste'));
    if (a.amListendeckel) w.appendChild(el('span', 'marker beipack', 'Beipack'));
    if (a.sperrgut) w.appendChild(el('span', 'marker sperrig', 'palettiert'));
    var p = el('span', 'preis', a.vkNetto === null ? 'Preis auf Anfrage' : eur(a.vkNetto));
    if (a.vkNetto !== null) {
      p.appendChild(el('span', 'eh', ' je ' + (D.einheiten[a.einheit] || a.einheit) + ', netto'));
    }
    w.appendChild(p);
    return w;
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
        rechnung = kundenWarenkorb(korb, { artikel: D.artikel, lieferanten: D.lieferanten });
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
       ['Fracht', eur(rechnung.frachtNetto), rechnung.teillieferungen[0].frachtGrund],
       ['Gewicht', String(rechnung.gewichtKg).replace('.', ',') + ' kg', gewichtText],
       ['Netto gesamt', eur(rechnung.nettoGesamt), 'zuzüglich 20 % USt'],
       ['Brutto', eur(rechnung.bruttoGesamt), 'inkl. ' + eur(rechnung.ustBetrag) + ' USt']
      ].forEach(function (r) {
        var d = el('div');
        d.appendChild(el('span', 'k', r[0]));
        d.appendChild(el('span', 'w', r[1]));
        d.appendChild(el('span', 'e', r[2]));
        tafel.appendChild(d);
      });
      z.appendChild(tafel);

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
        'Das steht auf jedem unserer Lieferantenbelege, auch auf den großen. '
        + 'Deshalb weisen wir sie getrennt aus, statt sie in die Preise zu rechnen.'));
      z.appendChild(hinweis);

      var weiter = el('a', 'knopf gross');
      weiter.href = pfad('kasse');
      weiter.textContent = 'Weiter zur Lieferadresse';
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
      mitte.appendChild(el('span', 'kz-e', eur(p.vkNetto) + ' je '
        + (D.einheiten[p.einheit] || p.einheit) + ', netto'
        + (p.sperrgut ? ' · palettiert, Kranentladung je Hub' : '')));
      zeile.appendChild(mitte);

      var menge = document.createElement('input');
      menge.type = 'number';
      menge.min = '1';
      menge.max = '999';
      menge.value = String(p.menge);
      menge.className = 'kz-menge';
      menge.setAttribute('aria-label', 'Menge ' + p.bezeichnung);
      menge.addEventListener('change', function () {
        var m = parseInt(menge.value, 10);
        if (!Number.isInteger(m) || m < 1) m = 1;
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

  function baueKasse() {
    var z = ziel('kasse-ziel');
    if (!z) return;
    if (!korb.length) {
      z.appendChild(el('p', 'lede', 'Der Warenkorb ist leer.'));
      return;
    }

    var rechnung;
    try {
      rechnung = kundenWarenkorb(korb, { artikel: D.artikel, lieferanten: D.lieferanten });
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
    [['Positionen', String(rechnung.positionen), rechnung.stueck + ' Stück'],
     ['Warenwert', eur(rechnung.warenwertNetto), 'netto'],
     ['Fracht', eur(rechnung.frachtNetto), rechnung.teillieferungen[0].frachtGrund],
     ['Brutto gesamt', eur(rechnung.bruttoGesamt), 'inkl. ' + eur(rechnung.ustBetrag) + ' USt']
    ].forEach(function (r) {
      var d = el('div');
      d.appendChild(el('span', 'k', r[0]));
      d.appendChild(el('span', 'w', r[1]));
      d.appendChild(el('span', 'e', r[2]));
      tafel.appendChild(d);
    });
    z.appendChild(tafel);

    var abschluss = el('div', 'antwort');
    abschluss.appendChild(el('strong', null, 'Hier endet die Vorschau. '));
    abschluss.appendChild(document.createTextNode(
      'Es kann nichts bestellt werden: Der Zahlungsanbieter ist nicht gewählt, '
      + 'und Impressum und Rechtstexte sind unvollständig. Diese Seite rechnet '
      + 'die Bestellung durch, sie löst keine aus.'));
    z.appendChild(abschluss);

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
    sel.addEventListener('change', pruefe);
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
