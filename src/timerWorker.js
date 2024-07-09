const TIMER_DURATION = 1200000; // 20 minutes in milliseconds

let startTime;
let pausedTime = 0;
let isPaused = false;
let timerId;

function updateTimer() {
  const currentTime = Date.now();
  const elapsedTime = currentTime - startTime + pausedTime;
  
  if (elapsedTime >= TIMER_DURATION) {
    clearInterval(timerId);
    self.postMessage({type: 'complete'});
    return;
  }

  const minutes = Math.floor(elapsedTime / 60000);
  const seconds = Math.floor((elapsedTime % 60000) / 1000);
  const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  self.postMessage({type: 'update', time: timeString});
}

function startTimer() {
  startTime = Date.now() - pausedTime;
  timerId = setInterval(updateTimer, 1000);
}

self.onmessage = function(e) {
  switch(e.data.command) {
    case 'start':
      if (!isPaused) {
        pausedTime = 0;
      }
      isPaused = false;
      startTimer();
      break;
    case 'pause':
      if (!isPaused) {
        clearInterval(timerId);
        pausedTime += Date.now() - startTime;
        isPaused = true;
      }
      break;
    case 'reset':
      clearInterval(timerId);
      isPaused = false;
      pausedTime = 0;
      self.postMessage({type: 'update', time: '00:00'});
      break;
  }
};