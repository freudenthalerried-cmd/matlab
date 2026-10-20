function y = verschiebe(x, k)
%VERSCHIEBE  y(t) = x(t-k); k > 0 = Vergangenheit, k < 0 = Zukunft. Raender = NaN.
  y = NaN(size(x));
  if k >= 0
    y(1+k:end) = x(1:end-k);
  else
    y(1:end+k) = x(1-k:end);
  end
end
