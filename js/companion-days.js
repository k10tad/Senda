//========================
// Senda companion days
//========================

(function () {
    "use strict";

    const STORAGE_KEY = "senda_companion_start_date";
    const badge = document.getElementById("companionDayBadge");
    const badgeNumber = document.getElementById("companionDayNumber");
    const detail = document.getElementById("companionDayDetail");
    const detailText = document.getElementById("companionDayDetailText");
    const closeDetail = document.getElementById("closeCompanionDayDetail");
    const dateInput = document.getElementById("companionStartDate");
    const saveButton = document.getElementById("saveCompanionStartDate");

    function todayKey(date = new Date()) {
        const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
        return local.toISOString().slice(0, 10);
    }

    function normaliseDate(value) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return null;
        const [year, month, day] = value.split("-").map(Number);
        const date = new Date(year, month - 1, day);
        return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
            ? value
            : null;
    }

    function getStartDate() {
        const saved = normaliseDate(localStorage.getItem(STORAGE_KEY));
        if (saved) return saved;
        const initial = todayKey();
        localStorage.setItem(STORAGE_KEY, initial);
        return initial;
    }

    function calculateDays(startDate = getStartDate()) {
        const [year, month, day] = startDate.split("-").map(Number);
        const startUtc = Date.UTC(year, month - 1, day);
        const today = new Date();
        const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
        return Math.max(1, Math.floor((todayUtc - startUtc) / 86400000) + 1);
    }

    function formatStartDate(value) {
        const [year, month, day] = value.split("-").map(Number);
        return new Date(year, month - 1, day).toLocaleDateString("ja-JP", {
            year: "numeric",
            month: "long",
            day: "numeric"
        });
    }

    function render() {
        const startDate = getStartDate();
        const days = calculateDays(startDate);
        if (badgeNumber) badgeNumber.textContent = String(days);
        if (badge) badge.setAttribute("aria-label", `寄り添い${days}日目。開始日は${formatStartDate(startDate)}`);
        if (detailText) detailText.textContent = `${formatStartDate(startDate)}から、寄り添い ${days}日目。`;
        if (dateInput) dateInput.value = startDate;
        return days;
    }

    function saveDate() {
        const selected = normaliseDate(dateInput?.value);
        if (!selected) return;
        if (selected > todayKey()) {
            alert("開始日は今日以前の日付を選んでください。");
            return;
        }
        localStorage.setItem(STORAGE_KEY, selected);
        render();
        const status = document.getElementById("settingsSavedMessage");
        if (status) {
            status.textContent = "寄り添いの開始日を保存したで。";
            status.classList.add("visible");
            setTimeout(() => status.classList.remove("visible"), 2400);
        }
    }

    badge?.addEventListener("click", function () {
        if (!detail) return;
        detail.hidden = !detail.hidden;
        if (!detail.hidden) render();
    });
    closeDetail?.addEventListener("click", () => { if (detail) detail.hidden = true; });
    saveButton?.addEventListener("click", saveDate);
    document.addEventListener("click", function (event) {
        if (!detail || detail.hidden) return;
        if (detail.contains(event.target) || badge?.contains(event.target)) return;
        detail.hidden = true;
    });

    render();
    window.setInterval(render, 60000);

    window.SendaCompanionDays = {
        storageKey: STORAGE_KEY,
        getStartDate,
        calculateDays,
        render
    };
})();
