//========================
// Senda Audio Engine
// 音声はこのファイルだけが管理する
//========================

let audioMode = "idle"; // idle / work / break / sleep / alarm

const SENDA_FIXED_BGM_VOLUME = 0.18;
const SENDA_FIXED_LIVING_VOLUME = 0.15;
const SENDA_FIXED_SLEEP_VOLUME = 0.78;
const SENDA_FIXED_SLEEP_DEEP_BREATH_VOLUME = 0.045;
const SENDA_FIXED_HEARTBEAT_VOLUME = 0.58;

const sendaAudio = {
    workBgm: new Audio("sound/BGM.mp3"),
    breakBgm: new Audio("sound/Break_BGM.mp3"),
    clock: new Audio("sound/clock.mp3"),
    pen: new Audio("sound/pen.mp3"),
    page: new Audio("sound/page.mp3"),
    gear: new Audio("sound/gear.mp3"),
    breath: new Audio("sound/breath_idle.mp3"),
    throat: new Audio("sound/throat.mp3"),
    step: new Audio("sound/step.mp3"),
    sleepBreath: new Audio("sound/sleep-breath.mp3"),
    heartbeat: new Audio("sound/heartbeat.mp3"),
    alarm: new Audio("sound/alarm.mp3")
};

sendaAudio.workBgm.loop = true;
sendaAudio.breakBgm.loop = true;
sendaAudio.clock.loop = true;
sendaAudio.sleepBreath.loop = true;
sendaAudio.heartbeat.loop = true;
sendaAudio.alarm.loop = true;

Object.values(sendaAudio).forEach(function (audio) {
    audio.preload = "auto";
});

let audioUnlocked = false;
let desiredAudioMode = "idle";
let deskTimer = null;
let humanTimer = null;
let gearTimer = null;
let sleepDeepBreathTimer = null;
let throatStopTimer = null;
let lastLivingSound = null;
let bedroomAmbienceEnabled = false;
let sendaBgmDuckFactor = 1;
let sendaBgmDuckFrame = null;

function clamp01(value) {
    return Math.min(1, Math.max(0, Number(value) || 0));
}

function applySendaAudioSettings() {
    const bgm = SENDA_FIXED_BGM_VOLUME;
    const living = SENDA_FIXED_LIVING_VOLUME;

    sendaAudio.workBgm.volume = clamp01(bgm * sendaBgmDuckFactor);
    sendaAudio.breakBgm.volume = clamp01(bgm * 0.84 * sendaBgmDuckFactor);
    sendaAudio.clock.volume = living * 0.74;
    sendaAudio.pen.volume = living;
    sendaAudio.page.volume = living * 1.12;
    sendaAudio.gear.volume = living * 0.86;
    sendaAudio.throat.volume = living * 0.74;
    sendaAudio.step.volume = living * 0.92;

    // 睡眠音はSettingsに依存させず、コード側で固定する。
    sendaAudio.sleepBreath.volume = SENDA_FIXED_SLEEP_VOLUME;
    sendaAudio.heartbeat.volume = SENDA_FIXED_HEARTBEAT_VOLUME;
    sendaAudio.breath.volume = audioMode === "sleep"
        ? SENDA_FIXED_SLEEP_DEEP_BREATH_VOLUME
        : living * 0.86;
    sendaAudio.alarm.volume = 0.48;
}

function setSendaVoiceDucking(active) {
    const start = sendaBgmDuckFactor;
    const target = active ? 0.3 : 1;
    const duration = active ? 240 : 520;
    const startedAt = performance.now();

    if (sendaBgmDuckFrame !== null) {
        cancelAnimationFrame(sendaBgmDuckFrame);
        sendaBgmDuckFrame = null;
    }

    function step(now) {
        const progress = Math.min(1, (now - startedAt) / duration);
        const eased = progress < 0.5
            ? 2 * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        sendaBgmDuckFactor = start + (target - start) * eased;
        applySendaAudioSettings();

        if (progress < 1) {
            sendaBgmDuckFrame = requestAnimationFrame(step);
        } else {
            sendaBgmDuckFactor = target;
            sendaBgmDuckFrame = null;
            applySendaAudioSettings();
        }
    }

    sendaBgmDuckFrame = requestAnimationFrame(step);
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
    clearTimeout(gearTimer);
    clearTimeout(sleepDeepBreathTimer);
    clearTimeout(throatStopTimer);
    deskTimer = null;
    humanTimer = null;
    gearTimer = null;
    sleepDeepBreathTimer = null;
    throatStopTimer = null;
}

function stopAllAudioElements() {
    Object.values(sendaAudio).forEach(audio => stopAudio(audio));
}

function syncBedroomHeartbeat() {
    const shouldPlay = bedroomAmbienceEnabled
        && audioUnlocked
        && audioMode !== "alarm";

    if (!shouldPlay) {
        stopAudio(sendaAudio.heartbeat);
        return;
    }

    applySendaAudioSettings();
    if (sendaAudio.heartbeat.paused) {
        safePlay(sendaAudio.heartbeat);
    }
}

function setBedroomAmbience(enabled) {
    bedroomAmbienceEnabled = Boolean(enabled);

    if (!bedroomAmbienceEnabled) {
        stopAudio(sendaAudio.heartbeat);
        return;
    }

    unlockAudio();
    syncBedroomHeartbeat();
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

function scheduleGearSound() {
    clearTimeout(gearTimer);
    if (audioMode !== "work") return;

    gearTimer = setTimeout(function () {
        if (audioMode !== "work") return;
        replay(sendaAudio.gear);
        scheduleGearSound();
    }, randomBetween(90000, 240000));
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
        scheduleGearSound();
    } else if (nextMode === "break") {
        safePlay(sendaAudio.breakBgm);
    } else if (nextMode === "sleep") {
        safePlay(sendaAudio.sleepBreath);
        scheduleSleepDeepBreath();
    } else if (nextMode === "alarm") {
        safePlay(sendaAudio.alarm);
    }

    syncBedroomHeartbeat();
}

function unlockAudio() {
    if (audioUnlocked) {
        if (desiredAudioMode !== "idle" && audioMode !== desiredAudioMode) {
            setMode(desiredAudioMode);
        } else {
            syncBedroomHeartbeat();
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
            if (desiredAudioMode !== "idle") {
                setMode(desiredAudioMode);
            } else {
                syncBedroomHeartbeat();
            }
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
