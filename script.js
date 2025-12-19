// Enhanced Stopwatch with Smooth Animations
// Features: Start, Stop, Reset, Lap tracking with visual feedback

(function () {
  const display = document.getElementById('display');
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const resetBtn = document.getElementById('resetBtn');
  const lapBtn = document.getElementById('lapBtn');
  const lapsList = document.getElementById('lapsList');
  const lapCount = document.getElementById('lapCount');
  const stopwatch = document.querySelector('.stopwatch');

  // State
  let running = false;
  let startTimestamp = 0;
  let accumulated = 0;
  let rafId = null;
  let lapCounter = 0;
  let lastLapTime = 0;

  // Format ms -> HH:MM:SS.mmm
  function formatMs(ms) {
    const total = Math.max(0, Math.floor(ms));
    const msPart = total % 1000;
    const s = Math.floor(total / 1000) % 60;
    const m = Math.floor(total / 60000) % 60;
    const h = Math.floor(total / 3600000);
    const hh = String(h).padStart(2, '0');
    const mm = String(m).padStart(2, '0');
    const ss = String(s).padStart(2, '0');
    const mss = String(msPart).padStart(3, '0');
    return `${hh}:${mm}:${ss}.${mss}`;
  }

  // Compute elapsed total (ms)
  function elapsedTotal() {
    if (running) {
      return accumulated + (performance.now() - startTimestamp);
    } else {
      return accumulated;
    }
  }

  // Update loop with smooth animation
  function update() {
    const total = elapsedTotal();
    display.textContent = formatMs(total);
    rafId = requestAnimationFrame(update);
  }

  // Button states helper with visual feedback
  function setButtonsForRunning(isRunning) {
    running = isRunning;
    startBtn.disabled = isRunning;
    stopBtn.disabled = !isRunning;
    lapBtn.disabled = !isRunning;
    resetBtn.disabled = false;
    startBtn.setAttribute('aria-pressed', String(isRunning));
    
    // Update button text
    const startText = startBtn.querySelector('span');
    if (startText) {
      startText.textContent = isRunning ? 'Running' : 'Start';
    }

    // Add visual state to stopwatch
    if (isRunning) {
      stopwatch.classList.add('running');
    } else {
      stopwatch.classList.remove('running');
    }
  }

  // Start function with animation
  function start() {
    if (running) return;
    startTimestamp = performance.now();
    setButtonsForRunning(true);
    rafId = requestAnimationFrame(update);
    
    // Trigger animation
    display.style.animation = 'none';
    setTimeout(() => {
      display.style.animation = '';
    }, 10);
  }

  // Stop function
  function stop() {
    if (!running) return;
    accumulated = elapsedTotal();
    cancelAnimationFrame(rafId);
    setButtonsForRunning(false);
  }

  // Reset function with animation
  function reset() {
    cancelAnimationFrame(rafId);
    running = false;
    startTimestamp = 0;
    accumulated = 0;
    lastLapTime = 0;
    lapCounter = 0;
    
    // Clear laps with fade out
    if (lapsList.children.length > 0) {
      Array.from(lapsList.children).forEach((li, index) => {
        setTimeout(() => {
          li.style.animation = 'fadeOut 0.3s ease-out';
          setTimeout(() => {
            lapsList.innerHTML = '';
            updateLapCount();
          }, 300);
        }, index * 50);
      });
    }
    
    display.textContent = '00:00:00.000';
    startBtn.disabled = false;
    stopBtn.disabled = true;
    lapBtn.disabled = true;
    resetBtn.disabled = true;
    startBtn.setAttribute('aria-pressed', 'false');
    
    const startText = startBtn.querySelector('span');
    if (startText) {
      startText.textContent = 'Start';
    }
    
    stopwatch.classList.remove('running');
  }

  // Lap function with enhanced visuals
  function lap() {
    const total = elapsedTotal();
    lapCounter += 1;
    const lapTime = total - lastLapTime;
    lastLapTime = total;

    const li = document.createElement('li');
    li.innerHTML = `<span>Lap ${lapCounter}</span><span>${formatMs(lapTime)}</span>`;
    
    // Add to top with animation
    if (lapsList.firstChild) {
      lapsList.insertBefore(li, lapsList.firstChild);
    } else {
      lapsList.appendChild(li);
    }

    // Update lap count
    updateLapCount();

    // Highlight fastest and slowest laps
    highlightBestWorstLaps();
  }

  // Update lap counter
  function updateLapCount() {
    const count = lapsList.children.length;
    lapCount.textContent = `${count} ${count === 1 ? 'lap' : 'laps'}`;
  }

  // Highlight best and worst laps
  function highlightBestWorstLaps() {
    const laps = Array.from(lapsList.children);
    if (laps.length < 2) return;

    // Remove previous highlights
    laps.forEach(li => {
      li.style.background = '';
      li.style.borderColor = '';
    });

    // Get lap times
    const times = laps.map(li => {
      const timeText = li.querySelector('span:last-child').textContent;
      return parseTime(timeText);
    });

    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    // Highlight fastest (green) and slowest (red)
    laps.forEach((li, index) => {
      if (times[index] === minTime) {
        li.style.background = 'linear-gradient(135deg, rgba(67, 233, 123, 0.15), rgba(67, 233, 123, 0.05))';
        li.style.borderColor = 'rgba(67, 233, 123, 0.3)';
      } else if (times[index] === maxTime) {
        li.style.background = 'linear-gradient(135deg, rgba(255, 107, 107, 0.15), rgba(255, 107, 107, 0.05))';
        li.style.borderColor = 'rgba(255, 107, 107, 0.3)';
      }
    });
  }

  // Parse time string to milliseconds
  function parseTime(timeStr) {
    const parts = timeStr.split(/[:.]/);
    const hours = parseInt(parts[0]) || 0;
    const minutes = parseInt(parts[1]) || 0;
    const seconds = parseInt(parts[2]) || 0;
    const ms = parseInt(parts[3]) || 0;
    return (hours * 3600000) + (minutes * 60000) + (seconds * 1000) + ms;
  }

  // Attach events
  startBtn.addEventListener('click', start);
  stopBtn.addEventListener('click', stop);
  resetBtn.addEventListener('click', reset);
  lapBtn.addEventListener('click', lap);

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Ignore if typing in an input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    switch(e.key.toLowerCase()) {
      case ' ':
      case 's':
        e.preventDefault();
        if (!running) {
          start();
        } else {
          stop();
        }
        break;
      case 'l':
        if (running) {
          e.preventDefault();
          lap();
        }
        break;
      case 'r':
        if (!startBtn.disabled || !resetBtn.disabled) {
          e.preventDefault();
          reset();
        }
        break;
    }
  });

  // Initialize
  reset();

  // Add CSS animation for fade out
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeOut {
      from { opacity: 1; transform: translateX(0); }
      to { opacity: 0; transform: translateX(-20px); }
    }
  `;
  document.head.appendChild(style);

  // Console message
  console.log('%c⏱️ Precision Stopwatch Ready!', 'color: #7c5cff; font-size: 16px; font-weight: bold;');
  console.log('%cKeyboard Shortcuts: Space/S = Start/Stop | L = Lap | R = Reset', 'color: #8b92a8; font-size: 12px;');
  console.log('%cBuilt with ❤️ for Prodigy InfoTech by Shivam Agrahari', 'color: #43e97b; font-size: 12px;');
})();
