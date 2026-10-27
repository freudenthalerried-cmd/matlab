<?php
// Weiterleitung zum Shop. Angemeldete Nutzer bekommen ihre Kennung als clickref mit,
// damit der Kauf über die Netzwerk-API ihrem Konto zugeordnet werden kann.
require __DIR__ . '/lib.php';
$shops = shops();
$shop = $shops[(string)($_GET['shop'] ?? '')] ?? null;
if (!$shop) {
    redirect('/');
}
// Deeplink nur auf die Domain des Shops zulassen.
$deeplink = (string)($_GET['url'] ?? '');
$host = strtolower((string)parse_url($deeplink, PHP_URL_HOST));
if ($deeplink === '' || !preg_match('#^https://#', $deeplink)
    || ($host !== $shop['domain'] && !str_ends_with($host, '.' . $shop['domain']))) {
    $deeplink = null;
}
$u = user();
if ($u || isset($_GET['ohne'])) {
    q('INSERT INTO clicks (user_id, shop_id, created) VALUES (?, ?, ?)', [$u['id'] ?? null, $shop['id'], time()]);
    redirect(awin_link($shop, $u ? 'u' . $u['ref'] : 'anon', $deeplink));
}
$self = '/go.php?' . http_build_query(['shop' => $shop['id'], 'url' => $deeplink]);
head($shop['name'] . ' mit Cashback');
?>
<section class="hero">
  <h1><?= h(cashback_prozent($shop)) ?> % Cashback bei <?= h($shop['name']) ?> sichern</h1>
  <p class="lead">Melde dich kostenlos an, bevor du zum Shop gehst. Nur so können wir deinen Einkauf deinem Konto zuordnen.</p>
  <p><a class="btn" href="/login.php?next=<?= h(urlencode($self)) ?>">Anmelden &amp; weiter</a>
     <a class="btn alt" href="/register.php?next=<?= h(urlencode($self)) ?>">Kostenlos registrieren</a></p>
  <p class="meta"><a href="<?= h($self . '&ohne=1') ?>" rel="nofollow">Ohne Cashback weiter zu <?= h($shop['name']) ?></a></p>
</section>
<?php foot();
