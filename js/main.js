//========================
// Senda 起動時
//========================

restoreWorkSession();

updateSendaDate();

function startSendaArrival() {
    loadWeather();

    const rhythmLine = window.SendaRhythm?.consumeArrivalReaction?.() || "";

    if (window.SendaVoice && message) {
        window.SendaVoice.queueWelcome(message, rhythmLine, {
            onFollowupShown: function () {
                window.SendaRhythm?.markArrivalShown?.();
            }
        });
    } else if (message && rhythmLine) {
        if (window.SendaTypewriter?.show) {
            window.SendaTypewriter.show(message, rhythmLine);
        } else {
            message.textContent = rhythmLine;
        }
        window.SendaRhythm?.markArrivalShown?.();
    } else if (message && typeof getDailyFlowMessage === "function") {
        message.textContent = getDailyFlowMessage();
    }
}

if (typeof isSendaOnboardingPending === "function" && isSendaOnboardingPending()) {
    window.addEventListener("senda-onboarding-complete", startSendaArrival, { once: true });
} else {
    startSendaArrival();
}
