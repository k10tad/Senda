//========================
// Senda 起動時
//========================

restoreWorkSession();

updateClock();
setInterval(updateClock, 1000);

loadWeather();

if (message && typeof getDailyFlowMessage === "function") {
    message.textContent = getDailyFlowMessage();
}
