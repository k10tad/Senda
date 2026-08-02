//========================
// Senda Promise
// 帰宅または就寝の約束を、Harryとの短いチャットとして交わす
//========================

(function () {
    "use strict";

    const STORAGE_KEY = "sendaPromiseStateV1";
    const MAX_DAYS = 120;
    const OFFER_DELAY_MS = 6200;
    const RETURN_CHECK_DELAY_MS = 5400;

    const elements = {
        overlay: document.getElementById("sendaPromiseOverlay"),
        close: document.getElementById("closeSendaPromise"),
        chat: document.getElementById("sendaPromiseChat"),
        status: document.getElementById("sendaPromiseStatus"),
        returnActions: document.getElementById("sendaReturnPromiseActions"),
        returnTime: document.getElementById("sendaReturnPromiseTime"),
        acceptReturn: document.getElementById("acceptReturnPromise"),
        declineReturn: document.getElementById("declineReturnPromise"),
        sleepActions: document.getElementById("sendaSleepPromiseActions"),
        acceptSleep: document.getElementById("acceptSleepPromise"),
        declineSleep: document.getElementById("declineSleepPromise")
    };

    let state = loadState();
    let offerTimer = null;
    let returnTimer = null;

    function emptyState() {
        return { schemaVersion: 1, days: {} };
    }

    function loadState() {
        try {
            const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
            if (!parsed || typeof parsed !== "object") return emptyState();
            return {
                ...emptyState(),
                ...parsed,
                days: parsed.days && typeof parsed.days === "object" ? parsed.days : {}
            };
        } catch (_) {
            return emptyState();
        }
    }

    function saveState() {
        const keys = Object.keys(state.days).sort();
        keys.slice(0, Math.max(0, keys.length - MAX_DAYS)).forEach(key => {
            delete state.days[key];
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        document.dispatchEvent(new CustomEvent("senda-promise-updated"));
    }

    function dateKey(date = new Date()) {
        return [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, "0"),
            String(date.getDate()).padStart(2, "0")
        ].join("-");
    }

    function timeText(date = new Date()) {
        return [
            String(date.getHours()).padStart(2, "0"),
            String(date.getMinutes()).padStart(2, "0")
        ].join(":");
    }

    function todayRecord(create = false, now = new Date()) {
        const key = dateKey(now);
        if (!state.days[key] && create) {
            state.days[key] = {
                date: key,
                offeredAt: null,
                type: null,
                status: "new",
                promisedAt: null,
                targetTime: "",
                completedAt: null
            };
        }
        return state.days[key] || null;
    }

    function addBubble(text, side = "harry") {
        if (!elements.chat) return;
        const bubble = document.createElement("p");
        bubble.className = `senda-promise-bubble ${side}`;
        bubble.textContent = text;
        elements.chat.appendChild(bubble);
    }

    function resetDialog() {
        if (elements.chat) elements.chat.replaceChildren();
        if (elements.status) elements.status.textContent = "";
        if (elements.returnActions) elements.returnActions.hidden = true;
        if (elements.sleepActions) elements.sleepActions.hidden = true;
    }

    function showOverlay() {
        if (!elements.overlay) return;
        elements.overlay.hidden = false;
        document.body.classList.add("senda-promise-open");
    }

    function closeOverlay() {
        if (!elements.overlay) return;
        elements.overlay.hidden = true;
        document.body.classList.remove("senda-promise-open");
    }

    function defaultReturnTime(now = new Date()) {
        const target = new Date(now);
        target.setHours(Math.max(18, now.getHours() + 7), 0, 0, 0);
        if (target.getHours() > 22) target.setHours(22, 0, 0, 0);
        return timeText(target);
    }

    function openOffer(now = new Date()) {
        const existing = todayRecord(false, now);
        if (existing && existing.status !== "new") return false;
        if (document.body.classList.contains("onboarding-open")) return false;

        const record = todayRecord(true, now);
        record.offeredAt = new Date(now).toISOString();
        record.type =
            now.getHours() >= 5 && now.getHours() < 12
                ? "return"
                : "sleep";
        record.status = "offered";
        saveState();

        resetDialog();
        showOverlay();

        if (record.type === "return") {
            addBubble("今日、何時ごろ帰る？　だいたいでええから、教えといたって。");
            if (elements.returnTime) elements.returnTime.value = defaultReturnTime(now);
            if (elements.returnActions) elements.returnActions.hidden = false;
            if (elements.status) elements.status.textContent = "約束した時刻を過ぎて戻ると、Harryが迎える。";
        } else {
            addBubble("今夜、一緒に寝る？　先に約束しといたら、お前も少しは切り上げるやろ。");
            if (elements.sleepActions) elements.sleepActions.hidden = false;
            if (elements.status) elements.status.textContent = "約束は、今夜Bedroomで「寝る」を選ぶと果たされる。";
        }
        return true;
    }

    function setPromised(type, targetTime = "") {
        const record = todayRecord(true);
        record.type = type;
        record.status = "promised";
        record.promisedAt = new Date().toISOString();
        record.targetTime = targetTime;
        saveState();
    }

    function acceptReturn() {
        const value = elements.returnTime?.value || "";
        if (!/^\d{2}:\d{2}$/.test(value)) {
            if (elements.status) elements.status.textContent = "帰る時刻を選んでな。";
            return;
        }

        const [hour, minute] = value.split(":").map(Number);
        const now = new Date();
        const target = new Date(now);
        target.setHours(hour, minute, 0, 0);
        if (target.getTime() <= now.getTime()) {
            if (elements.status) elements.status.textContent = "今より後の時刻を選んでな。もう帰ってきとる約束にはできへん。";
            return;
        }

        setPromised("return", value);
        if (elements.returnActions) elements.returnActions.hidden = true;
        addBubble(`${value}ごろに帰る`, "user");
        addBubble(`分かった。${value}な。遅れても怒らんけど、ちゃんと帰ってきて。待っとるから。`);
        if (elements.status) elements.status.textContent = "今日の帰宅約束として記録しました。";
    }

    function acceptSleep() {
        setPromised("sleep");
        if (elements.sleepActions) elements.sleepActions.hidden = true;
        addBubble("今夜、一緒に寝る", "user");
        addBubble("約束やで。今夜はちゃんと、俺んとこ戻ってきて。");
        if (elements.status) elements.status.textContent = "今夜の約束として記録しました。";
    }

    function decline(type) {
        const record = todayRecord(true);
        record.type = type;
        record.status = "declined";
        saveState();
        if (elements.returnActions) elements.returnActions.hidden = true;
        if (elements.sleepActions) elements.sleepActions.hidden = true;
        addBubble(type === "return" ? "今日はまだ分からない" : "今夜は未定", "user");
        addBubble("そっか。ほな、決めつけんと待っとく。帰ってきたら顔だけ見せて。");
        if (elements.status) elements.status.textContent = "今日は約束を決めずにおきます。";
    }

    function completionCopy(type, targetTime = "") {
        if (type === "return") {
            return {
                title: "帰ってくる約束",
                body: `${targetTime || "約束の時間"}を過ぎて、ちゃんと帰ってきた。待っとった甲斐あったな。……おかえり。`
            };
        }
        return {
            title: "一緒に寝る約束",
            body: "今夜はちゃんと俺んとこへ戻ってきた。約束守ったな。ほな、もう離れんとって。"
        };
    }

    function recordCompletion(record) {
        const copy = completionCopy(record.type, record.targetTime);
        const completed = new Date(record.completedAt);
        const write = window.SendaHuella?.addSystemDiary?.({
            id: `senda-promise-${record.date}-${record.type}`,
            dateKey: record.date,
            createdAt: completed.getTime(),
            title: copy.title,
            body: copy.body,
            time: timeText(completed)
        });
        if (write && typeof write.catch === "function") {
            write.catch(error => console.warn("約束をHuellaへ記録できませんでした。", error));
        }
    }

    function showCompletion(record, target) {
        closeOverlay();
        const messageTarget = target || document.getElementById("message");
        const line = window.SendaVoice?.playPromise?.(record.type, messageTarget);
        if (!line && messageTarget) {
            const copy = completionCopy(record.type, record.targetTime);
            if (window.SendaTypewriter?.show) {
                window.SendaTypewriter.show(messageTarget, copy.body);
            } else {
                messageTarget.textContent = copy.body;
            }
        }

        const homeMessage = document.getElementById("message");
        if (line && homeMessage && homeMessage !== messageTarget) {
            homeMessage.textContent = line.subtitle;
        }
    }

    function complete(record, target) {
        if (!record || record.status !== "promised") return false;
        record.status = "completed";
        record.completedAt = new Date().toISOString();
        saveState();
        showCompletion(record, target);
        recordCompletion(record);
        return true;
    }

    function returnTarget(record) {
        if (!record?.targetTime) return NaN;
        const [hour, minute] = record.targetTime.split(":").map(Number);
        const target = new Date(`${record.date}T00:00:00`);
        target.setHours(hour, minute, 0, 0);
        return target.getTime();
    }

    function checkReturnPromise() {
        const record = todayRecord();
        if (!record || record.type !== "return" || record.status !== "promised") return false;
        if (Date.now() < returnTarget(record)) return false;
        return complete(record, document.getElementById("message"));
    }

    function fulfillSleep(target) {
        const record = todayRecord();
        if (!record || record.type !== "sleep" || record.status !== "promised") return false;
        return complete(record, target || document.getElementById("sleepMessage"));
    }

    function schedule() {
        clearTimeout(offerTimer);
        clearTimeout(returnTimer);

        returnTimer = setTimeout(function () {
            if (!checkReturnPromise()) {
                offerTimer = setTimeout(openOffer, Math.max(0, OFFER_DELAY_MS - RETURN_CHECK_DELAY_MS));
            }
        }, RETURN_CHECK_DELAY_MS);
    }

    elements.close?.addEventListener("click", closeOverlay);
    elements.acceptReturn?.addEventListener("click", acceptReturn);
    elements.declineReturn?.addEventListener("click", () => decline("return"));
    elements.acceptSleep?.addEventListener("click", acceptSleep);
    elements.declineSleep?.addEventListener("click", () => decline("sleep"));
    elements.overlay?.addEventListener("click", event => {
        if (event.target === elements.overlay) closeOverlay();
    });
    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && !elements.overlay?.hidden) closeOverlay();
    });
    document.addEventListener("visibilitychange", function () {
        if (!document.hidden) setTimeout(checkReturnPromise, 450);
    });
    window.addEventListener("pageshow", function () {
        setTimeout(checkReturnPromise, 450);
    });

    if (typeof isSendaOnboardingPending === "function" && isSendaOnboardingPending()) {
        window.addEventListener("senda-onboarding-complete", schedule, { once: true });
    } else {
        schedule();
    }

    window.SendaPromise = {
        openOffer,
        checkReturnPromise,
        fulfillSleep,
        getToday: () => todayRecord(),
        getHistory: () => Object.values(state.days)
            .filter(record => record && record.date)
            .sort((a, b) => String(b.date).localeCompare(String(a.date)))
            .map(record => ({ ...record }))
    };
})();
