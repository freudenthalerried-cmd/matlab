<?php
require __DIR__ . '/lib.php';
$u = require_login();
if (!is_admin($u)) {
    http_response_code(403);
    exit('Kein Zugriff.');
}
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    $status = $_POST['status'] ?? '';
    $p = q("SELECT p.*, u.email FROM payouts p JOIN users u ON u.id = p.user_id WHERE p.id = ? AND p.status = 'offen'",
           [(int)($_POST['id'] ?? 0)])->fetch();
    if ($p && in_array($status, ['bezahlt', 'abgelehnt'], true)) {
        q('UPDATE payouts SET status = ?, done = ? WHERE id = ?', [$status, time(), $p['id']]);
        send_mail($p['email'], $status === 'bezahlt' ? 'Dein Cashback wurde ausgezahlt' : 'Deine Auszahlung konnte nicht durchgeführt werden',
            $status === 'bezahlt'
                ? euro((int)$p['amount_cents']) . " wurden an {$p['ziel']} überwiesen. Danke, dass du über uns einkaufst!"
                : "Die Auszahlung über " . euro((int)$p['amount_cents']) . " war nicht möglich (z. B. ungültige Kontodaten). Das Guthaben ist wieder in deinem Konto.");
    }
    redirect('/admin.php');
}
$open = q("SELECT p.*, u.email FROM payouts p JOIN users u ON u.id = p.user_id WHERE p.status = 'offen' ORDER BY p.created")->fetchAll();
$stat = q("SELECT
    (SELECT COUNT(*) FROM users WHERE verified = 1) AS nutzer,
    (SELECT COUNT(*) FROM clicks WHERE created > ?) AS klicks30,
    (SELECT COALESCE(SUM(commission_cents), 0) FROM transactions WHERE status = 'bestaetigt') AS provision,
    (SELECT COALESCE(SUM(cashback_cents), 0) FROM transactions WHERE status = 'bestaetigt') AS cashback,
    (SELECT COALESCE(SUM(commission_cents), 0) FROM transactions WHERE status = 'vorgemerkt') AS offen", [time() - 30 * 86400])->fetch();
head('Admin');
?>
<h1>Admin</h1>
<div class="calc-out">
  <div>Aktive Nutzer<b><?= (int)$stat['nutzer'] ?></b></div>
  <div>Klicks (30 Tage)<b><?= (int)$stat['klicks30'] ?></b></div>
  <div>Provision bestätigt<b><?= euro((int)$stat['provision']) ?></b></div>
  <div>davon Cashback an Nutzer<b><?= euro((int)$stat['cashback']) ?></b></div>
  <div>Provision vorgemerkt<b><?= euro((int)$stat['offen']) ?></b></div>
</div>
<h2>Offene Auszahlungen</h2>
<?php if (!$open): ?><p>Keine offenen Auszahlungen.</p><?php endif ?>
<?php foreach ($open as $p): ?>
<form method="post" class="box">
  <?= csrf_field() ?><input type="hidden" name="id" value="<?= (int)$p['id'] ?>">
  <p><strong><?= euro((int)$p['amount_cents']) ?></strong> an <?= h($p['email']) ?> per <?= h($p['methode']) ?>:
     <code><?= h($p['ziel']) ?></code> (<?= date('d.m.Y', (int)$p['created']) ?>)</p>
  <button class="btn" name="status" value="bezahlt">Als bezahlt markieren</button>
  <button class="btn alt" name="status" value="abgelehnt">Ablehnen</button>
</form>
<?php endforeach ?>
<?php foot();
