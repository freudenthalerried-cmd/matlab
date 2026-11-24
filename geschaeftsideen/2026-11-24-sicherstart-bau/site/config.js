/* Sicherstart Bau: Einstellungen der Website.
   Nur diese Datei anpassen. Hier niemals Passwörter oder geheime Schlüssel eintragen,
   die Datei ist öffentlich lesbar. Stripe-Schlüssel gehören in die Netlify-Umgebungsvariablen. */
window.SICHERSTART_CONFIG = {
  // Firmendaten für Impressum und Auftragsbestätigung
  firma: "Sicherstart Bau",
  inhaber: "Stefan Freudenthaler",
  email: "stefan.freudenthaler@aon.at",
  telefon: "",
  adresse: "",      // z. B. "Musterstraße 1, 4020 Linz"
  uid: "",          // z. B. "ATU12345678"
  firmenbuch: "",   // nur falls eingetragen, z. B. "FN 123456a, Landesgericht Linz"
  gewerbe: "",      // z. B. "Dienstleistungen in der automatischen Datenverarbeitung und Informationstechnik"
  behoerde: "",     // z. B. "Bezirkshauptmannschaft …" oder "Magistrat …"
  kammer: "",       // z. B. "WKO Oberösterreich, Fachgruppe UBIT"

  // Bankverbindung für Überweisung und Zahlschein-QR-Code (steht ohnehin auf jeder Rechnung)
  kontoinhaber: "",
  iban: "",         // z. B. "AT12 3456 7890 1234 5678"
  bic: "",
  ust: 0.20,

  // Online-Zahlung (Karte, SEPA-Lastschrift) über Stripe.
  // Erst auf true setzen, wenn STRIPE_SECRET_KEY und STRIPE_TAX_RATE_ID in Netlify hinterlegt sind.
  onlinePayment: false,

  // Google Ads Conversion-Tracking. Wird erst nach Zustimmung im Cookie-Banner geladen.
  // Ohne ID erscheint kein Cookie-Banner und es wird nichts von Google geladen.
  googleAds: {
    id: "",          // z. B. "AW-123456789"
    bestellung: "",  // Conversion-Label der Aktion "Bestellung"
    anfrage: ""      // Conversion-Label der Aktion "Demo-Anfrage"
  }
};
