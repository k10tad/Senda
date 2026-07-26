//========================
// 今日の調子チェック
// ハリー会話つき
//========================
　
const moodButtons = document.querySelectorAll(".mood-btn");
const todayOrder = document.getElementById("todayOrder");
const trainingSuggestion = document.getElementById("trainingSuggestion");
const moodQuestion = document.getElementById("moodQuestion");

const moodQuestions = [
    "今日はどない？　誤魔化したらあかんで。",
    "調子どう？　強がりは採点外や。",
    "顔、ちゃんと見せてみ。",
    "昨日の夜、ちょっとは眠れた？",
    "今日はまた無茶する気ちゃうやろな？"
];

const moodData = {
    good: {
        lines: [
            "そら結構。",
            "今日はちょい飛ばせそうやな。",
            "ただし調子乗ったらあかんで。{name}、そこ怪しいからな。"
        ],
        order: "今日の目安：25分を2回。余裕残ったら、軽く身体動かそか。",
        training: "運動メニュー：シャドー3分 × 3R、休憩1分。最後にストレッチ5分な。"
    },

    normal: {
        lines: [
            "いつも通りか。",
            "ほな、無理に景気つけんでもええやろ。",
            "まず25分。俺も付き合うで。"
        ],
        order: "今日の目安：25分を1回。その前に水一杯な。",
        training: "運動メニュー：シャドー3分 × 2R、フットワーク3分や。"
    },

    tired: {
        lines: [
            "疲れとるな。",
            "今日は量で格好つけんでええよ。",
            "短う、確実に。一個終わったら充分や。"
        ],
        order: "今日の目安：作業は短め。20分だけ集中して、あとは様子見よ。",
        training: "運動メニュー：シャドー2分 × 2R、軽いストレッチ5分な。"
    },

    veryTired: {
        lines: [
            "……なるほど。今日はあかん日か。",
            "ほな追い込むん禁止な。文句は元気な日に聞くわ。",
            "最低限でええ。壊れたら俺が困んねん。"
        ],
        order: "今日の優先：水分、食事、休息。仕事はそのあとや。",
        training: "運動メニュー：首・肩・背中のストレッチだけでええよ。"
    },

    headache: {
        lines: [
            "頭痛か。厄介なん来たなあ。",
            "画面と照明落とそ。ついでに意地も置いとき。",
            "今日は勝たんでええ。悪うせえへんかったら充分や。"
        ],
        order: "今日の優先：水分。暗めのとこでちょい休み。",
        training: "運動メニュー：強い運動はなし。肩回し、首まわりの脱力、深呼吸な。"
    },

    low: {
        lines: [
            "そっか。ほな今日は俺が甘やかす番やな。",
            "ノルマ半分。勝手に増やしたらあかんで。",
            "一個できたら勝ち。できんくても、ここには戻っておいで。"
        ],
        order: "今日の目安：ひとつだけ。できたら充分や。",
        training: "運動メニュー：1分だけ動こ。できたら勝ちや。"
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
        messageBox.textContent = typeof personalizeSendaText === "function"
            ? personalizeSendaText(text)
            : text.replaceAll("{name}", "きみ");
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
