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

const HOECHSTLAENGE = 65536;
const ABLAGEORDNER = __DIR__ . '/../bestellungen';

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

// --- 2. Die Angaben, jede mit Grenze ----------------------------------------

$text     = textFeld($daten, 'text', 20000);
$firma    = textFeld($daten, 'firma', 200);
$email    = textFeld($daten, 'email', 200);
$bezirk   = textFeld($daten, 'bezirk', 100);
$telefon  = textFeld($daten, 'telefon', 60, false);

if (!filter_var($email, FILTER_VALIDATE_EMAIL) || !istKopfsicher($email)) {
    antworte(400, ['ok' => false, 'grund' => 'Die E-Mail-Adresse ist nicht lesbar.']);
}
foreach (['firma' => $firma, 'bezirk' => $bezirk, 'telefon' => (string) $telefon] as $name => $wert) {
    if (!istKopfsicher($wert)) {
        antworte(400, ['ok' => false, 'grund' => "Unerlaubtes Zeichen in: $name"]);
    }
}

// --- 3. Der Empfänger kommt aus der Konfiguration, nicht aus der Anfrage -----
//
// Ohne ihn wird nichts angenommen. Eine Bestellung, die niemanden erreicht,
// liegt in einer Datei, in die keiner sieht — das ist schlechter als eine
// ehrliche Absage.

$empfaenger = null;
if (is_file(__DIR__ . '/bestellung-konfiguration.php')) {
    $empfaenger = require __DIR__ . '/bestellung-konfiguration.php';
}
if (!is_string($empfaenger) || !filter_var($empfaenger, FILTER_VALIDATE_EMAIL)) {
    antworte(503, ['ok' => false, 'grund' => 'Der Bestellweg ist noch nicht eingerichtet.']);
}

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
rewind($griff);
while (fgets($griff) !== false) {
    $bestand++;
}
$nummer = sprintf('B-%d-%04d', $jahr, $bestand + 1);

$zeile = json_encode([
    'nummer'    => $nummer,
    'zeitpunkt' => gmdate('c'),
    'firma'     => $firma,
    'email'     => $email,
    'telefon'   => $telefon,
    'bezirk'    => $bezirk,
    'text'      => $text,
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

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

$betreff = "Bestellung $nummer — $firma";
$kopf = "From: bestellung@" . ($_SERVER['SERVER_NAME'] ?? 'localhost') . "\r\n"
      . "Reply-To: $email\r\n"
      . "Content-Type: text/plain; charset=utf-8\r\n";
$koerper = "$firma\n$email\n" . ($telefon !== null ? "$telefon\n" : '')
         . "Bezirk der Baustelle: $bezirk\n\n$text\n";

$gemeldet = function_exists('mail') ? @mail($empfaenger, $betreff, $koerper, $kopf) : false;

antworte(200, ['ok' => true, 'nummer' => $nummer, 'gemeldet' => (bool) $gemeldet]);
