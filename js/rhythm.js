//========================
// Senda Life Rhythm
// 遅い帰宅と就寝時刻の変化を、責めずにHarryが気に掛ける
//========================

(function () {
    "use strict";

    const KEYS = {
        lastLaunchAt: "senda_rhythm_lastLaunchAt_v1",
        arrivalShownDate: "senda_rhythm_arrivalShownDate_v1",
        lastBedtimeAt: "senda_rhythm_lastBedtimeAt_v1",
        bedtimeShownDate: "senda_rhythm_bedtimeShownDate_v1"
    };

    const LATE_ARRIVAL_HOUR = 20;
    const VERY_LATE_ARRIVAL_HOUR = 23;
    const LATE_BEDTIME_MINUTES = 25 * 60 + 30;
    const EARLIER_BY_MINUTES = 45;

    const arrivalLines = {
        late: [
            "帰り遅かったん？　飯、ちゃんと食うた？　まだなら何か腹に入れよ。",
            "おかえり。遅かったから、ちょっと気になっとった。風呂と飯、どっち先にする？",
            "やっと帰ってきた。怒ってへんよ。……ただ、ちゃんと休める顔しとるか見せて。"
        ],
        veryLate: [
            "こんな時間までお疲れさん。飯も風呂もまだなら、今日は最低限でええ。まず座り。",
            "おかえり。無事ならそれでええけど、連絡もなしに遅いと心配するやろ。ほら、こっちおいで。",
            "遅かったな。責めへんから、今日はちゃんと頼って。ひとりで全部済ませようとせんでええ。"
        ]
    };

    const bedtimeLines = {
        first: [
            "ちゃんと寝に来たんやな。えらい。今夜の時間、覚えとくから。",
            "今日から寝る時間も覚えとくわ。見張るためやないで。お前が無理しとらんか知りたいだけやし。",
            "今夜はこの時間やな。ほな、ここを俺らの基準にしよ。あとは安心して寝ぇ。"
        ],
        late: [
            "まだ起きとったん？　続きは明日でも逃げへんよ。今夜は俺の言うこと聞いて、目ぇ閉じ。",
            "夜更かし仲間にするには、ちょっと顔が疲れすぎや。ほら、もう休も。",
            "こんな時間まで頑張らんでええ。今日は俺がここおるから、安心して寝ぇ。"
        ],
        earlier: [
            "今日は前より早いやん。えらいな。そうやって自分のことも、ちゃんと大事にし。",
            "今夜は早めに来れたんやな。よしよし。明日の自分が、たぶん喜ぶで。",
            "前より早う休めたやん。俺まで安心した。ほな、今日はゆっくり寝よ。"
        ],
        steady: [
            "今日も休む時間に来れたな。ええ子や。あとは俺の隣で目ぇ閉じるだけ。",
            "ちゃんと寝に来た。それで充分や。今日の残りは、もう俺に預け。"
        ]
    };

    function pick(list) {
        return list[Math.floor(Math.random() * list.length)];
    }

    function dateKey(date = new Date()) {
        return [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, "0"),
            String(date.getDate()).padStart(2, "0")
        ].join("-");
    }

    function normalizedBedtimeMinutes(date) {
        const minutes = date.getHours() * 60 + date.getMinutes();
        return date.getHours() < 12 ? minutes + 24 * 60 : minutes;
    }

    function consumeArrivalReaction(now = new Date()) {
        const today = dateKey(now);
        const alreadyShown = localStorage.getItem(KEYS.arrivalShownDate) === today;
        localStorage.setItem(KEYS.lastLaunchAt, String(now.getTime()));

        if (alreadyShown) return "";

        const hour = now.getHours();
        const isAfterMidnight = hour < 5;
        if (hour < LATE_ARRIVAL_HOUR && !isAfterMidnight) return "";

        const group =
            hour >= VERY_LATE_ARRIVAL_HOUR || isAfterMidnight
                ? arrivalLines.veryLate
                : arrivalLines.late;
        return pick(group);
    }

    function markArrivalShown(now = new Date()) {
        localStorage.setItem(KEYS.arrivalShownDate, dateKey(now));
    }

    function recordBedtime(now = new Date()) {
        const today = dateKey(now);
        const alreadyShown = localStorage.getItem(KEYS.bedtimeShownDate) === today;
        const previousTimestamp = Number(localStorage.getItem(KEYS.lastBedtimeAt));
        const previous = Number.isFinite(previousTimestamp) && previousTimestamp > 0
            ? new Date(previousTimestamp)
            : null;

        localStorage.setItem(KEYS.lastBedtimeAt, String(now.getTime()));
        if (alreadyShown) return "";

        const currentMinutes = normalizedBedtimeMinutes(now);
        if (currentMinutes >= LATE_BEDTIME_MINUTES) {
            return pick(bedtimeLines.late);
        }

        if (!previous) {
            return pick(bedtimeLines.first);
        }

        if (previous) {
            const previousMinutes = normalizedBedtimeMinutes(previous);
            const improvement = previousMinutes - currentMinutes;
            if (improvement >= EARLIER_BY_MINUTES) {
                return pick(bedtimeLines.earlier);
            }

            if (Math.abs(improvement) <= 20) {
                return pick(bedtimeLines.steady);
            }
        }

        return "";
    }

    function markBedtimeShown(now = new Date()) {
        localStorage.setItem(KEYS.bedtimeShownDate, dateKey(now));
    }

    window.SendaRhythm = {
        consumeArrivalReaction,
        markArrivalShown,
        recordBedtime,
        markBedtimeShown,
        normalizedBedtimeMinutes
    };
})();
