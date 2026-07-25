//========================
// Senda Orion Splash Engine
// 画面全体に固定し、約6秒でHomeへ移る
//========================

(function () {
    const splash = document.getElementById("sendaSplash");
    const skipButton = document.getElementById("skipSplash");

    function updateViewportHeight() {
        const height = window.visualViewport?.height || window.innerHeight;
        document.documentElement.style.setProperty("--senda-viewport-height", `${height}px`);
    }

    updateViewportHeight();
    window.scrollTo(0, 0);
    window.addEventListener("resize", updateViewportHeight, { passive: true });
    window.visualViewport?.addEventListener("resize", updateViewportHeight, { passive: true });

    if (!splash) {
        document.body.classList.remove("splash-active");
        return;
    }

    // 必ずbody直下に置き、親要素のtransform/filterの影響を受けないようにする。
    if (splash.parentElement !== document.body) document.body.prepend(splash);

    let finished = false;
    let finishTimer = null;

    function finishSplash() {
        if (finished) return;
        finished = true;
        clearTimeout(finishTimer);
        splash.classList.add("is-leaving");
        document.body.classList.remove("splash-active");

        setTimeout(function () {
            splash.remove();
            window.scrollTo(0, 0);
        }, 760);
    }

    finishTimer = setTimeout(finishSplash, 6000);
    skipButton?.addEventListener("click", function (event) {
        event.stopPropagation();
        finishSplash();
    });
    splash.addEventListener("pointerdown", finishSplash);

    setTimeout(finishSplash, 9000);
})();
