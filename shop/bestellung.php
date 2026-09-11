<?php
/**
 * Das Empfangsskript des Bestellwegs — Gate 26, 4. September 2026.
 *
 * Die Kasse rechnet im Browser und erzeugt eine fertige Positionsliste. Bis
 * heute endete der Weg dort: Der Kunde kopierte den Text in sein eigenes
 * Mailprogramm. Dieses Skript ist die Gegenstelle, die ihn entgegennimmt.
 *
 * **Warum PHP und warum hier.** Der Hoster steht fest (All-Inkl) und kann PHP;
 * ein fremder Formulardienst kostet Geld und macht seinen Anbieter zum
 * Auftragsverarbeiter nach Art. 28 DSGVO. Die Begründung mit den drei
 * verworfenen Wegen steht in `src/bestellweg.js` unter `GEWAEHLTER_WEG`.
 *
 * **Was dieses Skript ausdrücklich nicht tut:**
 *
 * - Es rechnet nichts nach. Die Preise stehen im Text, den die Kasse gebaut
 *   hat; hier würde eine zweite Rechnung entstehen, die von der ersten
 *   abweichen kann. Nachgerechnet wird mit `npm run anfrage-lesen`, und zwar
 *   gegen den Katalog — nicht gegen das, was der Browser mitgeschickt hat.
 * - Es bestätigt nichts. Eine Auftragsbestätigung ist nach AGB Punkt 2 die
 *   Annahme des Vertrags; sie entsteht in `npm run vorgang`, nach der Prüfung
 *   von Liefergebiet, Mindestbestellwert und Lieferzeit.
 * - Es schickt dem Kunden keine Mail. Wer eine Empfangsbestätigung
 *   automatisch versendet, versendet sie auch an jede Adresse, die jemand
 *   anders hier einträgt.
 *
 * > **Es nimmt entgegen, legt ab und sagt Bescheid. Mehr nicht.**
 */

declare(strict_types=1);

/*
 * **Die Uhr dieses Betriebs, gesetzt am 9. September 2026.** Bis dahin stand
 * hier nichts, und das Skript las zwei verschiedene Uhren: Die Journaldatei
 * kam aus `date('Y')` — also aus der Zeitzone, die der Hoster eingestellt
 * hat und die niemand nachgesehen hat —, der Zeitstempel aus `gmdate('c')`,
 * also aus UTC.
 *
 * Mit echtem PHP nachgestellt, Bestellung am 1. Jänner 2027 um 00:30 Uhr
 * österreichischer Zeit:
 *
 *   Zeitzone UTC             journal-2026.jsonl   Stempel 2026-12-31T23:30:00+00:00
 *   Zeitzone Europe/Vienna   journal-2027.jsonl   Stempel 2026-12-31T23:30:00+00:00
 *
 * Auf einem UTC-Host landet der Geschäftsfall im Journal des **Vorjahres**
 * und bekommt eine Nummer daraus; auf einem Wiener Host stimmt die Datei,
 * und der Stempel nennt trotzdem den 31. Dezember. § 11 UStG meint mit dem
 * Ausstellungsdatum den Tag am Sitz des Unternehmens, § 132 BAO zählt sieben
 * Jahre ab Ende des Wirtschaftsjahres — beides österreichische Daten.
 *
 * Es braucht dafür keinen Jahreswechsel: Jede Bestellung zwischen
 * Mitternacht und 01:00 Uhr (im Sommer 02:00) trug das Datum des Vortags.
 *
 * Der Aufruf steht **vor** jeder Zeitrechnung und nicht in einer Zeile
 * daneben: Ein Skript, das seine Zeitzone erst nach dem ersten `date()`
 * setzt, hat sie für dieses eine nicht gesetzt.
 */
date_default_timezone_set('Europe/Vienna');

const HOECHSTLAENGE = 65536;
const ABLAGEORDNER = __DIR__ . '/../bestellungen';

/*
 * **Gate 35, 11. September 2026 — wer hier schreiben darf und wie oft.**
 *
 * Gemessen an einem laufenden PHP: **dreißig Bestellungen hintereinander von
 * derselben Adresse, dreißigmal 200**, dreißig Zeilen im Journal. Ein
 * Formular auf einer fremden Seite (`Content-Type: text/plain`) kam durch,
 * eine Anfrage mit fremdem `Origin` ebenfalls. Jede davon schreibt in die
 * Vorgangsablage, die nach § 132 BAO sieben Jahre zu führen ist, und löst
 * eine Mail an den Betrieb aus.
 *
 * > **Ein Geschäftsbuch, in das jeder beliebig oft schreiben darf, ist keine
 * > Ablage, sondern eine Halde.**
 *
 * Drei Sperren, alle ohne fremde Bibliothek und ohne neue Daten:
 *
 * 1. **Nur `application/json`.** Ein HTML-Formular auf einer fremden Seite
 *    kann diesen Kopf nicht setzen; ein `fetch` mit ihm löst eine
 *    Vorabanfrage aus, die hier niemand beantwortet. Der eigene Absendeweg
 *    (`shop-bestellen.js`) setzt ihn seit jeher — die Sperre kostet den
 *    ehrlichen Weg nichts.
 * 2. **Kein `Sec-Fetch-Site: cross-site`.** Wo der Browser selbst sagt, dass
 *    die Anfrage von woanders kommt, wird geglaubt. Fehlt der Kopf, wird
 *    nicht geraten — ältere Browser und Werkzeuge senden ihn nicht.
 * 3. **Eine Obergrenze je Minute, über alle zusammen.** Nicht je Adresse:
 *    Dafür müsste die IP gespeichert werden, und das wäre ein neuer Zweck,
 *    eine neue Angabe auf der Datenschutzseite und ein neues Risiko — für
 *    einen Betrieb mit einer Handvoll Bestellungen je Woche unverhältnismäßig.
 *    Gezählt wird aus den Zeitstempeln, die das Journal ohnehin führt.
 *
 * **Was diese Sperren nicht können:** eine langsame, geduldige Flut. Dagegen
 * hülfe nur eine Zählung je Adresse oder ein fremder Dienst — das eine kostet
 * personenbezogene Daten, das andere Geld und einen Auftragsverarbeiter.
 * Beides ist eine Entscheidung des Auftraggebers und steht als offener Punkt.
 */
const HOECHSTENJEFENSTER = 5;
const FENSTERSEKUNDEN = 60;

/** Antwortet als JSON und beendet — eine Ausgabe, ein Ausgang. */
function antworte(int $code, array $daten): void
{
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($daten, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/**
 * Kopfzeileneinschleusung: Ein Zeilenumbruch in einer Angabe, die in einen
 * Mailkopf geht, macht daraus zwei Kopfzeilen — und die zweite kann ein
 * weiterer Empfänger sein. Deshalb geht **keine** eingegangene Angabe roh in
 * einen Kopf; was hier nicht durchkommt, kommt gar nicht durch.
 */
function istKopfsicher(string $wert): bool
{
    return !preg_match('/[\r\n\0]/', $wert);
}

function textFeld(array $daten, string $name, int $maximum, bool $pflicht = true): ?string
{
    $wert = $daten[$name] ?? null;
    if (!is_string($wert) || trim($wert) === '') {
        if ($pflicht) {
            antworte(400, ['ok' => false, 'grund' => "Feld fehlt oder ist leer: $name"]);
        }
        return null;
    }
    $wert = trim($wert);
    if (mb_strlen($wert) > $maximum) {
        antworte(400, ['ok' => false, 'grund' => "Feld zu lang: $name"]);
    }
    return $wert;
}

// --- 1. Nur POST, nur JSON, nur begrenzt lang -------------------------------

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    antworte(405, ['ok' => false, 'grund' => 'Nur POST.']);
}

$art = strtolower(trim(explode(';', (string) ($_SERVER['CONTENT_TYPE'] ?? ''))[0]));
if ($art !== 'application/json') {
    antworte(415, ['ok' => false, 'grund' => 'Erwartet wird application/json.']);
}

if (strtolower((string) ($_SERVER['HTTP_SEC_FETCH_SITE'] ?? '')) === 'cross-site') {
    antworte(403, ['ok' => false, 'grund' => 'Diese Bestellung kommt nicht von dieser Seite.']);
}

$roh = file_get_contents('php://input', false, null, 0, HOECHSTLAENGE + 1);
if ($roh === false) {
    antworte(400, ['ok' => false, 'grund' => 'Kein Inhalt.']);
}
if (strlen($roh) > HOECHSTLAENGE) {
    antworte(413, ['ok' => false, 'grund' => 'Inhalt zu lang.']);
}

$daten = json_decode($roh, true);
if (!is_array($daten)) {
    antworte(400, ['ok' => false, 'grund' => 'Kein lesbares JSON.']);
}

// --- 2. Der Empfänger und die Feldliste, beide aus der Konfiguration --------
//
// **Die Feldliste steht nicht hier.** Sie wird von `npm run website` aus
// `src/bestellfelder.js` erzeugt — derselben Quelle, aus der das Formular im
// Browser entsteht und gegen die `pruefeBestelldaten` gehalten wird. Eine
// handgepflegte zweite Liste an dieser Stelle wäre genau der Fehler, den das
// Register auflöst: zwei Listen für dieselbe Sache, und die kürzere gewinnt.

// --- 3. Der Empfänger kommt aus der Konfiguration, nicht aus der Anfrage -----
//
// Ohne ihn wird nichts angenommen. Eine Bestellung, die niemanden erreicht,
// liegt in einer Datei, in die keiner sieht — das ist schlechter als eine
// ehrliche Absage.

$k = is_file(__DIR__ . '/bestellung-konfiguration.php')
    ? require __DIR__ . '/bestellung-konfiguration.php'
    : null;
$empfaenger = is_array($k) ? ($k['empfaenger'] ?? null) : null;
$felder = is_array($k) && isset($k['felder']) && is_array($k['felder']) ? $k['felder'] : [];
if (!is_string($empfaenger) || !filter_var($empfaenger, FILTER_VALIDATE_EMAIL) || $felder === []) {
    antworte(503, ['ok' => false, 'grund' => 'Der Bestellweg ist noch nicht eingerichtet.']);
}

// --- 3. Die Angaben, jede mit Grenze ----------------------------------------

$text   = textFeld($daten, 'text', 20000);
$bezirk = textFeld($daten, 'bezirk', 100);
if (!istKopfsicher($bezirk)) {
    antworte(400, ['ok' => false, 'grund' => 'Unerlaubtes Zeichen in: bezirk']);
}

$erhoben = [];
foreach ($felder as $name => $art) {
    if ($art === 'checkbox') {
        // Eine Bestätigung ist entweder erklärt oder nicht. `false` ist keine
        // fehlende Angabe, sondern eine Verneinung — und die hält Gate 7 auf.
        if (($daten[$name] ?? null) !== true) {
            antworte(400, ['ok' => false, 'grund' => "Bestätigung fehlt: $name"]);
        }
        $erhoben[$name] = true;
        continue;
    }
    $wert = textFeld($daten, $name, 200);
    if (!istKopfsicher($wert)) {
        antworte(400, ['ok' => false, 'grund' => "Unerlaubtes Zeichen in: $name"]);
    }
    if ($art === 'email' && !filter_var($wert, FILTER_VALIDATE_EMAIL)) {
        antworte(400, ['ok' => false, 'grund' => 'Die E-Mail-Adresse ist nicht lesbar.']);
    }
    $erhoben[$name] = $wert;
}

// Die tiefere Prüfung — UID-Prüfziffer, Postleitzahl, Gate 7 — geschieht
// nicht hier, sondern in `npm run vorgang` gegen `pruefeBestelldaten`. Dieses
// Skript prüft die **Form** der Eingabe; die Sache prüft das Werkzeug, das
// den Beleg erzeugt. Zwei Fassungen derselben Prüfung liefen auseinander.

// --- 4. Ablegen — unter Sperre, und außerhalb des Webverzeichnisses ---------
//
// `../bestellungen` liegt eine Ebene über dem, was der Webserver ausliefert.
// Ein Journal mit Namen und Anschriften, das unter einer URL erreichbar ist,
// ist kein Journal, sondern eine Veröffentlichung.

if (!is_dir(ABLAGEORDNER) && !@mkdir(ABLAGEORDNER, 0700, true) && !is_dir(ABLAGEORDNER)) {
    antworte(500, ['ok' => false, 'grund' => 'Ablage nicht erreichbar.']);
}

$jahr  = (int) date('Y');
$datei = ABLAGEORDNER . "/journal-$jahr.jsonl";

$griff = @fopen($datei, 'c+');
if ($griff === false) {
    antworte(500, ['ok' => false, 'grund' => 'Ablage nicht beschreibbar.']);
}
if (!flock($griff, LOCK_EX)) {
    fclose($griff);
    antworte(500, ['ok' => false, 'grund' => 'Ablage belegt.']);
}

// Die laufende Nummer entsteht **unter der Sperre**. Wer sie vorher zieht,
// vergibt bei zwei gleichzeitigen Bestellungen zweimal dieselbe.
$bestand = 0;
$imFenster = 0;
$grenze = time() - FENSTERSEKUNDEN;
rewind($griff);
while (($zeileAusAblage = fgets($griff)) !== false) {
    $bestand++;
    // Aus derselben Lesung, die ohnehin läuft: Wie viele Einträge sind jünger
    // als das Fenster? Ein zweiter Durchgang über dieselbe Datei wäre ein
    // zweiter Weg zur selben Zahl.
    $alt = json_decode($zeileAusAblage, true);
    if (is_array($alt) && isset($alt['zeitpunkt']) && is_string($alt['zeitpunkt'])) {
        $stempel = strtotime($alt['zeitpunkt']);
        if ($stempel !== false && $stempel >= $grenze) {
            $imFenster++;
        }
    }
}
if ($imFenster >= HOECHSTENJEFENSTER) {
    flock($griff, LOCK_UN);
    fclose($griff);
    header('Retry-After: ' . FENSTERSEKUNDEN);
    antworte(429, [
        'ok' => false,
        'grund' => 'Gerade gehen ungewöhnlich viele Bestellungen ein. Bitte in einer Minute noch '
            . 'einmal abschicken — der Warenkorb bleibt erhalten.',
    ]);
}
$nummer = sprintf('B-%d-%04d', $jahr, $bestand + 1);

$zeile = json_encode([
    'nummer'    => $nummer,
    'zeitpunkt' => date('c'),
    'bezirk'    => $bezirk,
    'text'      => $text,
] + $erhoben, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

fseek($griff, 0, SEEK_END);
$geschrieben = fwrite($griff, $zeile . "\n");
fflush($griff);
flock($griff, LOCK_UN);
fclose($griff);

if ($geschrieben === false) {
    antworte(500, ['ok' => false, 'grund' => 'Ablage nicht beschreibbar.']);
}

// --- 5. Bescheid geben ------------------------------------------------------
//
// **Erst ablegen, dann melden.** Scheitert die Mail, liegt die Bestellung
// trotzdem in der Ablage und ist nicht verloren. Umgekehrt wäre eine
// gemeldete Bestellung ohne Eintrag der teurere Fehler.

$betreff = "Bestellung $nummer — " . ($erhoben['firma'] ?? '');
$kopf = "From: bestellung@" . ($_SERVER['SERVER_NAME'] ?? 'localhost') . "\r\n"
      . (isset($erhoben['email']) ? "Reply-To: {$erhoben['email']}\r\n" : '')
      . "Content-Type: text/plain; charset=utf-8\r\n";
$koerper = '';
foreach ($erhoben as $name => $wert) {
    $koerper .= "$name: " . ($wert === true ? 'ja' : $wert) . "\n";
}
$koerper .= "Bezirk der Baustelle: $bezirk\n\n$text\n";

$gemeldet = function_exists('mail') ? @mail($empfaenger, $betreff, $koerper, $kopf) : false;

antworte(200, ['ok' => true, 'nummer' => $nummer, 'gemeldet' => (bool) $gemeldet]);
