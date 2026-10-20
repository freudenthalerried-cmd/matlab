"""Erzeugt den Innenteil (A4, s/w) für KDP: 'Unser Hausbau – Bautagebuch für Bauherren in Österreich'.
Aufruf: python3 build_book.py <ausgabeordner>"""
import sys
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, Table,
                                TableStyle, PageBreak, Flowable, KeepTogether, CondPageBreak)
from reportlab.platypus.tableofcontents import TableOfContents
from content import *  # Texte und Listen

F = "/usr/share/fonts/truetype/dejavu/"
pdfmetrics.registerFont(TTFont("R", F + "DejaVuSans.ttf"))
pdfmetrics.registerFont(TTFont("B", F + "DejaVuSans-Bold.ttf"))
pdfmetrics.registerFontFamily("R", normal="R", bold="B", italic="R", boldItalic="B")
from reportlab.platypus import tables as _tables
_tables.CellStyle.fontname = "R"  # sonst nutzt Table für leere Zellen Helvetica (KDP: nur eingebettete Schriften)

INK = colors.HexColor("#222222"); GREY = colors.HexColor("#8a8a8a"); LIGHT = colors.HexColor("#e6e6e6")
LINE = colors.HexColor("#b0b0b0")
W, H = A4
M_IN, M_OUT, M_TOP, M_BOT = 20 * mm, 20 * mm, 18 * mm, 20 * mm
CW = W - M_IN - M_OUT  # Inhaltsbreite

S = dict(
    h1=ParagraphStyle("h1", fontName="B", fontSize=19, leading=24, textColor=INK, spaceAfter=4 * mm),
    h2=ParagraphStyle("h2", fontName="B", fontSize=12.5, leading=16, textColor=INK, spaceBefore=4 * mm, spaceAfter=2 * mm),
    body=ParagraphStyle("body", fontName="R", fontSize=9.6, leading=13.6, textColor=INK, spaceAfter=2 * mm),
    small=ParagraphStyle("small", fontName="R", fontSize=8, leading=10.5, textColor=INK),
    cell=ParagraphStyle("cell", fontName="R", fontSize=8.3, leading=10.4, textColor=INK),
    cellb=ParagraphStyle("cellb", fontName="B", fontSize=8.3, leading=10.4, textColor=INK),
    check=ParagraphStyle("check", fontName="R", fontSize=9.4, leading=12.6, textColor=INK, leftIndent=6 * mm,
                         firstLineIndent=-6 * mm, spaceAfter=1.3 * mm),
    tip=ParagraphStyle("tip", fontName="R", fontSize=9.2, leading=13, textColor=INK),
    title=ParagraphStyle("title", fontName="B", fontSize=30, leading=38, textColor=INK, alignment=1),
    part=ParagraphStyle("part", fontName="B", fontSize=30, leading=38, textColor=INK, alignment=1),
    partsub=ParagraphStyle("partsub", fontName="R", fontSize=12, leading=17, textColor=INK, alignment=1),
)


class Doc(BaseDocTemplate):
    def __init__(self, fn):
        super().__init__(fn, pagesize=A4, leftMargin=M_IN, rightMargin=M_OUT, topMargin=M_TOP,
                         bottomMargin=M_BOT, title=TITLE, author=AUTHOR, subject=SUBTITLE,
                         initialFontName="R", initialFontSize=9)
        fr = Frame(M_IN, M_BOT, CW, H - M_TOP - M_BOT, id="f", leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
        self.addPageTemplates([PageTemplate("p", [fr], onPageEnd=self.deco)])
        self.section = ""

    def deco(self, c, doc):
        n = c.getPageNumber()
        if n <= 2:
            return
        c.setFont("R", 8); c.setFillColor(GREY)
        c.drawCentredString(W / 2, 10 * mm, str(n))
        if self.section:
            c.drawCentredString(W / 2, H - 10 * mm, self.section)

    def afterFlowable(self, f):
        if isinstance(f, Paragraph) and f.style.name in ("h1", "part"):
            txt = f.getPlainText()
            if f.style.name == "h1":
                self.section = txt
            # wiederholte Formularseiten nur einmal ins Inhaltsverzeichnis
            key = txt.split(":")[0].split(" (")[0].split(" –")[0]
            seen = self.__dict__.setdefault("_toc_seen", set())
            if txt != "Inhalt" and (f.style.name == "part" or key not in seen):
                seen.add(key)
                self.notify("TOCEntry", (0 if f.style.name == "part" else 1, key if ":" in txt else txt, self.page))

    def handle_documentBegin(self):
        self._toc_seen = set()
        super().handle_documentBegin()


class SetSection(Flowable):
    def __init__(self, t): super().__init__(); self.t = t
    def wrap(self, *a): return 0, 0
    def draw(self): self.canv._doctemplate.section = self.t


class DotGrid(Flowable):
    def __init__(self, w, h, step=5 * mm): super().__init__(); self.w, self.h, self.s = w, h, step
    def wrap(self, *a): return self.w, self.h
    def draw(self):
        c = self.canv; c.setFillColor(LINE)
        y = 0
        while y <= self.h:
            x = 0
            while x <= self.w:
                c.circle(x, y, 0.28, stroke=0, fill=1); x += self.s
            y += self.s


def P(t, s="body"): return Paragraph(t, S[s])


def h1(t): return [P(t, "h1")]


def checklist(items):
    return [P("☐&nbsp;&nbsp;" + i, "check") for i in items]


def tip(text, label="Praxistipp"):
    t = Table([[P(f"<b>{label}:</b> {text}", "tip")]], colWidths=[CW])
    t.setStyle(TableStyle([("BOX", (0, 0), (-1, -1), 0.8, INK), ("BACKGROUND", (0, 0), (-1, -1), LIGHT),
                           ("LEFTPADDING", (0, 0), (-1, -1), 3 * mm), ("RIGHTPADDING", (0, 0), (-1, -1), 3 * mm),
                           ("TOPPADDING", (0, 0), (-1, -1), 2.2 * mm), ("BOTTOMPADDING", (0, 0), (-1, -1), 2.5 * mm)]))
    return [Spacer(1, 1.5 * mm), t, Spacer(1, 3 * mm)]


def grid(header, nrows, widths, rowh=7.5 * mm, prefill=None, hdrh=None):
    """Formular-Tabelle mit Kopfzeile und leeren (oder vorbefüllten) Zeilen; widths als Anteile."""
    tot = sum(widths); cw = [CW * w / tot for w in widths]
    data = [[P(h, "cellb") for h in header]]
    prefill = prefill or []
    for i in range(nrows):
        row = prefill[i] if i < len(prefill) else [""] * len(header)
        data.append([P(str(x), "cell") if x else "" for x in row])
    t = Table(data, colWidths=cw, rowHeights=[hdrh] + [rowh] * nrows, repeatRows=1)
    t.setStyle(TableStyle([("GRID", (0, 0), (-1, -1), 0.5, LINE), ("BACKGROUND", (0, 0), (-1, 0), LIGHT),
                           ("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("LEFTPADDING", (0, 0), (-1, -1), 1.6 * mm),
                           ("RIGHTPADDING", (0, 0), (-1, -1), 1.2 * mm), ("TOPPADDING", (0, 0), (-1, -1), 0.8 * mm),
                           ("BOTTOMPADDING", (0, 0), (-1, -1), 0.8 * mm)]))
    return t


def fields(labels, cols=1, rowh=8.5 * mm, labw=0.38):
    """Beschriftete Schreibzeilen (Label | Linie), optional zweispaltig."""
    data, row = [], []
    for lab in labels:
        row += [P(lab, "cellb"), ""]
        if len(row) == 2 * cols:
            data.append(row); row = []
    if row:
        data.append(row + [""] * (2 * cols - len(row)))
    lw = CW / cols * labw; fw = CW / cols - lw
    t = Table(data, colWidths=[lw, fw] * cols, rowHeights=rowh)
    st = [("VALIGN", (0, 0), (-1, -1), "BOTTOM"), ("LEFTPADDING", (0, 0), (-1, -1), 0), ("BOTTOMPADDING", (0, 0), (-1, -1), 1)]
    for c in range(cols):
        st.append(("LINEBELOW", (2 * c + 1, 0), (2 * c + 1, -1), 0.5, LINE))
    t.setStyle(TableStyle(st))
    return t


def lines(n, rowh=8 * mm, label=None):
    out = [P(f"<b>{label}</b>", "cell")] if label else []
    t = Table([[""]] * n, colWidths=[CW], rowHeights=rowh)
    t.setStyle(TableStyle([("LINEBELOW", (0, 0), (-1, -1), 0.5, LINE)]))
    return out + [t]


def part(num, title, sub):
    return [PageBreak(), SetSection(""), Spacer(1, 85 * mm), P(f"Teil {num}", "partsub"), Spacer(1, 3 * mm),
            P(title, "part"), Spacer(1, 6 * mm), P(sub, "partsub")]


# ---------------------------------------------------------------- Seiten

def front():
    st = []
    st += [Spacer(1, 70 * mm), P(TITLE, "title"), Spacer(1, 6 * mm), P(SUBTITLE, "partsub"), Spacer(1, 30 * mm),
           P("Dieses Buch gehört:", "partsub"), Spacer(1, 12 * mm), fields(["Name"], rowh=10 * mm, labw=0.15),
           fields(["Bauvorhaben"], rowh=10 * mm, labw=0.2), PageBreak()]
    st += [Spacer(1, 150 * mm)] + [P(t, "small") for t in IMPRESSUM] + [PageBreak()]
    toc = TableOfContents()
    toc.levelStyles = [ParagraphStyle("t0", fontName="B", fontSize=10.5, leading=15, spaceBefore=3 * mm),
                       ParagraphStyle("t1", fontName="R", fontSize=9.4, leading=12.5, leftIndent=6 * mm)]
    toc.dotsMinLevel = 0
    st += [SetSection("Inhalt"), P("Inhalt", "h1"), toc]
    return st


def knowledge():
    st = part(1, "Wissen & Ablauf", "Was Bauherren in Österreich wissen und erledigen müssen – Schritt für Schritt")
    for sec in KNOWLEDGE:
        st += [CondPageBreak(60 * mm)] if not sec.get("newpage", True) else [PageBreak()]
        st += h1(sec["title"])
        for blk in sec["blocks"]:
            kind, val = blk[0], blk[1]
            if kind == "p": st.append(P(val))
            elif kind == "h2": st += [CondPageBreak(35 * mm), P(val, "h2")]
            elif kind == "check": st += checklist(val)
            elif kind == "tip": st += tip(val)
            elif kind == "warn": st += tip(val, "Achtung")
            elif kind == "table":
                hdr, rows, wid = val
                st.append(grid(hdr, len(rows), wid, rowh=None, prefill=rows)); st.append(Spacer(1, 3 * mm))
    return st


def project():
    st = part(2, "Planung & Kosten", "Projektdaten, Kontakte, Kosten, Angebote, Termine und Ausstattung")
    st += [PageBreak()] + h1("Projekt-Steckbrief")
    st.append(P("Grundstück", "h2"))
    st.append(fields(["Adresse", "Katastralgemeinde (KG)", "Einlagezahl (EZ)", "Grundstücksnummer(n)", "Grundstücksfläche m²",
                      "Widmung lt. Flächenwidmungsplan", "Bebauungsbestimmungen", "Gefahrenzonen / Hochwasser"], labw=0.36))
    st.append(P("Gebäude", "h2"))
    st.append(fields(["Haustyp / Bauweise", "Wohnnutzfläche m²", "Geschoße / Keller", "Heizsystem", "Energiekennzahl (HWB)",
                      "Geplanter Baubeginn", "Geplanter Einzug"], labw=0.36))
    st.append(P("Behörde & Bescheide", "h2"))
    st.append(fields(["Baubehörde (Gemeinde)", "Ansuchen eingereicht am", "Bauverhandlung am", "Baubewilligung (Zahl, Datum)",
                      "Rechtskräftig seit", "Baubeginnsanzeige am", "Fertigstellungsanzeige am"], labw=0.36))
    st += [PageBreak()] + h1("Wichtige Kontakte")
    roles = ["Planer / Architekt", "Baumeister / Bauführer", "Statiker", "Bauaufsicht / ÖBA", "Baustellenkoordinator (BauKG)",
             "Baubehörde Gemeinde", "Bank / Finanzierung", "Notar / Treuhänder", "Versicherung", "Vermesser", "Energieausweis",
             "Elektro", "Sanitär / Heizung", "Dach / Zimmerer", "Spengler", "Fenster / Türen", "Estrich", "Fliesen", "Boden",
             "Maler", "Fassade", "Netzbetreiber Strom", "Wasser / Kanal", "Rauchfangkehrer", "Nachbar links", "Nachbar rechts", "", ""]
    st.append(grid(["Funktion", "Firma / Name", "Telefon", "E-Mail", "Notiz"], len(roles), [2.2, 2.6, 1.6, 2.4, 1.2],
                   rowh=8.3 * mm, prefill=[[r, "", "", "", ""] for r in roles]))
    # Kosten
    st += [PageBreak()] + h1("Kostenplan nach ÖNORM B 1801-1")
    st.append(P(KOSTEN_INTRO))
    st.append(grid(["Kostenbereich", "Budget €", "Auftrag/Angebot €", "Abgerechnet €", "Abweichung €"], len(KOSTENBEREICHE),
                   [3.3, 1.5, 1.7, 1.6, 1.6], rowh=11 * mm, prefill=[[k, "", "", "", ""] for k in KOSTENBEREICHE]))
    st += [Spacer(1, 3 * mm), grid(["", "Budget €", "Auftrag/Angebot €", "Abgerechnet €", "Abweichung €"], 1,
                                    [3.3, 1.5, 1.7, 1.6, 1.6], rowh=11 * mm, prefill=[["<b>Gesamtkosten</b>", "", "", "", ""]])]
    st += tip("Planen Sie eine Reserve von 10–15 % der Baukosten ein. Fast jedes Bauvorhaben hat unvorhergesehene Mehrkosten "
              "(Boden, Wetter, Änderungswünsche, Preissteigerungen).")
    st += [PageBreak()] + h1("Nebenkosten – Checkliste & Budget")
    st.append(P(NEBENKOSTEN_INTRO))
    st.append(grid(["Position", "Hinweis", "Budget €", "Ist €"], len(NEBENKOSTEN), [2.6, 4.2, 1.2, 1.2], rowh=None,
                   prefill=[[a, b, "", ""] for a, b in NEBENKOSTEN]))
    st += [PageBreak()] + h1("Finanzierungsübersicht")
    st.append(P("Mittelherkunft", "h2"))
    st.append(grid(["Quelle", "Betrag €", "verfügbar ab", "Notiz"], 8, [3, 1.6, 1.6, 3.5], rowh=8.5 * mm,
                   prefill=[[x, "", "", ""] for x in ["Eigenmittel (Ersparnisse)", "Eigenleistung (bewertet)", "Wohnbauförderung Land",
                                              "Sonstige Förderungen", "Kredit 1", "Kredit 2", "", "<b>Summe</b>"]]))
    st.append(P("Kreditangebote vergleichen", "h2"))
    st.append(grid(["Kriterium", "Bank A", "Bank B", "Bank C"], len(KREDIT_VERGLEICH), [3, 2, 2, 2], rowh=8 * mm,
                   prefill=[[k, "", "", ""] for k in KREDIT_VERGLEICH]))
    # Rechnungsjournal
    for i in range(4):
        st += [PageBreak()] + h1("Rechnungs- & Zahlungsjournal" + ("" if i == 0 else " (Forts.)"))
        if i == 0:
            st.append(P(ZAHLUNG_INTRO))
        st.append(grid(["Datum", "Firma", "Rechnung Nr. / Teilrechnung", "Betrag brutto €", "geprüft ✓", "bezahlt am",
                        "Rücklass €"], 25 if i else 21, [1.3, 2.4, 2.2, 1.6, 1, 1.4, 1.3], rowh=9 * mm))
    # Angebotsvergleich
    for g in GEWERKE_ANGEBOT:
        st += [PageBreak()] + h1("Angebotsvergleich: " + (g or "____________________"))
        st.append(grid(["Kriterium", "Firma A", "Firma B", "Firma C"], len(ANGEBOT_KRITERIEN), [3, 2.2, 2.2, 2.2],
                       rowh=9.6 * mm, prefill=[[k, "", "", ""] for k in ANGEBOT_KRITERIEN]))
        st += [Spacer(1, 3 * mm)] + lines(2, label="Begründung der Entscheidung:")
    # Bauzeitenplan
    st += [PageBreak()] + h1("Bauzeitenplan")
    st.append(P("Monate oben eintragen, Zeiträume je Gewerk schraffieren. Geplant = Bleistift, tatsächlich = Kugelschreiber."))
    months = [""] * 12
    st.append(grid(["Gewerk / Phase"] + months, len(BAUABLAUF) + 4, [3.2] + [0.6] * 12, rowh=7.6 * mm,
                   prefill=[[g] + [""] * 12 for g in BAUABLAUF]))
    # Bemusterung
    st += [PageBreak()] + h1("Ausstattung & Bemusterung")
    st.append(P(BEMUSTERUNG_INTRO))
    for i in range(3):
        if i: st += [PageBreak()] + h1("Ausstattung & Bemusterung (Forts.)")
        st.append(grid(["Raum", "Bauteil (Boden, Fliese, Farbe, Tür …)", "Produkt / Farbe / Format", "Lieferant", "Preis €",
                        "fix ✓"], 24 if i else 21, [1.6, 2.8, 2.8, 1.6, 1.1, 0.8], rowh=9.2 * mm))
    # Elektroplanung
    st += [PageBreak()] + h1("Elektroplanung Raum für Raum")
    st.append(P(ELEKTRO_INTRO))
    st += checklist(ELEKTRO_VERGESSEN)
    for i, r in enumerate(RAEUME):
        if i % 2 == 0: st += [PageBreak()]
        st.append(KeepTogether([P("Raum: " + (r or "____________________"), "h2"),
                                grid(["Element", "Anzahl", "Position / Höhe", "Notiz"], len(ELEKTRO_ELEMENTE),
                                     [2.6, 0.9, 3, 3], rowh=7.6 * mm, prefill=[[e, "", "", ""] for e in ELEKTRO_ELEMENTE]),
                                Spacer(1, 4 * mm)]))
    return st


def diary_entry():
    def row(*cells):
        return list(cells)
    wetter = "☐ sonnig&nbsp;&nbsp; ☐ bewölkt&nbsp;&nbsp; ☐ Regen&nbsp;&nbsp; ☐ Schnee&nbsp;&nbsp; ☐ Frost&nbsp;&nbsp; ☐ Wind&nbsp;&nbsp;&nbsp; Temp.: ______ °C"
    data = [
        [P("<b>Datum:</b>", "cell"), "", P("<b>Wochentag:</b>", "cell"), "", P("<b>Zeit von–bis:</b>", "cell"), ""],
        [P("<b>Wetter:</b> " + wetter, "cell"), "", "", "", "", ""],
        [P("<b>Anwesende Firmen / Personen (Anzahl):</b>", "cell"), "", "", "", "", ""],
        ["", "", "", "", "", ""],
        [P("<b>Ausgeführte Arbeiten / Baufortschritt:</b>", "cell"), "", "", "", "", ""],
        ["", "", "", "", "", ""], ["", "", "", "", "", ""], ["", "", "", "", "", ""],
        [P("<b>Lieferungen / Material:</b>", "cell"), "", "", "", "", ""],
        [P("<b>Probleme, Mängel, Behinderungen:</b>", "cell"), "", "", "", "", ""],
        ["", "", "", "", "", ""],
        [P("<b>Absprachen / Anordnungen (wer, was):</b>", "cell"), "", "", "", "", ""],
        ["", "", "", "", "", ""],
        [P("<b>Foto-Nr.:</b> _______________&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<b>Als Nächstes:</b>", "cell"), "", "", "", "", ""],
    ]
    cw = [CW * x for x in (0.12, 0.18, 0.15, 0.15, 0.17, 0.23)]
    t = Table(data, colWidths=cw, rowHeights=8.9 * mm)
    st = [("BOX", (0, 0), (-1, -1), 0.9, INK), ("VALIGN", (0, 0), (-1, -1), "BOTTOM"),
          ("LEFTPADDING", (0, 0), (-1, -1), 1.6 * mm), ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
          ("BACKGROUND", (0, 0), (-1, 0), LIGHT), ("LINEBELOW", (0, 0), (-1, -1), 0.4, LINE)]
    for r in range(1, 14):
        st.append(("SPAN", (0, r), (-1, r)))
    t.setStyle(TableStyle(st))
    return t


def diary(pages=80):
    st = part(3, "Bautagebuch", "Ein Eintrag pro Baustellentag – Ihr Nachweis bei Streit, Mängeln und Verzögerungen")
    st += [PageBreak()] + h1("So führen Sie das Bautagebuch")
    st.append(P(TAGEBUCH_INTRO))
    st += checklist(TAGEBUCH_TIPPS)
    st.append(SetSection("Bautagebuch"))
    for _ in range(pages):
        st += [PageBreak(), diary_entry(), Spacer(1, 6 * mm), diary_entry()]
    return st


def control():
    st = part(4, "Kontrolle & Abnahme", "Besprechungen, Kontroll-Checklisten je Gewerk, Abnahme und Mängel")
    for i in range(12):
        st += [PageBreak()] + h1("Baubesprechung – Protokoll Nr. ____")
        st.append(fields(["Datum / Uhrzeit", "Ort", "Teilnehmer"], labw=0.22, rowh=8 * mm))
        st += lines(1)
        st.append(Spacer(1, 3 * mm))
        st.append(grid(["Nr.", "Thema / Beschluss", "Wer", "bis wann", "erl. ✓"], 15, [0.6, 5.6, 1.4, 1.3, 0.8], rowh=10.5 * mm))
        st.append(Spacer(1, 3 * mm))
        st.append(fields(["Nächste Besprechung", "Protokoll an alle verteilt am"], labw=0.32, rowh=8 * mm))
    for g in KONTROLLE:
        st += [PageBreak()] + h1("Kontrolle: " + g["title"])
        st.append(P(g["intro"]))
        st += checklist(g["items"])
        if g.get("tip"): st += tip(g["tip"])
        st += [Spacer(1, 2 * mm), fields(["Geprüft am / von", "Unterschrift"], cols=2, labw=0.42, rowh=9 * mm)]
    st += [PageBreak()] + h1("Abnahme – worauf achten?")
    for blk in ABNAHME_WISSEN:
        if blk[0] == "p": st.append(P(blk[1]))
        elif blk[0] == "h2": st.append(P(blk[1], "h2"))
        elif blk[0] == "check": st += checklist(blk[1])
        elif blk[0] == "tip": st += tip(blk[1])
    for i in range(8):
        if i % 2 == 0: st += [PageBreak()] + h1("Übergabe- / Abnahmeprotokoll")
        else: st.append(Spacer(1, 8 * mm))
        st.append(KeepTogether([
            fields(["Gewerk", "Firma", "Datum der Abnahme", "Anwesend"], cols=2, labw=0.3, rowh=8.5 * mm),
            Spacer(1, 2 * mm),
            P("Ergebnis: &nbsp;&nbsp;☐ abgenommen ohne Mängel &nbsp;&nbsp;☐ abgenommen mit Mängeln (siehe Mängelliste Nr. ____) "
              "&nbsp;&nbsp;☐ Abnahme verweigert wegen wesentlicher Mängel", "body"),
            fields(["Übernommene Unterlagen (Pläne, Befunde, Anleitungen)", "Gewährleistung beginnt am / endet am",
                    "Vereinbarter Haftrücklass / Garantie"], labw=0.48, rowh=8.5 * mm),
            Spacer(1, 6 * mm),
            fields(["Unterschrift Auftraggeber", "Unterschrift Auftragnehmer"], cols=2, labw=0.42, rowh=11 * mm)]))
    for i in range(6):
        st += [PageBreak()] + h1("Mängelliste" + (" (Forts.)" if i else ""))
        if i == 0: st.append(P(MAENGEL_INTRO))
        st.append(grid(["Nr.", "festgestellt am", "Ort / Raum", "Mangel (genau beschreiben, Foto-Nr.)", "Firma", "Frist",
                        "behoben am"], 20 if i == 0 else 23, [0.6, 1.3, 1.5, 4.1, 1.5, 1.1, 1.3], rowh=9.6 * mm))
    return st


def archive():
    st = part(5, "Hausakte & Wartung", "Unterlagen, Fristen, Wartung, Zählerstände, Notizen und Begriffe")
    st += [PageBreak()] + h1("Hausakte – diese Unterlagen aufbewahren")
    st.append(P(HAUSAKTE_INTRO))
    st.append(grid(["Unterlage", "vorhanden ✓", "Ablageort"], len(HAUSAKTE), [5, 1.3, 2.8], rowh=7.4 * mm,
                   prefill=[[d, "", ""] for d in HAUSAKTE]))
    st += tip("Fotografieren Sie alle Leitungen in Wänden, Böden und Decken <b>vor</b> dem Verputzen und vor dem Estrich – "
              "mit Maßband im Bild. Diese Fotos ersparen Ihnen später Bohrschäden und teure Suche.")
    for i in range(2):
        st += [PageBreak()] + h1("Gewährleistung & Garantien" + (" (Forts.)" if i else ""))
        if i == 0: st.append(P(GEWAEHR_INTRO))
        st.append(grid(["Gewerk / Produkt", "Firma / Hersteller", "Abnahme am", "Gewährleistung bis", "Garantie bis",
                        "Rücklass freigeben am"], 20 if i == 0 else 25, [2.2, 2.2, 1.3, 1.5, 1.3, 1.6], rowh=9 * mm))
    st += [PageBreak()] + h1("Wartungsplan fürs neue Haus")
    st.append(P(WARTUNG_INTRO))
    st.append(grid(["Was", "Wie oft", "Wer", "Hinweis"], len(WARTUNG), [2.6, 1.3, 1.3, 4.2], rowh=None,
                   prefill=[list(x) for x in WARTUNG]))
    st += [PageBreak()] + h1("Wartungsnachweis")
    st.append(grid(["Datum", "Anlage / Bauteil", "Durchgeführt von", "Ergebnis / nächster Termin"], 26, [1.3, 2.6, 2.4, 3.6],
                   rowh=9 * mm))
    st += [PageBreak()] + h1("Zählerstände")
    st.append(P("Zählerstände bei Übergabe, Einzug und jährlich notieren – hilft bei Abrechnungen und zeigt Verbrauchsfehler früh."))
    st.append(grid(["Datum", "Strom (kWh)", "PV-Einspeisung", "Wasser (m³)", "Gas / Wärme", "Anlass"], 24,
                   [1.3, 1.6, 1.6, 1.4, 1.5, 2.2], rowh=9 * mm))
    st += [PageBreak()] + h1("Begriffe von A bis Z")
    for k, v in GLOSSAR:
        st.append(P(f"<b>{k}</b> – {v}", "body"))
    for i in range(7):
        st += [PageBreak()] + h1("Skizzen" if i < 3 else "Notizen")
        if i < 3: st.append(DotGrid(CW, H - M_TOP - M_BOT - 20 * mm))
        else: st += lines(29)
    return st


def build(out):
    doc = Doc(out)
    story = front() + knowledge() + project() + diary() + control() + archive()
    doc.multiBuild(story)
    return doc.page


if __name__ == "__main__":
    n = build(sys.argv[1] + "/innenteil.pdf")
    print(n)
