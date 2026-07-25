//========================
// Senda Moonlight background
// 星空・オリオン座・金色の月明かり
//========================

const SENDA_STAR_COUNT = 52;
let sendaGlintTimerId = null;

function createMoonlightStars() {
    const starField = document.getElementById("starField");
    if (!starField || starField.childElementCount > 0) return;

    for (let i = 0; i < SENDA_STAR_COUNT; i++) {
        const star = document.createElement("span");
        const size = 1.1 + Math.random() * 2.7;
        const duration = 16 + Math.random() * 34;
        const delay = Math.random() * -42;
        const gold = Math.random() < 0.16;
        const bright = !gold && Math.random() < 0.18;

        star.className = "moonlight-star";
        if (gold) star.classList.add("star-gold");
        if (bright) star.classList.add("star-bright");

        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.animationDuration = `${duration}s`;
        star.style.animationDelay = `${delay}s`;
        star.style.setProperty(
            "--star-opacity",
            (0.48 + Math.random() * 0.48).toFixed(2)
        );

        starField.appendChild(star);
    }
}

function createHomeOrion() {
    const orion = document.getElementById("homeOrion");
    if (!orion || orion.childElementCount > 0) return;

    const points = [
        [23, 18], [69, 20],
        [38, 46], [50, 49], [62, 46],
        [29, 78], [72, 80]
    ];

    const connections = [
        [0, 2], [1, 4], [2, 3], [3, 4],
        [2, 5], [4, 6], [0, 1]
    ];

    points.forEach(([x, y], index) => {
        const star = document.createElement("span");
        star.className = `orion-star orion-star-${index + 1}`;
        star.style.left = `${x}%`;
        star.style.top = `${y}%`;
        orion.appendChild(star);
    });

    connections.forEach(([from, to]) => {
        const [x1, y1] = points[from];
        const [x2, y2] = points[to];
        const dx = x2 - x1;
        const dy = y2 - y1;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;

        const line = document.createElement("span");
        line.className = "orion-line";
        line.style.left = `${x1}%`;
        line.style.top = `${y1}%`;
        line.style.width = `${length}%`;
        line.style.transform = `rotate(${angle}deg)`;
        orion.appendChild(line);
    });
}

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

function createGoldGlint() {
    if (document.body.classList.contains("sleep-mode")) {
        scheduleNextGoldGlint();
        return;
    }

    const glint = document.createElement("span");
    glint.className = "senda-gold-glint";

    // 画面端やカード付近に、月光の粒が一度だけ灯る。
    glint.style.left = `${8 + Math.random() * 84}%`;
    glint.style.top = `${8 + Math.random() * 78}%`;

    document.body.appendChild(glint);
    window.setTimeout(() => glint.remove(), 4200);

    scheduleNextGoldGlint();
}

function scheduleNextGoldGlint() {
    window.clearTimeout(sendaGlintTimerId);
    sendaGlintTimerId = window.setTimeout(
        createGoldGlint,
        24000 + Math.random() * 42000
    );
}

function initMoonlightBackground() {
    createMoonlightStars();
    createHomeOrion();
    updateMoonlightTimeTheme();
    scheduleNextGoldGlint();

    window.setInterval(updateMoonlightTimeTheme, 60 * 1000);
}

document.addEventListener("DOMContentLoaded", initMoonlightBackground);
