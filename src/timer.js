const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const timerDisplay = document.getElementById('timerDisplay');
const messageModal = document.getElementById('messageModal');
const okBtn = document.getElementById('okBtn');
const notificationToggle = document.getElementById('notificationToggle');

let worker = new Worker('timerWorker.js');
let originalTitle = document.title;
let audioContext;
let audioBuffer;
let soundInterval;
let titleAnimationInterval;
let useSilentNotifications = false;
let showOrangeDot = false;

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

function saveNotificationPreference(preference) {
  localStorage.setItem("useSilentNotifications", preference);
}

function loadNotificationPreference() {
  const preference = localStorage.getItem("useSilentNotifications");
  if (preference !== null) {
    useSilentNotifications = preference === "true";
    notificationToggle.textContent = useSilentNotifications ? 
      "Use Explicit Notifications" : "Use Silent Notifications";
  }
}

function sendNotification() {
  if ("Notification" in window) {
    if (Notification.permission === "granted") {
      new Notification("Break Time", {
        body: "20 minutes have passed. Please take a break from the screen and look at something 20 feet (6 meters) away for at least 5 minutes.",
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
  const message = "Time's Up! Look away from screen!";
  let position = 0;
  
  titleAnimationInterval = setInterval(() => {
    if (showOrangeDot) {
      document.title = "🟠 " + message.substring(position) + message.substring(0, position);
    } else {
      document.title = message.substring(position) + message.substring(0, position);
    }
    showOrangeDot = !showOrangeDot;
    position++;
    if (position > message.length) position = 0;
  }, 500);
}

function stopTitleAnimation() {
  clearInterval(titleAnimationInterval);
  document.title = originalTitle;
  showOrangeDot = false;
}

function showMessageModal() {
  messageModal.style.display = 'block';
}

function startTimer() {
  worker.postMessage({command: 'start'});
  startBtn.disabled = true;
  pauseBtn.disabled = false;
  resetBtn.disabled = false;
}

function pauseTimer() {
  worker.postMessage({command: 'pause'});
  startBtn.disabled = false;
  pauseBtn.disabled = true;
}

function resetTimer() {
  worker.postMessage({command: 'reset'});
  stopTitleAnimation();
  clearInterval(soundInterval);
  startBtn.disabled = false;
  pauseBtn.disabled = true;
  resetBtn.disabled = true;
  messageModal.style.display = 'none';
  startTimer();
}

function toggleNotificationMethod() {
  useSilentNotifications = !useSilentNotifications;
  notificationToggle.textContent = useSilentNotifications ? 
    "Use Explicit Notifications" : "Use Silent Notifications";

  saveNotificationPreference(useSilentNotifications);
  
  if (useSilentNotifications && "Notification" in window) {
    Notification.requestPermission();
  }
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

// Initialize button states
pauseBtn.disabled = true;
resetBtn.disabled = true;

loadNotificationPreference();
loadAudio();