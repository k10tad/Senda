//========================
// Senda Harry Voice
// スペイン語音声と関西弁字幕を一組で管理する
//========================
 
(function () {
    const VOICE_BASE_PATH = "sound/voice/";
    const VOICE_VOLUME = 0.92;

    const lines = {
        welcome: {
            subtitle: "来たんやな、{name}。ほら、ちょっと俺とおり。",
            file: "harry-welcome-a-es.mp3"
        },
        workStart: {
            subtitle: "ほな、{name}。手ぇ動かそか。逃げるんは五分だけ許したる。",
            file: "harry-work-start-b-es.mp3"
        },
        breakStart: {
            subtitle: "{name}、休憩やで。手ぇ止めへんなら、俺が没収するからな。",
            file: "harry-break-start-c-es.mp3"
        },
        workComplete: {
            subtitle: "今日は終いや、{name}。そんな顔せんでも、もう充分やったで。",
            file: "harry-work-complete-c-es.mp3"
        },
        sleepStart: {
            subtitle: "{name}、今日の分はもう充分や。明日のことは、起きてからでええ。",
            file: "harry-sleep-start-b-es.mp3"
        },
        wakeUpB: {
            subtitle: "おはよ、{name}。ほら、起きるん手伝ったる。",
            file: "harry-wake-up-b-es.mp3"
        },
        wakeUpC: {
            subtitle: "起きや、{name}。寝癖だけ先に活動開始しとるで。",
            file: "harry-wake-up-c-es.mp3"
        }
    };

    let currentVoice = null;
    let resumeMode = null;
    let welcomePlayed = false;

    function restoreBackgroundAudio() {
        if (!resumeMode || resumeMode === "idle") {
            resumeMode = null;
            return;
        }
        const mode = resumeMode;
        resumeMode = null;
        if (typeof setMode === "function") setMode(mode);
    }

    function stopCurrentVoice() {
        if (!currentVoice) return;
        currentVoice.onended = null;
        currentVoice.onerror = null;
        currentVoice.pause();
        try { currentVoice.currentTime = 0; } catch (_) {}
        currentVoice = null;
        restoreBackgroundAudio();
    }

    function duckBackgroundAudio() {
        if (typeof audioMode === "undefined" || typeof setMode !== "function") return;
        resumeMode = audioMode;
        if (resumeMode !== "idle") setMode("idle");
    }

    function setSubtitle(target, text) {
        const element = typeof target === "string"
            ? document.getElementById(target)
            : target;
        if (element) element.textContent = text;
    }

    function getUserName() {
        return typeof getSendaUserName === "function"
            ? getSendaUserName()
            : "レイ";
    }

    function resolveSubtitle(template) {
        return String(template || "").replaceAll("{name}", getUserName());
    }

    function play(key, target) {
        const line = lines[key];
        if (!line) return null;

        const resolvedLine = {
            ...line,
            subtitle: resolveSubtitle(line.subtitle)
        };

        setSubtitle(target, resolvedLine.subtitle);
        stopCurrentVoice();
        duckBackgroundAudio();

        const audio = new Audio(VOICE_BASE_PATH + line.file);
        currentVoice = audio;
        audio.preload = "auto";
        audio.volume = VOICE_VOLUME;

        const finish = function () {
            if (currentVoice !== audio) return;
            currentVoice = null;
            restoreBackgroundAudio();
        };

        audio.onended = finish;
        audio.onerror = finish;

        try {
            const result = audio.play();
            if (result && typeof result.catch === "function") result.catch(finish);
        } catch (_) {
            finish();
        }

        return resolvedLine;
    }

    function playWakeUp(target) {
        const keys = ["wakeUpB", "wakeUpC"];
        return play(keys[Math.floor(Math.random() * keys.length)], target);
    }

    function queueWelcome(target) {
        setSubtitle(target, resolveSubtitle(lines.welcome.subtitle));

        function playOnce() {
            if (welcomePlayed) return;
            welcomePlayed = true;
            play("welcome", target);
        }

        document.addEventListener("pointerdown", playOnce, { once: true });
        document.addEventListener("keydown", playOnce, { once: true });
    }

    window.SendaVoice = {
        lines,
        play,
        playWakeUp,
        queueWelcome,
        resolveSubtitle,
        stop: stopCurrentVoice
    };
})();
