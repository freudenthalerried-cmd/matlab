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

/**
 * Der Satz für die drei Fälle, in denen **wir** es sind und nicht der Kunde.
 *
 * **Der Anlass, 15. September 2026.** Hier standen „Ablage nicht erreichbar.",
 * „Ablage nicht beschreibbar." und „Ablage belegt." — drei Sätze über unser
 * Journal, hingestellt vor einen Menschen, der gerade bestellen wollte. Der
 * Unterschied ist nicht sprachlich: Wer glaubt, er sei schuld, versucht es
 * anders; wer weiß, dass es an uns liegt, ruft an.
 *
 * Welcher der drei Fälle eingetreten ist, gehört ins Protokoll des Servers und
 * nicht in die Antwort — für den Besteller ist es dieselbe Lage.
 */
const ABLAGE_FEHLT = 'Ihre Bestellung konnte bei uns nicht gespeichert werden. Das liegt an uns '
    . 'und nicht an Ihrer Eingabe. Bitte versuchen Sie es in einigen Minuten noch einmal.';

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

/*
 * **Gate 37, 11. September 2026 — zweimal dasselbe ist einmal.**
 *
 * Gemessen an einem laufenden PHP: Dieselbe Bestellung zweimal geschickt
 * ergibt **zwei Journalzeilen und zwei Nummern**, B-2026-0001 und
 * B-2026-0002. Zwei Geschäftsfälle, zwei Mails — und wenn der Shop wirklich
 * verkauft, womöglich zwei Lieferungen derselben Palette auf dieselbe
 * Baustelle.
 *
 * Der Weg dorthin ist der gewöhnliche: Die Oberfläche sperrt den Knopf
 * während des Absendens und gibt ihn erst bei einer Absage wieder frei. Ein
 * Doppeleintrag entsteht also nicht durch Ungeduld, sondern durch einen
 * **Abriss nach dem Schreiben** — die Bestellung liegt, die Antwort kommt nie
 * an, der Besteller drückt noch einmal. Auf einer Baustelle ist das kein
 * Sonderfall.
 *
 * > **Wer nicht weiß, ob seine Bestellung angekommen ist, schickt sie noch
 * > einmal — und das ist vernünftig.** Unvernünftig wäre, sie zweimal zu
 * > verbuchen.
 *
 * **Verglichen wird der Inhalt, nicht ein mitgeschickter Schlüssel.** Ein
 * Schlüssel vom Browser wäre die übliche Lösung und hier die schlechtere: Er
 * bliebe gleich, wenn der Besteller einen Tippfehler in seiner Anschrift
 * berichtigt und erneut abschickt — dann ginge die Berichtigung verloren.
 * Der Abdruck über die eingegangenen Angaben ändert sich mit ihnen.
 *
 * **Warum ein Fenster und keine Ewigkeit:** Eine Baustelle, die dieselbe
 * Palette in vier Wochen noch einmal bestellt, muss eine zweite Nummer
 * bekommen. Zehn Minuten fangen den Abriss und treffen die Wiederbestellung
 * praktisch nie.
 *
 * **Und es wird nicht verschwiegen:** Die Antwort sagt, dass die Bestellung
 * schon vorlag, und nennt die alte Nummer. Eine stille Unterdrückung wäre
 * dieselbe Sorte Fehler wie die stille Kürzung des Warenkorbs vom Vortag.
 */
const DOPPELFENSTER = 600;

/**
 * Der Abdruck einer Bestellung: alles, was der Besteller geschickt hat.
 *
 * Nummer und Zeitpunkt gehören nicht dazu — sie vergibt dieses Skript, und
 * zwei Abschriften derselben Bestellung unterschieden sich sonst immer.
 * Sortiert, damit die Reihenfolge der Felder keine Rolle spielt.
 */
function abdruck(array $angaben): string
{
    $ohne = $angaben;
    unset($ohne['nummer'], $ohne['zeitpunkt']);
    ksort($ohne);
    return hash('sha256', json_encode($ohne, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
}

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

/**
 * Wie das Feld auf dem Formular heißt.
 *
 * **Der Anlass, 15. September 2026.** Die Meldung lautete „Feld fehlt oder ist
 * leer: unternehmerBestaetigt". Unter diesem Namen hat der Besteller nie etwas
 * gesehen; auf dem Formular steht „Ich bestelle für ein Unternehmen".
 *
 * Die Beschriftungen kommen aus derselben Quelle wie die Felder selbst
 * (`src/bestellfelder.js`) und werden von `npm run website` mitgeschrieben.
 * Fehlt eine, steht der technische Name da — das ist schlechter als die
 * Beschriftung und besser als gar nichts.
 */
function beschriftung(string $name): string
{
    global $beschriftungen;
    return is_array($beschriftungen) && isset($beschriftungen[$name])
        ? (string) $beschriftungen[$name]
        : $name;
}

function textFeld(array $daten, string $name, int $maximum, bool $pflicht = true): ?string
{
    $wert = $daten[$name] ?? null;
    if (!is_string($wert) || trim($wert) === '') {
        if ($pflicht) {
            antworte(400, ['ok' => false, 'grund' => 'Bitte ergänzen Sie noch: ' . beschriftung($name) . '. Die Angabe steht auf dem Formular unter diesem Namen.']);
        }
        return null;
    }
    $wert = trim($wert);
    if (mb_strlen($wert) > $maximum) {
        antworte(400, ['ok' => false, 'grund' => 'Diese Angabe ist länger, als das Formular annehmen kann: ' . beschriftung($name) . '. Bitte kürzen Sie sie.']);
    }
    return $wert;
}

// --- 1. Nur POST, nur JSON, nur begrenzt lang -------------------------------

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    antworte(405, ['ok' => false, 'grund' => 'Diese Seite nimmt Bestellungen nur über das Formular der Kasse an. Bitte schicken Sie die Bestellung über die Kasse ab.']);
}

$art = strtolower(trim(explode(';', (string) ($_SERVER['CONTENT_TYPE'] ?? ''))[0]));
if ($art !== 'application/json') {
    antworte(415, ['ok' => false, 'grund' => 'Die Bestellung ist nicht in der erwarteten Form angekommen. Bitte laden Sie die Seite neu und schicken Sie die Bestellung noch einmal ab.']);
}

if (strtolower((string) ($_SERVER['HTTP_SEC_FETCH_SITE'] ?? '')) === 'cross-site') {
    antworte(403, ['ok' => false, 'grund' => 'Diese Bestellung wurde nicht auf dieser Seite ausgefüllt. Bitte öffnen Sie die Kasse erneut und schicken Sie die Bestellung von dort ab.']);
}

$roh = file_get_contents('php://input', false, null, 0, HOECHSTLAENGE + 1);
if ($roh === false) {
    antworte(400, ['ok' => false, 'grund' => 'Die Bestellung ist unvollständig bei uns angekommen. Bitte laden Sie die Seite neu und schicken Sie die Bestellung noch einmal ab.']);
}
if (strlen($roh) > HOECHSTLAENGE) {
    antworte(413, ['ok' => false, 'grund' => 'Die Bestellung ist zu umfangreich für einen Vorgang. Bitte teilen Sie sie in zwei Bestellungen.']);
}

$daten = json_decode($roh, true);
if (!is_array($daten)) {
    antworte(400, ['ok' => false, 'grund' => 'Die Bestellung ist unvollständig bei uns angekommen. Bitte laden Sie die Seite neu und schicken Sie die Bestellung noch einmal ab.']);
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
$beschriftungen = is_array($k) && isset($k['beschriftungen']) && is_array($k['beschriftungen'])
    ? $k['beschriftungen']
    : [];
if (!is_string($empfaenger) || !filter_var($empfaenger, FILTER_VALIDATE_EMAIL) || $felder === []) {
    antworte(503, ['ok' => false, 'grund' => 'Der Bestellweg ist gerade nicht in Betrieb. Das liegt an uns. Bitte schicken Sie uns die Liste als Anfrage — die Schaltfläche daneben tut das.']);
}

// --- 3. Die Angaben, jede mit Grenze ----------------------------------------

$text   = textFeld($daten, 'text', 20000);
$bezirk = textFeld($daten, 'bezirk', 100);
if (!istKopfsicher($bezirk)) {
    antworte(400, ['ok' => false, 'grund' => 'Diese Angabe enthält ein Zeichen, das hier nicht stehen darf: ' . beschriftung('bezirk') . '. Bitte ohne Zeilenumbrüche eintragen.']);
}

$erhoben = [];
foreach ($felder as $name => $art) {
    if ($art === 'checkbox') {
        // Eine Bestätigung ist entweder erklärt oder nicht. `false` ist keine
        // fehlende Angabe, sondern eine Verneinung — und die hält Gate 7 auf.
        if (($daten[$name] ?? null) !== true) {
            antworte(400, ['ok' => false, 'grund' => 'Bitte setzen Sie noch das Häkchen bei: ' . beschriftung($name) . '. Ohne diese Erklärung können wir keine Nettorechnung ausstellen.']);
        }
        $erhoben[$name] = true;
        continue;
    }
    $wert = textFeld($daten, $name, 200);
    if (!istKopfsicher($wert)) {
        antworte(400, ['ok' => false, 'grund' => 'Diese Angabe enthält ein Zeichen, das hier nicht stehen darf: ' . beschriftung($name) . '. Bitte ohne Zeilenumbrüche eintragen.']);
    }
    if ($art === 'email' && !filter_var($wert, FILTER_VALIDATE_EMAIL)) {
        antworte(400, ['ok' => false, 'grund' => 'Die E-Mail-Adresse ist nicht lesbar. Bitte prüfen Sie die Schreibweise — dorthin geht Ihr Angebot.']);
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
    antworte(500, ['ok' => false, 'grund' => ABLAGE_FEHLT]);
}

$jahr  = (int) date('Y');
$datei = ABLAGEORDNER . "/journal-$jahr.jsonl";

$griff = @fopen($datei, 'c+');
if ($griff === false) {
    antworte(500, ['ok' => false, 'grund' => ABLAGE_FEHLT]);
}
if (!flock($griff, LOCK_EX)) {
    fclose($griff);
    antworte(500, ['ok' => false, 'grund' => ABLAGE_FEHLT]);
}

// Die laufende Nummer entsteht **unter der Sperre**. Wer sie vorher zieht,
// vergibt bei zwei gleichzeitigen Bestellungen zweimal dieselbe.
$eigenerAbdruck = abdruck(['bezirk' => $bezirk, 'text' => $text] + $erhoben);

$bestand = 0;
$imFenster = 0;
$schonDa = null;
$grenze = time() - FENSTERSEKUNDEN;
$doppelgrenze = time() - DOPPELFENSTER;
rewind($griff);
while (($zeileAusAblage = fgets($griff)) !== false) {
    $bestand++;
    // Aus derselben Lesung, die ohnehin läuft: Wie viele Einträge sind jünger
    // als das Fenster, und liegt dieselbe Bestellung schon da? Ein zweiter
    // Durchgang über dieselbe Datei wäre ein zweiter Weg zur selben Zahl.
    $alt = json_decode($zeileAusAblage, true);
    if (is_array($alt) && isset($alt['zeitpunkt']) && is_string($alt['zeitpunkt'])) {
        $stempel = strtotime($alt['zeitpunkt']);
        if ($stempel !== false && $stempel >= $grenze) {
            $imFenster++;
        }
        if ($stempel !== false && $stempel >= $doppelgrenze
            && isset($alt['nummer']) && abdruck($alt) === $eigenerAbdruck) {
            $schonDa = (string) $alt['nummer'];
        }
    }
}

// **Erst antworten, dann zählen.** Eine Bestellung, die schon liegt, zählt
// nicht gegen die Minutengrenze: Sonst sperrte ein Abriss den Besteller auch
// noch aus.
if ($schonDa !== null) {
    flock($griff, LOCK_UN);
    fclose($griff);
    antworte(200, [
        'ok' => true,
        'nummer' => $schonDa,
        'bereits' => true,
        'gemeldet' => false,
        'grund' => 'Diese Bestellung liegt bereits vor. Ihre Nummer bleibt ' . $schonDa . '.',
    ]);
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
    antworte(500, ['ok' => false, 'grund' => ABLAGE_FEHLT]);
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
