function [t, o, h, l, c, v] = lade_kurse(symbol, intervall, quelle)
%LADE_KURSE  Laedt OHLCV-Kerzen von Binance oder aus einer CSV-Datei.
%   [t,o,h,l,c,v] = lade_kurse('BTCUSDT', '1d', 'binance')
%   [t,o,h,l,c,v] = lade_kurse('', '', 'demo')        % Zufallsdaten, offline
%   [t,o,h,l,c,v] = lade_kurse('', '', 'kurse.csv')   % CSV: zeit_ms,open,high,low,close,volume
%   t = Zeit in Millisekunden (UTC), Spalten jeweils als Vektor.

  if nargin < 3 || strcmpi(quelle, 'binance')
    daten = lade_binance(symbol, intervall);
  elseif strcmpi(quelle, 'demo')
    daten = demo_daten();                 % Zufallspfad zum Testen ohne Internet
  else
    daten = dlmread(quelle, ',', 1, 0);   % erste Zeile = Kopfzeile
  end

  daten = sortrows(daten, 1);
  [~, idx] = unique(daten(:,1));          % doppelte Kerzen entfernen
  daten = daten(idx, :);
  t = daten(:,1); o = daten(:,2); h = daten(:,3);
  l = daten(:,4); c = daten(:,5); v = daten(:,6);
end

function daten = lade_binance(symbol, intervall)
  basis = 'https://api.binance.com/api/v3/klines';
  start = 0;                              % ab Beginn der Historie
  daten = zeros(0, 6);
  while true
    url = sprintf('%s?symbol=%s&interval=%s&limit=1000&startTime=%d', ...
                  basis, symbol, intervall, start);
    roh = jsondecode(urlread(url));
    if isempty(roh), break; end
    block = kerzen_zu_matrix(roh);
    daten = [daten; block];               %#ok<AGROW>
    if size(block, 1) < 1000, break; end
    start = block(end, 1) + 1;
  end
  % letzte (noch offene) Kerze verwerfen
  daten = daten(1:end-1, :);
end

function m = kerzen_zu_matrix(roh)
  % Binance liefert gemischte Typen (Zahlen und Strings) -> Zelle von Zellen
  if isnumeric(roh)
    m = roh(:, 1:6);
    return;
  end
  n = numel(roh);
  m = zeros(n, 6);
  for i = 1:n
    k = roh{i};
    if ~iscell(k), k = num2cell(k); end
    for j = 1:6
      x = k{j};
      if ischar(x), x = str2double(x); end
      m(i, j) = x;
    end
  end
end

function daten = demo_daten()
  rand('seed', 1); randn('seed', 1);
  n = 2500;
  r = 0.0005 + 0.035 * randn(n, 1);       % reiner Zufall: nicht vorhersagbar
  c = 1000 * exp(cumsum(r));
  t = (0:n-1)' * 86400000;
  daten = [t, c, c .* 1.02, c .* 0.98, c, 1e6 * exp(0.3 * randn(n, 1))];
end
