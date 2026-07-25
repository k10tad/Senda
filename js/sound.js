//========================
// Senda Audio Engine
// 音声はこのファイルだけが管理する
//========================

let audioMode = "idle"; // idle / work / break / sleep / alarm

const SENDA_AUDIO_SETTINGS_KEY = "sendaSettings";
const SENDA_FIXED_SLEEP_VOLUME = 0.78;
const SENDA_FIXED_SLEEP_DEEP_BREATH_VOLUME = 0.045;

const sendaAudio = {
    workBgm: new Audio("sound/BGM.mp3"),
    breakBgm: new Audio("sound/Break_BGM.mp3"),
    clock: new Audio("sound/clock.mp3"),
    pen: new Audio("sound/pen.mp3"),
    page: new Audio("sound/page.mp3"),
    breath: new Audio("sound/breath_idle.mp3"),
    throat: new Audio("sound/throat.mp3"),
    step: new Audio("sound/step.mp3"),
    sleepBreath: new Audio("sound/breath_idle.mp3"),
    alarm: new Audio("sound/alarm.mp3")
};

sendaAudio.workBgm.loop = true;
sendaAudio.breakBgm.loop = true;
sendaAudio.clock.loop = true;
sendaAudio.sleepBreath.loop = true;
sendaAudio.alarm.loop = true;

Object.values(sendaAudio).forEach(function (audio) {
    audio.preload = "auto";
});

let audioUnlocked = false;
let desiredAudioMode = "idle";
let deskTimer = null;
let humanTimer = null;
let sleepDeepBreathTimer = null;
let throatStopTimer = null;
let lastLivingSound = null;

function readAudioSettings() {
    try {
        const saved = JSON.parse(localStorage.getItem(SENDA_AUDIO_SETTINGS_KEY));
        return {
            bgmVolume: Number(saved?.bgmVolume ?? 18),
            livingVolume: Number(saved?.livingVolume ?? 15)
        };
    } catch (_) {
        return { bgmVolume: 18, livingVolume: 15 };
    }
}

function clamp01(value) {
    return Math.min(1, Math.max(0, Number(value) || 0));
}

function applySendaAudioSettings() {
    const settings = readAudioSettings();
    const bgm = clamp01(settings.bgmVolume / 100);
    const living = clamp01(settings.livingVolume / 100);

    sendaAudio.workBgm.volume = bgm;
    sendaAudio.breakBgm.volume = bgm * 0.84;
    sendaAudio.clock.volume = living * 0.74;
    sendaAudio.pen.volume = living;
    sendaAudio.page.volume = living * 1.12;
    sendaAudio.throat.volume = living * 0.74;
    sendaAudio.step.volume = living * 0.92;

    // 睡眠音はSettingsに依存させず、コード側で固定する。
    sendaAudio.sleepBreath.volume = SENDA_FIXED_SLEEP_VOLUME;
    sendaAudio.breath.volume = audioMode === "sleep"
        ? SENDA_FIXED_SLEEP_DEEP_BREATH_VOLUME
        : living * 0.86;
    sendaAudio.alarm.volume = 0.48;
}

function safePlay(audio) {
    if (!audio) return Promise.resolve(false);
    try {
        const result = audio.play();
        if (result && typeof result.then === "function") {
            return result.then(() => true).catch(() => false);
        }
        return Promise.resolve(true);
    } catch (_) {
        return Promise.resolve(false);
    }
}

function stopAudio(audio, reset = true) {
    if (!audio) return;
    audio.pause();
    if (reset) {
        try { audio.currentTime = 0; } catch (_) {}
    }
}

function replay(audio) {
    stopAudio(audio);
    safePlay(audio);
}

function clearAudioTimers() {
    clearTimeout(deskTimer);
    clearTimeout(humanTimer);
    clearTimeout(sleepDeepBreathTimer);
    clearTimeout(throatStopTimer);
    deskTimer = null;
    humanTimer = null;
    sleepDeepBreathTimer = null;
    throatStopTimer = null;
}

function stopAllAudioElements() {
    Object.values(sendaAudio).forEach(audio => stopAudio(audio));
}

function randomBetween(min, max) {
    return min + Math.random() * (max - min);
}

function chooseDifferent(list) {
    const candidates = list.filter(item => item.key !== lastLivingSound);
    const pool = candidates.length ? candidates : list;
    const item = pool[Math.floor(Math.random() * pool.length)];
    lastLivingSound = item.key;
    return item;
}

function playThroatSound() {
    if (audioMode !== "work") return;
    stopAudio(sendaAudio.throat);
    safePlay(sendaAudio.throat);
    clearTimeout(throatStopTimer);
    throatStopTimer = setTimeout(function () {
        stopAudio(sendaAudio.throat);
    }, 3000);
}

function scheduleDeskSound() {
    clearTimeout(deskTimer);
    if (audioMode !== "work") return;

    deskTimer = setTimeout(function () {
        if (audioMode !== "work") return;
        const choice = chooseDifferent([
            { key: "pen", audio: sendaAudio.pen },
            { key: "page", audio: sendaAudio.page }
        ]);
        replay(choice.audio);
        scheduleDeskSound();
    }, randomBetween(20000, 55000));
}

function scheduleHumanSound() {
    clearTimeout(humanTimer);
    if (audioMode !== "work") return;

    humanTimer = setTimeout(function () {
        if (audioMode !== "work") return;
        if (Math.random() < 0.16) {
            lastLivingSound = "throat";
            playThroatSound();
        } else {
            lastLivingSound = "breath";
            replay(sendaAudio.breath);
        }
        scheduleHumanSound();
    }, randomBetween(55000, 140000));
}

function scheduleSleepDeepBreath() {
    clearTimeout(sleepDeepBreathTimer);
    if (audioMode !== "sleep") return;

    sleepDeepBreathTimer = setTimeout(function () {
        if (audioMode !== "sleep") return;
        sendaAudio.breath.volume = SENDA_FIXED_SLEEP_DEEP_BREATH_VOLUME;
        replay(sendaAudio.breath);
        scheduleSleepDeepBreath();
    }, randomBetween(60000, 150000));
}

function setMode(nextMode) {
    desiredAudioMode = nextMode;
    clearAudioTimers();
    stopAllAudioElements();
    audioMode = nextMode;
    applySendaAudioSettings();

    if (nextMode === "work") {
        safePlay(sendaAudio.workBgm);
        safePlay(sendaAudio.clock);
        scheduleDeskSound();
        scheduleHumanSound();
    } else if (nextMode === "break") {
        safePlay(sendaAudio.breakBgm);
    } else if (nextMode === "sleep") {
        safePlay(sendaAudio.sleepBreath);
        scheduleSleepDeepBreath();
    } else if (nextMode === "alarm") {
        safePlay(sendaAudio.alarm);
    }
}

function unlockAudio() {
    if (audioUnlocked) {
        if (desiredAudioMode !== "idle" && audioMode !== desiredAudioMode) {
            setMode(desiredAudioMode);
        }
        return;
    }

    audioUnlocked = true;
    applySendaAudioSettings();

    // ユーザー操作の中でアラーム音を無音再生し、後の自動再生を許可しやすくする。
    const previous = sendaAudio.alarm.volume;
    sendaAudio.alarm.volume = 0.001;
    safePlay(sendaAudio.alarm).then(function () {
        setTimeout(function () {
            stopAudio(sendaAudio.alarm);
            sendaAudio.alarm.volume = previous;
            if (desiredAudioMode !== "idle") setMode(desiredAudioMode);
        }, 40);
    });
}

function armAlarmAudio() {
    unlockAudio();
}

function startRoomSounds() {
    unlockAudio();
    setMode("work");
}

function stopRoomSounds() {
    if (audioMode === "work") setMode("idle");
}

function startBreakBgm() {
    unlockAudio();
    setMode("break");
}

function stopBreakBgm() {
    if (audioMode === "break") setMode("idle");
}

function startSleepBgm() {
    unlockAudio();
    setMode("sleep");
}

function stopSleepBgm() {
    if (audioMode === "sleep") setMode("idle");
}

function startAlarmSound() {
    setMode("alarm");
}

function stopAlarmSound() {
    if (audioMode === "alarm") setMode("idle");
    else stopAudio(sendaAudio.alarm);
}

function stopAllSounds() {
    setMode("idle");
}

function playPageStepSound() {
    if (audioMode === "sleep" || audioMode === "alarm") return;
    applySendaAudioSettings();
    replay(sendaAudio.step);
}

// 最初のユーザー操作で音声を解錠する。
document.addEventListener("pointerdown", unlockAudio, { once: true, passive: true });
document.addEventListener("touchend", unlockAudio, { once: true, passive: true });
document.addEventListener("keydown", unlockAudio, { once: true });

applySendaAudioSettings();
