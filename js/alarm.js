//========================
// Senda Alarm Engine
// 時刻判定・アラーム・スヌーズだけを管理する
//========================

const SENDA_ALARM_KEYS = {
    time: "sendaAlarmTime",
    enabled: "sendaAlarmEnabled",
    lastTriggered: "sendaAlarmLastTriggered",
    snoozeUntil: "sendaAlarmSnoozeUntil"
};

const alarmTimeInput = document.getElementById("alarmTime");
const alarmEnabledInput = document.getElementById("alarmEnabled");
const saveAlarmButton = document.getElementById("saveAlarm");
const alarmStatus = document.getElementById("alarmStatus");
const alarmCountdown = document.getElementById("alarmCountdown");
const alarmRingingPanel = document.getElementById("alarmRingingPanel");
const alarmWakeMessage = document.getElementById("alarmWakeMessage");
const alarmWakeButton = document.getElementById("alarmWakeButton");
const alarmSnoozeButton = document.getElementById("alarmSnoozeButton");

let alarmCheckTimer = null;
let alarmIsRinging = false;

function getSavedAlarmTime() {
    return localStorage.getItem(SENDA_ALARM_KEYS.time) || "07:30";
}

function isSavedAlarmEnabled() {
    return localStorage.getItem(SENDA_ALARM_KEYS.enabled) === "true";
}

function getSnoozeUntil() {
    const value = Number(localStorage.getItem(SENDA_ALARM_KEYS.snoozeUntil));
    return Number.isFinite(value) && value > Date.now() ? value : null;
}

function getNextAlarmDate(timeText) {
    const [hour, minute] = timeText.split(":").map(Number);
    if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null;

    const now = new Date();
    const next = new Date();
    next.setHours(hour, minute, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
    return next;
}

function formatRemaining(milliseconds) {
    const totalMinutes = Math.max(1, Math.ceil(milliseconds / 60000));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (!hours) return `あと ${minutes}分`;
    if (!minutes) return `あと ${hours}時間`;
    return `あと ${hours}時間 ${minutes}分`;
}

function getAlarmTarget() {
    return getSnoozeUntil() || getNextAlarmDate(getSavedAlarmTime())?.getTime() || null;
}

function updateAlarmPreview() {
    if (!alarmStatus || !alarmCountdown) return;

    if (!isSavedAlarmEnabled()) {
        alarmStatus.textContent = "アラームは設定されていません";
        alarmCountdown.textContent = "";
        return;
    }

    const snooze = getSnoozeUntil();
    const target = getAlarmTarget();
    alarmStatus.textContent = snooze
        ? "5分後にもう一度起こす。"
        : `${getSavedAlarmTime()} に起こす。`;
    alarmCountdown.textContent = target ? formatRemaining(target - Date.now()) : "";
}

function saveAlarmSettings() {
    const time = alarmTimeInput?.value || "07:30";
    const enabled = Boolean(alarmEnabledInput?.checked);

    localStorage.setItem(SENDA_ALARM_KEYS.time, time);
    localStorage.setItem(SENDA_ALARM_KEYS.enabled, String(enabled));
    localStorage.removeItem(SENDA_ALARM_KEYS.snoozeUntil);

    if (typeof armAlarmAudio === "function") armAlarmAudio();
    updateAlarmPreview();

    if (typeof setSleepMessages === "function") {
        setSleepMessages(enabled ? `${time}だな。起こす。` : "アラームを外した。");
    }
}

function setAlarmImage(src) {
    if (typeof setHomeImage === "function") setHomeImage(src);
    if (typeof setSleepImage === "function") setSleepImage(src);
}

function setAlarmMessage(text) {
    if (alarmWakeMessage) alarmWakeMessage.textContent = text;
    if (typeof setSleepMessages === "function") setSleepMessages(text, true);
}

function cancelActiveAlarm() {
    alarmIsRinging = false;
    if (typeof stopAlarmSound === "function") stopAlarmSound();
    document.body.classList.remove("alarm-mode");
    if (alarmRingingPanel) alarmRingingPanel.hidden = true;
}

function triggerAlarm() {
    if (alarmIsRinging) return;
    alarmIsRinging = true;

    const now = new Date();
    const minuteKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}-${now.getMinutes()}`;
    localStorage.setItem(SENDA_ALARM_KEYS.lastTriggered, minuteKey);
    localStorage.removeItem(SENDA_ALARM_KEYS.snoozeUntil);

    if (typeof stopSleepBgm === "function") stopSleepBgm();
    document.body.classList.remove("sleep-mode");
    document.body.classList.add("alarm-mode");
    if (alarmRingingPanel) alarmRingingPanel.hidden = false;

    const sleepingImage = window.SENDA_IMAGES?.sleeping || "assets/companion-sleep.jpg";
    setAlarmImage(sleepingImage);
    setAlarmMessage(`……${typeof getSendaUserName === "function" ? getSendaUserName() : "レイ"}。起きる時間だ。`);

    if (typeof startAlarmSound === "function") startAlarmSound();
}

function wakeFromAlarm() {
    cancelActiveAlarm();
    localStorage.removeItem(SENDA_ALARM_KEYS.snoozeUntil);

    if (typeof stopSleepRecord === "function" && sleepStartTime) {
        stopSleepRecord();
    } else {
        const morningImage = window.SENDA_IMAGES?.morning || "assets/companion-morning.jpg";
        setAlarmImage(morningImage);
        if (window.SendaVoice) {
            const line = window.SendaVoice.playWakeUp(alarmWakeMessage);
            if (line) setAlarmMessage(line.subtitle);
        } else {
            const name = typeof getSendaUserName === "function"
                ? getSendaUserName()
                : "レイ";
            setAlarmMessage(`おはよ、${name}。ほら、起きるん手伝ったる。`);
        }
    }
    updateAlarmPreview();
}

function snoozeAlarm() {
    cancelActiveAlarm();
    localStorage.setItem(
        SENDA_ALARM_KEYS.snoozeUntil,
        String(Date.now() + 5 * 60 * 1000)
    );

    document.body.classList.add("sleep-mode");
    const sleepingImage = window.SENDA_IMAGES?.sleeping || "assets/companion-sleep.jpg";
    setAlarmImage(sleepingImage);
    setAlarmMessage("あと5分だ。……眠れ。");
    if (typeof startSleepBgm === "function") startSleepBgm();
    updateAlarmPreview();
}

function shouldTriggerAlarm() {
    if (!isSavedAlarmEnabled() || alarmIsRinging) return false;

    const sleepStartedAt = Number(localStorage.getItem("sendaSleepStartedAt"));
    if (!sleepStartedAt || Date.now() - sleepStartedAt < 60000) return false;

    const snooze = getSnoozeUntil();
    if (snooze) return Date.now() >= snooze;

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    if (currentTime !== getSavedAlarmTime()) return false;

    const minuteKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}-${now.getMinutes()}`;
    return localStorage.getItem(SENDA_ALARM_KEYS.lastTriggered) !== minuteKey;
}

function checkAlarm() {
    if (shouldTriggerAlarm()) triggerAlarm();
    updateAlarmPreview();
}

function loadAlarmSettings() {
    if (alarmTimeInput) alarmTimeInput.value = getSavedAlarmTime();
    if (alarmEnabledInput) alarmEnabledInput.checked = isSavedAlarmEnabled();
    clearInterval(alarmCheckTimer);
    alarmCheckTimer = setInterval(checkAlarm, 1000);
    checkAlarm();
}

if (saveAlarmButton) saveAlarmButton.addEventListener("click", saveAlarmSettings);
if (alarmWakeButton) alarmWakeButton.addEventListener("click", wakeFromAlarm);
if (alarmSnoozeButton) alarmSnoozeButton.addEventListener("click", snoozeAlarm);

loadAlarmSettings();
