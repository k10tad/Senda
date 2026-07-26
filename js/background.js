// Senda natural background
// 星・オリオン座の旧演出は使わず、低頻度の葉と日差しだけを描画する。

let sendaLeafTimerId = null;
let sendaSunlightTimerId = null;

function updateMoonlightTimeTheme() {
    const hour = new Date().getHours();
    document.body.classList.remove(
        "senda-dawn",
        "senda-day",
        "senda-evening",
        "senda-night",
        "senda-deep-night"
    );

    if (hour >= 5 && hour < 8) {
        document.body.classList.add("senda-dawn");
    } else if (hour >= 8 && hour < 17) {
        document.body.classList.add("senda-day");
    } else if (hour >= 17 && hour < 20) {
        document.body.classList.add("senda-evening");
    } else if (hour >= 20 || hour < 1) {
        document.body.classList.add("senda-night");
    } else {
        document.body.classList.add("senda-deep-night");
    }
}

function natureEffectsArePaused() {
    const sessionState = localStorage.getItem("sendaSessionState");
    return (
        document.hidden ||
        document.body.classList.contains("sleep-mode") ||
        sessionState === "work"
    );
}

function createOliveLeaves() {
    const layer = document.getElementById("sendaNatureEffects");
    if (!layer || natureEffectsArePaused()) {
        scheduleNextLeaves();
        return;
    }

    const leafCount = 1 + Math.floor(Math.random() * 3);
    const fromLeft = Math.random() < 0.5;

    for (let index = 0; index < leafCount; index += 1) {
        const leaf = document.createElement("span");
        leaf.className = "senda-olive-leaf";
        leaf.style.setProperty("--leaf-start-x", `${fromLeft ? -12 : 92 + Math.random() * 12}vw`);
        leaf.style.setProperty("--leaf-drift-x", `${fromLeft ? 48 + Math.random() * 40 : -(48 + Math.random() * 40)}vw`);
        leaf.style.setProperty("--leaf-start-y", `${8 + Math.random() * 34}vh`);
        leaf.style.setProperty("--leaf-fall-y", `${30 + Math.random() * 42}vh`);
        leaf.style.setProperty("--leaf-rotate", `${fromLeft ? 260 : -260 + Math.random() * 120}deg`);
        leaf.style.setProperty("--leaf-duration", `${10 + Math.random() * 5}s`);
        leaf.style.animationDelay = `${index * 0.8}s`;
        layer.appendChild(leaf);
        window.setTimeout(() => leaf.remove(), 17000);
    }

    scheduleNextLeaves();
}

function createSunlight() {
    const layer = document.getElementById("sendaNatureEffects");
    if (!layer || natureEffectsArePaused()) {
        scheduleNextSunlight();
        return;
    }

    const sunlight = document.createElement("span");
    sunlight.className = "senda-sunlight";
    if (Math.random() < 0.5) sunlight.classList.add("from-left");
    layer.appendChild(sunlight);
    window.setTimeout(() => sunlight.remove(), 15000);
    scheduleNextSunlight();
}

function scheduleNextLeaves(firstRun = false) {
    window.clearTimeout(sendaLeafTimerId);
    const delay = firstRun
        ? 22000 + Math.random() * 18000
        : 3 * 60 * 1000 + Math.random() * 3 * 60 * 1000;
    sendaLeafTimerId = window.setTimeout(createOliveLeaves, delay);
}

function scheduleNextSunlight(firstRun = false) {
    window.clearTimeout(sendaSunlightTimerId);
    const delay = firstRun
        ? 45000 + Math.random() * 30000
        : 8 * 60 * 1000 + Math.random() * 7 * 60 * 1000;
    sendaSunlightTimerId = window.setTimeout(createSunlight, delay);
}

function initNaturalBackground() {
    updateMoonlightTimeTheme();
    scheduleNextLeaves(true);
    scheduleNextSunlight(true);

    window.setInterval(updateMoonlightTimeTheme, 60 * 1000);
}

document.addEventListener("DOMContentLoaded", initNaturalBackground);
