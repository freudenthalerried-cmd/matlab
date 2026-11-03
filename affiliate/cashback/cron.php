<?php
// Täglicher Abgleich der Transaktionen mit Awin.
// All-Inkl KAS → Tools → Cronjobs: URL https://<domain>/cron.php?key=<cron_key>, täglich.
require __DIR__ . '/lib.php';
if (PHP_SAPI !== 'cli' && !hash_equals((string)cfg('cron_key'), (string)($_GET['key'] ?? ''))) {
    http_response_code(403);
    exit('Kein Zugriff.');
}
header('Content-Type: text/plain; charset=UTF-8');

$tz = new DateTimeZone('Europe/Vienna');
$end = new DateTime('now', $tz);
$start = (clone $end)->modify('-30 days');  // Awin erlaubt max. 31 Tage pro Abfrage
$url = cfg('awin_api_base') . '/publishers/' . rawurlencode((string)cfg('awin_publisher_id')) . '/transactions/?'
     . http_build_query(['startDate' => $start->format('Y-m-d\TH:i:s'), 'endDate' => $end->format('Y-m-d\TH:i:s'),
                         'timezone' => 'Europe/Berlin', 'dateType' => 'transaction']);
$ch = curl_init($url);
curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 60,
                        CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . cfg('awin_token')]]);
$body = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
if ($code !== 200 || !is_array($list = json_decode((string)$body, true))) {
    http_response_code(502);
    exit("Awin-API Fehler (HTTP $code)\n");
}

$map = ['pending' => 'vorgemerkt', 'approved' => 'bestaetigt', 'declined' => 'storniert', 'deleted' => 'storniert'];
$neu = $upd = 0;
foreach ($list as $t) {
    $ref = (string)($t['clickRefs']['clickRef'] ?? '');
    if (!preg_match('/^u([0-9a-f]{12})$/', $ref, $m) || ($t['commissionAmount']['currency'] ?? 'EUR') !== 'EUR') {
        continue;
    }
    $uid = q('SELECT id FROM users WHERE ref = ?', [$m[1]])->fetchColumn();
    if (!$uid) {
        continue;
    }
    $status = $map[$t['commissionStatus'] ?? ''] ?? 'vorgemerkt';
    $commission = (int)round(($t['commissionAmount']['amount'] ?? 0) * 100);
    $cashback = $status === 'storniert' ? 0 : (int)floor($commission * cfg('anteil'));
    $row = q("SELECT id, status FROM transactions WHERE network = 'awin' AND network_id = ?", [(string)$t['id']])->fetch();
    if ($row) {
        if ($row['status'] !== $status) {
            q('UPDATE transactions SET status = ?, commission_cents = ?, cashback_cents = ?, updated = ? WHERE id = ?',
              [$status, $commission, $cashback, time(), $row['id']]);
            $upd++;
        }
        continue;
    }
    $shopName = (string)($t['advertiserName'] ?? ('Shop ' . ($t['advertiserId'] ?? '')));
    q('INSERT INTO transactions (network, network_id, user_id, advertiser, sale_cents, commission_cents, cashback_cents, status, tx_date, updated)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      ['awin', (string)$t['id'], $uid, $shopName, (int)round(($t['saleAmount']['amount'] ?? 0) * 100), $commission, $cashback,
       $status, strtotime((string)($t['transactionDate'] ?? 'now')) ?: time(), time()]);
    $neu++;
    $email = q('SELECT email FROM users WHERE id = ?', [$uid])->fetchColumn();
    send_mail($email, 'Dein Einkauf wurde erfasst: ' . euro($cashback) . ' Cashback',
        "Dein Einkauf bei $shopName wurde erfasst. " . euro($cashback) . " Cashback sind vorgemerkt und werden nach Bestätigung durch den Shop verfügbar.\n"
        . cfg('site_url') . '/konto.php');
}
echo "OK: $neu neu, $upd aktualisiert, " . count($list) . " Transaktionen geprüft\n";
