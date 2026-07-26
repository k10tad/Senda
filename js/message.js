const workMessages = [
    "よう、レイ。今日も付き合おか。",
    "机は逃げへんよ。レイが逃げたいなら五分だけな。",
    "今日は何から片付ける？　めんどい方からいっとく？",
    "手ぇ動かし。俺は隣で機械でもいじっとくわ。"
];

const morningMessages = [
    "おはよ、レイ。起きられたんなら充分えらい。",
    "まず水な。コーヒーはそのあとや。",
    "今日はどこまで行こか。俺も付き合うで。"
];

const breakMessages = [
    "休憩やで。ほら、手ぇ止め。",
    "ちょっと歩いといで。逃亡は五分までな。",
    "目ぇ閉じとき。俺の顔はあとでなんぼでも見れるやろ。"
];

const rainMessages = [
    "雨やな。なんか温いもん飲み。紅茶以外で。",
    "こんな日は急がん方がええ。何事も滑るで。",
    "雨音借りて、静かに片付けよか。"
];

const lowPressureMessages = [
    "気圧落ちとるな。レイまで一緒に落ちたらあかんで。",
    "頭痛来そうなら、意地張る前に止まりや。",
    "今日は低速運転な。壊れるよりずっとましや。"
];

const nightMessages = [
    "夜更かしする気？　悪い仲間ならここにおるで。",
    "眠なったら寝えや。俺が運ぶ羽目になるやろ。",
    "今日もようやったな。あとは俺に寄越し。"
];

function randomMessage(list) {
    const text = list[Math.floor(Math.random() * list.length)];

    if (typeof personalizeSendaText === "function") {
        return personalizeSendaText(text);
    }

    return text;
}

function getMessageList(weatherCode, pressure){

    const hour = new Date().getHours();

    if (pressure !== null && pressure <= 1005) {
        return lowPressureMessages;
    }

    if (weatherCode !== null && weatherCode >= 80) {
        return rainMessages;
    }

    if (hour >= 5 && hour < 11) {
        return morningMessages;
    }

    if (hour >= 18) {
        return nightMessages;
    }

    return workMessages;
}

const welcomeMessages = {
    morning: [
        "おはよ、レイ。起きたんなら半分勝ちや。",
        "来たんか。まず水、その次俺、ほんで机な。",
        "朝やな。昨日より一歩でええ。欲張らんとこ。"
    ],
    afternoon: [
        "よう、レイ。午後のめんどいの、一緒に片付けよか。",
        "眠そうやな。座っただけでも褒めたるわ。",
        "まだ時間あるって。焦って転ばんようにな。"
    ],
    night: [
        "夜か。付き合うけど、朝までは要交渉やで。",
        "遅いやん。終わり決めてから始めよか。",
        "眠なったら寝えや。命令やなくてお願い。珍しいやろ。"
    ],
    lowFocusYesterday: [
        "昨日はあんま進まんかったな。今日は短くてええから、始めよ。",
        "昨日の分まで責めんでええ。今日の25分があるやろ。"
    ],
    goodFocusYesterday: [
        "昨日よう集中しとったな。今日もその調子でいこ。",
        "昨日の記録、悪ないやん。今日はちょっとだけ超えてみる？"
    ]
};

function getWelcomeMessage() {
    const hour = new Date().getHours();

    const yesterdayFocus =
        Number(localStorage.getItem("senda_yesterdayFocusSeconds")) || 0;

    if (yesterdayFocus >= 7200) {
        return randomMessage(welcomeMessages.goodFocusYesterday);
    }

    if (yesterdayFocus > 0 && yesterdayFocus < 1800) {
        return randomMessage(welcomeMessages.lowFocusYesterday);
    }

    if (hour >= 5 && hour < 11) {
        return randomMessage(welcomeMessages.morning);
    }

    if (hour >= 18) {
        return randomMessage(welcomeMessages.night);
    }

    return randomMessage(welcomeMessages.afternoon);
}

const idleMessages = [
    "……レイ。",
        "姿勢崩れとるで。こっちおいで、直したる。",
    "水、飲んだ？",
    "焦らんでええ。今やっとる分だけで充分や。",
        "そのまま続けてみ。俺、隣おるから。",
    "肩の力抜きや。",
    "……悪ない集中やな。",
    "今日は静かやな。",
    "眠なったら無理せんでええよ。",
    "一個ずつ片付けよ。",
    "静かやな。",
    "ちょい肩回しといで。",
    "呼吸浅いで。",
        "時計ばっか見たら、時間も照れるで。",
        "コーヒーの匂いやな。俺の分は？",
        "チョコあるんなら、休憩の交渉乗ったる。",
        "この歯車、どっから余ったと思う？　俺も知らん。",
    "……悪ないやん。",
    "その調子や。",
    "急がんでええよ。",
    "俺、ここおるで。",
];

const contextualIdleMessages = {

    morning: [
        "朝の集中力は貴重やで。",
        "頭動くうちに、めんどい奴仕留めよか。",
        "今日は何から片付ける？"
    ],

    afternoon: [
        "昼越えると頭もちょい錆びるな。",
        "ちょっと歩いてくるんもええで。",
        "午後はペース守ってこ。"
    ],

    night: [
        "もう夜やで。",
        "切り上げるんも腕のうちや。",
        "今日はここまででも充分やろ。"
    ],

    rain: [
        "雨音も悪ないな。",
        "今日は静かな日やな。",
        "雨の日は焦らん方がええで。"
    ],

    sunny: [
        "こんな日は外の空気も悪ないで。",
        "窓、開けてみる？"
    ],

    cloudy: [
        "曇りの日って静かで好きやわ。",
        "考え事には向いとるな。"
    ],

    storm: [
        "外、騒がしいな。",
        "今日は屋内で充分やろ。"
    ],

    lowPressure: [
        "気圧落ちとるな。機械なら叩いたら直るんやけど。",
        "今日は頭痛来ても不思議やないで。",
        "今日は省エネな。レイは交換部品きかへんから。"
    ],

    longFocus: [
        "もう二時間近う座っとるで。",
        "立って身体伸ばし。",
        "水分補給しよか。"
    ],

    midnight: [
        "まだ起きとるん？",
        "……まあ、俺も人のこと言えへんけど。"
    ]

};



//========================
// Companion Engine bridge
//========================

const SENDA_COMPANION_ENGINE_ENABLED = true;
const SENDA_COMPANION_DEBUG_LABEL = false;

function getCompanionEngineMessage() {
    if (
        SENDA_COMPANION_ENGINE_ENABLED !== true ||
        !window.CompanionEngine ||
        typeof window.CompanionEngine.getMessage !== "function"
    ) {
        return "";
    }

    try {
        const generatedMessage = window.CompanionEngine.getMessage({
            weatherCode:
                typeof currentWeatherCode !== "undefined"
                    ? currentWeatherCode
                    : null,
            pressure:
                typeof currentPressure !== "undefined"
                    ? currentPressure
                    : null
        });

        if (!generatedMessage) return "";

        return SENDA_COMPANION_DEBUG_LABEL
            ? `[Companion]\n${generatedMessage}`
            : generatedMessage;

    } catch (error) {
        console.warn("Companion Engine fallback:", error);
        return "";
    }
}

let idleMessageTimer = null;

function showIdleMessage() {
    if (typeof sessionState !== "undefined" && sessionState !== "work") return;

    const companionMessage = getCompanionEngineMessage();

    if (companionMessage) {
        message.textContent = companionMessage;
        scheduleIdleMessage();
        return;
    }

    const memoryMessage = getMemoryMessage();

if (memoryMessage && Math.random() < 0.25) {
    message.textContent = memoryMessage;
    scheduleIdleMessage();
    return;
}
    const hour = new Date().getHours();

    if (currentPressure && currentPressure <= 1005) {
        message.textContent =
            randomMessage(contextualIdleMessages.lowPressure);

    } else if (
        currentWeatherCode &&
        currentWeatherCode >= 80
    ) {
        message.textContent =
            randomMessage(contextualIdleMessages.rain);

    } else if (todayFocusSeconds >= 7200) {
        message.textContent =
            randomMessage(contextualIdleMessages.longFocus);

    } else if (hour >= 5 && hour < 12) {
        message.textContent =
            randomMessage(contextualIdleMessages.morning);

    } else if (hour >= 12 && hour < 18) {
        message.textContent =
            randomMessage(contextualIdleMessages.afternoon);

    } else if (hour >= 18) {
        message.textContent =
            randomMessage(contextualIdleMessages.night);

    } else {
        message.textContent =
            randomMessage(idleMessages);
    }

    scheduleIdleMessage();
}

function scheduleIdleMessage() {
    const fallback = { min: 180000, max: 420000 };
    const range = typeof getSendaIdleDelay === "function"
        ? getSendaIdleDelay("next")
        : fallback;

    const next = range.min + Math.random() * (range.max - range.min);
    idleMessageTimer = setTimeout(showIdleMessage, next);
}

function startIdleMessages() {
    if (idleMessageTimer !== null) return;

    const fallback = { min: 90000, max: 180000 };
    const range = typeof getSendaIdleDelay === "function"
        ? getSendaIdleDelay("first")
        : fallback;

    const first = range.min + Math.random() * (range.max - range.min);
    idleMessageTimer = setTimeout(showIdleMessage, first);
}

function stopIdleMessages() {
    clearTimeout(idleMessageTimer);
    idleMessageTimer = null;
}

function formatFocusTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
        return `${hours}時間${minutes}分`;
    }

    return `${minutes}分`;
}

function getDailySummaryMessage() {
    const focusSeconds =
        Number(localStorage.getItem("senda_todayFocusSeconds")) || 0;

    const count =
        Number(localStorage.getItem("senda_pomodoroCount")) || 0;

    const focusText = formatFocusTime(focusSeconds);

    if (focusSeconds === 0) {
        return "今日はまだ記録なしか。で、どないする？　今から俺と始める？";
    }

    if (focusSeconds < 1800) {
        return `今日は${focusText}。短くても座ったなら上等。次は、あと少しだけ付き合え。`;
    }

    if (focusSeconds < 7200) {
        return `今日は${focusText}、ポモドーロは${count}回。悪くないな。ちゃんと積み上がってる。`;
    }

    return `今日は${focusText}、ポモドーロは${count}回。よくやった、レイ。もう俺の隣で休んでいい。`;
}

const sleepComments = {

    terrible: [
        "……レイ、それ睡眠って呼ぶんは詐欺やろ。",
        "今日は無茶禁止な。反論は寝てから聞いたる。",
        "敵より先に睡魔に撃ち抜かれそうやな。",
        "集中する前に寝え。俺が見張っとくから。",
        "そのままやと机と熱烈な再会するで。",
        "働けとは言うけど、倒れろとは言うてへん。",
        "その睡眠時間で手術はあかん。医者でも患者になるで。",
        "今日は判断鈍るで。俺の目まで借りるつもりで慎重にな。"
    ],

    short: [
        "ちょい寝不足やな。",
        "コーヒーだけで解決する話ちゃうで。",
        "昼休みに目ぇ閉じとき。",
        "今日は早めに切り上げてもええよ。",
        "休憩も仕事や。さぼりちゃう。",
        "無理したら夜に響くで。",
        "あと一時間眠れたら理想やったな。",
        "飛ばしすぎんとき。燃料切れのレイ、重いねん。"
    ],

    good: [
        "悪ない睡眠やな。",
        "今日は頭回りそうやん。",
        "ええ朝やな。",
        "これなら集中できそうや。",
        "準備は充分やな。",
        "今日も一歩ずついこ。置いてかへんから。",
        "調子よさそうやな。",
        "これなら安心して送り出せるわ。帰りはここな。"
    ],

    perfect: [
        "理想的な睡眠やん。",
        "今日は期待してもよさそうやな。",
        "身体も脳も万全やん。",
        "ええコンディションや。",
        "ようやく人間らしい睡眠時間やな。",
        "今日はけっこう進めそうやん。",
        "褒めたる。ほら、こっちおいで。",
        "この調子やと俺の出番少なそうやな。ちょい寂しいけど。"
    ]

};

const dailyFlowMessages = {
    morning: [
        "おはよ、レイ。まず水な。話はそっから。",
        "朝やで。最初は軽く暖機運転でいこ。",
        "今日は何から片付ける？　厄介なんは俺にも寄越し。"
    ],

    noon: [
        "昼やで。ちゃんと食べた？",
        "昼抜いたらあかん。コーヒーは食事ちゃうで。",
        "ちょい立ち。固まったら油差すで。"
    ],

    evening: [
        "夕方やな。残り一緒に数えよか。",
        "こっから欲張らんでええよ。要る分だけでええ。",
        "そろそろ店じまいの準備やで。"
    ],

    night: [
        "夜やで。終わりの時間は先に決めとき。",
        "長引かせんときや。俺まで付き合う羽目になるやろ。",
        "眠なったら寝え。頼むから、俺に運ばせんといて。"
    ],

    midnight: [
        "まだ起きとるん？　……俺も人のこと言えへんけどな。",
        "深夜やで。今の判断力、ウイスキー一杯分くらい怪しいわ。",
        "今日はもう畳も。続きは逃げへんよ。"
    ]
};

function getDailyFlowMessage() {
    const companionMessage = getCompanionEngineMessage();

    if (companionMessage) {
        return companionMessage;
    }

    const hour = new Date().getHours();

    if (hour >= 5 && hour < 11) {
        return randomMessage(dailyFlowMessages.morning);
    }

    if (hour >= 11 && hour < 14) {
        return randomMessage(dailyFlowMessages.noon);
    }

    if (hour >= 17 && hour < 21) {
        return randomMessage(dailyFlowMessages.evening);
    }

    if (hour >= 21 && hour < 24) {
        return randomMessage(dailyFlowMessages.night);
    }

    if (hour >= 0 && hour < 5) {
        return randomMessage(dailyFlowMessages.midnight);
    }

    return randomMessage(dailyFlowMessages.morning);
}

//========================
// Harry 呼びかけ・間と余韻のある短い返事（Companion Reply Phase 9.3）
//========================

const callHarryButton = document.getElementById("callHarry");
const companionReplyChoices = document.getElementById("companionReplyChoices");
const companionReplyButtons = Array.from(
    document.querySelectorAll("[data-companion-reply]")
);

let harryCallCount = 0;
let harryCallResetTimer = null;
let companionReplyTimer = null;
let companionReplyClosingTimer = null;
const lastCompanionReplyIndexes = {};

//========================
// Companion Conversation foundation（Phase 9.4 preparation）
//========================

const COMPANION_CONVERSATION_RESET_MS = 30 * 60 * 1000;

const companionConversationState = {
    lastReplyType: null,
    lastReplyKey: null,
    lastReplyId: null,
    lastInteractionAt: 0,
    consecutiveCount: 0
};

function resetCompanionConversationState() {
    companionConversationState.lastReplyType = null;
    companionConversationState.lastReplyKey = null;
    companionConversationState.lastReplyId = null;
    companionConversationState.lastInteractionAt = 0;
    companionConversationState.consecutiveCount = 0;
}

function expireCompanionConversationState(now = Date.now()) {
    if (
        companionConversationState.lastInteractionAt > 0 &&
        now - companionConversationState.lastInteractionAt >=
            COMPANION_CONVERSATION_RESET_MS
    ) {
        resetCompanionConversationState();
    }
}

function recordCompanionReply(replyType, replyKey, replyId) {
    const now = Date.now();
    expireCompanionConversationState(now);

    companionConversationState.consecutiveCount =
        companionConversationState.lastReplyType === replyType
            ? companionConversationState.consecutiveCount + 1
            : 1;

    companionConversationState.lastReplyType = replyType;
    companionConversationState.lastReplyKey = replyKey;
    companionConversationState.lastReplyId = replyId;
    companionConversationState.lastInteractionAt = now;
}

function getCompanionConversationState() {
    expireCompanionConversationState();
    return { ...companionConversationState };
}

window.SendaCompanionConversation = {
    getState: getCompanionConversationState,
    reset: resetCompanionConversationState,
    resetAfterMs: COMPANION_CONVERSATION_RESET_MS
};

function pickSendaDialogue(key) {
    const list = window.SendaDialogues?.[key];
    if (!Array.isArray(list) || list.length === 0) return "";

    const selected = list[Math.floor(Math.random() * list.length)];
    const name = typeof getSendaUserName === "function" ? getSendaUserName() : "レイ";
    return selected.replaceAll("{name}", name);
}

function pickSendaReply(key) {
    const list = window.SendaDialogues?.[key];
    if (Array.isArray(list) && list.length > 0) {
        const previousIndex = lastCompanionReplyIndexes[key];
        const availableIndexes = list
            .map(function (_, index) { return index; })
            .filter(function (index) {
                return list.length === 1 || index !== previousIndex;
            });
        const selectedIndex =
            availableIndexes[Math.floor(Math.random() * availableIndexes.length)];
        const selected = list[selectedIndex];

        if (selected && typeof selected.main === "string") {
            lastCompanionReplyIndexes[key] = selectedIndex;
            const name =
                typeof getSendaUserName === "function"
                    ? getSendaUserName()
                    : "レイ";

            return {
                main: selected.main.replaceAll("{name}", name),
                closing:
                    typeof selected.closing === "string"
                        ? selected.closing.replaceAll("{name}", name)
                        : "",
                id:
                    typeof selected.id === "string"
                        ? selected.id
                        : `${key}:${selectedIndex}`
            };
        }
    }

    // 9.3以前の Main／Closing 分割形式がキャッシュに残っていても、
    // 「……」で停止しないよう互換取得する。
    const mainList = window.SendaDialogues?.[`${key}Main`];
    const closingList = window.SendaDialogues?.[`${key}Closing`];
    if (!Array.isArray(mainList) || mainList.length === 0) return null;

    const name = typeof getSendaUserName === "function" ? getSendaUserName() : "レイ";
    const mainIndex = Math.floor(Math.random() * mainList.length);
    const closingIndex =
        Array.isArray(closingList) && closingList.length > 0
            ? Math.floor(Math.random() * closingList.length)
            : -1;

    return {
        main: String(mainList[mainIndex]).replaceAll("{name}", name),
        closing: closingIndex >= 0
            ? String(closingList[closingIndex]).replaceAll("{name}", name)
            : "",
        id: `${key}:legacy:${mainIndex}:${closingIndex}`
    };
}

function setCompanionReplyChoicesVisible(isVisible) {
    if (!companionReplyChoices) return;

    companionReplyChoices.hidden = !isVisible;
    companionReplyButtons.forEach(function (button) {
        button.disabled = false;
    });
}

function isRainyCompanionWeather(code) {
    const value = Number(code);
    if (!Number.isFinite(value)) return false;

    return (
        (value >= 51 && value <= 67) ||
        (value >= 80 && value <= 82) ||
        (value >= 95 && value <= 99)
    );
}

function getCompanionReplyContext() {
    const hour = new Date().getHours();
    const pressure =
        typeof currentPressure !== "undefined"
            ? Number(currentPressure)
            : NaN;
    const weatherCode =
        typeof currentWeatherCode !== "undefined"
            ? Number(currentWeatherCode)
            : NaN;

    // 体調に響きやすい天候を最優先にする。
    if (
        (Number.isFinite(pressure) && pressure <= 1005) ||
        isRainyCompanionWeather(weatherCode)
    ) {
        return "weather";
    }

    // 21時以降と早朝は、夜向けの返事に切り替える。
    if (hour >= 21 || hour < 5) {
        return "night";
    }

    // 作業中は作業向け、それ以外の日中も軽い日常向けにする。
    if (typeof sessionState !== "undefined" && sessionState === "work") {
        return "work";
    }

    return "day";
}

const companionReplySets = {
    day: [
        { value: "busy", label: "今日は忙しい" },
        { value: "break", label: "少し休む" },
        { value: "justCalled", label: "呼んだだけ" }
    ],
    work: [
        { value: "busy", label: "まだ忙しい" },
        { value: "break", label: "少し休憩する" },
        { value: "justCalled", label: "呼んだだけ" }
    ],
    night: [
        { value: "tired", label: "少し疲れた" },
        { value: "cantSleep", label: "眠れない" },
        { value: "justCalled", label: "呼んだだけ" }
    ],
    weather: [
        { value: "headHeavy", label: "頭が重い" },
        { value: "quiet", label: "今日は静かにしたい" },
        { value: "justCalled", label: "呼んだだけ" }
    ]
};

function updateCompanionReplyChoices() {
    const context = getCompanionReplyContext();
    const choices = companionReplySets[context] || companionReplySets.day;

    companionReplyButtons.forEach(function (button, index) {
        const choice = choices[index];
        if (!choice) {
            button.hidden = true;
            return;
        }

        button.hidden = false;
        button.dataset.companionReply = choice.value;
        button.textContent = choice.label;
    });
}

function callHarry() {
    clearTimeout(companionReplyTimer);
    clearTimeout(companionReplyClosingTimer);
    harryCallCount += 1;
    clearTimeout(harryCallResetTimer);

    if (window.SendaVoice && message) {
        window.SendaVoice.playHarryChat(message);
    } else {
        const key = harryCallCount === 1 ? "normalCall" : "normalCallRepeat";
        const line = pickSendaDialogue(key);

        if (line && message) {
            message.textContent = line;
        }
    }

    updateCompanionReplyChoices();
    setCompanionReplyChoicesVisible(true);

    harryCallResetTimer = setTimeout(function () {
        harryCallCount = 0;
    }, 45000);
}

function handleCompanionReply(reply) {
    const dialogueKeys = {
        busy: "normalReplyBusy",
        break: "normalReplyBreak",
        tired: "normalReplyTired",
        cantSleep: "normalReplyCantSleep",
        headHeavy: "normalReplyHeadHeavy",
        quiet: "normalReplyQuiet",
        justCalled: "normalReplyJustCalled"
    };

    const key = dialogueKeys[reply];
    if (!key || !message) return;

    const recoveryReplies = {
        busy: {
            main: "そっか。ほな、今やること一個だけ決めよ。",
            closing: "順番に片付けたらええよ。"
        },
        break: {
            main: "それでええ。ちょっと離れておいで。",
            closing: "戻ったらまた呼んでな。"
        },
        tired: {
            main: "そっか。今日はちょっと力抜こ。",
            closing: "無理、重ねたらあかんで。"
        },
        cantSleep: {
            main: "眠れへんなら、無理に眠ろうとせんでええ。",
            closing: "横になっとるだけでも身体は休めるで。"
        },
        headHeavy: {
            main: "そっか。明るさ落とそ。",
            closing: "水飲んで、ちょい休み。"
        },
        quiet: {
            main: "分かった。今日は言葉減らそか。",
            closing: "でも、ここにはおるで。"
        },
        justCalled: {
            main: "呼びたかっただけなん？",
            closing: "それでもかまへんよ。"
        }
    };

    clearTimeout(companionReplyTimer);
    clearTimeout(companionReplyClosingTimer);

    companionReplyButtons.forEach(function (button) {
        button.disabled = true;
    });
    setCompanionReplyChoicesVisible(false);

    // 一拍置いてから、短い返答を表示する。
    message.textContent = "……";
    companionReplyTimer = setTimeout(function () {
        // 台詞集がキャッシュ不整合などで取得できない場合も、
        // 選択内容に対応した返答を使い、全選択肢を同じ台詞へ落とさない。
        const selectedReply =
            pickSendaReply(key) ||
            {
                ...recoveryReplies[reply],
                id: `${key}:recovery`
            };
        recordCompanionReply(reply, key, selectedReply.id);
        const mainLine = selectedReply.main;
        if (mainLine) message.textContent = mainLine;

        // さらに一呼吸置き、締めの一言を添える。
        companionReplyClosingTimer = setTimeout(function () {
            const closingLine = selectedReply.closing;
            if (!closingLine) return;

            // Main はすでに表示済みなので、Closing では再掲しない。
            // 再結合すると「分かった。」→「分かった。\n確認しなくても…」のように
            // 同じ台詞を二度言ったように見えるため、締めの一言だけへ切り替える。
            message.textContent = closingLine;
        }, 850);
    }, 750);
}

if (callHarryButton) {
    callHarryButton.addEventListener("click", callHarry);
}

companionReplyButtons.forEach(function (button) {
    button.addEventListener("click", function () {
        handleCompanionReply(button.dataset.companionReply);
    });
});
