%% KORRELATION_MINUTEN  Minuten-Korrelationsmodell Altcoins <-> BTC ueber das letzte Jahr
% 1) Verzoegerungsprofil: Korrelation Coin(t) mit BTC(t-k), k = -5..+5 Minuten
% 2) Je Monat: Korrelation, Beta, Lag-1-Korrelation (Vergleich ueber die Monate)
% 3) Modell: Coin-Rendite(t) = a + b1*BTC(t-1) + ... + b5*BTC(t-5)  (nur Vergangenheit!)
%    Walk-forward je Monat: auf allen Vormonaten trainieren, im Monat testen.
%    Handel nur, wenn |Prognose| > Gebuehren fuer Kauf + Verkauf.
% Laeuft ohne Toolbox in MATLAB und GNU Octave.

clear; clc;

%% Einstellungen
basis   = 'BTCUSDT';
coins   = {'ETHUSDT', 'SOLUSDT', 'XRPUSDT', 'BNBUSDT', 'ADAUSDT', 'DOGEUSDT'};
quelle  = 'binance';     % 'binance' oder 'demo'
monate  = 12;            % letzte N volle Monate
max_lag = 5;             % Minuten
gebuehr = 0.001;         % je Seite (0,1 %); Maker/VIP z.B. 0.0002

%% BTC laden
fprintf('Lade %s ...\n', basis);
[tb, cb] = lade_minuten(basis, quelle, monate, 0);

gesamt = {};
figure;
for i = 1:numel(coins)
  coin = strrep(coins{i}, 'USDT', '');
  fprintf('\nLade %s ...\n', coins{i});
  [tc, cc] = lade_minuten(coins{i}, quelle, monate, i);
  [t, ia, ic] = intersect(tb, tc);
  if numel(t) < 1440 * 5, fprintf('  zu wenig Daten\n'); continue; end

  % Minutenrenditen, nur zwischen direkt aufeinanderfolgenden Minuten
  luecke = [true; diff(t) ~= 60000];
  rb = [NaN; diff(log(cb(ia)))]; rb(luecke) = NaN;
  ra = [NaN; diff(log(cc(ic)))]; ra(luecke) = NaN;
  dv = datevec(t / 86400000 + datenum(1970, 1, 1));
  monat = dv(:,1) * 100 + dv(:,2);

  %% 1) Verzoegerungsprofil (ganzes Jahr)
  ks = -max_lag:max_lag;
  profil = NaN(size(ks));
  for j = 1:numel(ks)
    profil(j) = korr_nan(ra, verschiebe(rb, ks(j)));
  end
  subplot(ceil(numel(coins) / 2), 2, i);
  bar(ks, profil); grid on;
  title(sprintf('%s: Korr. mit BTC um k Min. frueher', coin));
  xlabel('k (Minuten, >0 = BTC fuehrt)'); ylabel('Korrelation');

  %% 2) + 3) Monatsweise Kennzahlen und Walk-forward-Modell
  X = zeros(numel(rb), max_lag);
  for k = 1:max_lag, X(:, k) = verschiebe(rb, k); end
  ok = all(isfinite(X), 2) & isfinite(ra) & isfinite(rb);

  fprintf('\n%s - Verzoegerungsprofil (ganzes Jahr):\n', coin);
  for j = 1:numel(ks), fprintf('  k=%+d: %+.3f', ks(j), profil(j)); end
  fprintf('\n\n%-7s %6s %6s %7s %9s %8s %10s %8s %11s %11s\n', 'Monat', 'Korr', 'Beta', 'Lag1', ...
          'R2 test', 'Treffer', 'roh 0-Geb', 'Trades', 'brutto %', 'netto %');

  mon = unique(monat(ok))';
  for m = mon
    im = ok & monat == m;
    x0 = rb(im); y0 = ra(im);
    k0 = korr_nan(y0, x0);
    b0 = kovar(x0, y0) / var(x0);
    l1 = korr_nan(y0, X(im, 1));

    tr = ok & monat < m;                  % nur Vormonate trainieren
    if sum(tr) < 1440 * 5
      fprintf('%-7d %6.2f %6.2f %+7.3f %9s\n', m, k0, b0, l1, '(Training)');
      gesamt(end+1, :) = {coin, m, k0, b0, l1, NaN, NaN, 0, 0, 0}; %#ok<SAGROW>
      continue;
    end
    A = [ones(sum(tr), 1), X(tr, :)];
    w = A \ ra(tr);
    p = [ones(sum(im), 1), X(im, :)] * w;
    r2 = 1 - sum((y0 - p).^2) / sum((y0 - mean(ra(tr))).^2);
    bew = y0 ~= 0 & p ~= 0;
    treffer = mean(sign(p(bew)) == sign(y0(bew)));
    roh = sum(sign(p) .* y0);             % jede Minute handeln, OHNE Gebuehren (theoretisch)
    handel = abs(p) > 2 * gebuehr;        % erwartete Bewegung > Kosten
    brutto = sum(sign(p(handel)) .* y0(handel));
    netto  = brutto - 2 * gebuehr * sum(handel);
    fprintf('%-7d %6.2f %6.2f %+7.3f %9.4f %7.1f%% %9.1f%% %8d %10.2f%% %10.2f%%\n', ...
            m, k0, b0, l1, r2, 100 * treffer, 100 * roh, sum(handel), 100 * brutto, 100 * netto);
    gesamt(end+1, :) = {coin, m, k0, b0, l1, r2, treffer, sum(handel), brutto, netto}; %#ok<SAGROW>
  end
end

%% Zusammenfassung je Coin
fprintf('\n=== Zusammenfassung (Testmonate) ===\n');
fprintf('%-6s %6s %6s %7s %9s %8s %8s %10s\n', 'Coin', 'Korr', 'Beta', 'Lag1', 'R2 test', 'Treffer', 'Trades', 'netto %');
for n = unique(gesamt(:, 1))'
  m = strcmp(gesamt(:, 1), n{1});
  r2 = cell2mat(gesamt(m, 6)); ok = isfinite(r2);
  tr = cell2mat(gesamt(m, 7));
  fprintf('%-6s %6.2f %6.2f %+7.3f %9.4f %7.1f%% %8d %9.2f%%\n', n{1}, ...
          mean(cell2mat(gesamt(m, 3))), mean(cell2mat(gesamt(m, 4))), mean(cell2mat(gesamt(m, 5))), ...
          mean(r2(ok)), 100 * mean(tr(ok)), sum(cell2mat(gesamt(m, 8))), 100 * sum(cell2mat(gesamt(m, 10))));
end
fprintf(['\nLesen: Lag1 > 0 = Coin folgt BTC mit 1 Minute Verzoegerung. ' ...
         'Nutzbar nur, wenn "netto %%" nach Gebuehren klar positiv ist.\n']);
