<?php
require __DIR__ . '/lib.php';
$shops = shops();
$anteil = (int)(cfg('anteil') * 100);
head(cfg('site_name') . ': Geld zurück bei Technik, Garten & Energie',
     'Kostenloses Cashback bei ausgewählten Herstellern – mit unabhängigen Vergleichen und Rechnern.');
?>
<section class="hero">
  <h1>Geld zurück bei jedem Einkauf – plus ehrliche Kaufberatung</h1>
  <p class="lead">Wir geben <?= $anteil ?> % unserer Provision als Cashback an dich weiter. Dazu bekommst du unabhängige Vergleiche, Rechner und Checklisten, damit du das richtige Produkt kaufst – nicht nur das günstigste.</p>
  <div class="answer"><strong>So funktioniert's:</strong> 1. Kostenlos registrieren · 2. Über unseren Link zum Shop · 3. Normal einkaufen · 4. Cashback wird automatisch gutgeschrieben und ab <?= euro(cfg('min_auszahlung')) ?> per PayPal oder Überweisung ausgezahlt.</div>
</section>

<section id="shops"><h2>Cashback-Shops</h2>
<?php if (!$shops): ?>
  <p>Die ersten Shops werden gerade freigeschaltet. Registriere dich jetzt, wir informieren dich per E-Mail.</p>
<?php endif ?>
<div class="cards">
<?php foreach ($shops as $s): ?>
  <article class="card">
    <h3><?= h($s['name']) ?><span class="badge"><?= h(cashback_prozent($s)) ?> % Cashback</span></h3>
    <p class="fuer"><?= h($s['kategorie']) ?></p>
    <p><strong>Spartipp:</strong> <?= h($s['spartipp']) ?></p>
    <?php if ($s['vergleich']): ?><p><a href="<?= h($s['vergleich']) ?>">Unabhängigen Vergleich ansehen →</a></p><?php endif ?>
    <a class="btn" href="/go.php?shop=<?= h(urlencode($s['id'])) ?>" rel="nofollow">Zum Shop mit Cashback</a>
  </article>
<?php endforeach ?>
</div></section>

<section id="rechner" class="calc"><h2>Cashback-Rechner</h2><p>Wie viel bekommst du zurück?</p>
<form class="calc-form" data-calc='<?= h(json_encode(["inputs" => [
    ["id" => "preis", "label" => "Kaufpreis", "wert" => 1000, "einheit" => "€"],
    ["id" => "rate", "label" => "Cashback des Shops", "wert" => 4, "einheit" => "%"]],
  "outputs" => [["label" => "Dein Cashback", "formel" => "preis * rate / 100", "einheit" => "€", "stellen" => 2],
                ["label" => "Effektiver Preis", "formel" => "preis - preis * rate / 100", "einheit" => "€", "stellen" => 2]]],
  JSON_UNESCAPED_UNICODE)) ?>'>
  <label>Kaufpreis<span><input type="number" id="preis" value="1000" inputmode="decimal"><em>€</em></span></label>
  <label>Cashback des Shops<span><input type="number" id="rate" value="4" step="0.1" inputmode="decimal"><em>%</em></span></label>
</form><div class="calc-out" aria-live="polite"></div></section>

<section id="faq"><h2>Häufige Fragen</h2>
<details><summary>Ist das wirklich kostenlos?</summary><p>Ja. Der Shop zahlt uns eine Provision für die Vermittlung, davon geben wir <?= $anteil ?> % an dich weiter. Du zahlst keinen Cent mehr.</p></details>
<details><summary>Wann bekomme ich mein Cashback?</summary><p>Der Einkauf erscheint meist nach 24–48 Stunden als „vorgemerkt“. Sobald der Shop ihn bestätigt (nach Ablauf der Rückgabefrist, oft 30–90 Tage), wird er verfügbar.</p></details>
<details><summary>Warum wurde mein Einkauf nicht erfasst?</summary><p>Häufige Ursachen: Werbeblocker, abgelehnte Cookies im Shop, ein Gutscheincode von einer anderen Seite oder ein Einkauf in der Shop-App. Starte den Einkauf immer frisch über unseren Link.</p></details>
<details><summary>Gibt es Cashback auch für Amazon?</summary><p>Nein. Amazon verbietet die Weitergabe von Provisionen. Auf unseren Vergleichsseiten findest du Amazon-Links ohne Cashback und Hersteller-Links mit Cashback.</p></details>
</section>
<script src="/app.js" defer></script>
<?php foot();
