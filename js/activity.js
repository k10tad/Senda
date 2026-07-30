//========================
// Harry current activity
// Senda専用。Havenの状態・保存領域とは共有しない。
//========================

(function () {
    "use strict";

    const STORAGE_KEY = "senda_harry_current_activity_v1";
    const MINUTE = 60 * 1000;

    const activities = {
        work: {
            label: "仕事中",
            image: "assets/activity-work.jpg",
            duration: [70, 130],
            soundDelay: [14, 32]
        },
        reading: {
            label: "読書中",
            image: "assets/activity-reading.jpg",
            duration: [45, 100],
            soundDelay: [12, 28]
        },
        shower: {
            label: "シャワーのあと",
            image: "assets/activity-shower.jpg",
            duration: [22, 42],
            soundDelay: [18, 38]
        },
        drink: {
            label: "一杯やってる",
            image: "assets/activity-drink.jpg",
            duration: [45, 95],
            soundDelay: [22, 45]
        },
        maintenance: {
            label: "道具の手入れ中",
            image: "assets/activity-maintenance.jpg",
            duration: [45, 90],
            soundDelay: [12, 30]
        }
    };

    let currentName = null;
    let changeTimer = null;
    let soundTimer = null;
    let sessionOverride = false;
    let passiveOverride = false;

    function readSaved() {
        try {
            const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
            if (!value || !activities[value.name]) return null;
            return value;
        } catch (_) {
            return null;
        }
    }

    function save(name, until) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ name, until }));
    }

    function weightedPool(now) {
        const hour = now.getHours();
        const weekend = now.getDay() === 0 || now.getDay() === 6;
        const pool = [];

        function add(name, weight) {
            for (let i = 0; i < weight; i += 1) pool.push(name);
        }

        if (!weekend && hour >= 8 && hour < 18) add("work", 7);
        else if (hour >= 9 && hour < 20) add("work", 2);

        add("reading", hour >= 20 || hour < 2 ? 6 : 3);
        add("maintenance", hour >= 10 && hour < 22 ? 5 : 1);

        if ((hour >= 6 && hour < 10) || hour >= 21) add("shower", 5);
        if (hour >= 18 || hour < 2) add("drink", 6);

        return pool.length ? pool : ["reading"];
    }

    function pickNext() {
        const weighted = weightedPool(new Date());
        const pool = weighted.filter(name => name !== currentName);
        const candidates = pool.length ? pool : weighted;
        return candidates[Math.floor(Math.random() * candidates.length)];
    }

    function randomDuration(name) {
        const range = activities[name].duration;
        return (range[0] + Math.random() * (range[1] - range[0])) * MINUTE;
    }

    function canShow() {
        return !sessionOverride
            && !passiveOverride
            && (typeof sessionState === "undefined" || sessionState === "idle");
    }

    function render() {
        if (!canShow() || !currentName) return;

        const activity = activities[currentName];
        const image = document.getElementById("harry");
        const badge = document.getElementById("harryActivity");
        const label = document.getElementById("harryActivityLabel");

        if (image) {
            image.src = activity.image;
            image.alt = `Harry・${activity.label}`;
        }
        if (label) label.textContent = activity.label;
        if (badge) badge.hidden = false;
    }

    function hideBadge() {
        const badge = document.getElementById("harryActivity");
        if (badge) badge.hidden = true;
    }

    function scheduleAmbientSound() {
        clearTimeout(soundTimer);
        if (!canShow() || !currentName) return;

        const range = activities[currentName].soundDelay || [15, 35];
        const delay = (range[0] + Math.random() * (range[1] - range[0])) * 1000;
        soundTimer = setTimeout(function () {
            if (
                canShow()
                && typeof playSendaActivitySound === "function"
            ) {
                playSendaActivitySound(currentName);
            }
            scheduleAmbientSound();
        }, delay);
    }

    function scheduleChange(until) {
        clearTimeout(changeTimer);
        const delay = Math.max(1000, until - Date.now());
        changeTimer = setTimeout(function () {
            setActivity(pickNext(), true);
        }, delay);
    }

    function setActivity(name, announceSound) {
        if (!activities[name]) return;

        currentName = name;
        const until = Date.now() + randomDuration(name);
        save(name, until);
        render();
        scheduleChange(until);
        scheduleAmbientSound();

        if (
            announceSound
            && canShow()
            && typeof playSendaActivitySound === "function"
        ) {
            playSendaActivitySound(name);
        }
    }

    function restoreForIdle() {
        sessionOverride = false;
        const saved = readSaved();

        if (saved && saved.until > Date.now()) {
            currentName = saved.name;
            render();
            scheduleChange(saved.until);
            scheduleAmbientSound();
            return;
        }

        setActivity(pickNext(), false);
    }

    function setSessionOverride(active) {
        sessionOverride = Boolean(active);

        if (sessionOverride) {
            hideBadge();
            clearTimeout(soundTimer);
        } else {
            restoreForIdle();
        }
    }

    function setPassiveOverride(active) {
        passiveOverride = Boolean(active);

        if (passiveOverride) {
            hideBadge();
            clearTimeout(soundTimer);
        } else {
            restoreForIdle();
        }
    }

    function init() {
        if (typeof sessionState !== "undefined" && sessionState !== "idle") {
            sessionOverride = true;
            hideBadge();
            return;
        }
        restoreForIdle();
    }

    window.SendaActivity = {
        restoreForIdle,
        setSessionOverride,
        setPassiveOverride,
        getCurrent: function () {
            return currentName;
        }
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
        init();
    }
})();
