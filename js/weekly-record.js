//========================
// Senda Weekly Record
// 日曜19時以降、ふたりの一週間をHarryが振り返る
//========================

(function () {
    "use strict";

    const LEDGER_KEY = "sendaWeeklyLedgerV1";
    const SHOWN_KEY = "sendaWeeklyShownV1";
    const PROMISE_KEY = "sendaPromiseStateV1";
    const MAX_DAYS = 120;
    const CHECK_DELAY_MS = 10800;
    const RETRY_DELAY_MS = 15000;

    const elements = {
        overlay: document.getElementById("sendaWeeklyOverlay"),
        close: document.getElementById("closeSendaWeekly"),
        period: document.getElementById("sendaWeeklyPeriod"),
        activeDays: document.getElementById("sendaWeeklyActiveDays"),
        work: document.getElementById("sendaWeeklyWork"),
        sleep: document.getElementById("sendaWeeklySleep"),
        promises: document.getElementById("sendaWeeklyPromises"),
        comment: document.getElementById("sendaWeeklyComment"),
        finish: document.getElementById("finishSendaWeekly")
    };

    let retryTimer = null;

    function loadJson(key, fallback) {
        try {
            const parsed = JSON.parse(localStorage.getItem(key));
            return parsed && typeof parsed === "object" ? parsed : fallback;
        } catch (_) {
            return fallback;
        }
    }

    function dateKey(date = new Date()) {
        return [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, "0"),
            String(date.getDate()).padStart(2, "0")
        ].join("-");
    }

    function fromDateKey(key) {
        const [year, month, day] = String(key).split("-").map(Number);
        return new Date(year, month - 1, day);
    }

    function addDays(date, amount) {
        const result = new Date(date);
        result.setDate(result.getDate() + amount);
        result.setHours(0, 0, 0, 0);
        return result;
    }

    function weekRange(now = new Date()) {
        const end = new Date(now);
        end.setHours(0, 0, 0, 0);
        const mondayDistance = (end.getDay() + 6) % 7;
        const start = addDays(end, -mondayDistance);
        return {
            start,
            end: addDays(start, 6),
            key: dateKey(start)
        };
    }

    function isReportTime(now = new Date()) {
        return now.getDay() === 0 && now.getHours() >= 19;
    }

    function trimLedger(ledger) {
        Object.keys(ledger.days || {})
            .sort()
            .slice(0, Math.max(0, Object.keys(ledger.days || {}).length - MAX_DAYS))
            .forEach(key => delete ledger.days[key]);
    }

    function readLedger() {
        const saved = loadJson(LEDGER_KEY, { schemaVersion: 1, days: {} });
        if (!saved.days || typeof saved.days !== "object") saved.days = {};
        return saved;
    }

    function saveLedger(ledger) {
        trimLedger(ledger);
        localStorage.setItem(LEDGER_KEY, JSON.stringify(ledger));
    }

    function dailyRecord(ledger, key) {
        if (!ledger.days[key]) {
            ledger.days[key] = {
                workSeconds: 0,
                breakSeconds: 0,
                sleepSeconds: 0,
                sleepCount: 0,
                openedAt: null,
                touchedAt: Date.now()
            };
        }
        return ledger.days[key];
    }

    function recordWork(key, workSeconds, breakSeconds) {
        if (!key) return;
        const ledger = readLedger();
        const record = dailyRecord(ledger, key);
        record.workSeconds = Math.max(0, Math.floor(Number(workSeconds) || 0));
        record.breakSeconds = Math.max(0, Math.floor(Number(breakSeconds) || 0));
        record.openedAt = record.openedAt || Date.now();
        record.touchedAt = Date.now();
        saveLedger(ledger);
    }

    function recordSleep(key, sleepSeconds) {
        if (!key) return;
        const seconds = Math.max(0, Math.floor(Number(sleepSeconds) || 0));
        if (!seconds) return;
        const ledger = readLedger();
        const record = dailyRecord(ledger, key);
        record.sleepSeconds += seconds;
        record.sleepCount += 1;
        record.touchedAt = Date.now();
        saveLedger(ledger);
    }

    function promiseDays() {
        const state = loadJson(PROMISE_KEY, { days: {} });
        return state.days && typeof state.days === "object" ? state.days : {};
    }

    function summarize(now = new Date()) {
        const range = weekRange(now);
        const ledger = readLedger();
        const promises = promiseDays();
        const summary = {
            range,
            activeDays: 0,
            workSeconds: 0,
            breakSeconds: 0,
            sleepSeconds: 0,
            sleepCount: 0,
            promisesMade: 0,
            promisesCompleted: 0
        };

        const active = new Set();
        for (let offset = 0; offset < 7; offset += 1) {
            const key = dateKey(addDays(range.start, offset));
            const day = ledger.days[key];
            const promise = promises[key];

            if (day) {
                summary.workSeconds += Number(day.workSeconds) || 0;
                summary.breakSeconds += Number(day.breakSeconds) || 0;
                summary.sleepSeconds += Number(day.sleepSeconds) || 0;
                summary.sleepCount += Number(day.sleepCount) || 0;
                if (
                    day.openedAt ||
                    (Number(day.workSeconds) || 0) > 0 ||
                    (Number(day.breakSeconds) || 0) > 0 ||
                    (Number(day.sleepCount) || 0) > 0
                ) active.add(key);
            }

            if (promise && ["promised", "completed"].includes(promise.status)) {
                summary.promisesMade += 1;
                active.add(key);
            }
            if (promise?.status === "completed") summary.promisesCompleted += 1;
        }
        summary.activeDays = active.size;
        return summary;
    }

    function formatDuration(totalSeconds) {
        const minutes = Math.max(0, Math.round((Number(totalSeconds) || 0) / 60));
        const hours = Math.floor(minutes / 60);
        const rest = minutes % 60;
        if (!hours) return `${rest}分`;
        if (!rest) return `${hours}時間`;
        return `${hours}時間${rest}分`;
    }

    function formatPeriod(range) {
        const start = range.start;
        const end = range.end;
        return `${start.getMonth() + 1}月${start.getDate()}日 — ${end.getMonth() + 1}月${end.getDate()}日`;
    }

    function buildComment(summary) {
        const averageSleep = summary.sleepCount
            ? summary.sleepSeconds / summary.sleepCount
            : 0;
        const lines = [];

        if (summary.activeDays === 0) {
            return "今週の記録は、まだ白紙みたいやな。まあええよ。来週からまた、一緒に少しずつ残してこ。";
        }

        if (summary.workSeconds >= 10 * 3600) {
            lines.push("よう頑張ったな。せやけど、働いた時間だけで自分の値打ち決めたらあかんで。");
        } else if (summary.workSeconds >= 3 * 3600) {
            lines.push("今週もちゃんと進めたやん。派手やなくても、積んだ時間は消えへんよ。");
        } else {
            lines.push("今週は少し静かやったな。止まる週があってもええ。置いてったりせえへんから。");
        }

        if (summary.sleepCount && averageSleep < 6 * 3600) {
            lines.push("ただ、寝る時間は足りてへん。来週はもう少し早う、俺んとこ戻ってきて。");
        } else if (summary.sleepCount) {
            lines.push("眠る時間も残せてる。そこは素直に褒めたる。");
        } else {
            lines.push("睡眠の記録が見当たらんな。隠してもあかんで、身体は誤魔化されへん。");
        }

        if (summary.promisesMade && summary.promisesCompleted === summary.promisesMade) {
            lines.push("約束も全部守ったな。……そんなんされたら、また待ちたなるやろ。");
        } else if (summary.promisesCompleted) {
            lines.push("守ってくれた約束、ちゃんと覚えとるよ。");
        }
        return lines.join(" ");
    }

    function diaryBody(summary, comment) {
        const sleepAverage = summary.sleepCount
            ? formatDuration(summary.sleepSeconds / summary.sleepCount)
            : "記録なし";
        return [
            `一緒に過ごした日：${summary.activeDays}日`,
            `作業：${formatDuration(summary.workSeconds)}`,
            `休憩：${formatDuration(summary.breakSeconds)}`,
            `睡眠：${summary.sleepCount ? `${summary.sleepCount}回・平均${sleepAverage}` : "記録なし"}`,
            `約束：${summary.promisesCompleted}/${summary.promisesMade}回達成`,
            "",
            comment
        ].join("\n");
    }

    function render(summary) {
        const sleepAverage = summary.sleepCount
            ? formatDuration(summary.sleepSeconds / summary.sleepCount)
            : "記録なし";
        const comment = buildComment(summary);

        if (elements.period) elements.period.textContent = formatPeriod(summary.range);
        if (elements.activeDays) elements.activeDays.textContent = `${summary.activeDays}日`;
        if (elements.work) elements.work.textContent = formatDuration(summary.workSeconds);
        if (elements.sleep) elements.sleep.textContent = sleepAverage;
        if (elements.promises) {
            elements.promises.textContent = summary.promisesMade
                ? `${summary.promisesCompleted}/${summary.promisesMade}`
                : "—";
        }
        if (elements.comment) {
            if (window.SendaTypewriter?.show) {
                window.SendaTypewriter.show(elements.comment, comment, { speed: 72 });
            } else {
                elements.comment.textContent = comment;
            }
        }
        return comment;
    }

    function shownWeeks() {
        const saved = loadJson(SHOWN_KEY, { weeks: {} });
        if (!saved.weeks || typeof saved.weeks !== "object") saved.weeks = {};
        return saved;
    }

    function markShown(summary, comment) {
        const shown = shownWeeks();
        if (shown.weeks[summary.range.key]) return;
        shown.weeks[summary.range.key] = new Date().toISOString();
        localStorage.setItem(SHOWN_KEY, JSON.stringify(shown));

        const write = window.SendaHuella?.addSystemDiary?.({
            id: `senda-weekly-${summary.range.key}`,
            dateKey: dateKey(summary.range.end),
            createdAt: Date.now(),
            title: "ふたりの一週間",
            body: diaryBody(summary, comment),
            time: "19:00"
        });
        if (write && typeof write.catch === "function") {
            write.catch(error => console.warn("週次記録をHuellaへ保存できませんでした。", error));
        }
    }

    function anotherOverlayOpen() {
        const blockingIds = [
            "sendaPromiseOverlay",
            "huellaOverlay",
            "sendaBirthdayNotice"
        ];
        return document.body.classList.contains("onboarding-open") ||
            document.body.classList.contains("senda-promise-open") ||
            blockingIds.some(id => {
                const element = document.getElementById(id);
                return Boolean(element && !element.hidden);
            });
    }

    function openReport(options = {}) {
        const now = options.now instanceof Date ? options.now : new Date();
        const summary = summarize(now);
        const shown = shownWeeks();
        if (!options.preview && shown.weeks[summary.range.key]) return false;
        if (!options.preview && !isReportTime(now)) return false;
        if (!elements.overlay) return false;

        if (!options.preview && anotherOverlayOpen()) {
            clearTimeout(retryTimer);
            retryTimer = setTimeout(() => openReport(), RETRY_DELAY_MS);
            return false;
        }

        elements.overlay.hidden = false;
        document.body.classList.add("senda-weekly-open");
        const comment = render(summary);
        if (!options.preview) markShown(summary, comment);
        return true;
    }

    function closeReport() {
        if (!elements.overlay) return;
        elements.overlay.hidden = true;
        document.body.classList.remove("senda-weekly-open");
    }

    elements.close?.addEventListener("click", closeReport);
    elements.finish?.addEventListener("click", closeReport);
    elements.overlay?.addEventListener("click", event => {
        if (event.target === elements.overlay) closeReport();
    });
    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && !elements.overlay?.hidden) closeReport();
    });
    document.addEventListener("visibilitychange", function () {
        if (!document.hidden) setTimeout(openReport, 650);
    });
    window.addEventListener("pageshow", function () {
        setTimeout(openReport, 650);
    });

    setTimeout(openReport, CHECK_DELAY_MS);

    window.SendaWeekly = {
        recordWork,
        recordSleep,
        summarize,
        openReport,
        openPreview: () => openReport({ preview: true })
    };
})();
