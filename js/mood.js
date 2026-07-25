//========================
// 今日の調子チェック
// ハリー会話つき
//========================

const moodButtons = document.querySelectorAll(".mood-btn");
const todayOrder = document.getElementById("todayOrder");
const trainingSuggestion = document.getElementById("trainingSuggestion");
const moodQuestion = document.getElementById("moodQuestion");

const moodQuestions = [
    "今日はどうだ。",
    "体調は。",
    "顔色は悪くないか。",
    "昨夜は眠れたか。",
    "今日は無理をしそうか？"
];

const moodData = {
    good: {
        lines: [
            "了解した。",
            "顔色は悪くない。今日は少し攻められそうだ。",
            "だが調子に乗りすぎるな。まずは一つずつだ。"
        ],
        order: "今日の司令：25分作業を2回。余裕があれば軽く身体を動かせ。",
        training: "運動メニュー：シャドー3分 × 3R、休憩1分。最後にストレッチ5分。"
    },

    normal: {
        lines: [
            "分かった。",
            "いつも通りでいい。崩さず進めるぞ。",
            "まずは25分だ。"
        ],
        order: "今日の司令：25分作業を1回。水を一杯飲め。",
        training: "運動メニュー：シャドー3分 × 2R、フットワーク3分。"
    },

    tired: {
        lines: [
            "了解した。",
            "今日は量より質だ。",
            "無理に詰め込むな。短く、確実に終わらせる。"
        ],
        order: "今日の司令：作業は短めでいい。20分だけ集中しろ。",
        training: "運動メニュー：シャドー2分 × 2R、軽いストレッチ5分。"
    },

    veryTired: {
        lines: [
            "……分かった。",
            "今日は追い込まない。",
            "最低限でいい。身体を壊す方が困る。"
        ],
        order: "今日の司令：水分、食事、休息を優先しろ。",
        training: "運動メニュー：首・肩・背中のストレッチだけでいい。"
    },

    headache: {
        lines: [
            "頭痛か。",
            "画面を見すぎるな。照明も落とせ。",
            "今日は勝つ日ではなく、崩れない日だ。"
        ],
        order: "今日の司令：水を飲め。暗めの環境で少し休め。",
        training: "運動メニュー：強い運動なし。肩回し、首まわりの脱力、深呼吸。"
    },

    low: {
        lines: [
            "……分かった。",
            "今日はノルマを半分にする。",
            "ひとつだけ終わらせれば十分だ。ここに戻ってこい。"
        ],
        order: "今日の司令：ひとつだけ終わらせれば十分だ。",
        training: "運動メニュー：1分だけ動け。できたら勝ちだ。"
    }
};

function pickMoodQuestion() {
    if (!moodQuestion) return;

    const text =
        moodQuestions[Math.floor(Math.random() * moodQuestions.length)];

    moodQuestion.textContent = text;
}

function getMessageBox() {
    return document.getElementById("message");
}

function setHarryLine(text) {
    const messageBox = getMessageBox();

    if (messageBox) {
        messageBox.textContent = text;
    }
}

function speakMoodLines(lines) {
    if (!Array.isArray(lines) || lines.length === 0) return;

    setHarryLine(lines[0]);

    if (lines[1]) {
        setTimeout(function () {
            setHarryLine(lines[1]);
        }, 900);
    }

    if (lines[2]) {
        setTimeout(function () {
            setHarryLine(lines[2]);
        }, 2200);
    }
}

function saveMoodLog(mood) {
    const today = new Date().toDateString();

    const log =
        JSON.parse(localStorage.getItem("senda_moodLog")) || [];

    log.push({
        date: today,
        mood: mood,
        time: new Date().toLocaleTimeString()
    });

    localStorage.setItem("senda_moodLog", JSON.stringify(log));
    localStorage.setItem("senda_todayMood", mood);
    localStorage.setItem("senda_todayMoodDate", today);
}

function applyMood(mood, shouldSpeak) {
    const data = moodData[mood];

    if (!data) return;

    if (todayOrder) {
        todayOrder.textContent = data.order;
    }

    if (trainingSuggestion) {
        trainingSuggestion.textContent = data.training;
    }

    if (shouldSpeak) {
        speakMoodLines(data.lines);
    }

    saveMoodLog(mood);
}

moodButtons.forEach(function (button) {
    button.addEventListener("click", function () {
        const mood = button.dataset.mood;
        applyMood(mood, true);
    });
});

function loadTodayMood() {
    const today = new Date().toDateString();
    const savedDate = localStorage.getItem("senda_todayMoodDate");
    const savedMood = localStorage.getItem("senda_todayMood");

    if (savedDate === today && savedMood) {
        applyMood(savedMood, false);
    }
}

pickMoodQuestion();
loadTodayMood();
