

function updateSendaDate() {
    const date = document.getElementById("date");

    const now = new Date();

    const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    if (date) {
        date.textContent =
            `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
    }
}
