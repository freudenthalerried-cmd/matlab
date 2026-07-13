(function () {
  const DURATION_SECONDS = 30 * 60;

  const display = document.getElementById('timer-display');
  const startButton = document.getElementById('start-button');
  const pauseButton = document.getElementById('pause-button');
  const resetButton = document.getElementById('reset-button');

  let remainingSeconds = DURATION_SECONDS;
  let intervalId = null;

  function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
  }

  function updateDisplay() {
    display.textContent = formatTime(remainingSeconds);
  }

  function tick() {
    remainingSeconds--;
    updateDisplay();
    if (remainingSeconds <= 0) {
      stopInterval();
      display.classList.add('timer-display-done');
    }
  }

  function stopInterval() {
    clearInterval(intervalId);
    intervalId = null;
    startButton.disabled = false;
    pauseButton.disabled = true;
  }

  startButton.addEventListener('click', function () {
    if (intervalId !== null || remainingSeconds <= 0) return;
    display.classList.remove('timer-display-done');
    intervalId = setInterval(tick, 1000);
    startButton.disabled = true;
    pauseButton.disabled = false;
  });

  pauseButton.addEventListener('click', function () {
    stopInterval();
  });

  resetButton.addEventListener('click', function () {
    stopInterval();
    remainingSeconds = DURATION_SECONDS;
    display.classList.remove('timer-display-done');
    updateDisplay();
  });

  updateDisplay();
})();
