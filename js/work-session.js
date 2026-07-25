//========================
// 作業・休憩カウントアップ
//========================

const SENDA_SESSION_KEYS = {
    date: "sendaSessionDate",
    workSeconds: "sendaWorkSeconds",
    breakSeconds: "sendaBreakSeconds",
    state: "sendaSessionState",
    lastTick: "sendaSessionLastTick"
};

let sessionState = localStorage.getItem(SENDA_SESSION_KEYS.state) || "idle";
let workSeconds = Number(localStorage.getItem(SENDA_SESSION_KEYS.workSeconds)) || 0;
let breakSeconds = Number(localStorage.getItem(SENDA_SESSION_KEYS.breakSeconds)) || 0;
let sessionLastTick = Number(localStorage.getItem(SENDA_SESSION_KEYS.lastTick)) || Date.now();

// message.jsとの互換用。作業中・休憩中はnull以外になる。
let timerId = null;
let todayFocusSeconds = workSeconds;
let currentWeatherCode = null;
let currentPressure = null;

const message = document.getElementById("message");
const workTime = document.getElementById("workTime");
const breakTime = document.getElementById("breakTime");
const sessionStatus = document.getElementById("sessionStatus");
const workStartButton = document.getElementById("workStart");
const workBreakButton = document.getElementById("workBreak");
const workEndButton = document.getElementById("workEnd");

function setSessionCompanionImage(state) {
    const harry = document.getElementById("harry");
    if (!harry) return;

    const images = window.SENDA_IMAGES || {};
    const imageByState = {
        work: images.work || "assets/companion-work.jpg",
        break: images.normal || "assets/companion-welcome.jpg",
        idle: images.normal || "assets/companion-welcome.jpg"
    };

    harry.src = imageByState[state] || imageByState.idle;
}

function getTodayKey() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function checkNewDay() {
    const today = getTodayKey();
    const savedDate = localStorage.getItem(SENDA_SESSION_KEYS.date);

    if (savedDate === today) return;

    localStorage.setItem("senda_yesterdayFocusSeconds", String(workSeconds));

    workSeconds = 0;
    breakSeconds = 0;
    todayFocusSeconds = 0;
    sessionState = "idle";
    sessionLastTick = Date.now();

    localStorage.setItem(SENDA_SESSION_KEYS.date, today);
    saveSessionState();
}

function formatSessionTime(totalSeconds) {
    const safeSeconds = Math.max(0, Math.floor(totalSeconds));
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    const seconds = safeSeconds % 60;

    return (
        String(hours).padStart(2, "0") + ":" +
        String(minutes).padStart(2, "0") + ":" +
        String(seconds).padStart(2, "0")
    );
}

function saveSessionState() {
    localStorage.setItem(SENDA_SESSION_KEYS.date, getTodayKey());
    localStorage.setItem(SENDA_SESSION_KEYS.workSeconds, String(workSeconds));
    localStorage.setItem(SENDA_SESSION_KEYS.breakSeconds, String(breakSeconds));
    localStorage.setItem(SENDA_SESSION_KEYS.state, sessionState);
    localStorage.setItem(SENDA_SESSION_KEYS.lastTick, String(sessionLastTick));

    // 既存の独り言・起動メッセージとの互換用。
    localStorage.setItem("senda_todayFocusSeconds", String(workSeconds));
}

function updateSessionDisplay() {
    if (workTime) workTime.textContent = formatSessionTime(workSeconds);
    if (breakTime) breakTime.textContent = formatSessionTime(breakSeconds);

    if (sessionStatus) {
        const labels = {
            idle: "待機中",
            work: "作業中",
            break: "休憩中"
        };

        sessionStatus.textContent = labels[sessionState] || labels.idle;
        sessionStatus.dataset.state = sessionState;
    }

    if (workStartButton) {
        workStartButton.textContent = sessionState === "break" ? "作業再開" : "作業開始";
        workStartButton.disabled = sessionState === "work";
    }

    if (workBreakButton) {
        workBreakButton.disabled = sessionState !== "work";
    }

    if (workEndButton) {
        workEndButton.disabled = sessionState === "idle";
    }
}

function applyElapsedTime() {
    if (sessionState === "idle") {
        sessionLastTick = Date.now();
        return;
    }

    const now = Date.now();
    const elapsed = Math.max(0, Math.floor((now - sessionLastTick) / 1000));

    if (elapsed <= 0) return;

    if (sessionState === "work") {
        workSeconds += elapsed;
        todayFocusSeconds = workSeconds;
    } else if (sessionState === "break") {
        breakSeconds += elapsed;
    }

    sessionLastTick += elapsed * 1000;
}

function stopSessionInterval() {
    if (timerId !== null) {
        clearInterval(timerId);
        timerId = null;
    }
}

function startSessionInterval() {
    stopSessionInterval();

    if (sessionState === "idle") return;

    timerId = setInterval(function () {
        applyElapsedTime();
        saveSessionState();
        updateSessionDisplay();
    }, 1000);
}

function startWorkSoundsSafely() {
    if (typeof unlockAudio === "function") unlockAudio();
    if (typeof startRoomSounds === "function") startRoomSounds();
    if (typeof startIdleMessages === "function") startIdleMessages();
}

function startBreakSoundsSafely() {
    if (typeof unlockAudio === "function") unlockAudio();
    if (typeof stopIdleMessages === "function") stopIdleMessages();
    if (typeof startBreakBgm === "function") startBreakBgm();
}

function stopSessionSoundsSafely() {
    if (typeof stopIdleMessages === "function") stopIdleMessages();

    if (typeof stopAllSounds === "function") {
        stopAllSounds();
        return;
    }

    if (typeof stopRoomSounds === "function") stopRoomSounds();
    if (typeof stopBreakBgm === "function") stopBreakBgm();
}

function beginWorkSession() {
    applyElapsedTime();
    sessionState = "work";
    sessionLastTick = Date.now();

    setSessionCompanionImage("work");
    startWorkSoundsSafely();

    if (message) {
        const list = typeof getMessageList === "function"
            ? getMessageList(currentWeatherCode, currentPressure)
            : ["ほな、やろか。俺も付き合うで。"];
        message.textContent = typeof randomMessage === "function"
            ? randomMessage(list)
            : list[0];
    }

    saveSessionState();
    updateSessionDisplay();
    startSessionInterval();
}

function beginBreakSession() {
    if (sessionState !== "work") return;

    applyElapsedTime();
    sessionState = "break";
    sessionLastTick = Date.now();

    setSessionCompanionImage("break");
    startBreakSoundsSafely();

    if (message) {
        const list = typeof breakMessages !== "undefined"
            ? breakMessages
            : ["休憩やで。手ぇ止めへんなら没収するからな。"];
        message.textContent = typeof randomMessage === "function"
            ? randomMessage(list)
            : list[0];
    }

    saveSessionState();
    updateSessionDisplay();
    startSessionInterval();
}

function endWorkSession() {
    applyElapsedTime();
    stopSessionInterval();
    stopSessionSoundsSafely();

    sessionState = "idle";
    sessionLastTick = Date.now();
    setSessionCompanionImage("idle");
    saveSessionState();
    updateSessionDisplay();

    if (message) {
        const workText = formatSessionTime(workSeconds);
        const breakText = formatSessionTime(breakSeconds);
        message.textContent = `作業 ${workText}、休憩 ${breakText}。ようやったな、レイ。あとはちょっとこっちで休み。`;
    }
}

function restoreWorkSession() {
    checkNewDay();
    applyElapsedTime();
    saveSessionState();
    updateSessionDisplay();

    if (sessionState === "work") {
        setSessionCompanionImage("work");
        startWorkSoundsSafely();
        startSessionInterval();
    } else if (sessionState === "break") {
        setSessionCompanionImage("break");
        startBreakSoundsSafely();
        startSessionInterval();
    }
}

if (workStartButton) {
    workStartButton.addEventListener("click", beginWorkSession);
}

if (workBreakButton) {
    workBreakButton.addEventListener("click", beginBreakSession);
}

if (workEndButton) {
    workEndButton.addEventListener("click", endWorkSession);
}

window.addEventListener("beforeunload", function () {
    applyElapsedTime();
    saveSessionState();
});

document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") {
        checkNewDay();
        applyElapsedTime();
        saveSessionState();
        updateSessionDisplay();
        if (sessionState !== "idle") {
            setSessionCompanionImage(sessionState);
        }
    }
});
