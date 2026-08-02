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

    // Bedroomで起床した直後は朝の画像を見せたままにし、
    // Livingへ戻った時点で作業・休憩または現在行動の画像へ復帰する。
    if (pageName === "home" && isActualChange) {
        if (typeof sessionState !== "undefined" && sessionState !== "idle") {
            if (typeof setSessionCompanionImage === "function") {
                setSessionCompanionImage(sessionState);
            }
        } else if (window.SendaActivity?.restoreForIdle) {
            window.SendaActivity.restoreForIdle();
        } else {
            const harry = document.getElementById("harry");
            if (harry && window.SENDA_IMAGES?.normal) {
                harry.src = window.SENDA_IMAGES.normal;
            }
        }
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
