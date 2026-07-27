//========================
// Senda 起動時
//========================

restoreWorkSession();

updateSendaDate();

loadWeather();

if (message && typeof getDailyFlowMessage === "function") {
    message.textContent = getDailyFlowMessage();
}

if (window.SendaVoice && message) {
    window.SendaVoice.queueWelcome(message);
}
 
