const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const timerDisplay = document.getElementById('timerDisplay');
const messageModal = document.getElementById('messageModal');
const okBtn = document.getElementById('okBtn');
const notificationToggle = document.getElementById('notificationToggle');

let animationFrameId;
let startTime;
let pausedTime = 0;
let isPaused = false;
const TIMER_DURATION = 1200000; // 20 minutes in milliseconds
let originalTitle = document.title;
let notificationSound = new Audio('https://example.com/path/to/notification-sound.mp3'); // Replace with actual sound file URL
let titleAnimationInterval;
let useSilentNotifications = false;

function updateTimer() {
  if (isPaused) return;

  const currentTime = Date.now();
  const elapsedTime = currentTime - startTime + pausedTime;
  
  if (elapsedTime >= TIMER_DURATION) {
    timerComplete();
    return;
  }

  const minutes = Math.floor(elapsedTime / 60000);
  const seconds = Math.floor((elapsedTime % 60000) / 1000);
  timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  animationFrameId = requestAnimationFrame(updateTimer);
}

function timerComplete() {
  pauseTimer();
  if (useSilentNotifications) {
    sendNotification();
    startTitleAnimation();
    playNotificationSound();
  } else {
    showMessageModal();
  }
}

function sendNotification() {
  if ("Notification" in window) {
    if (Notification.permission === "granted") {
      new Notification("Timer Complete", {
        body: "20 minutes have passed. Please look away for 20 seconds.",
        icon: "/path/to/icon.png" // Replace with actual icon path
      });
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then(function (permission) {
        if (permission === "granted") {
          sendNotification();
        }
      });
    }
  }
}

function startTitleAnimation() {
  const message = "Time's Up! Look away for 20 seconds ";
  let position = 0;
  
  titleAnimationInterval = setInterval(() => {
    document.title = message.substring(position) + message.substring(0, position);
    position++;
    if (position > message.length) position = 0;
  }, 250); // Adjust speed of animation here
}

function stopTitleAnimation() {
  clearInterval(titleAnimationInterval);
  document.title = originalTitle;
}

function playNotificationSound() {
  notificationSound.play();
}

function showMessageModal() {
  messageModal.style.display = 'block';
}

function startTimer() {
  if (!isPaused) {
    startTime = Date.now();
  } else {
    startTime = Date.now() - pausedTime;
    isPaused = false;
  }
  startBtn.disabled = true;
  pauseBtn.disabled = false;
  resetBtn.disabled = false;
  animationFrameId = requestAnimationFrame(updateTimer);
}

function pauseTimer() {
  if (!isPaused) {
    cancelAnimationFrame(animationFrameId);
    pausedTime += Date.now() - startTime;
    isPaused = true;
    startBtn.disabled = false;
    pauseBtn.disabled = true;
  }
}

function resetTimer() {
  cancelAnimationFrame(animationFrameId);
  stopTitleAnimation();
  timerDisplay.textContent = '00:00';
  startBtn.disabled = false;
  pauseBtn.disabled = true;
  resetBtn.disabled = true;
  isPaused = false;
  pausedTime = 0;
  messageModal.style.display = 'none';
}

function toggleNotificationMethod() {
  useSilentNotifications = !useSilentNotifications;
  notificationToggle.textContent = useSilentNotifications ? 
    "Use Explicit Notifications" : "Use Silent Notifications";
  
  if (useSilentNotifications && "Notification" in window) {
    Notification.requestPermission();
  }
}

startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);
okBtn.addEventListener('click', () => {
  messageModal.style.display = 'none';
  resetTimer();
});
notificationToggle.addEventListener('click', toggleNotificationMethod);

// Initialize button states
pauseBtn.disabled = true;
resetBtn.disabled = true;