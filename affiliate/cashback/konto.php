<?php
require __DIR__ . '/lib.php';
$u = require_login();
$info = $err = null;
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    $methode = $_POST['methode'] ?? '';
    $ziel = trim((string)($_POST['ziel'] ?? ''));
    $iban = strtoupper(preg_replace('/\s+/', '', $ziel));
    if (!in_array($methode, ['paypal', 'iban'], true)) {
        $err = 'Bitte eine Auszahlungsart wählen.';
    } elseif ($methode === 'paypal' && !filter_var($ziel, FILTER_VALIDATE_EMAIL)) {
        $err = 'Bitte eine gültige PayPal-E-Mail-Adresse angeben.';
    } elseif ($methode === 'iban' && !preg_match('/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/', $iban)) {
        $err = 'Bitte eine gültige IBAN angeben.';
    } else {
        db()->beginTransaction();
        $s = saldo((int)$u['id']);
        if ($s['verfuegbar'] < cfg('min_auszahlung')) {
            db()->rollBack();
            $err = 'Die Mindestauszahlung beträgt ' . euro(cfg('min_auszahlung')) . '.';
        } else {
            q('INSERT INTO payouts (user_id, amount_cents, methode, ziel, created) VALUES (?, ?, ?, ?, ?)',
              [$u['id'], $s['verfuegbar'], $methode, $methode === 'iban' ? $iban : $ziel, time()]);
            db()->commit();
            send_mail(cfg('admin_email'), 'Neue Cashback-Auszahlung: ' . euro($s['verfuegbar']),
                "Neue Auszahlungsanfrage von {$u['email']} über " . euro($s['verfuegbar']) . "\n" . cfg('site_url') . '/admin.php');
            $info = 'Auszahlung über ' . euro($s['verfuegbar']) . ' beantragt. Sie wird in der Regel innerhalb von 7 Tagen überwiesen.';
        }
    }
}
$s = saldo((int)$u['id']);
$tx = q('SELECT * FROM transactions WHERE user_id = ? ORDER BY tx_date DESC LIMIT 50', [$u['id']])->fetchAll();
$po = q('SELECT * FROM payouts WHERE user_id = ? ORDER BY created DESC LIMIT 20', [$u['id']])->fetchAll();
$label = ['vorgemerkt' => 'vorgemerkt', 'bestaetigt' => 'bestätigt', 'storniert' => 'storniert',
          'offen' => 'in Bearbeitung', 'bezahlt' => 'ausgezahlt', 'abgelehnt' => 'abgelehnt'];
head('Mein Cashback-Konto');
?>
<h1>Mein Cashback-Konto</h1>
<?= msg($info) . msg($err, 'err') ?>
<div class="calc-out">
  <div>Verfügbar<b><?= euro($s['verfuegbar']) ?></b></div>
  <div>Vorgemerkt<b><?= euro($s['vorgemerkt']) ?></b></div>
  <div>Bisher ausgezahlt<b><?= euro($s['ausgezahlt']) ?></b></div>
</div>
<p class="hint">Vorgemerktes Cashback wird verfügbar, sobald der Shop den Kauf bestätigt (meist nach Ablauf der Rückgabefrist, 30–90 Tage).</p>

<?php if ($s['verfuegbar'] >= cfg('min_auszahlung')): ?>
<h2>Auszahlung beantragen</h2>
<form method="post" class="box form">
  <?= csrf_field() ?>
  <label>Auszahlung per
    <select name="methode"><option value="paypal">PayPal</option><option value="iban">Banküberweisung (IBAN)</option></select></label>
  <label>PayPal-E-Mail oder IBAN<input name="ziel" required maxlength="190"></label>
  <button class="btn">Jetzt <?= euro($s['verfuegbar']) ?> auszahlen</button>
</form>
<?php else: ?>
<p>Auszahlung ab <?= euro(cfg('min_auszahlung')) ?> verfügbarem Guthaben möglich.</p>
<?php endif ?>

<h2>Meine Einkäufe</h2>
<?php if (!$tx): ?>
<p>Noch keine Einkäufe. Einkäufe erscheinen meist innerhalb von 24–48 Stunden. <a href="/#shops">Zu den Shops</a></p>
<?php else: ?>
<div class="tablewrap"><table><thead><tr><th>Datum</th><th>Shop</th><th>Einkauf</th><th>Cashback</th><th>Status</th></tr></thead><tbody>
<?php foreach ($tx as $t): ?>
<tr><td><?= date('d.m.Y', (int)$t['tx_date']) ?></td><td><?= h($t['advertiser']) ?></td><td><?= euro((int)$t['sale_cents']) ?></td>
<td><?= euro((int)$t['cashback_cents']) ?></td><td><?= h($label[$t['status']] ?? $t['status']) ?></td></tr>
<?php endforeach ?>
</tbody></table></div>
<?php endif ?>

<?php if ($po): ?>
<h2>Auszahlungen</h2>
<ul><?php foreach ($po as $p): ?><li><?= date('d.m.Y', (int)$p['created']) ?>: <?= euro((int)$p['amount_cents']) ?> – <?= h($label[$p['status']]) ?></li><?php endforeach ?></ul>
<?php endif ?>
<p class="hint">Einkauf fehlt? Schreib uns innerhalb von 30 Tagen mit Bestellnummer an <?= h(cfg('betreiber')['email']) ?>.</p>
<?php foot();
