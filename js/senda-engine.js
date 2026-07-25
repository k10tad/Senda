/* =========================================================
   SENDA NEW ENGINE OVERRIDES
   Splash位置と睡眠・アラーム表示の安定化
   ========================================================= */

html {
    min-height: 100%;
    background: #05070d;
}

body.splash-active {
    overflow: hidden !important;
    filter: none !important;
    transform: none !important;
    animation: none !important;
}

.senda-splash {
    position: fixed !important;
    inset: auto !important;
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: var(--senda-viewport-height, 100dvh) !important;
    min-height: 0 !important;
    max-height: none !important;
    margin: 0 !important;
    padding:
        max(18px, env(safe-area-inset-top))
        max(18px, env(safe-area-inset-right))
        max(18px, env(safe-area-inset-bottom))
        max(18px, env(safe-area-inset-left)) !important;
    box-sizing: border-box !important;
    display: block !important;
    overflow: hidden !important;
    z-index: 2147483647 !important;
    contain: layout paint size !important;
}

.splash-content {
    position: absolute !important;
    top: 50% !important;
    left: 50% !important;
    width: min(86vw, 430px) !important;
    height: auto !important;
    min-height: 0 !important;
    margin: 0 !important;
    transform: translate(-50%, -54%) !important;
    display: grid !important;
    justify-items: center !important;
}

.splash-orion {
    width: min(64vw, 290px) !important;
    height: auto !important;
    max-height: 43vh !important;
}

.skip-splash {
    position: absolute !important;
    right: max(16px, env(safe-area-inset-right)) !important;
    bottom: max(16px, env(safe-area-inset-bottom)) !important;
}

body.splash-active #appPages {
    opacity: 0 !important;
    pointer-events: none !important;
}

body.sleep-mode .moonlight-sky {
    opacity: 0.34;
}

body.alarm-mode {
    filter: none !important;
}

#sleepVolume:disabled {
    opacity: 0.45;
    cursor: not-allowed;
}

@media (max-width: 768px) {
    .splash-content {
        top: 47% !important;
        transform: translate(-50%, -50%) !important;
    }

    .splash-orion {
        width: min(68vw, 270px) !important;
        max-height: 40vh !important;
    }

    .splash-brand {
        margin-top: -18px !important;
    }
}

@media (max-height: 700px) {
    .splash-content {
        top: 46% !important;
    }

    .splash-orion {
        width: min(54vw, 235px) !important;
        max-height: 36vh !important;
    }

    .splash-title {
        font-size: clamp(2.2rem, 10vw, 3.6rem) !important;
    }
}
