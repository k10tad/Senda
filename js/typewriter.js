//========================
// Senda dialogue typewriter
// 既存・追加を問わず、台詞領域への書き込みを一元的に表示する
//========================
(function () {
    "use strict";

    const SELECTORS = [
        "#message",
        "#sleepMessage",
        "#alarmWakeMessage",
        "#sendaBirthdayMessage"
    ];
    const state = new WeakMap();

    function resolveElement(target) {
        return typeof target === "string" ? document.querySelector(target) : target;
    }

    function waitForCharacter(character) {
        if (/[。！？!?]/.test(character)) return 260;
        if (/[、，,；;：:]/.test(character)) return 135;
        if (character === "…") return 190;
        if (character === "\n") return 150;
        return 62;
    }

    function write(element, value) {
        const current = state.get(element) || {};
        current.internalText = value;
        state.set(element, current);
        element.textContent = value;
    }

    function show(target, text, options = {}) {
        const element = resolveElement(target);
        if (!element) return Promise.resolve();

        const fullText = String(text ?? "");
        const previous = state.get(element) || {};
        const token = (previous.token || 0) + 1;
        state.set(element, { ...previous, token, fullText, internalText: "" });

        element.setAttribute("aria-label", fullText);
        element.classList.add("senda-typewriter-active");
        write(element, "");

        if (!fullText || options.instant === true || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            write(element, fullText);
            element.classList.remove("senda-typewriter-active");
            return Promise.resolve();
        }

        return new Promise(resolve => {
            let index = 0;

            function next() {
                const current = state.get(element);
                if (!current || current.token !== token) {
                    resolve();
                    return;
                }

                index += 1;
                write(element, fullText.slice(0, index));

                if (index >= fullText.length) {
                    element.classList.remove("senda-typewriter-active");
                    resolve();
                    return;
                }

                const delay = options.speed || waitForCharacter(fullText[index - 1]);
                window.setTimeout(next, delay);
            }

            next();
        });
    }

    const observer = new MutationObserver(records => {
        const changed = new Set();
        records.forEach(record => {
            const element = record.target.nodeType === Node.TEXT_NODE
                ? record.target.parentElement
                : record.target;
            const target = element?.closest?.(SELECTORS.join(","));
            if (target) changed.add(target);
        });

        changed.forEach(element => {
            const actual = element.textContent || "";
            const current = state.get(element);
            if (current && actual === current.internalText) return;
            show(element, actual);
        });
    });

    function observe() {
        SELECTORS.forEach(selector => {
            const element = document.querySelector(selector);
            if (!element) return;
            state.set(element, { token: 0, internalText: element.textContent || "" });
            observer.observe(element, { childList: true, characterData: true, subtree: true });
            if (element.textContent) show(element, element.textContent);
        });
    }

    observe();
    window.SendaTypewriter = { show };
})();
