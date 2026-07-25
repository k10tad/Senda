// Senda Companion Engine - Phase 4
// Existing Senda messages remain available.
// The engine is only used when window.USE_COMPANION_ENGINE === true.

window.CompanionEngine = {
    version: "0.4",

    getTimePeriod() {
        const hour = new Date().getHours();

        if (hour < 5) return "deepNight";
        if (hour < 10) return "morning";
        if (hour < 17) return "day";
        if (hour < 21) return "evening";
        return "night";
    },

    getWeatherPeriod(weatherCode) {
        if (typeof weatherCode === "number" && weatherCode >= 80) {
            return "rain";
        }

        if (typeof weatherCode === "number" && weatherCode >= 1) {
            return "cloud";
        }

        return "clear";
    },

    pick(list) {
        if (!Array.isArray(list) || list.length === 0) return "";
        return list[Math.floor(Math.random() * list.length)];
    },

    getMessage(context = {}) {
        const dialogues = window.SendaDialogues;

        if (!dialogues) {
            return "";
        }

        const timeKey = this.getTimePeriod();
        const weatherKey = this.getWeatherPeriod(context.weatherCode);

        const timeLine = this.pick(dialogues.time?.[timeKey]);
        const weatherLine = this.pick(dialogues.weather?.[weatherKey]);
        const closingLine = this.pick(dialogues.closing);

        return [timeLine, weatherLine, closingLine]
            .filter(Boolean)
            .join("\n");
    }
};
