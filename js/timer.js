//========================
// ポモドーロタイマー
//========================

let mode = "work";
let timeLeft = 25 * 60;
let timerId = null;

let todayFocusSeconds =
    Number(localStorage.getItem("senda_todayFocusSeconds")) || 0;

let pomodoroCount =
    Number(localStorage.getItem("senda_pomodoroCount")) || 0;

const timer = document.getElementById("timer");
const startButton = document.getElementById("start");
const pauseButton = document.getElementById("pause");
const resetButton = document.getElementById("reset");
const message = document.getElementById("message");
const summaryButton = document.getElementById("summaryButton");

let currentWeatherCode = null;
let currentPressure = null;

function safeStartWorkSounds() {
    if (typeof unlockAudio === "function") {
        unlockAudio();
    }

    if (typeof startRoomSounds === "function") {
        startRoomSounds();
    }

    if (typeof startIdleMessages === "function") {
        startIdleMessages();
    }
}

function safeStartBreakSounds() {
    if (typeof unlockAudio === "function") {
        unlockAudio();
    }

    if (typeof startBreakBgm === "function") {
        startBreakBgm();
    }

    if (typeof stopIdleMessages === "function") {
        stopIdleMessages();
    }
}

function safeStopAllSounds() {
    if (typeof stopAllSounds === "function") {
        stopAllSounds();
        return;
    }

    if (typeof stopRoomSounds === "function") {
        stopRoomSounds();
    }

    if (typeof stopBreakBgm === "function") {
        stopBreakBgm();
    }

    if (typeof stopSleepBgm === "function") {
        stopSleepBgm();
    }
}

function updateTimer() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    timer.textContent =
        String(minutes).padStart(2, "0") + ":" +
        String(seconds).padStart(2, "0");

    timer.style.transform = "scale(1.05)";

    setTimeout(function () {
        timer.style.transform = "scale(1)";
    }, 120);
}

function updateFocusDisplay() {
    const focusTime = document.getElementById("focusTime");
    const pomodoroDisplay = document.getElementById("pomodoroDisplay");

    if (!focusTime || !pomodoroDisplay) return;

    const hours = Math.floor(todayFocusSeconds / 3600);
    const minutes = Math.floor((todayFocusSeconds % 3600) / 60);
    const seconds = todayFocusSeconds % 60;

    focusTime.textContent =
        String(hours).padStart(2, "0") + ":" +
        String(minutes).padStart(2, "0") + ":" +
        String(seconds).padStart(2, "0");

    pomodoroDisplay.textContent =
        pomodoroCount + " Pomodoro" + (pomodoroCount === 1 ? "" : "s");
}

function switchMode() {
    safeStopAllSounds();

    if (typeof stopIdleMessages === "function") {
        stopIdleMessages();
    }

    if (mode === "work") {
        mode = "break";
        timeLeft = 5 * 60;

        message.textContent = randomMessage(breakMessages);
        safeStartBreakSounds();

    } else {
        mode = "work";
        timeLeft = 25 * 60;

        message.textContent =
            randomMessage(getMessageList(currentWeatherCode, currentPressure));

        safeStartWorkSounds();
    }

    updateTimer();
}

startButton.addEventListener("click", function () {
    if (typeof unlockAudio === "function") {
        unlockAudio();
    }

    if (timerId !== null) return;

    if (typeof startSound !== "undefined") {
        startSound.currentTime = 0;
        startSound.play().catch(function () {});
    }

    if (mode === "work") {
        safeStartWorkSounds();

        message.textContent =
            randomMessage(getMessageList(currentWeatherCode, currentPressure));

    } else {
        safeStartBreakSounds();
        message.textContent = randomMessage(breakMessages);
    }

    timerId = setInterval(function () {
        timeLeft--;
        updateTimer();

        if (mode === "work") {
            todayFocusSeconds++;

            localStorage.setItem(
                "senda_todayFocusSeconds",
                todayFocusSeconds
            );

            updateFocusDisplay();
        }

        if (timeLeft <= 0) {
            if (mode === "work") {
                pomodoroCount++;
                localStorage.setItem("senda_pomodoroCount", pomodoroCount);
                updateFocusDisplay();
            }

            clearInterval(timerId);
            timerId = null;

            switchMode();
        }

    }, 1000);
});

pauseButton.addEventListener("click", function () {
    if (timerId === null) return;

    clearInterval(timerId);
    timerId = null;

    safeStopAllSounds();

    if (typeof stopIdleMessages === "function") {
        stopIdleMessages();
    }

    message.textContent = "止めた。だが戻ってこい。";
});

resetButton.addEventListener("click", function () {
    clearInterval(timerId);
    timerId = null;

    safeStopAllSounds();

    if (typeof stopIdleMessages === "function") {
        stopIdleMessages();
    }

    mode = "work";
    timeLeft = 25 * 60;

    updateTimer();

    message.textContent = "仕切り直しだ、レイ。";
});

summaryButton.addEventListener("click", function () {
    message.textContent = getDailySummaryMessage();
});

updateTimer();
updateFocusDisplay();

function checkNewDay() {
    const today = new Date().toDateString();
    const savedDate = localStorage.getItem("senda_savedDate");

    if (savedDate === null) {
        localStorage.setItem("senda_savedDate", today);
        return;
    }

    if (savedDate !== today) {
        localStorage.setItem(
            "senda_yesterdayFocusSeconds",
            todayFocusSeconds
        );

        localStorage.setItem("senda_todayFocusSeconds", 0);
        localStorage.setItem("senda_pomodoroCount", 0);

        todayFocusSeconds = 0;
        pomodoroCount = 0;

        localStorage.setItem("senda_savedDate", today);
    }
}

checkNewDay();
