//========================
// Senda 起動時
//========================

restoreWorkSession();

updateSendaDate();

function startSendaArrival() {
    loadWeather();

    if (message && typeof getDailyFlowMessage === "function") {
        message.textContent = getDailyFlowMessage();
    }

    if (window.SendaVoice && message) {
        window.SendaVoice.queueWelcome(message);
    }
}

if (typeof isSendaOnboardingPending === "function" && isSendaOnboardingPending()) {
    window.addEventListener("senda-onboarding-complete", startSendaArrival, { once: true });
} else {
    startSendaArrival();
}
