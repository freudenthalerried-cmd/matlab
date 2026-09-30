function k = korr_nan(x, y)
%KORR_NAN  Korrelation, Paare mit NaN werden ignoriert.
  m = isfinite(x) & isfinite(y);
  k = korr(x(m), y(m));
end
