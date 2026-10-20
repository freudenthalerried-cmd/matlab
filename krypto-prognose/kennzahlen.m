function kennzahlen(name, r, jahr, trades)
%KENNZAHLEN  Gibt Gesamtrendite, Sharpe (annualisiert), max. Drawdown und Trades aus.
  kap = exp(cumsum(r));
  dd = 1 - kap ./ cummax(kap);
  sharpe = mean(r) / std(r) * sqrt(jahr);
  fprintf('%-18s %9.1f %% %10.2f %9.1f %% %8d\n', name, 100 * (kap(end) - 1), sharpe, 100 * max(dd), trades);
end
