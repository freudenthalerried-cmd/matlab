function w = logreg_fit(X, y, lambda)
%LOGREG_FIT  Logistische Regression mit L2-Regularisierung (Newton/IRLS).
%   Ohne Toolbox, laeuft in MATLAB und Octave. w(1) = Achsenabschnitt.
  if nargin < 3, lambda = 1; end
  A = [ones(size(X,1),1), X];
  w = zeros(size(A,2), 1);
  R = lambda * eye(numel(w)); R(1,1) = 0;   % Achsenabschnitt nicht bestrafen
  for it = 1:50
    p = 1 ./ (1 + exp(-A * w));
    g = A' * (p - y) + R * w;
    H = A' * (A .* (p .* (1 - p))) + R;
    schritt = H \ g;
    w = w - schritt;
    if max(abs(schritt)) < 1e-8, break; end
  end
end
