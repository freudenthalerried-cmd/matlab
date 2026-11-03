<?php
require __DIR__ . '/lib.php';
$anteil = (int)(cfg('anteil') * 100);
head('Teilnahmebedingungen');
?>
<article class="post">
<h1>Teilnahmebedingungen Cashback</h1>
<p>Stand: <?= date('m/Y') ?>. Betreiber: <?= h(cfg('betreiber')['name']) ?>, <?= h(cfg('betreiber')['adresse']) ?>.</p>
<h2>1. Leistung</h2><p>Für Einkäufe, die über unsere Cashback-Links bei teilnehmenden Shops getätigt werden, erhalten wir unter Umständen eine Provision. Wir schreiben dir freiwillig <?= $anteil ?> % der tatsächlich vom Shop bestätigten Provision als Cashback gut. Ein Rechtsanspruch auf Cashback besteht erst, wenn die Provision vom Shop bestätigt und an uns ausgezahlt wurde.</p>
<h2>2. Erfassung</h2><p>Das Cashback setzt voraus, dass du vor dem Einkauf angemeldet bist, den Shop über unseren Link aufrufst und den Einkauf ohne Unterbrechung abschließt. Werbeblocker, abgelehnte Cookies, fremde Gutscheincodes oder App-Käufe können die Erfassung verhindern. Für technische Fehler der Shops oder Netzwerke haften wir nicht. Fehlende Einkäufe kannst du innerhalb von 30 Tagen mit Bestellnachweis melden; wir fragen dann beim Netzwerk nach.</p>
<h2>3. Status</h2><p>„Vorgemerkt“: Einkauf wurde erfasst, aber noch nicht bestätigt. „Bestätigt“: Shop hat die Provision freigegeben, das Cashback ist auszahlbar. „Storniert“: Rückgabe, Stornierung oder Ablehnung durch den Shop – es entsteht kein Cashback. Wird eine bereits bestätigte Provision nachträglich storniert, wird das Cashback mit künftigem Guthaben verrechnet.</p>
<h2>4. Auszahlung</h2><p>Auszahlung ab <?= euro(cfg('min_auszahlung')) ?> bestätigtem Guthaben per PayPal oder SEPA-Überweisung, in der Regel innerhalb von 7 Tagen. Für die Richtigkeit der angegebenen Kontodaten bist du verantwortlich.</p>
<h2>5. Missbrauch</h2><p>Mehrfachkonten, Eigenkäufe mit anschließender Rückgabe, Manipulation von Links oder sonstiger Missbrauch führen zur Sperre des Kontos und zum Verfall des Guthabens.</p>
<h2>6. Kündigung</h2><p>Du kannst dein Konto jederzeit per E-Mail an <?= h(cfg('betreiber')['email']) ?> löschen lassen; bestätigtes Guthaben ab der Mindestauszahlung wird vorher ausgezahlt. Wir können das Programm mit 30 Tagen Frist beenden; bestätigtes Guthaben wird dann ohne Mindestbetrag ausgezahlt.</p>
<h2>7. Recht</h2><p>Es gilt österreichisches Recht unter Ausschluss der Verweisungsnormen. Zwingende Verbraucherschutzbestimmungen bleiben unberührt.</p>
</article>
<?php foot();
