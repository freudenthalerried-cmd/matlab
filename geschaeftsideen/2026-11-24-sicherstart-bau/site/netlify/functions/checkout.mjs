// Startet eine Stripe-Checkout-Sitzung (Abo mit Grundpauschale + Mitarbeitern, einmalige Posten auf der ersten Rechnung).
// Preise werden hier auf dem Server berechnet, nie aus dem Browser übernommen.
// Umgebungsvariablen in Netlify: STRIPE_SECRET_KEY (sk_live_… oder sk_test_…), STRIPE_TAX_RATE_ID (txr_…, 20 % exklusive).

const PLANS = {
  basis: {name: "Basis", base: 49, per: 6},
  profi: {name: "Profi", base: 99, per: 9},
  gu: {name: "Generalunternehmer", base: 199, per: 12}
};
const YEAR = 10.2; // 12 Monate minus 15 %
const cents = eur => Math.round(eur * 100);
const int = (x, min, max) => Math.min(max, Math.max(min, Math.floor(Number(x) || 0)));
const json = (body, status = 200) => new Response(JSON.stringify(body), {status, headers: {"Content-Type": "application/json"}});

export default async (req) => {
  if (req.method !== "POST") return json({error: "Nur POST erlaubt."}, 405);
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return json({error: "Online-Zahlung ist noch nicht eingerichtet."}, 501);

  let o;
  try { o = await req.json(); } catch { return json({error: "Ungültige Anfrage."}, 400); }
  const p = PLANS[o.plan];
  const n = int(o.n, 1, 5000), themen = int(o.themen, 0, 50), film = int(o.film, 0, 20);
  const email = String(o.email || "").trim();
  if (!p || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({error: "Bitte die Angaben prüfen."}, 400);

  // Umsatzsteuer: Österreich 20 %, Deutschland mit gültiger UID und Schweiz ohne österreichische USt
  const land = String(o.land || "Österreich");
  const uid = String(o.uid || "").replace(/\s/g, "");
  const noVat = land === "Schweiz" || (land === "Deutschland" && /^DE\d{9}$/i.test(uid));
  const taxRate = process.env.STRIPE_TAX_RATE_ID;
  if (!noVat && !taxRate) return json({error: "Steuersatz für die Online-Zahlung fehlt."}, 501);

  const yearly = o.int === "jahr", factor = yearly ? YEAR : 1, interval = yearly ? "year" : "month";
  const ref = String(o.nr || "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 60);
  const origin = process.env.URL || new URL(req.url).origin;

  const f = new URLSearchParams();
  f.set("mode", "subscription");
  f.set("locale", "de");
  f.set("customer_email", email);
  if (ref) f.set("client_reference_id", ref);
  f.set("success_url", origin + "/#danke");
  f.set("cancel_url", origin + "/#bestellen");
  f.set("billing_address_collection", "required");
  f.set("tax_id_collection[enabled]", "true");
  f.set("metadata[bestellnummer]", ref);
  f.set("metadata[firma]", String(o.firma || "").slice(0, 200));
  f.set("subscription_data[metadata][bestellnummer]", ref);

  let i = 0;
  const add = (name, unitCents, qty, recurring) => {
    f.set(`line_items[${i}][price_data][currency]`, "eur");
    f.set(`line_items[${i}][price_data][product_data][name]`, name);
    f.set(`line_items[${i}][price_data][unit_amount]`, String(unitCents));
    if (recurring) f.set(`line_items[${i}][price_data][recurring][interval]`, interval);
    f.set(`line_items[${i}][quantity]`, String(qty));
    if (!noVat) f.set(`line_items[${i}][tax_rates][0]`, taxRate);
    i++;
  };
  add(`Sicherstart Bau ${p.name}: Grundpauschale`, cents(p.base * factor), 1, true);
  add(`Sicherstart Bau ${p.name}: pro aktivem Mitarbeiter`, cents(p.per * factor), n, true);
  add("Einrichtung und Einschulung", 49000, 1, false);
  if (themen) add("Eigenes Unterweisungsthema", 39000, themen, false);
  if (film) add("Baustellenfilm vor Ort", 89000, film, false);

  const r = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {Authorization: `Bearer ${key}`, "Content-Type": "application/x-www-form-urlencoded"},
    body: f.toString()
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.url) {
    console.error("Stripe-Fehler", r.status, j && j.error && j.error.message);
    return json({error: "Die Zahlung konnte nicht gestartet werden."}, 502);
  }
  return json({url: j.url});
};
