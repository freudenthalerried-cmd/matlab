function k = korr(x, y)
%KORR  Pearson-Korrelation zweier Vektoren.
  k = kovar(x, y) / (std(x) * std(y));
end
