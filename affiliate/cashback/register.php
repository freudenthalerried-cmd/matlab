<?php
require __DIR__ . '/lib.php';
$err = null;
$next = safe_next($_GET['next'] ?? $_POST['next'] ?? null);
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    $email = strtolower(trim((string)($_POST['email'] ?? '')));
    $pw = (string)($_POST['passwort'] ?? '');
    if (throttle('register', 5)) {
        $err = 'Zu viele Versuche. Bitte in 15 Minuten erneut probieren.';
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $err = 'Bitte eine gültige E-Mail-Adresse eingeben.';
    } elseif (strlen($pw) < 10) {
        $err = 'Das Passwort muss mindestens 10 Zeichen haben.';
    } elseif (empty($_POST['agb'])) {
        $err = 'Bitte die Teilnahmebedingungen akzeptieren.';
    } else {
        $token = bin2hex(random_bytes(32));
        $exists = q('SELECT id FROM users WHERE email = ?', [$email])->fetchColumn();
        if (!$exists) {
            q('INSERT INTO users (email, pass_hash, ref, verify_hash, created) VALUES (?, ?, ?, ?, ?)',
              [$email, password_hash($pw, PASSWORD_DEFAULT), bin2hex(random_bytes(6)), hash('sha256', $token), time()]);
            send_mail($email, 'Bitte bestätige deine E-Mail-Adresse',
                "Hallo!\n\nBitte bestätige dein Cashback-Konto:\n" . cfg('site_url') . '/verify.php?t=' . $token
                . '&next=' . urlencode($next) . "\n\nWenn du dich nicht registriert hast, ignoriere diese E-Mail.");
        }
        // Gleiche Antwort, ob Konto existiert oder nicht (keine Konten-Ausspähung).
        head('Fast geschafft');
        echo '<h1>Fast geschafft!</h1><p>Wir haben dir eine E-Mail mit einem Bestätigungslink geschickt. '
           . 'Bitte klicke darauf, um dein Konto zu aktivieren.</p>';
        foot();
        exit;
    }
}
head('Kostenlos registrieren – Cashback sichern', 'Kostenloses Cashback-Konto anlegen.');
?>
<h1>Kostenloses Cashback-Konto</h1>
<?= msg($err, 'err') ?>
<form method="post" class="box form">
  <?= csrf_field() ?><input type="hidden" name="next" value="<?= h($next) ?>">
  <label>E-Mail<input type="email" name="email" required autocomplete="email" value="<?= h($_POST['email'] ?? '') ?>"></label>
  <label>Passwort (mind. 10 Zeichen)<input type="password" name="passwort" required minlength="10" autocomplete="new-password"></label>
  <label class="check"><input type="checkbox" name="agb" value="1" required> Ich akzeptiere die <a href="<?= url('/teilnahme.php') ?>" target="_blank">Teilnahmebedingungen</a> und habe die <a href="<?= url('/datenschutz.php') ?>" target="_blank">Datenschutzerklärung</a> gelesen.</label>
  <button class="btn">Konto anlegen</button>
</form>
<p>Schon registriert? <a href="<?= url('/login.php?next=') ?><?= h(urlencode($next)) ?>">Anmelden</a></p>
<?php foot();
