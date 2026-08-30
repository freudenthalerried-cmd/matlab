(function () {
  const STORAGE_KEY = 'freudenthaler-bau-protokolle';

  const form = document.getElementById('protokoll-form');
  const liste = document.getElementById('eintraege');
  const leerHinweis = document.getElementById('keine-eintraege');
  const printButton = document.getElementById('print-all');
  const datumFeld = document.getElementById('p-datum');

  function ladeEintraege() {
    try {
      const roh = localStorage.getItem(STORAGE_KEY);
      const daten = roh ? JSON.parse(roh) : [];
      return Array.isArray(daten) ? daten : [];
    } catch (e) {
      return [];
    }
  }

  function speichereEintraege(eintraege) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(eintraege));
    } catch (e) {
      /* Speicher nicht verfügbar (z. B. Privatmodus) – Anzeige funktioniert trotzdem */
    }
  }

  function formatiereDatum(isoDatum) {
    const [jahr, monat, tag] = isoDatum.split('-');
    if (!jahr || !monat || !tag) return isoDatum;
    return tag + '.' + monat + '.' + jahr;
  }

  function feld(dl, bezeichnung, wert) {
    if (!wert) return;
    const dt = document.createElement('dt');
    dt.textContent = bezeichnung;
    const dd = document.createElement('dd');
    dd.textContent = wert;
    dl.appendChild(dt);
    dl.appendChild(dd);
  }

  function rendereEintraege() {
    const eintraege = ladeEintraege();
    liste.textContent = '';
    leerHinweis.hidden = eintraege.length > 0;
    printButton.hidden = eintraege.length === 0;

    eintraege
      .slice()
      .sort(function (a, b) { return b.datum.localeCompare(a.datum) || b.id - a.id; })
      .forEach(function (eintrag) {
        const li = document.createElement('li');
        li.className = 'eintrag';

        const kopf = document.createElement('div');
        kopf.className = 'eintrag-kopf';

        const titel = document.createElement('span');
        titel.className = 'eintrag-titel';
        titel.textContent = eintrag.baustelle;

        const datum = document.createElement('span');
        datum.className = 'eintrag-datum';
        datum.textContent = formatiereDatum(eintrag.datum) + (eintrag.wetter ? ' · ' + eintrag.wetter : '');

        kopf.appendChild(titel);
        kopf.appendChild(datum);
        li.appendChild(kopf);

        const dl = document.createElement('dl');
        feld(dl, 'Anwesende', eintrag.anwesende);
        feld(dl, 'Ausgeführte Arbeiten', eintrag.arbeiten);
        feld(dl, 'Besondere Vorkommnisse / Mängel', eintrag.vorkommnisse);
        li.appendChild(dl);

        const aktionen = document.createElement('div');
        aktionen.className = 'eintrag-aktionen';

        const loeschen = document.createElement('button');
        loeschen.type = 'button';
        loeschen.className = 'btn btn-danger';
        loeschen.textContent = 'Löschen';
        loeschen.addEventListener('click', function () {
          if (!confirm('Dieses Protokoll wirklich löschen?')) return;
          speichereEintraege(ladeEintraege().filter(function (e) { return e.id !== eintrag.id; }));
          rendereEintraege();
        });

        aktionen.appendChild(loeschen);
        li.appendChild(aktionen);
        liste.appendChild(li);
      });
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    const eintrag = {
      id: Date.now(),
      datum: datumFeld.value,
      baustelle: document.getElementById('p-baustelle').value.trim(),
      wetter: document.getElementById('p-wetter').value,
      anwesende: document.getElementById('p-anwesende').value.trim(),
      arbeiten: document.getElementById('p-arbeiten').value.trim(),
      vorkommnisse: document.getElementById('p-vorkommnisse').value.trim()
    };

    if (!eintrag.datum || !eintrag.baustelle || !eintrag.arbeiten) return;

    const eintraege = ladeEintraege();
    eintraege.push(eintrag);
    speichereEintraege(eintraege);

    form.reset();
    datumFeld.value = heute();
    rendereEintraege();
  });

  printButton.addEventListener('click', function () {
    window.print();
  });

  function heute() {
    const jetzt = new Date();
    const monat = String(jetzt.getMonth() + 1).padStart(2, '0');
    const tag = String(jetzt.getDate()).padStart(2, '0');
    return jetzt.getFullYear() + '-' + monat + '-' + tag;
  }

  datumFeld.value = heute();
  rendereEintraege();
})();
