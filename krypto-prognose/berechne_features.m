function [X, namen] = berechne_features(c, v)
%BERECHNE_FEATURES  Merkmale je Zeitpunkt t, nur aus Daten bis einschliesslich t.
%   c = Schlusskurse, v = Volumen (Spaltenvektoren). Zeilen mit NaN = zu wenig Historie.

  n = numel(c);
  r = [NaN; diff(log(c))];                % Log-Rendite

  r1  = r;
  r7  = log(c ./ verschiebe(c, 7));
  r30 = log(c ./ verschiebe(c, 30));
  sma20 = gleitend(c, 20);
  sma50 = gleitend(c, 50);
  abst20 = c ./ sma20 - 1;
  abst50 = c ./ sma50 - 1;
  vol20  = gleitend_std(r, 20);
  rsi14  = rsi(c, 14);
  lv = log(v + 1);
  vol_z = (lv - gleitend(lv, 20)) ./ gleitend_std(lv, 20);

  X = [r1, r7, r30, abst20, abst50, vol20, (rsi14 - 50) / 50, vol_z];
  namen = {'r1','r7','r30','abst_sma20','abst_sma50','vola20','rsi14','volumen_z'};
  X(1:min(n, 50), :) = NaN;               % Warmlaufphase
end

function y = verschiebe(x, k)
  y = [NaN(k, 1); x(1:end-k)];
end

function m = gleitend(x, k)
  m = NaN(size(x));
  for i = k:numel(x)
    m(i) = mean(x(i-k+1:i));
  end
end

function s = gleitend_std(x, k)
  s = NaN(size(x));
  for i = k:numel(x)
    s(i) = std(x(i-k+1:i));
  end
end

function out = rsi(c, k)
  d = [NaN; diff(c)];
  auf = max(d, 0); ab = max(-d, 0);
  out = NaN(size(c));
  for i = k+1:numel(c)
    g = mean(auf(i-k+1:i)); v = mean(ab(i-k+1:i));
    if v == 0, out(i) = 100; else, out(i) = 100 - 100 / (1 + g / v); end
  end
end
