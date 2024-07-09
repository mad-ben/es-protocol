// DOM Elements
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const timerDisplay = document.getElementById('timerDisplay');
const messageModal = document.getElementById('messageModal');
const okBtn = document.getElementById('okBtn');
const notificationToggle = document.getElementById('notificationToggle');

// Global variables
const worker = new Worker('timerWorker.js');
const originalTitle = document.title;
let audioContext;
let audioBuffer;
let soundInterval;
let titleAnimationInterval;
let useSilentNotifications = false;
let showOrangeDot = false;

// Audio functions
function loadAudio() {
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  fetch('./resource/mgs-alert.mp3')
    .then(response => response.arrayBuffer())
    .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
    .then(decodedAudio => {
      audioBuffer = decodedAudio;
    })
    .catch(error => console.error('Error loading audio:', error));
}

function playNotificationSound() {
  if (audioContext && audioBuffer) {
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start();
  }
}

function startRepeatedSound() {
  playNotificationSound();
  soundInterval = setInterval(playNotificationSound, 5000); // Play every 5 seconds
}

// Notification functions
function saveNotificationPreference(preference) {
  localStorage.setItem("useSilentNotifications", preference);
}

function loadNotificationPreference() {
  const preference = localStorage.getItem("useSilentNotifications");
  if (preference !== null) {
    useSilentNotifications = preference === "true";
    updateNotificationToggleText();
  }
}

function updateNotificationToggleText() {
  notificationToggle.textContent = useSilentNotifications ? 
    "Use Explicit Notifications" : "Use Silent Notifications";
}

function sendNotification() {
  if ("Notification" in window) {
    if (Notification.permission === "granted") {
      new Notification("Break Time", {
        body: "20 minutes have passed. Please take a break from the screen and look at something 20 feet (6 meters) away for at least 5 minutes.",
        icon: "./resource/icon.png"
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

// Title animation functions
function startTitleAnimation() {
  const message = "Time's Up! Look away from screen!";
  let position = 0;
  
  titleAnimationInterval = setInterval(() => {
    document.title = (showOrangeDot ? "🟠 " : "") + 
      message.substring(position) + message.substring(0, position);
    showOrangeDot = !showOrangeDot;
    position = (position + 1) % message.length;
  }, 500);
}

function stopTitleAnimation() {
  clearInterval(titleAnimationInterval);
  document.title = originalTitle;
  showOrangeDot = false;
}

// Timer control functions
function startTimer() {
  worker.postMessage({command: 'start'});
  updateButtonStates(true, false, false);
}

function pauseTimer() {
  worker.postMessage({command: 'pause'});
  updateButtonStates(false, true, false);
}

function resetTimer() {
  worker.postMessage({command: 'reset'});
  stopTitleAnimation();
  clearInterval(soundInterval);
  updateButtonStates(false, true, true);
  messageModal.style.display = 'none';
}

function updateButtonStates(startDisabled, pauseDisabled, resetDisabled) {
  startBtn.disabled = startDisabled;
  pauseBtn.disabled = pauseDisabled;
  resetBtn.disabled = resetDisabled;
}

function timerComplete() {
  pauseTimer();
  startTitleAnimation();
  if (useSilentNotifications) {
    sendNotification();
  } else {
    startRepeatedSound();
  }
  if (!document.hidden) {
    showMessageModal();
  }
}

function showMessageModal() {
  messageModal.style.display = 'block';
}

function toggleNotificationMethod() {
  useSilentNotifications = !useSilentNotifications;
  updateNotificationToggleText();
  saveNotificationPreference(useSilentNotifications);
  
  if (useSilentNotifications && "Notification" in window) {
    Notification.requestPermission();
  }
}

// Event listeners
startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);
okBtn.addEventListener('click', () => {
  messageModal.style.display = 'none';
  clearInterval(soundInterval);
  resetTimer();
});
notificationToggle.addEventListener('click', toggleNotificationMethod);

document.addEventListener('visibilitychange', function() {
  if (!document.hidden && soundInterval) {
    showMessageModal();
    clearInterval(soundInterval);
  }
});

worker.onmessage = function(e) {
  if (e.data.type === 'update') {
    timerDisplay.textContent = e.data.time;
  } else if (e.data.type === 'complete') {
    timerComplete();
  }
};

// Initialization
function init() {
  updateButtonStates(false, true, true);
  loadNotificationPreference();
  loadAudio();
}

init();