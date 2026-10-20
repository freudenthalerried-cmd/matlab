%% KORRELATION_BTC  Gleichlauf, Beta und Verzoegerung von Altcoins zu BTC - je Jahr
% Misst pro Kalenderjahr:
%   Korr     - Korrelation der Renditen zu BTC (gleiche Kerze)
%   Beta     - Hebel zu BTC (1,5 = Coin bewegt sich 1,5x so stark)
%   Crash    - Korrelation nur an BTC-Crashtagen (BTC-Rendite < -crash_grenze)
%   Lag1..3  - Korrelation Coin(t) mit BTC(t-k): folgt der Coin BTC verzoegert?
%   Treffer  - wie oft sagt die Richtung von BTC(t-1) die Richtung des Coins(t) richtig voraus
%   Coin/BTC - Jahresrendite Coin minus BTC (Altcoin besser/schlechter als BTC)
% Laeuft ohne Toolbox in MATLAB und GNU Octave.

clear; clc;

%% Einstellungen
basis      = 'BTCUSDT';
coins      = {'ETHUSDT', 'SOLUSDT', 'XRPUSDT', 'BNBUSDT', 'ADAUSDT', 'DOGEUSDT'};
intervall  = '1d';        % '1d' fuer Tage, '1h' fuer Stunden (Verzoegerung kurzfristig)
quelle     = 'binance';   % 'binance' oder 'demo' (simulierte Daten zum Testen)
crash_grenze = 0.03;      % 1d: 3 %, bei 1h eher 0.01
fenster    = 90;          % Kerzen fuer rollierende Korrelation (Grafik)
max_lag    = 3;

%% Daten laden
[tb, cb] = lade_coin(basis, intervall, quelle, []);
rb_all = [NaN; diff(log(cb))];

ergebnis = {};                            % Zeilen: {coin, jahr, korr, beta, crash, lag1..3, treffer, diff}
figure; hold on; legende = {};

for i = 1:numel(coins)
  [tc, cc] = lade_coin(coins{i}, intervall, quelle, rb_all, i);
  [t, ia, ic] = intersect(tb, tc);        % nur gemeinsame Zeitpunkte
  if numel(t) < fenster + 10, continue; end
  rb = diff(log(cb(ia)));  ra = diff(log(cc(ic)));  t = t(2:end);
  jahre = jahr_aus_ms(t);

  for j = unique(jahre)'
    m = jahre == j;
    if sum(m) < 30, continue; end
    x = rb(m); y = ra(m);
    k = korr(x, y);
    b = kovar(x, y) / var(x);
    c = x < -crash_grenze;
    if sum(c) >= 5, kc = korr(x(c), y(c)); else, kc = NaN; end
    lags = NaN(1, max_lag);
    for L = 1:max_lag
      lags(L) = korr(x(1:end-L), y(1+L:end));
    end
    treffer = mean(sign(x(1:end-1)) == sign(y(2:end)));
    diff_jahr = 100 * (exp(sum(y)) - exp(sum(x)));
    ergebnis(end+1, :) = {coins{i}, j, k, b, kc, lags, treffer, diff_jahr}; %#ok<SAGROW>
  end

  % rollierende Korrelation fuer die Grafik
  rk = NaN(size(rb));
  for s = fenster:numel(rb)
    rk(s) = korr(rb(s-fenster+1:s), ra(s-fenster+1:s));
  end
  plot(t / 86400000 / 365.25 + 1970, rk);
  legende{end+1} = strrep(coins{i}, 'USDT', ''); %#ok<SAGROW>
end

%% Tabelle je Coin und Jahr
fprintf('%-9s %5s %6s %6s %6s %7s %7s %7s %8s %9s\n', ...
        'Coin', 'Jahr', 'Korr', 'Beta', 'Crash', 'Lag1', 'Lag2', 'Lag3', 'Treffer', 'Coin-BTC');
for r = 1:size(ergebnis, 1)
  e = ergebnis(r, :);
  fprintf('%-9s %5d %6.2f %6.2f %6.2f %7.3f %7.3f %7.3f %7.1f%% %8.0f%%\n', ...
          strrep(e{1}, 'USDT', ''), e{2}, e{3}, e{4}, e{5}, e{6}(1), e{6}(2), e{6}(3), 100 * e{7}, e{8});
end

%% Durchschnitt ueber alle Coins je Jahr
jahre_alle = cell2mat(ergebnis(:, 2));
fprintf('\nDurchschnitt aller Coins je Jahr:\n');
fprintf('%5s %6s %6s %6s %7s %8s\n', 'Jahr', 'Korr', 'Beta', 'Crash', 'Lag1', 'Treffer');
for j = unique(jahre_alle)'
  m = jahre_alle == j;
  lag1 = cellfun(@(v) v(1), ergebnis(m, 6));
  fprintf('%5d %6.2f %6.2f %6.2f %7.3f %7.1f%%\n', j, mean(cell2mat(ergebnis(m, 3))), ...
          mean(cell2mat(ergebnis(m, 4))), mean_ohne_nan(cell2mat(ergebnis(m, 5))), ...
          mean(lag1), 100 * mean(cell2mat(ergebnis(m, 7))));
end
n_jahr = round(365 * (strcmp(intervall, '1d')) + 8760 * (strcmp(intervall, '1h')));
if n_jahr > 0
  fprintf('\nFaustregel: |Lag1| unter ~%.3f ist bei %d Kerzen/Jahr nicht von Zufall unterscheidbar.\n', ...
          2 / sqrt(n_jahr), n_jahr);
end

xlabel('Jahr'); ylabel(sprintf('Korrelation zu BTC (%d Kerzen rollierend)', fenster));
title('Gleichlauf der Altcoins mit BTC'); legend(legende, 'Location', 'southeast'); grid on;
