<?php
declare(strict_types=1);

const CFG_FILE = __DIR__ . '/config.php';
if (!is_file(CFG_FILE)) {
    http_response_code(503);
    exit('Konfiguration fehlt: config.sample.php als config.php anlegen.');
}
$CFG = require CFG_FILE;

if (PHP_SAPI !== 'cli') {
    session_set_cookie_params(['lifetime' => 0, 'path' => '/', 'secure' => !empty($_SERVER['HTTPS']),
                               'httponly' => true, 'samesite' => 'Lax']);
    session_start();
}

function cfg(string $k)
{
    global $CFG;
    return $CFG[$k] ?? null;
}

function db(): PDO
{
    static $pdo;
    return $pdo ??= new PDO(cfg('db_dsn'), cfg('db_user'), cfg('db_pass'), [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
}

function q(string $sql, array $p = []): PDOStatement
{
    $st = db()->prepare($sql);
    $st->execute($p);
    return $st;
}

function h(?string $s): string
{
    return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8');
}

function euro(int $cents): string
{
    return number_format($cents / 100, 2, ',', '.') . ' €';
}

function redirect(string $to): never
{
    header('Location: ' . $to);
    exit;
}

/** Nur relative Pfade derselben Seite erlauben (kein Open Redirect). */
function safe_next(?string $next): string
{
    return ($next && str_starts_with($next, '/') && !str_starts_with($next, '//') && !str_contains($next, '\\'))
        ? $next : '/konto.php';
}

function csrf_token(): string
{
    return $_SESSION['csrf'] ??= bin2hex(random_bytes(32));
}

function csrf_field(): string
{
    return '<input type="hidden" name="csrf" value="' . csrf_token() . '">';
}

function csrf_check(): void
{
    if (!hash_equals($_SESSION['csrf'] ?? '', (string)($_POST['csrf'] ?? ''))) {
        http_response_code(400);
        exit('Sitzung abgelaufen. Bitte Seite neu laden.');
    }
}

/** Einfache Bremse gegen Brute Force: max. $max Versuche je IP und Art in 15 Minuten. */
function throttle(string $art, int $max = 10): bool
{
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'cli';
    $since = time() - 900;
    q('DELETE FROM attempts WHERE created < ?', [$since]);
    $n = (int)q('SELECT COUNT(*) FROM attempts WHERE ip = ? AND art = ?', [$ip, $art])->fetchColumn();
    q('INSERT INTO attempts (ip, art, created) VALUES (?, ?, ?)', [$ip, $art, time()]);
    return $n >= $max;
}

function user(): ?array
{
    if (empty($_SESSION['uid'])) {
        return null;
    }
    static $u;
    return $u ??= (q('SELECT * FROM users WHERE id = ?', [$_SESSION['uid']])->fetch() ?: null);
}

function require_login(): array
{
    $u = user();
    if (!$u) {
        redirect('/login.php?next=' . urlencode($_SERVER['REQUEST_URI'] ?? '/konto.php'));
    }
    return $u;
}

function is_admin(?array $u): bool
{
    return $u && strcasecmp($u['email'], (string)cfg('admin_email')) === 0;
}

function send_mail(string $to, string $subject, string $body): void
{
    if ($log = cfg('mail_log')) {
        file_put_contents($log, "TO: $to\nSUBJECT: $subject\n$body\n---\n", FILE_APPEND);
        return;
    }
    $headers = 'From: ' . cfg('site_name') . ' <' . cfg('mail_from') . ">\r\nContent-Type: text/plain; charset=UTF-8";
    mail($to, '=?UTF-8?B?' . base64_encode($subject) . '?=', $body, $headers);
}

/** Aktive Shops aus shops.json, Schlüssel = Shop-ID. */
function shops(bool $nurAktiv = true): array
{
    $all = json_decode(file_get_contents(__DIR__ . '/shops.json'), true);
    $out = [];
    foreach ($all as $s) {
        if (!$nurAktiv || $s['aktiv']) {
            $out[$s['id']] = $s;
        }
    }
    return $out;
}

function cashback_prozent(array $shop): float
{
    return round($shop['provision_prozent'] * cfg('anteil'), 1);
}

function awin_link(array $shop, string $clickref, ?string $deeplink = null): string
{
    return 'https://www.awin1.com/cread.php?' . http_build_query([
        'awinmid' => $shop['advertiser_id'],
        'awinaffid' => cfg('awin_publisher_id'),
        'clickref' => $clickref,
        'ued' => $deeplink ?: $shop['url'],
    ]);
}

function saldo(int $uid): array
{
    $r = q("SELECT
        COALESCE(SUM(CASE WHEN status = 'bestaetigt' THEN cashback_cents END), 0) AS best,
        COALESCE(SUM(CASE WHEN status = 'vorgemerkt' THEN cashback_cents END), 0) AS vorg
        FROM transactions WHERE user_id = ?", [$uid])->fetch();
    $aus = (int)q("SELECT COALESCE(SUM(amount_cents), 0) FROM payouts WHERE user_id = ? AND status IN ('offen', 'bezahlt')",
                  [$uid])->fetchColumn();
    return ['verfuegbar' => (int)$r['best'] - $aus, 'vorgemerkt' => (int)$r['vorg'], 'ausgezahlt' => $aus];
}

function head(string $title, string $desc = ''): void
{
    $u = user();
    $name = h(cfg('site_name'));
    echo '<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8">'
        . '<meta name="viewport" content="width=device-width, initial-scale=1">'
        . '<title>' . h($title) . '</title><meta name="description" content="' . h($desc) . '">'
        . '<link rel="stylesheet" href="/style.css"></head><body>'
        . '<header class="top"><div class="wrap"><a class="logo" href="/">💸 ' . $name . '</a><nav>'
        . '<a href="/#shops">Shops</a><a href="/#rechner">Rechner</a>'
        . ($u ? '<a href="/konto.php">Mein Konto</a>' . (is_admin($u) ? '<a href="/admin.php">Admin</a>' : '')
              . '<a href="/logout.php">Abmelden</a>'
              : '<a href="/login.php">Anmelden</a><a href="/register.php">Registrieren</a>')
        . '</nav></div></header><main class="wrap">';
}

function foot(): void
{
    echo '</main><footer><div class="wrap"><p>Cashback-Links sind Partnerlinks: Wir erhalten vom Shop eine Provision und geben '
        . (int)(cfg('anteil') * 100) . ' % davon an dich weiter.</p><p><a href="/teilnahme.php">Teilnahmebedingungen</a> · '
        . '<a href="/impressum.php">Impressum</a> · <a href="/datenschutz.php">Datenschutz</a></p></div></footer></body></html>';
}

function msg(?string $text, string $type = 'ok'): string
{
    return $text ? '<p class="msg ' . $type . '">' . h($text) . '</p>' : '';
}
