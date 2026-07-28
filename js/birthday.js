//========================
// Senda birthdays
// Harry: 1991-03-04 / player: month and day only
//========================
(function () {
    "use strict";

    const HARRY_BIRTH = { year: 1991, month: 3, day: 4 };
    const notice = document.getElementById("sendaBirthdayNotice");
    const kicker = document.getElementById("sendaBirthdayKicker");
    const message = document.getElementById("sendaBirthdayMessage");
    const close = document.getElementById("closeBirthdayNotice");

    function dateAtNoon(date = new Date()) {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
    }

    function dayDistance(month, day, today = new Date()) {
        const base = dateAtNoon(today);
        const target = new Date(base.getFullYear(), month - 1, day, 12);
        return Math.round((target - base) / 86400000);
    }

    function harryAge(today = new Date()) {
        let age = today.getFullYear() - HARRY_BIRTH.year;
        if (today.getMonth() + 1 < HARRY_BIRTH.month ||
            (today.getMonth() + 1 === HARRY_BIRTH.month && today.getDate() < HARRY_BIRTH.day)) age -= 1;
        return age;
    }

    function playerBirthday() {
        const settings = window.sendaSettings || {};
        const month = Number(settings.playerBirthdayMonth);
        const day = Number(settings.playerBirthdayDay);
        return month >= 1 && month <= 12 && day >= 1 && day <= 31 ? { month, day } : null;
    }

    function show(text, label) {
        if (!notice || !message) return;
        if (kicker) kicker.textContent = label;
        message.textContent = typeof window.personalizeSendaText === "function" ? window.personalizeSendaText(text) : text;
        notice.hidden = false;
    }

    function evaluate() {
        const today = new Date();
        const harryDiff = dayDistance(HARRY_BIRTH.month, HARRY_BIRTH.day, today);
        const player = playerBirthday();
        const playerDiff = player ? dayDistance(player.month, player.day, today) : null;
        let text = "";
        let label = "BIRTHDAY";

        if (playerDiff === 0 && harryDiff === 0) {
            text = "今日は二人とも誕生日やな。主役が二人やと、祝う側が足りへん。……まあ、俺がお前を一番に祝うけど。";
            label = "OUR BIRTHDAY";
        } else if (playerDiff === 0) {
            text = "誕生日おめでとう、{name}。今日は遠慮せんでええ、何でも言うてや？";
            label = "FOR YOU";
        } else if (harryDiff === 0) {
            text = `今日は俺の誕生日らしい。${harryAge(today)}歳や。……覚えとってくれたなら、それで十分やで。`;
            label = "HARRY · MARCH 4";
        } else if (playerDiff === 1) {
            text = "明日はお前の誕生日やな。忘れるわけないやろ。ちゃんと空けてる。";
            label = "TOMORROW";
        } else if (playerDiff === -1) {
            text = "昨日の余韻くらい、まだ残しといてええ。誕生日は一日で片付けるもんでもないやろ。";
            label = "AFTERGLOW";
        } else if (harryDiff === 1) {
            text = "明日、俺の誕生日や。大げさなんはいらんけど……お前がおるなら、それでええ。";
            label = "TOMORROW";
        } else if (harryDiff === -1) {
            text = "昨日はありがとな。祝われるん、まだ少し慣れへんけど……悪くなかった。";
            label = "AFTERGLOW";
        }

        document.body.classList.toggle("senda-birthday-today", playerDiff === 0 || harryDiff === 0);
        if (text) {
            show(text, label);
            const homeMessage = document.getElementById("message");
            if (homeMessage && (playerDiff === 0 || harryDiff === 0)) homeMessage.textContent = text.replace("{name}", window.getSendaUserName?.() || "cariño");
        }
        return { harryDiff, playerDiff, harryAge: harryAge(today) };
    }

    close?.addEventListener("click", () => { if (notice) notice.hidden = true; });
    window.addEventListener("senda-settings-changed", evaluate);
    evaluate();

    window.SendaBirthday = { HARRY_BIRTH, harryAge, evaluate };
})();
