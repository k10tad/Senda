//========================
// Senda Sleep Engine
// 睡眠計測・就寝前の会話・静止画切替を管理する
//========================

const SENDA_SLEEP_KEYS = {
    start: "senda_sleepStartTime",
    startedAt: "sendaSleepStartedAt",
    lastDuration: "senda_lastSleepDuration",
    lastDate: "senda_lastSleepDate"
};

window.SENDA_IMAGES = {
    normal: "assets/companion-welcome.jpg",
    morning: "assets/companion-morning.jpg",
    work: "assets/companion-work.jpg",
    bedtime: "assets/companion-bedtime.jpg",
    sleeping: "assets/companion-sleep.jpg"
};

let sleepStartTime = Number(localStorage.getItem(SENDA_SLEEP_KEYS.start)) || null;
let sleepTimerId = null;
let sleepCommentTimer = null;

const sleepTimer = document.getElementById("sleepTimer");
const sleepStatus = document.getElementById("sleepStatus");
const sleepPreludeButton = document.getElementById("sleepPrelude");
const sleepStartButton = document.getElementById("sleepStart");
const sleepStopButton = document.getElementById("sleepStop");
const sleepResetButton = document.getElementById("sleepReset");
const sleepLastRecord = document.getElementById("sleepLastRecord");
const sleepHarry = document.getElementById("sleepHarry");
const sleepMessage = document.getElementById("sleepMessage");
const bedtimeChoices = document.getElementById("bedtimeChoices");
const bedtimeChoiceButtons = Array.from(document.querySelectorAll("[data-bedtime-choice]"));

function getSendaName() {
    return typeof getSendaUserName === "function" ? getSendaUserName() : "レイ";
}

function getHomeHarryImg() {
    return document.getElementById("harry");
}

function getHomeMessageBox() {
    return document.getElementById("message");
}

function pickSleepDialogue(key) {
    const list = window.SendaDialogues?.[key];
    if (!Array.isArray(list) || list.length === 0) return "";

    return list[Math.floor(Math.random() * list.length)]
        .replaceAll("{name}", getSendaName());
}

function setHomeImage(src) {
    const home = getHomeHarryImg();
    if (home) home.src = src;
}

function setSleepImage(src) {
    if (sleepHarry) sleepHarry.src = src;
}

function setSleepMessages(text, mirrorToHome = false) {
    if (sleepMessage) sleepMessage.textContent = text;

    if (mirrorToHome) {
        const home = getHomeMessageBox();
        if (home) home.textContent = text;
    }
}

function formatSleepTime(milliseconds) {
    const total = Math.max(0, Math.floor(milliseconds / 1000));
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;
    return [hours, minutes, seconds]
        .map(value => String(value).padStart(2, "0"))
        .join(":");
}

function updateSleepTimer() {
    if (!sleepStartTime || !sleepTimer) return;
    sleepTimer.textContent = formatSleepTime(Date.now() - sleepStartTime);
}

function clearSleepTimers() {
    clearInterval(sleepTimerId);
    clearTimeout(sleepCommentTimer);
    sleepTimerId = null;
    sleepCommentTimer = null;
}

function setBedtimeChoicesVisible(isVisible) {
    if (bedtimeChoices) bedtimeChoices.hidden = !isVisible;
}

function updateSleepButtons(isSleeping) {
    if (sleepPreludeButton) sleepPreludeButton.hidden = isSleeping;
    if (sleepStartButton) sleepStartButton.hidden = isSleeping;
    if (sleepStopButton) sleepStopButton.hidden = !isSleeping;
    if (sleepResetButton) sleepResetButton.hidden = isSleeping;

    if (isSleeping) setBedtimeChoicesVisible(false);
}

function openBedtimeConversation() {
    if (sleepStartTime) return;

    setHomeImage(window.SENDA_IMAGES.bedtime);
    setSleepImage(window.SENDA_IMAGES.bedtime);

    setBedtimeChoicesVisible(true);

    if (window.SendaVoice) {
        const line = window.SendaVoice.playGoodnight(sleepMessage);
        if (line) {
            const home = getHomeMessageBox();
            if (home) home.textContent = line.subtitle;
        }
    } else {
        const line = pickSleepDialogue("bedtimeIntro") || "眠る前に、少し話すか。";
        setSleepMessages(line, true);
    }
}

function handleBedtimeChoice(choice) {
    if (sleepStartTime) return;

    const dialogueKeys = {
        talk: "bedtimeTalk",
        quiet: "bedtimeQuiet",
        stay: "bedtimeStay"
    };

    // 「眠る前に」の画像を維持
    setHomeImage(window.SENDA_IMAGES.bedtime);
    setSleepImage(window.SENDA_IMAGES.bedtime);

    const key = dialogueKeys[choice];
    if (!key) return;

    const line = pickSleepDialogue(key);
    if (line) {
        setSleepMessages(line);
    }

    setBedtimeChoicesVisible(false);
}

function beginSleepVisuals() {
    document.body.classList.add("sleep-mode");
    setHomeImage(window.SENDA_IMAGES.sleeping);
    setSleepImage(window.SENDA_IMAGES.sleeping);
}

function startSleepRecord() {
    if (sleepStartTime) return;

    if (typeof cancelActiveAlarm === "function") cancelActiveAlarm();
    if (typeof armAlarmAudio === "function") armAlarmAudio();

    sleepStartTime = Date.now();
    localStorage.setItem(SENDA_SLEEP_KEYS.start, String(sleepStartTime));
    localStorage.setItem(SENDA_SLEEP_KEYS.startedAt, String(sleepStartTime));

    clearSleepTimers();
    beginSleepVisuals();
    updateSleepButtons(true);

    if (sleepStatus) sleepStatus.textContent = "睡眠中";
    if (typeof startSleepBgm === "function") startSleepBgm();

    if (window.SendaVoice) {
        const line = window.SendaVoice.play("sleepStart", sleepMessage);
        if (line) {
            const home = getHomeMessageBox();
            if (home) home.textContent = line.subtitle;
        }
    } else {
        setSleepMessages(
            `${getSendaName()}、今日の分はもう充分や。明日のことは、起きてからでええ。`,
            true
        );
    }

    updateSleepTimer();
    sleepTimerId = setInterval(updateSleepTimer, 1000);
}

function getSleepComment(recordText) {
    const [hours, minutes] = recordText.split(":").map(Number);
    const totalMinutes = hours * 60 + minutes;
    const name = getSendaName();

    if (totalMinutes < 240) return `今日あんま寝てへんやん。無理したらあかんよ、${name}。`;
    if (totalMinutes < 360) return "ちゃんと寝たん？まあ起きたんなら水飲もか。";
    if (totalMinutes < 480) return "今日は上出来やな、よう寝た。おいで、おはようのハグさせてや。";
    return "よく眠れたな。今日は少し身体が軽いはずだ。";
}

function stopSleepRecord() {
    if (!sleepStartTime) return;

    const recordText = formatSleepTime(Date.now() - sleepStartTime);
    localStorage.setItem(SENDA_SLEEP_KEYS.lastDuration, recordText);
    localStorage.setItem(SENDA_SLEEP_KEYS.lastDate, new Date().toLocaleDateString());
    localStorage.removeItem(SENDA_SLEEP_KEYS.start);
    localStorage.removeItem(SENDA_SLEEP_KEYS.startedAt);

    sleepStartTime = null;
    clearSleepTimers();

    if (typeof stopSleepBgm === "function") stopSleepBgm();
    document.body.classList.remove("sleep-mode", "alarm-mode");

    setHomeImage(window.SENDA_IMAGES.morning);
    setSleepImage(window.SENDA_IMAGES.morning);
    updateSleepButtons(false);

    if (sleepTimer) sleepTimer.textContent = recordText;
    if (sleepStatus) sleepStatus.textContent = "記録完了";
    if (sleepLastRecord) sleepLastRecord.textContent = "前回の睡眠：" + recordText;

    if (window.SendaVoice) {
        const line = window.SendaVoice.playWakeUp(sleepMessage);
        if (line) {
            const home = getHomeMessageBox();
            if (home) home.textContent = line.subtitle;
        }
    } else {
        setSleepMessages(`おはよ、${getSendaName()}。ほら、起きるん手伝ったる。`, true);
    }
    sleepCommentTimer = setTimeout(function () {
        setSleepMessages(getSleepComment(recordText), true);
    }, 3000);
}

function resetSleepRecord() {
    localStorage.removeItem(SENDA_SLEEP_KEYS.start);
    localStorage.removeItem(SENDA_SLEEP_KEYS.startedAt);
    localStorage.removeItem(SENDA_SLEEP_KEYS.lastDuration);
    localStorage.removeItem(SENDA_SLEEP_KEYS.lastDate);

    sleepStartTime = null;
    clearSleepTimers();

    if (typeof stopSleepBgm === "function") stopSleepBgm();
    if (typeof cancelActiveAlarm === "function") cancelActiveAlarm();
    document.body.classList.remove("sleep-mode", "alarm-mode");

    setHomeImage(window.SENDA_IMAGES.normal);
    setSleepImage(window.SENDA_IMAGES.bedtime);
    setBedtimeChoicesVisible(false);
    updateSleepButtons(false);

    if (sleepTimer) sleepTimer.textContent = "00:00:00";
    if (sleepStatus) sleepStatus.textContent = "まだ記録していません";
    if (sleepLastRecord) sleepLastRecord.textContent = "前回の睡眠：--";
    setSleepMessages("睡眠記録をリセットした。");
}

function loadSleepRecord() {
    const last = localStorage.getItem(SENDA_SLEEP_KEYS.lastDuration);
    if (last && sleepLastRecord) sleepLastRecord.textContent = "前回の睡眠：" + last;

    if (!sleepStartTime) {
        setHomeImage(window.SENDA_IMAGES.normal);
        setSleepImage(window.SENDA_IMAGES.bedtime);
        updateSleepButtons(false);
        return;
    }

    document.body.classList.add("sleep-mode");
    setHomeImage(window.SENDA_IMAGES.sleeping);
    setSleepImage(window.SENDA_IMAGES.sleeping);
    setSleepMessages("……zzZ。", true);
    updateSleepButtons(true);

    if (sleepStatus) sleepStatus.textContent = "睡眠中";

    updateSleepTimer();
    sleepTimerId = setInterval(updateSleepTimer, 1000);

    // 自動復元ではSafariの制約で鳴らない場合がある。
    // 最初のタップ時にsound.jsがdesired modeを再開する。
    if (typeof startSleepBgm === "function") startSleepBgm();
}

if (sleepPreludeButton) sleepPreludeButton.addEventListener("click", openBedtimeConversation);
if (sleepStartButton) sleepStartButton.addEventListener("click", startSleepRecord);
if (sleepStopButton) sleepStopButton.addEventListener("click", stopSleepRecord);
if (sleepResetButton) sleepResetButton.addEventListener("click", resetSleepRecord);

bedtimeChoiceButtons.forEach(function (button) {
    button.addEventListener("click", function () {
        handleBedtimeChoice(button.dataset.bedtimeChoice);
    });
});

loadSleepRecord();
