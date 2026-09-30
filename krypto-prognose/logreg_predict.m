function p = logreg_predict(w, X)
%LOGREG_PREDICT  Wahrscheinlichkeit P(Kurs steigt) je Zeile von X.
  p = 1 ./ (1 + exp(-[ones(size(X,1),1), X] * w));
end
