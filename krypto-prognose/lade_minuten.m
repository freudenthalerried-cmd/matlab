function [t, c] = lade_minuten(symbol, quelle, monate, nr)
%LADE_MINUTEN  1-Minuten-Schlusskurse der letzten N vollen Monate.
%   Quelle 'binance': Monatsdateien von data.binance.vision (schnell, ~12 Downloads),
%   Ergebnis wird in daten_<SYMBOL>_1m.mat zwischengespeichert.
%   Quelle 'demo': simulierte Minuten (30 Tage) mit eingebauter Verzoegerung zu BTC.
%   t = Zeit in ms (UTC), c = Schlusskurs.
  if nargin < 3, monate = 12; end
  if nargin < 4, nr = 0; end
  if strcmpi(quelle, 'demo')
    [t, c] = demo_minuten(nr);
    return;
  end

  cache = sprintf('daten_%s_1m_%dM.mat', symbol, monate);
  if exist(cache, 'file')
    s = load(cache); t = s.t; c = s.c;
    return;
  end

  jetzt = datevec(now);
  t = []; c = [];
  for k = monate:-1:1
    d = datevec(datenum(jetzt(1), jetzt(2) - k, 1));
    name = sprintf('%s-1m-%04d-%02d', symbol, d(1), d(2));
    url = sprintf('https://data.binance.vision/data/spot/monthly/klines/%s/1m/%s.zip', symbol, name);
    zipdatei = fullfile(tempdir, [name '.zip']);
    fprintf('  lade %s ...\n', name);
    try
      if exist('OCTAVE_VERSION', 'builtin'), urlwrite(url, zipdatei); else, websave(zipdatei, url); end
    catch
      warning('%s nicht verfuegbar - uebersprungen', name);
      continue;
    end
    dateien = unzip(zipdatei, tempdir);
    [tm, cm] = lies_csv(dateien{1});
    t = [t; tm]; c = [c; cm];            %#ok<AGROW>
    delete(zipdatei); delete(dateien{1});
  end
  [t, i] = unique(t); c = c(i);
  save(cache, 't', 'c');
end

function [t, c] = lies_csv(datei)
  fid = fopen(datei, 'r');
  erste = fgetl(fid);
  kopf = double(isletter(erste(1)));     % neuere Dateien koennen eine Kopfzeile haben
  frewind(fid);
  d = textscan(fid, '%f %*f %*f %*f %f %*[^\n]', 'Delimiter', ',', 'HeaderLines', kopf);
  fclose(fid);
  t = d{1}; c = d{2};
  if ~isempty(t) && t(1) > 1e14, t = t / 1000; end   % ab 2025 Mikrosekunden
end

function [t, c] = demo_minuten(nr)
  n = 30 * 1440;
  randn('seed', 7);
  rb = 0.0008 * randn(n, 1);             % BTC-Minutenrenditen
  if nr == 0
    r = rb;
  else
    randn('seed', 7 + nr);
    r = 1.2 * rb + 0.3 * [0; rb(1:end-1)] + 0.0007 * randn(n, 1);   % Coin folgt BTC um 1 Minute
  end
  t = (0:n-1)' * 60000 + 1.7e12;
  c = 100 * exp(cumsum(r));
end
