

function updateClock() {
    const clock = document.getElementById("clock");
    const date = document.getElementById("date");

    const now = new Date();

    const hour = String(now.getHours()).padStart(2, "0");
    const minute = String(now.getMinutes()).padStart(2, "0");
    const second = String(now.getSeconds()).padStart(2, "0");

    if (clock) {
        clock.textContent = `${hour}:${minute}:${second}`;
    }

    const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    if (date) {
        date.textContent =
            `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
    }
}