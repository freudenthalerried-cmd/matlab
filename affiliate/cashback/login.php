<?php
require __DIR__ . '/lib.php';
$err = null;
$next = safe_next($_GET['next'] ?? $_POST['next'] ?? null);
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    $email = strtolower(trim((string)($_POST['email'] ?? '')));
    $u = q('SELECT * FROM users WHERE email = ?', [$email])->fetch();
    if (throttle('login')) {
        $err = 'Zu viele Versuche. Bitte in 15 Minuten erneut probieren.';
    } elseif (!$u || !password_verify((string)($_POST['passwort'] ?? ''), $u['pass_hash'])) {
        $err = 'E-Mail oder Passwort falsch.';
    } elseif (!$u['verified']) {
        $err = 'Bitte bestätige zuerst deine E-Mail-Adresse (Link in deinem Postfach).';
    } else {
        session_regenerate_id(true);
        $_SESSION['uid'] = $u['id'];
        redirect($next);
    }
}
head('Anmelden');
?>
<h1>Anmelden</h1>
<?= msg($err, 'err') ?>
<form method="post" class="box form">
  <?= csrf_field() ?><input type="hidden" name="next" value="<?= h($next) ?>">
  <label>E-Mail<input type="email" name="email" required autocomplete="email"></label>
  <label>Passwort<input type="password" name="passwort" required autocomplete="current-password"></label>
  <button class="btn">Anmelden</button>
</form>
<p><a href="/passwort.php">Passwort vergessen?</a> · <a href="/register.php?next=<?= h(urlencode($next)) ?>">Neues Konto anlegen</a></p>
<?php foot();
