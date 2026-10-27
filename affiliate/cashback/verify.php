<?php
require __DIR__ . '/lib.php';
$t = (string)($_GET['t'] ?? '');
$u = $t ? q('SELECT id FROM users WHERE verify_hash = ?', [hash('sha256', $t)])->fetch() : null;
if (!$u) {
    head('Link ungültig');
    echo '<h1>Link ungültig</h1><p>Der Bestätigungslink ist ungültig oder wurde bereits verwendet. <a href="/login.php">Zur Anmeldung</a></p>';
    foot();
    exit;
}
q('UPDATE users SET verified = 1, verify_hash = NULL WHERE id = ?', [$u['id']]);
session_regenerate_id(true);
$_SESSION['uid'] = $u['id'];
redirect(safe_next($_GET['next'] ?? null));
