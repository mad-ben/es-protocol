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
const TIMER_DURATION = 1200000; // 1200000 - 20 minutes in milliseconds
let originalTitle = document.title;
let notificationSound = new Audio('./resource/mgs-alert.mp3'); // Replace with actual sound file URL
let titleAnimationInterval;
let useSilentNotifications = false;

function setCookie(name, value, days) {
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = "expires=" + date.toUTCString();
  document.cookie = name + "=" + value + ";" + expires + ";path=/";
}

function getCookie(name) {
  const cookieName = name + "=";
  const decodedCookie = decodeURIComponent(document.cookie);
  const cookieArray = decodedCookie.split(';');
  for (let i = 0; i < cookieArray.length; i++) {
      let cookie = cookieArray[i];
      while (cookie.charAt(0) === ' ') {
          cookie = cookie.substring(1);
      }
      if (cookie.indexOf(cookieName) === 0) {
          return cookie.substring(cookieName.length, cookie.length);
      }
  }
  return "";
}

function checkCookieConsent() {
  if (getCookie("cookieConsent") !== "true") {
      const consent = confirm("This website uses cookies to save your notification preferences. Do you consent to the use of cookies?");
      if (consent) {
          setCookie("cookieConsent", "true", 365);
          loadNotificationPreference();
      }
  } else {
      loadNotificationPreference();
  }
}

// Modify loadNotificationPreference function
function loadNotificationPreference() {
  if (getCookie("cookieConsent") === "true") {
      const preference = getCookie("useSilentNotifications");
      if (preference !== "") {
          useSilentNotifications = preference === "true";
          notificationToggle.textContent = useSilentNotifications ? 
              "Use Explicit Notifications" : "Use Silent Notifications";
      }
  }
}

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
  startTitleAnimation(); // Always start title animation
  if (useSilentNotifications) {
    sendNotification();
  } else {
    playNotificationSound(); // Always play sound
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
  }, 10); // Adjust speed of animation here
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

    // Save preference to cookie
    setCookie("useSilentNotifications", useSilentNotifications, 365);  // Saves for 1 year 
  
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
checkCookieConsent();