"""Erzeugt das KDP-Umschlag-PDF (Rückseite, Buchrücken, Vorderseite inkl. 0,125" Beschnitt).
Aufruf: python3 build_cover.py <ausgabeordner> <seitenzahl_innenteil>"""
import sys
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.units import inch, mm
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph, Frame
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from content import TITLE, AUTHOR, STAND

F = "/usr/share/fonts/truetype/dejavu/"
pdfmetrics.registerFont(TTFont("R", F + "DejaVuSans.ttf"))
pdfmetrics.registerFont(TTFont("B", F + "DejaVuSans-Bold.ttf"))
pdfmetrics.registerFontFamily("R", normal="R", bold="B", italic="R", boldItalic="B")
import reportlab.platypus.tables as _t; _t.CellStyle.fontname = "R"

out, pages = sys.argv[1], int(sys.argv[2])
TRIM_W, TRIM_H, BLEED = 8.27 * inch, 11.69 * inch, 0.125 * inch   # A4 bei KDP
SPINE = pages * 0.002252 * inch                                     # weißes Papier, s/w
W, H = 2 * BLEED + 2 * TRIM_W + SPINE, 2 * BLEED + TRIM_H
SAFE = 0.375 * inch                                                 # Abstand zum Beschnittrand + Sicherheitszone
BG = colors.HexColor("#1E3442"); ACC = colors.HexColor("#F2A900"); WHITE = colors.white
front_x = BLEED + TRIM_W + SPINE                                    # linke Kante Vorderseite (Trim)

c = canvas.Canvas(f"{out}/umschlag.pdf", pagesize=(W, H), initialFontName="R")
c.setTitle(f"{TITLE} – Umschlag"); c.setAuthor(AUTHOR)
c.setFillColor(BG); c.rect(0, 0, W, H, stroke=0, fill=1)


def para(text, x, y, w, h, style):
    Frame(x, y, w, h, 0, 0, 0, 0, showBoundary=0).addFromList([Paragraph(text, style)], c)


# ---------------- Vorderseite
fx, fw = front_x + SAFE - BLEED + 0.1 * inch, TRIM_W - 2 * (SAFE - BLEED) - 0.2 * inch
c.setFillColor(ACC); c.rect(front_x, H - BLEED - 1.25 * inch, TRIM_W + BLEED, 0.08 * inch, stroke=0, fill=1)
c.setFont("B", 11); c.setFillColor(ACC)
c.drawString(fx, H - BLEED - 0.95 * inch, "BAUTAGEBUCH  ·  RATGEBER  ·  CHECKLISTEN")
c.setFont("B", 58); c.setFillColor(WHITE)
c.drawString(fx, H - BLEED - 2.35 * inch, "Unser")
c.drawString(fx, H - BLEED - 3.2 * inch, "Hausbau")
sub = ParagraphStyle("s", fontName="R", fontSize=17, leading=23, textColor=WHITE)
para("Das Bautagebuch für Bauherren in <b>Österreich</b>", fx, H - BLEED - 4.45 * inch, fw, 1 * inch, sub)

# Haus-Illustration (Strichzeichnung)
cx, base, hw = front_x + TRIM_W / 2, 3.05 * inch, 2.1 * inch
c.setStrokeColor(WHITE); c.setLineWidth(3); c.setLineJoin(1)
c.line(cx - 2.9 * inch, base, cx + 2.9 * inch, base)                              # Boden
c.rect(cx - hw, base, 2 * hw, 2.1 * inch, stroke=1, fill=0)                       # Baukörper
p = c.beginPath(); p.moveTo(cx - hw - 0.35 * inch, base + 2.1 * inch); p.lineTo(cx, base + 3.6 * inch)
p.lineTo(cx + hw + 0.35 * inch, base + 2.1 * inch); c.drawPath(p, stroke=1, fill=0)  # Dach
c.rect(cx - 0.35 * inch, base, 0.7 * inch, 1.3 * inch, stroke=1, fill=0)          # Tür
for wx in (-1.6, 0.75):                                                           # Fenster
    c.rect(cx + wx * inch, base + 1.1 * inch, 0.85 * inch, 0.65 * inch, stroke=1, fill=0)
    c.setLineWidth(1.5); c.line(cx + (wx + 0.425) * inch, base + 1.1 * inch, cx + (wx + 0.425) * inch, base + 1.75 * inch)
    c.setLineWidth(3)
c.setStrokeColor(ACC); c.setLineWidth(3)                                          # Kran (Akzent)
kx = cx + 2.55 * inch
c.line(kx, base, kx, base + 4.1 * inch); c.line(kx - 1.7 * inch, base + 4.1 * inch, kx + 0.45 * inch, base + 4.1 * inch)
c.setLineWidth(1.4)
for i in range(8):
    y0 = base + i * 0.5 * inch; c.line(kx - 0.12 * inch, y0, kx + 0.12 * inch, y0 + 0.5 * inch)
c.line(kx - 1.3 * inch, base + 4.1 * inch, kx - 1.3 * inch, base + 3.35 * inch)
c.rect(kx - 1.38 * inch, base + 3.2 * inch, 0.16 * inch, 0.15 * inch, stroke=1, fill=0)

# Merkmale + Autor
c.setFillColor(WHITE); c.setFont("R", 11.5)
feats = ["Alle Bauphasen mit Checklisten", "Kostenplan nach ÖNORM B 1801-1", "160 Bautagebuch-Einträge",
         "Abnahme, Mängel & Hausakte"]
y = 2.35 * inch
for i, f in enumerate(feats):
    xx = fx + (i % 2) * fw / 2; yy = y - (i // 2) * 0.32 * inch
    c.setFillColor(ACC); c.drawString(xx, yy, "✓"); c.setFillColor(WHITE); c.drawString(xx + 0.22 * inch, yy, f)
c.setFont("B", 14); c.setFillColor(WHITE); c.drawString(fx, BLEED + SAFE + 0.15 * inch, AUTHOR)
c.setFont("R", 9); c.setFillColor(colors.HexColor("#c9d3da"))
c.drawRightString(front_x + TRIM_W - (SAFE - BLEED) - 0.1 * inch, BLEED + SAFE + 0.15 * inch, f"A4 · Rechtsstand {STAND}")

# ---------------- Buchrücken
c.setFillColor(ACC); c.rect(BLEED + TRIM_W, 0, SPINE, H, stroke=0, fill=1)
c.saveState(); c.translate(BLEED + TRIM_W + SPINE / 2, H / 2); c.rotate(-90)
c.setFillColor(BG); c.setFont("B", 13)
c.drawCentredString(-0.9 * inch, -4.5, "UNSER HAUSBAU")
c.setFont("R", 10); c.drawCentredString(1.9 * inch, -3.5, "Bautagebuch Österreich")
c.setFont("B", 10); c.drawCentredString(4.2 * inch, -3.5, AUTHOR)
c.restoreState()

# ---------------- Rückseite
bx, bw = BLEED + SAFE - BLEED + 0.1 * inch, TRIM_W - 2 * (SAFE - BLEED) - 0.2 * inch
h = ParagraphStyle("h", fontName="B", fontSize=22, leading=28, textColor=WHITE)
b = ParagraphStyle("b", fontName="R", fontSize=11.2, leading=16, textColor=WHITE, spaceAfter=8)
li = ParagraphStyle("l", parent=b, leftIndent=16, firstLineIndent=-16, spaceAfter=5)
txt = [Paragraph("Bauen ohne böse Überraschungen.", h),
       Paragraph("<br/>Dieses Buch begleitet Bauherren in Österreich vom Grundstück bis zum Einzug – und darüber hinaus. "
                 "Es vereint Ratgeber, Planungswerkzeug und Bautagebuch in einem Band und hilft, Kosten im Griff zu "
                 "behalten, Fehler früh zu erkennen und im Streitfall Beweise in der Hand zu haben.", b)]
for t in ["<b>Alle Phasen erklärt:</b> Grundstück, Finanzierung, Planung, Behörde, Vergabe, Bauablauf, Abnahme, Gewährleistung",
          "<b>Speziell für Österreich:</b> Grunderwerbsteuer und Grundbuch, Bauarbeitenkoordinationsgesetz, ÖNORM B 1801-1 und "
          "B 2110, Baugesetze aller Bundesländer, Förderstellen",
          "<b>Kosten im Griff:</b> Kostenplan, Nebenkosten-Checkliste, Kreditvergleich, Rechnungs- und Zahlungsjournal",
          "<b>Gut vorbereitet:</b> Angebotsvergleich für 13 Gewerke, Bauzeitenplan, Bemusterung, Elektroplanung Raum für Raum",
          "<b>Lückenlos dokumentiert:</b> 160 Bautagebuch-Einträge und 12 Besprechungsprotokolle",
          "<b>Richtig abnehmen:</b> Kontroll-Checklisten je Gewerk, Abnahmeprotokolle, Mängellisten",
          "<b>Für später:</b> Hausakte, Gewährleistungsfristen, Wartungsplan, Zählerstände"]:
    txt.append(Paragraph(f"<font color='#F2A900'>✓</font>&nbsp;&nbsp;{t}", li))
txt.append(Paragraph(f"<br/>Großes A4-Format mit viel Platz zum Schreiben. Rechtsstand {STAND}.", b))
Frame(bx, BLEED + 2.0 * inch, bw, TRIM_H - 2.0 * inch - (SAFE - BLEED) - 0.4 * inch, 0, 0, 0, 0).addFromList(txt, c)
# Barcode-Bereich (unten rechts, 2" x 1.2") bleibt frei – KDP setzt dort den ISBN-Barcode.
c.showPage(); c.save()
print(f"Umschlag {W / inch:.3f} x {H / inch:.3f} in, Buchrücken {SPINE / inch:.4f} in")
