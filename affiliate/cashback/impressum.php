<?php
require __DIR__ . '/lib.php';
$b = cfg('betreiber');
head('Impressum');
?>
<h1>Impressum</h1>
<p>Informationen gemäß § 5 ECG und Offenlegung gemäß § 25 MedienG</p>
<p><strong><?= h($b['name']) ?></strong><br><?= h($b['adresse']) ?><br>E-Mail: <?= h($b['email']) ?></p>
<p><strong>Blattlinie:</strong> Cashback-Programm und unabhängige Kaufberatung für Technik, Haus, Garten und Energie.</p>
<p>Verbraucher können Beschwerden an die Online-Streitbeilegungsplattform der EU richten.</p>
<?php foot();
