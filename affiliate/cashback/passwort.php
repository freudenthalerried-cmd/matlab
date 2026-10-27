<?php
require __DIR__ . '/lib.php';
$t = (string)($_GET['t'] ?? $_POST['t'] ?? '');
$info = $err = null;
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    if ($t === '') {
        $email = strtolower(trim((string)($_POST['email'] ?? '')));
        if (!throttle('reset', 5) && ($u = q('SELECT id FROM users WHERE email = ?', [$email])->fetch())) {
            $token = bin2hex(random_bytes(32));
            q('UPDATE users SET reset_hash = ?, reset_expires = ? WHERE id = ?', [hash('sha256', $token), time() + 3600, $u['id']]);
            send_mail($email, 'Passwort zurücksetzen',
                "Hier kannst du ein neues Passwort setzen (1 Stunde gültig):\n" . cfg('site_url') . '/passwort.php?t=' . $token);
        }
        $info = 'Falls ein Konto mit dieser Adresse existiert, haben wir dir einen Link geschickt.';
    } else {
        $u = q('SELECT id FROM users WHERE reset_hash = ? AND reset_expires > ?', [hash('sha256', $t), time()])->fetch();
        $pw = (string)($_POST['passwort'] ?? '');
        if (!$u) {
            $err = 'Der Link ist abgelaufen. Bitte neu anfordern.';
            $t = '';
        } elseif (strlen($pw) < 10) {
            $err = 'Das Passwort muss mindestens 10 Zeichen haben.';
        } else {
            // Wer den Mail-Link nutzt, hat die Adresse damit auch bestätigt.
            q('UPDATE users SET pass_hash = ?, reset_hash = NULL, reset_expires = NULL, verified = 1 WHERE id = ?',
              [password_hash($pw, PASSWORD_DEFAULT), $u['id']]);
            redirect('/login.php');
        }
    }
}
head('Passwort zurücksetzen');
echo '<h1>Passwort zurücksetzen</h1>' . msg($info) . msg($err, 'err');
?>
<form method="post" class="box form">
  <?= csrf_field() ?>
  <?php if ($t === ''): ?>
    <label>E-Mail<input type="email" name="email" required></label>
    <button class="btn">Link anfordern</button>
  <?php else: ?>
    <input type="hidden" name="t" value="<?= h($t) ?>">
    <label>Neues Passwort (mind. 10 Zeichen)<input type="password" name="passwort" required minlength="10" autocomplete="new-password"></label>
    <button class="btn">Passwort speichern</button>
  <?php endif ?>
</form>
<?php foot();
