const TIMER_DURATION = 1200000; // 20 minutes in milliseconds

let remainingTime = TIMER_DURATION;
let isPaused = true;
let timerId;

function updateTimer() {
  if (!isPaused) {
    remainingTime -= 1000; // Decrease by 1 second
  }
  
  if (remainingTime <= 0) {
    clearInterval(timerId);
    self.postMessage({type: 'complete'});
    return;
  }

  const minutes = Math.floor(remainingTime / 60000);
  const seconds = Math.floor((remainingTime % 60000) / 1000);
  const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  self.postMessage({type: 'update', time: timeString});
}

function startTimer() {
  isPaused = false;
  updateTimer(); // Update immediately when starting
  timerId = setInterval(updateTimer, 1000);
}

self.onmessage = function(e) {
  switch(e.data.command) {
    case 'start':
      if (isPaused) {
        startTimer();
      }
      break;
    case 'pause':
      if (!isPaused) {
        clearInterval(timerId);
        isPaused = true;
      }
      break;
    case 'reset':
      clearInterval(timerId);
      isPaused = true;
      remainingTime = TIMER_DURATION;
      self.postMessage({type: 'update', time: '20:00'});
      break;
  }
};