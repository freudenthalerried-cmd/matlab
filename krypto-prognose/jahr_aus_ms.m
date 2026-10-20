function j = jahr_aus_ms(t)
%JAHR_AUS_MS  Kalenderjahr (UTC) aus Zeitstempel in Millisekunden.
  dv = datevec(t / 86400000 + datenum(1970, 1, 1));
  j = dv(:, 1);
end
