//========================
// Senda ページ切替
//========================

const sendaPages = Array.from(document.querySelectorAll(".app-page"));
const sendaNavButtons = Array.from(document.querySelectorAll("[data-page-target]"));
const sendaBackButtons = Array.from(document.querySelectorAll("[data-go-page]"));

function showSendaPage(pageName, options = {}) {
    const targetPage = document.querySelector(
        `.app-page[data-page="${pageName}"]`
    );
    

    if (!targetPage) return;

    const currentPage = document.querySelector(".app-page.active");
    const currentName = currentPage ? currentPage.dataset.page : null;
    const isActualChange = currentName !== pageName;

    sendaPages.forEach(function (page) {
        const isTarget = page === targetPage;
        page.classList.toggle("active", isTarget);
        page.setAttribute("aria-hidden", String(!isTarget));
    });

    sendaNavButtons.forEach(function (button) {
        button.classList.toggle(
            "active",
            button.dataset.pageTarget === pageName
        );
    });

    document.body.dataset.sendaPage = pageName;

    if (typeof setBedroomAmbience === "function") {
        setBedroomAmbience(pageName === "sleep");
    }

    if (isActualChange && options.silent !== true) {
        if (typeof playPageStepSound === "function") {
            playPageStepSound();
        }
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
}

sendaNavButtons.forEach(function (button) {
    button.addEventListener("click", function () {
        showSendaPage(button.dataset.pageTarget);
    });
});

sendaBackButtons.forEach(function (button) {
    button.addEventListener("click", function () {
        showSendaPage(button.dataset.goPage);
    });
});

// 起動時は足音を鳴らさずHomeを表示する。
showSendaPage("home", { silent: true });
