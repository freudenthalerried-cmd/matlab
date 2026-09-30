function c = kovar(x, y)
%KOVAR  Stichproben-Kovarianz zweier Vektoren (MATLAB/Octave einheitlich).
  x = x(:) - mean(x); y = y(:) - mean(y);
  c = sum(x .* y) / (numel(x) - 1);
end
