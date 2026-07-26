//========================
// Senda Harry Voice
// スペイン語音声と関西弁字幕を一組で管理する
//========================
　
(function () {
    const VOICE_BASE_PATH = "sound/voice/";
    const VOICE_VOLUME = 0.92;
    const HARRY_CHAT_RARE_RATE = 0.12;

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
        },

        harryChat01: {
            subtitle: "俺のこと探してたん？",
            file: "harry-chat-01.mp3"
        },
        harryChat02: {
            subtitle: "おいで。もうちょい近ぉ。",
            file: "harry-chat-02.mp3"
        },
        harryChat03: {
            subtitle: "……うん。その距離がええ。",
            file: "harry-chat-03.mp3"
        },
        harryChat04: {
            subtitle: "ちょっとだけ、顔見せて。",
            file: "harry-chat-04.mp3"
        },
        harryChat05: {
            subtitle: "……{name}がおって、ほんま良かった。",
            file: "harry-chat-05.mp3"
        },
        harryChat06: {
            subtitle: "ちゃんと俺んとこ来てくれるんやな。",
            file: "harry-chat-06.mp3"
        },
        harryChat07: {
            subtitle: "来たか、{name}。\n……ほんなら安心や。",
            file: "harry-chat-07.mp3"
        },
        harryChat08: {
            subtitle: "今日は何も話さんでもええ。",
            file: "harry-chat-08.mp3"
        },
        harryChat09: {
            subtitle: "{name}、少しだけ一緒におろ。",
            file: "harry-chat-09.mp3"
        },
        harryChat10: {
            subtitle: "……そんな顔で笑わんといて。\n俺まで調子狂うやん。",
            file: "harry-chat-10.mp3"
        },
        harryChatRare01: {
            subtitle: "……おいで、{name}。\nちょっと抱きしめたなった。",
            file: "harry-chat-rare-01.mp3"
        },
        harryChatRare02: {
            subtitle: "ちゃんと伝えられとるか分からんけど……\n{name}のこと、ほんまに大事に思っとる。",
            file: "harry-chat-rare-02.mp3"
        },
        harryChatRare03: {
            subtitle: "……そんな目で見んといて。\n帰したくなくなるやろ。",
            file: "harry-chat-rare-03.mp3"
        },

        goodnight01: {
            subtitle: "おやすみ、{name}。\n今日はもう何もせんでええ。\nゆっくり寝ぇ。俺はここにおる。",
            file: "harry-goodnight-01.mp3"
        },
        goodnight02: {
            subtitle: "{name}、目ぇ閉じて。\n続きは全部、明日の俺らに任せよ。",
            file: "harry-goodnight-02.mp3"
        },
        goodnight03: {
            subtitle: "寒いんやったら……\n{name}、もう少しこっち来ぃ。",
            file: "harry-goodnight-03.mp3"
        },
        goodnight04: {
            subtitle: "安心して寝ぇ、{name}。\n今夜は何にも邪魔させへんから。",
            file: "harry-goodnight-04.mp3"
        },
        goodnight05: {
            subtitle: "明日の朝も、ちゃんと起こしたる。\n……ほな、おやすみ。{name}。",
            file: "harry-goodnight-05.mp3"
        }
    };

    const groups = {
        harryChat: [
            "harryChat01", "harryChat02", "harryChat03", "harryChat04", "harryChat05",
            "harryChat06", "harryChat07", "harryChat08", "harryChat09", "harryChat10"
        ],
        harryChatRare: ["harryChatRare01", "harryChatRare02", "harryChatRare03"],
        goodnight: ["goodnight01", "goodnight02", "goodnight03", "goodnight04", "goodnight05"]
    };

    const lastPlayedByGroup = {};
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
            : "きみ";
    }

    function resolveSubtitle(template) {
        return String(template || "").replaceAll("{name}", getUserName());
    }

    function play(key, target) {
        const line = lines[key];
        if (!line) return null;

        const resolvedLine = {
            ...line,
            key,
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

    function pickGroupKey(groupName) {
        const keys = groups[groupName];
        if (!Array.isArray(keys) || keys.length === 0) return null;

        const previousKey = lastPlayedByGroup[groupName];
        const candidates = keys.filter(function (key) {
            return keys.length === 1 || key !== previousKey;
        });
        const key = candidates[Math.floor(Math.random() * candidates.length)];
        lastPlayedByGroup[groupName] = key;
        return key;
    }

    function playGroup(groupName, target) {
        const key = pickGroupKey(groupName);
        return key ? play(key, target) : null;
    }

    function playHarryChat(target) {
        const isRare = Math.random() < HARRY_CHAT_RARE_RATE;
        return playGroup(isRare ? "harryChatRare" : "harryChat", target);
    }

    function playGoodnight(target) {
        return playGroup("goodnight", target);
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
        groups,
        rareRate: HARRY_CHAT_RARE_RATE,
        play,
        playGroup,
        playHarryChat,
        playGoodnight,
        playWakeUp,
        queueWelcome,
        resolveSubtitle,
        stop: stopCurrentVoice
    };
})();
