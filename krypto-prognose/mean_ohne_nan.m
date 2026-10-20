function m = mean_ohne_nan(x)
%MEAN_OHNE_NAN  Mittelwert ohne NaN-Eintraege.
  x = x(~isnan(x));
  if isempty(x), m = NaN; else, m = mean(x); end
end
