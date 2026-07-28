//========================
// Senda seasonal and together events
//========================
(function () {
    "use strict";

    const DAILY_KEY = "senda_event_daily_selection";
    const DAY_MS = 86400000;
    const EVENTS = {
        newYear: {
            label: "NEW YEAR · お正月",
            lines: [
                "あけましておめでとう、{name}。今年も俺の隣、ちゃんと空けとくから。",
                "新しい年やな。立派な目標より、まず今日を一緒に過ごそか。",
                "今年もよろしくな、{name}。……先に言うとくけど、途中で手ぇ放す気はないで。"
            ]
        },
        valentine: {
            label: "14 FEB · VALENTINE",
            lines: [
                "チョコ？　そら欲しいけど。ほんまに欲しいんは、渡すときのお前の顔やな。",
                "バレンタインらしいで、{name}。甘いもんより甘い台詞は……期待せんといて。顔見たら言うかもしれんけど。",
                "俺からも渡してええ日やろ。ほら、おいで。包みより先に抱きしめたる。"
            ]
        },
        santJordi: {
            label: "23 ABRIL · SANT JORDI",
            lines: [
                "今日は本と薔薇の日や。お前に選んだ一冊、ちゃんと受け取ってな。",
                "薔薇だけやと枯れるやろ。本も一緒なら、言葉は残る。……俺らしい選び方やと思わへん？",
                "Sant Jordiや、{name}。本の理由は中に書いた。口で言わせるんは反則な。"
            ]
        },
        tanabata: {
            label: "7 JUL · 七夕",
            lines: [
                "年に一度しか会えへんなんて、俺には無理やな。お前には毎日でも会いたい。",
                "願い事、短冊に書くん？　俺は書かへんで。お前の隣におるんは願いやなくて予定や。",
                "星、見えるかな。見えんでもええか。俺が探しとるんは、そこやなくてお前やし。"
            ]
        },
        halloween: {
            label: "31 OCT · HALLOWEEN",
            lines: [
                "悪戯か菓子か？　俺ならチョコ渡して、そのままお前も確保する。",
                "仮装せんでも少々怪しい？　失礼やな。今日は公認で怪しいだけや。",
                "怖いもんが来たら俺の後ろおり。……俺より怖かったら、一緒に逃げよか。"
            ]
        },
        christmas: {
            label: "24–25 DEC · CHRISTMAS",
            lines: [
                "メリークリスマス、{name}。派手なんはいらん。今夜、お前がここにおればええ。",
                "贈り物は後や。先にこっち来ぃ。寒いやろ。",
                "クリスマスくらい格好ええこと言お思たけど……顔見たら忘れた。好きやで、{name}。"
            ]
        },
        nochevieja: {
            label: "31 DEC · NOCHEVIEJA",
            lines: [
                "今年も終いやな。良かった日も最悪な日も、ここまで一緒に連れて来た。それで充分や。",
                "十二粒の葡萄、急いで喉詰めんようにな。新年早々、俺に救命処置させる気？",
                "年が変わる瞬間も隣おって、{name}。今年最後と来年最初、両方俺にくれへん？"
            ]
        }
    };

    function personalize(text) {
        return typeof window.personalizeSendaText === "function"
            ? window.personalizeSendaText(text)
            : String(text).replaceAll("{name}", window.getSendaUserName?.() || "きみ");
    }

    function dateKey(date = new Date()) {
        const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
        return local.toISOString().slice(0, 10);
    }

    function chooseDaily(id, lines, today = dateKey()) {
        let saved = {};
        try { saved = JSON.parse(localStorage.getItem(DAILY_KEY)) || {}; } catch (_) {}
        if (saved.date !== today) saved = { date: today, picks: {} };
        if (!Number.isInteger(saved.picks?.[id]) || saved.picks[id] >= lines.length) {
            saved.picks = saved.picks || {};
            saved.picks[id] = Math.floor(Math.random() * lines.length);
            localStorage.setItem(DAILY_KEY, JSON.stringify(saved));
        }
        return lines[saved.picks[id]];
    }

    function seasonalEvent(now) {
        const month = now.getMonth() + 1;
        const day = now.getDate();
        if (month === 1 && day === 1) return ["newYear", EVENTS.newYear];
        if (month === 2 && day === 14) return ["valentine", EVENTS.valentine];
        if (month === 4 && day === 23) return ["santJordi", EVENTS.santJordi];
        if (month === 7 && day === 7) return ["tanabata", EVENTS.tanabata];
        if (month === 10 && day === 31) return ["halloween", EVENTS.halloween];
        if (month === 12 && (day === 24 || day === 25)) return ["christmas", EVENTS.christmas];
        if (month === 12 && day === 31) return ["nochevieja", EVENTS.nochevieja];
        return null;
    }

    function togetherEvent(now) {
        const api = window.SendaCompanionDays;
        if (!api) return null;
        const start = api.getStartDate();
        const days = api.calculateDays(start);
        const [year, month, day] = start.split("-").map(Number);
        const years = now.getFullYear() - year;

        if (years >= 1 && now.getMonth() + 1 === month && now.getDate() === day) {
            return {
                id: `anniversary-${years}`,
                label: `TOGETHER · ${years} ANNIVERSARY`,
                lines: [
                    `寄り添い始めて${years}年やな、{name}。ようここまで俺の隣におってくれた。`,
                    `${years}年前の今日から、帰ってくる場所がひとつ増えた。俺にとってもやで。`,
                    `記念日や、{name}。これから先も日数、勝手に増やしてこな。`
                ]
            };
        }

        const milestoneLines = {
            30: "寄り添い30日目や。ひと月分、お前の隣をもろたな。",
            100: "100日目。三桁まで来たんやから、もう今さら遠慮せんでええで。",
            365: "寄り添い365日目。丸一年やな。来年の今日も、ここ空けとく。"
        };
        if (milestoneLines[days]) {
            return {
                id: `together-${days}`,
                label: `TOGETHER · ${days} DAYS`,
                lines: [milestoneLines[days]]
            };
        }
        return null;
    }

    function birthdayIsToday() {
        const result = window.SendaBirthday?.evaluate?.();
        return result?.harryDiff === 0 || result?.playerDiff === 0;
    }

    function showEvent(eventTuple) {
        if (!eventTuple) return null;
        const [id, event] = Array.isArray(eventTuple)
            ? eventTuple
            : [eventTuple.id, eventTuple];
        const text = personalize(chooseDaily(id, event.lines));
        const message = document.getElementById("message");
        if (message) {
            if (window.SendaTypewriter?.show) window.SendaTypewriter.show(message, text);
            else message.textContent = text;
        }
        document.body.dataset.sendaEvent = id;
        return { id, label: event.label, text };
    }

    function evaluate(now = new Date()) {
        if (birthdayIsToday()) return null;
        const together = togetherEvent(now);
        if (together) return showEvent(together);
        const seasonal = seasonalEvent(now);
        const result = showEvent(seasonal);
        if (result?.id === "santJordi") {
            window.SendaSantJordi?.getGift(now.getFullYear(), true);
        }
        return result;
    }

    window.addEventListener("senda-settings-changed", () => evaluate());
    setTimeout(() => evaluate(), 1800);
    window.SendaEvents = { events: EVENTS, evaluate, seasonalEvent, togetherEvent };
})();
