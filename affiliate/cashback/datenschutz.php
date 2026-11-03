<?php
require __DIR__ . '/lib.php';
$b = cfg('betreiber');
head('Datenschutz');
?>
<article class="post">
<h1>Datenschutzerklärung</h1>
<h2>Verantwortlicher</h2><p><?= h($b['name']) ?>, <?= h($b['adresse']) ?>, <?= h($b['email']) ?></p>
<h2>Kundenkonto</h2><p>Für das Cashback-Konto speichern wir E-Mail-Adresse, Passwort (nur als sicherer Hash), eine zufällige Kundenkennung, deine Klicks auf Shop-Links, die vom Partnernetzwerk gemeldeten Einkäufe (Shop, Betrag, Provision, Status, Datum) sowie deine Auszahlungsdaten (PayPal-Adresse oder IBAN). Rechtsgrundlage ist die Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO). Die Daten werden bis zur Löschung deines Kontos gespeichert; Auszahlungsbelege bewahren wir wegen steuerrechtlicher Pflichten 7 Jahre auf (Art. 6 Abs. 1 lit. c DSGVO).</p>
<h2>Partnernetzwerk (Awin)</h2><p>Beim Klick auf einen Cashback-Link wirst du über die Awin AG (Berlin) zum Shop weitergeleitet. Dabei übermitteln wir nur deine zufällige Kundenkennung, nicht deine E-Mail-Adresse. Awin und der Shop setzen Cookies, um den Einkauf zuzuordnen; Details in den Datenschutzhinweisen von Awin und des jeweiligen Shops. Awin meldet uns den Einkauf mit dieser Kennung zurück.</p>
<h2>Cookies</h2><p>Wir setzen nur ein technisch notwendiges Sitzungs-Cookie für die Anmeldung. Es gibt keine Analyse- oder Werbe-Tracker auf dieser Seite.</p>
<h2>E-Mails</h2><p>Wir senden dir nur E-Mails, die für dein Konto nötig sind (Bestätigung, Passwort, erfasste Einkäufe, Auszahlungen).</p>
<h2>Hosting</h2><p>ALL-INKL.COM – Neue Medien Münnich, Deutschland (Server-Logfiles, max. 7 Tage).</p>
<h2>Deine Rechte</h2><p>Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit und Widerspruch per E-Mail an <?= h($b['email']) ?>. Beschwerden an die Österreichische Datenschutzbehörde (dsb.gv.at).</p>
</article>
<?php foot();
