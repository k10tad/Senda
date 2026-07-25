//========================
// Senda Settings Engine
// 設定保存と画面反映だけを管理する
//========================

const SENDA_SETTINGS_KEY = "sendaSettings";
const SENDA_PREFECTURES = [
    ["hokkaido", "北海道", 43.0618, 141.3545],
    ["aomori", "青森県", 40.8244, 140.7400],
    ["iwate", "岩手県", 39.7036, 141.1527],
    ["miyagi", "宮城県", 38.2682, 140.8694],
    ["akita", "秋田県", 39.7186, 140.1024],
    ["yamagata", "山形県", 38.2404, 140.3633],
    ["fukushima", "福島県", 37.7503, 140.4676],
    ["ibaraki", "茨城県", 36.3418, 140.4468],
    ["tochigi", "栃木県", 36.5657, 139.8836],
    ["gunma", "群馬県", 36.3912, 139.0608],
    ["saitama", "埼玉県", 35.8569, 139.6489],
    ["chiba", "千葉県", 35.6046, 140.1233],
    ["tokyo", "東京都", 35.6762, 139.6503],
    ["kanagawa", "神奈川県", 35.4478, 139.6425],
    ["niigata", "新潟県", 37.9026, 139.0232],
    ["toyama", "富山県", 36.6953, 137.2113],
    ["ishikawa", "石川県", 36.5947, 136.6256],
    ["fukui", "福井県", 36.0652, 136.2216],
    ["yamanashi", "山梨県", 35.6642, 138.5684],
    ["nagano", "長野県", 36.6513, 138.1810],
    ["gifu", "岐阜県", 35.3912, 136.7223],
    ["shizuoka", "静岡県", 34.9769, 138.3831],
    ["aichi", "愛知県", 35.1802, 136.9066],
    ["mie", "三重県", 34.7303, 136.5086],
    ["shiga", "滋賀県", 35.0045, 135.8686],
    ["kyoto", "京都府", 35.0116, 135.7681],
    ["osaka", "大阪府", 34.6937, 135.5023],
    ["hyogo", "兵庫県", 34.6913, 135.1830],
    ["nara", "奈良県", 34.6851, 135.8048],
    ["wakayama", "和歌山県", 34.2260, 135.1675],
    ["tottori", "鳥取県", 35.5039, 134.2381],
    ["shimane", "島根県", 35.4723, 133.0505],
    ["okayama", "岡山県", 34.6618, 133.9350],
    ["hiroshima", "広島県", 34.3966, 132.4596],
    ["yamaguchi", "山口県", 34.1859, 131.4714],
    ["tokushima", "徳島県", 34.0658, 134.5593],
    ["kagawa", "香川県", 34.3401, 134.0434],
    ["ehime", "愛媛県", 33.8416, 132.7657],
    ["kochi", "高知県", 33.5597, 133.5311],
    ["fukuoka", "福岡県", 33.5904, 130.4017],
    ["saga", "佐賀県", 33.2494, 130.2988],
    ["nagasaki", "長崎県", 32.7503, 129.8777],
    ["kumamoto", "熊本県", 32.8031, 130.7079],
    ["oita", "大分県", 33.2382, 131.6126],
    ["miyazaki", "宮崎県", 31.9077, 131.4202],
    ["kagoshima", "鹿児島県", 31.5966, 130.5571],
    ["okinawa", "沖縄県", 26.2124, 127.6809]
].map(([id, label, latitude, longitude]) => ({ id, label, latitude, longitude }));

const sendaDefaultSettings = {
    userName: "レイ",
    weatherPrefecture: "osaka",
    idleFrequency: "normal"
};

function clampSetting(value, min, max) {
    return Math.min(max, Math.max(min, Number(value)));
}

function loadSendaSettings() {
    try {
        const saved = JSON.parse(localStorage.getItem(SENDA_SETTINGS_KEY));
        return {
            ...sendaDefaultSettings,
            ...(saved && typeof saved === "object" ? saved : {}),
            userName: String(saved?.userName || "レイ").trim() || "レイ",
            weatherPrefecture: SENDA_PREFECTURES.some(item => item.id === saved?.weatherPrefecture)
                ? saved.weatherPrefecture
                : "osaka",
            idleFrequency: ["low", "normal", "high"].includes(saved?.idleFrequency)
                ? saved.idleFrequency
                : "normal"
        };
    } catch (_) {
        return { ...sendaDefaultSettings };
    }
}

let sendaSettings = loadSendaSettings();
let lastSavedUserName = sendaSettings.userName;

const userNameInput = document.getElementById("userNameInput");
const weatherPrefectureInput = document.getElementById("weatherPrefecture");
const saveSettingsButton = document.getElementById("saveSettings");
const resetSettingsButton = document.getElementById("resetSettings");
const settingsSavedMessage = document.getElementById("settingsSavedMessage");
const frequencyInputs = Array.from(document.querySelectorAll('input[name="idleFrequency"]'));

function saveSendaSettings() {
    localStorage.setItem(SENDA_SETTINGS_KEY, JSON.stringify(sendaSettings));
}

function getSendaWeatherLocation() {
    return SENDA_PREFECTURES.find(item => item.id === sendaSettings.weatherPrefecture)
        || SENDA_PREFECTURES.find(item => item.id === "osaka");
}

function getSendaUserName() {
    return sendaSettings.userName || "レイ";
}

function personalizeSendaText(text) {
    return typeof text === "string" ? text.replaceAll("レイ", getSendaUserName()) : text;
}

function updateVisibleName(oldName, newName) {
    ["message", "sleepMessage", "alarmWakeMessage"]
        .map(id => document.getElementById(id))
        .filter(Boolean)
        .forEach(function (element) {
            element.textContent = (element.textContent || "")
                .replaceAll(oldName, newName)
                .replaceAll("レイ", newName);
        });
}

function getSendaIdleDelay(stage = "next") {
    const ranges = {
        low: { first: { min: 180000, max: 300000 }, next: { min: 420000, max: 720000 } },
        normal: { first: { min: 90000, max: 180000 }, next: { min: 180000, max: 420000 } },
        high: { first: { min: 45000, max: 90000 }, next: { min: 90000, max: 210000 } }
    };
    return ranges[sendaSettings.idleFrequency][stage];
}

function fillSettingsForm() {
    if (userNameInput) userNameInput.value = sendaSettings.userName;
    if (weatherPrefectureInput) {
        weatherPrefectureInput.replaceChildren(...SENDA_PREFECTURES.map(function (prefecture) {
            const option = document.createElement("option");
            option.value = prefecture.id;
            option.textContent = prefecture.label;
            return option;
        }));
        weatherPrefectureInput.value = sendaSettings.weatherPrefecture;
    }
    frequencyInputs.forEach(input => input.checked = input.value === sendaSettings.idleFrequency);
}

function readSettingsForm() {
    const selected = frequencyInputs.find(input => input.checked);
    return {
        userName: String(userNameInput?.value || "レイ").trim() || "レイ",
        weatherPrefecture: SENDA_PREFECTURES.some(item => item.id === weatherPrefectureInput?.value)
            ? weatherPrefectureInput.value
            : "osaka",
        idleFrequency: selected?.value || "normal"
    };
}

function showSaved(text) {
    if (!settingsSavedMessage) return;
    settingsSavedMessage.textContent = text;
    settingsSavedMessage.classList.add("visible");
    clearTimeout(showSaved.timer);
    showSaved.timer = setTimeout(() => settingsSavedMessage.classList.remove("visible"), 2400);
}

function commitSettings() {
    const oldName = lastSavedUserName;
    const oldPrefecture = sendaSettings.weatherPrefecture;
    sendaSettings = readSettingsForm();
    lastSavedUserName = sendaSettings.userName;
    saveSendaSettings();
    updateVisibleName(oldName, sendaSettings.userName);
    if (oldPrefecture !== sendaSettings.weatherPrefecture && typeof loadWeather === "function") {
        loadWeather();
    }
    showSaved("保存したで。");
}

function resetSendaSettings() {
    const oldName = lastSavedUserName;
    sendaSettings = { ...sendaDefaultSettings };
    lastSavedUserName = sendaSettings.userName;
    saveSendaSettings();
    fillSettingsForm();
    updateVisibleName(oldName, sendaSettings.userName);
    if (typeof loadWeather === "function") loadWeather();
    showSaved("初期設定に戻したで。");
}

if (saveSettingsButton) saveSettingsButton.addEventListener("click", commitSettings);
if (resetSettingsButton) resetSettingsButton.addEventListener("click", resetSendaSettings);
if (userNameInput) userNameInput.addEventListener("keydown", event => {
    if (event.key === "Enter") commitSettings();
});

fillSettingsForm();
saveSendaSettings();
