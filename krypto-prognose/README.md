# Krypto-Kursprognose (MATLAB / Octave)

Walk-forward-Backtest für die Richtung der nächsten Kerze (steigt/fällt), z. B. BTCUSDT.
Kein Toolbox-Zwang – läuft in MATLAB und GNU Octave.

## Start
```matlab
cd krypto-prognose
btc_prognose
```
Einstellungen oben in `btc_prognose.m` (Symbol, Intervall, Gebühr, Schwelle …).
`quelle = 'demo'` nutzt Zufallsdaten (offline), oder Pfad zu einer CSV
(`zeit_ms,open,high,low,close,volume`, erste Zeile = Kopfzeile).

## Dateien
| Datei | Zweck |
|---|---|
| `btc_prognose.m` | Hauptskript: Daten → Merkmale → Walk-forward → Auswertung → Grafik |
| `lade_kurse.m` | Binance-API (paginiert) / CSV / Demo-Daten |
| `berechne_features.m` | Renditen 1/7/30, Abstand SMA20/50, Volatilität, RSI, Volumen-z |
| `logreg_fit.m`, `logreg_predict.m` | Logistische Regression mit L2 (Newton) |
| `kennzahlen.m` | Rendite, Sharpe, max. Drawdown, Trades |

## Auswertung lesen
- **Trefferquote** mit Baselines vergleichen („steigt immer“, Momentum, Zufall).
- **p-Wert < 0,05** → Trefferquote signifikant über 50 %, sonst evtl. Zufall.
- Entscheidend ist **Rendite nach Gebühren** und **Drawdown**, nicht die Trefferquote.

Hinweis: Mit den Demo-Zufallsdaten liegt das Modell bei ca. 50 % – so soll es sein.
Keine Anlageberatung.
