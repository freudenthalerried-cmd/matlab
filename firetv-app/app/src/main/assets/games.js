'use strict';
/* Paar-Spiele: everything runs in the #game overlay. Level 1 = romantisch, 2 = prickelnd, 3 = heiß.
   Higher levels also draw from the lower ones so the evening can build up. */
var Games = (function () {
  var LEVELS = ['Romantisch', 'Prickelnd', 'Heiß'];
  var PL = ['Spieler 1', 'Spieler 2'];

  var DICE = {
    act: [
      ['Küsse', 'Streichle', 'Massiere', 'Puste sanft auf', 'Kitzle zärtlich', 'Berühre mit den Fingerspitzen'],
      ['Küsse langsam', 'Knabbere zart an', 'Lecke sanft über', 'Streichle mit einem Eiswürfel', 'Massiere mit Öl', 'Berühre nur mit den Lippen'],
      ['Verwöhne mit der Zunge', 'Sauge zärtlich an', 'Beiße ganz sanft in', 'Küsse leidenschaftlich', 'Streichle mit warmem Atem', 'Verwöhne ohne Hände']
    ],
    part: [
      ['den Hals', 'das Ohrläppchen', 'den Nacken', 'die Hände', 'den Rücken', 'die Lippen'],
      ['den Bauch', 'die Innenseite der Oberschenkel', 'die Brust', 'den unteren Rücken', 'die Schultern', 'den Po'],
      ['eine Stelle deiner Wahl', 'die empfindlichste Stelle', 'die Brustwarzen', 'die Leiste', 'den Intimbereich', 'eine Stelle, die dein Partner wählt']
    ],
    how: ['10 Sekunden', '30 Sekunden', '1 Minute', 'mit verbundenen Augen', 'ganz langsam', 'bis dein Partner „Stopp“ sagt']
  };

  var TRUTH = [
    ['Was war dein erster Gedanke, als du mich gesehen hast?', 'Welcher Moment mit mir war der romantischste?', 'Was findest du an mir am anziehendsten?',
     'Wo würdest du mit mir gern ein Wochenende verbringen?', 'Welches Kleidungsstück von mir magst du am liebsten?', 'Wann hast du dich zuletzt nach mir gesehnt?',
     'Was war unser schönster Kuss?', 'Welche Berührung von mir genießt du am meisten?', 'Was wolltest du mir schon lange sagen?',
     'Welches Lied erinnert dich an uns?'],
    ['Wovon hast du zuletzt geträumt, in dem ich vorkam?', 'Welche Stelle an deinem Körper ist am empfindlichsten?', 'Was macht dich bei mir sofort an?',
     'Welches Outfit sollte ich öfter tragen?', 'Wo war der aufregendste Ort, an dem wir uns geküsst haben?', 'Was würdest du gern einmal mit mir ausprobieren?',
     'Was war dein heißester Gedanke heute?', 'Welche Fantasie hast du noch nie ausgesprochen?', 'Was magst du lieber: langsam oder wild?',
     'Welcher Film hat dich schon einmal richtig angemacht?'],
    ['Was ist deine geheimste Fantasie mit mir?', 'Welcher war unser bester gemeinsamer Moment im Bett – und warum?', 'Was soll ich heute Nacht unbedingt mit dir machen?',
     'An welchem ungewöhnlichen Ort würdest du gern mit mir schlafen?', 'Welche Stellung magst du am liebsten?', 'Was törnt dich am meisten an, wenn ich es sage?',
     'Was würdest du gern einmal mit mir filmen oder fotografieren?', 'Welches Spielzeug würdest du gern ausprobieren?', 'Wie würdest du mich am liebsten wecken?',
     'Was war das Frechste, das du je über mich gedacht hast?']
  ];
  var DARE = [
    ['Gib deinem Partner einen langen, langsamen Kuss.', 'Massiere deinem Partner 1 Minute die Schultern.', 'Flüstere deinem Partner drei Komplimente ins Ohr.',
     'Tanzt eng umschlungen zu einem Lied.', 'Küsse deinem Partner zärtlich den Hals.', 'Halte die Hand deines Partners und schaut euch 30 Sekunden in die Augen.',
     'Streichle deinem Partner durchs Haar, bis er/sie lächelt.', 'Gib deinem Partner 10 Küsse an 10 verschiedenen Stellen im Gesicht.'],
    ['Ziehe ein Kleidungsstück deiner Wahl aus.', 'Ziehe deinem Partner ein Kleidungsstück aus – nur mit den Zähnen.', 'Küsse deinen Partner vom Hals bis zum Bauchnabel.',
     'Massiere deinem Partner mit Öl den Rücken – 2 Minuten.', 'Verbinde deinem Partner die Augen und küsse ihn/sie an drei überraschenden Stellen.',
     'Mach deinem Partner einen kleinen Strip zu einem Lied seiner Wahl.', 'Setz dich auf den Schoß deines Partners und küsse ihn/sie 1 Minute.',
     'Beschreibe flüsternd, was du heute Nacht mit deinem Partner machen willst.'],
    ['Ziehe deinen Partner komplett aus – ganz langsam.', 'Verwöhne deinen Partner 2 Minuten nur mit dem Mund.', 'Dein Partner darf 3 Minuten lang bestimmen, was du tust.',
     'Fessle deinem Partner sanft die Hände und verwöhne ihn/sie nach Lust.', 'Zeig deinem Partner, wie du dich am liebsten berührst.',
     'Probiert die nächste Stellung aus dem Stellungs-Roulette aus.', 'Verwöhne deinen Partner mit einem Eiswürfel – überall, wo er/sie möchte.',
     'Küsse deinen Partner von den Füßen aufwärts, so weit er/sie es zulässt.']
  ];
  var CARDS = [
    [['Kuschelt euch eng aneinander und atmet gemeinsam ruhig.', 60], ['Massiere die Hände deines Partners.', 90], ['Küsst euch ohne Hände.', 45],
     ['Streichle den Rücken deines Partners mit den Fingerspitzen.', 60], ['Erzähle, was du an deinem Partner liebst – ohne Pause.', 45],
     ['Fußmassage für deinen Partner.', 120]],
    [['Küsse den Nacken deines Partners, er/sie darf sich nicht bewegen.', 60], ['Ölmassage am Rücken – bis zum Po.', 120],
     ['Ihr dürft euch nur mit den Lippen berühren.', 60], ['Streichle die Innenseite der Oberschenkel deines Partners.', 45],
     ['Beide ziehen ein Kleidungsstück aus und küssen sich.', 30], ['Verbinde die Augen deines Partners und verwöhne ihn/sie.', 90]],
    [['Verwöhne deinen Partner mit dem Mund – er/sie bestimmt das Tempo.', 120], ['Dein Partner liegt still, du darfst alles.', 120],
     ['Kein Höhepunkt erlaubt – necke deinen Partner bis zur Grenze.', 90], ['Nackt in Löffelchenstellung kuscheln und streicheln.', 120],
     ['Gegenseitiges Verwöhnen mit den Händen.', 120], ['Probiert eine neue Stellung aus.', 180]]
  ];
  var NEVER = [
    ['… jemanden beim ersten Date geküsst.', '… einen Liebesbrief geschrieben.', '… im Regen geküsst.', '… von meinem Partner geträumt.',
     '… beim Kuscheln eingeschlafen.', '… heimlich das Parfum/Shirt meines Partners gerochen.', '… ein Date komplett vergessen.'],
    ['… beim Sex lachen müssen.', '… nackt geschwommen.', '… sexy Fotos verschickt.', '… im Auto rumgemacht.', '… Dessous für jemanden gekauft.',
     '… im Kino rumgeknutscht.', '… an Sex gedacht, während jemand mit mir redete.'],
    ['… Sex an einem öffentlichen Ort gehabt.', '… ein Sexspielzeug benutzt.', '… beim Sex gefilmt oder fotografiert.', '… eine Fantasie mit mehreren Personen gehabt.',
     '… mich beim Sex fesseln lassen.', '… es dreimal in einer Nacht getan.', '… einen Porno mit dem Partner geschaut.']
  ];
  var POS = [
    ['Löffelchen', 'Beide liegen seitlich, eng aneinander – sehr nah und zärtlich.'],
    ['Missionar', 'Klassisch, viel Augenkontakt und Küsse.'],
    ['Reiterin / Reiter', 'Eine Person sitzt oben und bestimmt Tempo und Tiefe.'],
    ['Lotus', 'Im Sitzen eng umschlungen, gesichtszugewandt – sehr intim.'],
    ['Hündchen', 'Von hinten auf allen Vieren – intensiv.'],
    ['Umgekehrte Reiterin', 'Oben sitzend, mit dem Rücken zum Partner.'],
    ['Stehend', 'An eine Wand gelehnt – spontan und leidenschaftlich.'],
    ['Bauchlage', 'Eine Person liegt auf dem Bauch, die andere darüber.'],
    ['Schmetterling', 'Eine Person liegt an der Bettkante, die andere steht davor.'],
    ['Sitzend am Stuhl', 'Eine Person sitzt, die andere setzt sich auf den Schoß.'],
    ['69', 'Gegenseitiges Verwöhnen mit dem Mund.'],
    ['Freie Wahl', 'Ihr entscheidet – aber diesmal mit verbundenen Augen.']
  ];
  var MASSAGE = [
    ['Macht es euch bequem, dimmt das Licht. Dein Partner liegt auf dem Bauch.', 30],
    ['Wärme deine Hände und lege sie ruhig auf den Rücken deines Partners.', 30],
    ['Streiche mit flachen Händen langsam vom unteren Rücken zu den Schultern.', 60],
    ['Knete sanft die Schultern und den Nacken.', 90],
    ['Fahre mit den Fingerspitzen die Wirbelsäule entlang – hoch und runter.', 60],
    ['Massiere den unteren Rücken mit kreisenden Bewegungen.', 60],
    ['Streichle über Po und Oberschenkel bis zu den Kniekehlen.', 60],
    ['Massiere die Füße – jede Zehe einzeln.', 90],
    ['Dein Partner dreht sich um. Streichle Bauch, Brust und Arme.', 90],
    ['Beende die Massage mit Küssen, wo immer du möchtest.', 60],
    ['Tauscht die Rollen – jetzt bist du dran.', 0]
  ];

  var GAMES = [
    ['dice', 'Liebeswürfel'], ['tod', 'Wahrheit oder Pflicht'], ['cards', 'Heiße Karten'],
    ['never', 'Ich hab noch nie'], ['pos', 'Stellungs-Roulette'], ['massage', 'Massage-Reise']
  ];
  var HELP = {
    dice:'OK = würfeln', tod:'◀ = Wahrheit · ▶ = Pflicht · ▼ = überspringen', cards:'OK = neue Karte · ▶ = Timer start/stop · ▼ = überspringen',
    never:'OK = nächste Aussage · Wer es schon getan hat, legt ein Kleidungsstück ab', pos:'OK = drehen', massage:'OK = nächster Schritt · ▶ = Timer start/stop'
  };

  var g = null, level = 1, turn = 0, timer = null, left = 0, step = 0, used = {}, cardSec = 60;
  function $(id) { return document.getElementById(id); }
  function pool(src) { // all items up to the chosen level
    var out = [];
    for (var i = 0; i < level; i++) out = out.concat(src[i]);
    return out;
  }
  function pick(list, key) { // no repeats until the list is used up
    var u = used[key] || (used[key] = {});
    var all = list.map(function (x, i) { return i; });
    var free = all.filter(function (i) { return !u[i]; });
    if (!free.length) { used[key] = u = {}; free = all; }
    var i = free[Math.floor(Math.random() * free.length)];
    u[i] = 1;
    return list[i];
  }
  function beep() {
    try {
      var c = new (window.AudioContext || window.webkitAudioContext)(), o = c.createOscillator(), gn = c.createGain();
      o.frequency.value = 660; gn.gain.value = 0.15; o.connect(gn); gn.connect(c.destination);
      o.start(); o.stop(c.currentTime + 0.6);
    } catch (e) { }
  }
  function stopTimer() { clearInterval(timer); timer = null; }
  function startTimer(sec, done) {
    stopTimer(); left = sec; drawTimer();
    if (!sec) return;
    timer = setInterval(function () {
      left--; drawTimer();
      if (left <= 0) { stopTimer(); beep(); if (done) done(); }
    }, 1000);
  }
  function drawTimer() {
    var e = $('gtimer'); if (!e) return;
    e.textContent = left > 0 ? Math.floor(left / 60) + ':' + ('0' + left % 60).slice(-2) : '';
  }
  function show(who, title, body, sub) {
    $('gwho').textContent = who || '';
    $('gtitle').textContent = title || '';
    $('gbody').textContent = body || '';
    $('gsub').textContent = sub || '';
    var c = $('gcard'); c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop');
  }
  function player() { return PL[turn % 2]; }

  function next(k) {
    var who = player();
    if (g === 'dice') {
      if (k !== 'Enter') return;
      var a = pick(pool(DICE.act), 'a'), p = pick(pool(DICE.part), 'p'), h = pick(DICE.how, 'h');
      show(who + ' würfelt', a + ' ' + p, h, 'Nächster Wurf: ' + PL[(turn + 1) % 2]);
      turn++;
    } else if (g === 'tod') {
      if (k === 'ArrowLeft') { show(who + ' · Wahrheit', '', pick(pool(TRUTH), 't'), 'OK = weiter zu ' + PL[(turn + 1) % 2]); turn++; }
      else if (k === 'ArrowRight') { show(who + ' · Pflicht', '', pick(pool(DARE), 'd'), 'OK = weiter zu ' + PL[(turn + 1) % 2]); turn++; }
      else if (k === 'Enter' || k === 'ArrowDown') show(player() + ' ist dran', 'Wahrheit oder Pflicht?', '◀ Wahrheit      Pflicht ▶', '');
    } else if (g === 'cards') {
      if (k === 'ArrowRight') { if (timer) stopTimer(); else startTimer(left || cardSec); return; }
      if (k !== 'Enter' && k !== 'ArrowDown') return;
      var c = pick(pool(CARDS), 'c');
      show(who + ' ist dran', '', c[0], '▶ = Timer starten');
      stopTimer(); left = cardSec = c[1]; drawTimer(); turn++;
    } else if (g === 'never') {
      if (k !== 'Enter' && k !== 'ArrowDown') return;
      show('Ich hab noch nie …', '', pick(pool(NEVER), 'n'), 'Wer es schon getan hat: ein Kleidungsstück ablegen');
    } else if (g === 'pos') {
      if (k !== 'Enter') return;
      var s = pick(POS, 'pos');
      show('Stellungs-Roulette', s[0], s[1], 'OK = nochmal drehen');
    } else if (g === 'massage') {
      if (k === 'ArrowRight') { if (timer) stopTimer(); else startTimer(left || MASSAGE[Math.max(0, step - 1)][1]); return; }
      if (k !== 'Enter') return;
      if (step >= MASSAGE.length) step = 0;
      var m = MASSAGE[step++];
      show('Massage-Reise · Schritt ' + step + '/' + MASSAGE.length, '', m[0], step < MASSAGE.length ? 'Weiter geht es automatisch nach dem Timer' : 'Fertig');
      startTimer(m[1], function () { next('Enter'); });
    }
  }

  function open(id) {
    g = id; turn = 0; step = 0; used = {}; stopTimer(); left = 0;
    var name = GAMES.filter(function (x) { return x[0] === id; })[0][1];
    $('game').style.display = 'flex';
    $('ghead').textContent = name + ' · ' + LEVELS[level - 1];
    $('ghelp').textContent = HELP[id] + ' · Zurück = Ende';
    drawTimer();
    var intro = {dice:'Drückt OK zum Würfeln.', tod:'', cards:'Drückt OK für die erste Karte.', never:'Drückt OK für die erste Aussage.',
      pos:'Drückt OK zum Drehen.', massage:'Drückt OK, um zu beginnen.'}[id];
    if (id === 'tod') next('Enter');
    else show(player() + ' beginnt', name, intro, 'Alles freiwillig – jede Karte darf übersprungen werden.');
  }
  function close() { stopTimer(); g = null; $('game').style.display = 'none'; }

  return {
    GAMES:GAMES, LEVELS:LEVELS,
    level:function (l) { if (l) { level = l; save('glevel', l); } return level; },
    init:function () { level = load('glevel', 1); },
    open:open, close:close,
    active:function () { return !!g; },
    key:function (k) {
      if (k === 'ArrowDown' && (g === 'dice' || g === 'pos' || g === 'massage')) k = 'Enter'; // ▼ = skip / next
      next(k);
    }
  };
})();
