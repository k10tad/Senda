//========================
// Quédate / AQUÍ CONMIGO
// 会話を求めず、Harryの生活音だけをそばに置くモード
//========================

(function () {
    "use strict";

    const STORAGE_KEY = "senda_quedate_active_v1";
    const START_LINE = "……それだけでええん？\nほな、勝手に隣おるわ。";
    const END_LINES = [
        "もうええん？　……ほな、また呼び。",
        "戻るんやな。俺はここおるから、好きにし。",
        "分かった。けど、また一人で抱え込む前に呼びや。"
    ];
    const CONTINUE_LINES = [
        "うん。ほな、まだここおる。",
        "分かった。何も話さんでええよ。",
        "まだ一緒やな。……それでええ。",
        "勝手に離れたりせえへんよ。安心し。"
    ];

    let active = false;
    let soundTimer = null;

    function statusElement() {
        return document.getElementById("callHarry");
    }

    function messageElement(target) {
        return target || document.getElementById("message");
    }

    function closeChoices() {
        const container = document.getElementById("companionReplyChoices");
        if (!container) return;
        container.hidden = true;
        container.classList.remove("senda-stay-choices");
    }

    function showLine(target, text) {
        const element = messageElement(target);
        if (!element) return;

        if (window.SendaTypewriter?.show) {
            window.SendaTypewriter.show(element, text);
        } else {
            element.textContent = text;
        }
    }

    function scheduleSound(initial = false) {
        clearTimeout(soundTimer);
        if (!active) return;

        const delay = initial
            ? (2.5 + Math.random() * 2.5) * 1000
            : (10 + Math.random() * 16) * 1000;
        soundTimer = setTimeout(function () {
            if (active && typeof playSendaStaySound === "function") {
                const activityName = window.SendaActivity?.getCurrent?.();
                playSendaStaySound(activityName);
            }
            scheduleSound(false);
        }, delay);
    }

    function applyVisualState() {
        const button = statusElement();
        if (button) {
            button.classList.toggle("senda-stay-call", active);
            button.replaceChildren();

            if (active) {
                const modeName = document.createElement("span");
                const label = document.createElement("small");
                modeName.textContent = "Quédate";
                label.textContent = "そばにいる";
                button.append(modeName, label);
                button.setAttribute("aria-label", "Quédate・そばにいる");
            } else {
                button.textContent = "Harry";
                button.setAttribute("aria-label", "Harryを呼ぶ");
            }
        }
        document.body.classList.toggle("senda-stay-active", active);

        if (window.SendaActivity?.setPassiveOverride) {
            window.SendaActivity.setPassiveOverride(active);
        }
    }

    function start(target) {
        if (typeof sessionState !== "undefined" && sessionState !== "idle") {
            showLine(
                target,
                "今の作業、途中やろ？　終わったら隣おるから、先に片付けておいで。"
            );
            return false;
        }

        if (active) {
            showLine(target, "もう隣おるやろ。確認せんでも逃げへんよ。");
            return true;
        }

        active = true;
        localStorage.setItem(STORAGE_KEY, "1");
        applyVisualState();
        showLine(target, START_LINE);
        scheduleSound(true);
        return true;
    }

    function stop(options = {}) {
        if (!active) return;

        active = false;
        localStorage.removeItem(STORAGE_KEY);
        clearTimeout(soundTimer);
        soundTimer = null;
        closeChoices();
        applyVisualState();

        if (options.silent !== true) {
            const line = END_LINES[Math.floor(Math.random() * END_LINES.length)];
            showLine(null, line);
        }
    }

    function continueStay() {
        if (!active) return;

        const line =
            CONTINUE_LINES[Math.floor(Math.random() * CONTINUE_LINES.length)];
        showLine(null, line);
        scheduleSound(false);
    }

    function openChoices(container, buttons) {
        if (!active || !container || !Array.isArray(buttons)) return;

        const choices = [
            { value: "stayEnd", label: "この時間を終える" },
            { value: "stayContinue", label: "まだここにいる" }
        ];

        buttons.forEach(function (button, index) {
            const choice = choices[index];
            if (!choice) {
                button.hidden = true;
                return;
            }

            button.hidden = false;
            button.disabled = false;
            button.dataset.companionReply = choice.value;
            button.textContent = choice.label;
        });

        container.classList.add("senda-stay-choices");
        container.hidden = false;
    }

    function restore() {
        if (localStorage.getItem(STORAGE_KEY) !== "1") return;
        if (typeof sessionState !== "undefined" && sessionState !== "idle") {
            localStorage.removeItem(STORAGE_KEY);
            return;
        }

        active = true;
        applyVisualState();
        scheduleSound(true);
    }

    window.SendaStayMode = {
        start,
        stop,
        continueStay,
        openChoices,
        closeChoices,
        isActive: function () {
            return active;
        }
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", restore, { once: true });
    } else {
        restore();
    }
})();
