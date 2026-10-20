%% BTC_PROGNOSE  Richtungsprognose (steigt/faellt am naechsten Tag) mit Walk-forward-Backtest
% Ablauf: Daten laden -> Merkmale -> logistische Regression -> Walk-forward
%         -> Trefferquote, Signifikanz, Rendite nach Gebuehren, Vergleich mit Baselines.
% Laeuft ohne Toolbox in MATLAB und GNU Octave.

clear; clc;

%% Einstellungen
symbol     = 'BTCUSDT';   % z.B. ETHUSDT, SOLUSDT
intervall  = '1d';        % 1d, 4h, 1h
quelle     = 'binance';   % 'binance', 'demo' (Zufallsdaten) oder Pfad zu CSV
start_train = 365;        % Mindestanzahl Kerzen fuers erste Training
neu_trainieren = 30;      % alle N Kerzen neu trainieren
fenster    = 730;         % Trainingsfenster (rollierend), Inf = alles
lambda     = 5;           % L2-Regularisierung (hoeher = vorsichtiger)
schwelle   = 0.52;        % nur kaufen, wenn P(steigt) >= schwelle
gebuehr    = 0.001;       % 0,1 % je Kauf/Verkauf (inkl. Slippage grob)
jahr       = 365;         % Kerzen pro Jahr (1d: 365, 4h: 2190, 1h: 8760)

%% 1) Daten
[t, ~, ~, ~, c, v] = lade_kurse(symbol, intervall, quelle);
fprintf('%d Kerzen geladen (%s, %s)\n', numel(c), symbol, intervall);

%% 2) Merkmale und Ziel
[X, namen] = berechne_features(c, v);
r_next = [diff(log(c)); NaN];            % Rendite der NAECHSTEN Kerze
y = double(r_next > 0);                  % Ziel: 1 = steigt

gueltig = all(isfinite(X), 2) & isfinite(r_next);
idx = find(gueltig);

%% 3) Walk-forward: nur Vergangenheit trainieren, Zukunft testen
p = NaN(size(c));
for k = start_train:neu_trainieren:numel(idx)
  tr = idx(max(1, k - fenster + 1):k);
  te = idx(k+1:min(k + neu_trainieren, numel(idx)));
  if isempty(te), break; end
  mu = mean(X(tr,:)); sd = std(X(tr,:)); sd(sd == 0) = 1;
  w = logreg_fit((X(tr,:) - mu) ./ sd, y(tr), lambda);
  p(te) = logreg_predict(w, (X(te,:) - mu) ./ sd);
end

test = find(isfinite(p));
n = numel(test);
fprintf('Testzeitraum: %d Kerzen (out-of-sample)\n\n', n);

%% 4) Trefferquoten
treffer_modell = mean((p(test) >= 0.5) == y(test));
treffer_immer  = mean(y(test));                          % "steigt immer"
treffer_mom    = mean((X(test, 2) > 0) == y(test));      % r7 > 0 -> steigt
treffer_zufall = 0.5;

% Binomialtest: ist Trefferquote signifikant > 50 %?
z = (treffer_modell * n - n / 2) / sqrt(n / 4);
p_wert = 0.5 * erfc(z / sqrt(2));

fprintf('%-26s %6.2f %%\n', 'Treffer Modell:', 100 * treffer_modell);
fprintf('%-26s %6.2f %%\n', 'Treffer "steigt immer":', 100 * treffer_immer);
fprintf('%-26s %6.2f %%\n', 'Treffer Momentum (r7>0):', 100 * treffer_mom);
fprintf('%-26s %6.2f %%\n', 'Treffer Zufall:', 100 * treffer_zufall);
if p_wert < 0.05, urteil = '-> signifikant'; else, urteil = '-> NICHT signifikant (Zufall moeglich)'; end
fprintf('p-Wert (Modell > 50 %%):   %.4f  %s\n\n', p_wert, urteil);

%% 5) Strategie: long bei P >= schwelle, sonst Cash
pos = double(p(test) >= schwelle);
wechsel = abs(diff([0; pos]));
r_strat = pos .* r_next(test) - wechsel * gebuehr;
r_bh    = r_next(test);
r_mom   = double(X(test,2) > 0) .* r_next(test) - abs(diff([0; double(X(test,2) > 0)])) * gebuehr;

fprintf('%-18s %10s %10s %10s %8s\n', '', 'Rendite', 'Sharpe', 'MaxDD', 'Trades');
kennzahlen('Modell',        r_strat, jahr, sum(wechsel));
kennzahlen('Momentum r7',   r_mom,   jahr, sum(abs(diff([0; double(X(test,2) > 0)]))));
kennzahlen('Kaufen+Halten', r_bh,    jahr, 1);

%% 6) Aktuelle Prognose (Modell auf letzten Daten)
tr = idx(max(1, numel(idx) - fenster + 1):end);
mu = mean(X(tr,:)); sd = std(X(tr,:)); sd(sd == 0) = 1;
w = logreg_fit((X(tr,:) - mu) ./ sd, y(tr), lambda);
p_jetzt = logreg_predict(w, (X(end,:) - mu) ./ sd);
fprintf('\nP(%s steigt naechste Kerze) = %.1f %%\n', symbol, 100 * p_jetzt);
fprintf('Gewichte (standardisiert):\n');
for j = 1:numel(namen)
  fprintf('  %-12s %+.3f\n', namen{j}, w(j+1));
end

%% 7) Grafik
figure;
tage = (t(test) - t(test(1))) / 86400000;
plot(tage, exp(cumsum(r_bh)), tage, exp(cumsum(r_strat)), tage, exp(cumsum(r_mom)));
legend('Kaufen+Halten', 'Modell', 'Momentum r7', 'Location', 'northwest');
xlabel('Tage im Test'); ylabel('Kapital (Start = 1)');
title(sprintf('%s Walk-forward-Backtest (nach Gebuehren)', symbol));
grid on;
