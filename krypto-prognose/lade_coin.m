function [t, c] = lade_coin(symbol, intervall, quelle, rb, nr)
%LADE_COIN  Zeit und Schlusskurs eines Coins. Bei quelle = 'demo' werden
%   Altcoins simuliert: Beta 1,3 zu BTC plus kleine Verzoegerung (Lag 1) -
%   damit laesst sich pruefen, ob die Auswertung Gleichlauf und Lag erkennt.
  if ~strcmpi(quelle, 'demo')
    [t, ~, ~, ~, c] = lade_kurse(symbol, intervall, quelle);
    return;
  end
  [t, ~, ~, ~, cb] = lade_kurse('', '', 'demo');
  if isempty(rb)                      % BTC selbst
    c = cb;
    return;
  end
  randn('seed', 100 + nr);
  rb(1) = 0;
  lag = [0; rb(1:end-1)];
  r = 1.3 * rb + 0.1 * lag + 0.025 * randn(size(rb));
  c = 10 * exp(cumsum(r));
end
