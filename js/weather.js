//========================
// Senda 天気・気圧
//========================

function getPressurePresentation(pressureValue) {
    const hour = new Date().getHours();
    const isNight = hour >= 18 || hour < 5;

    if (pressureValue <= 1005) {
        return {
            level: "気圧：低め",
            comment: "今日は低めやわ。無理せんとゆっくり進めや。"
        };
    }

    if (pressureValue >= 1017) {
        return {
            level: "気圧：高め",
            comment: isNight
                ? "今日は気圧高めやな、そんでも夜更かしはほどほどにな。"
                : "今日は調子が出そうやな。"
        };
    }

    return {
        level: "気圧：安定",
        comment: isNight
            ? "今日は気圧安定してるで。焦らず進めてこか。"
            : "いいペースで進めよう。"
    };
}

function getWeatherIcon(code) {
    const hour = new Date().getHours();
    const isNight = hour >= 18 || hour < 5;

    if (code === 0) return isNight ? "☾" : "☀";
    if (code >= 1 && code <= 3) return isNight ? "☾" : "⛅";
    if (code >= 45 && code <= 48) return "🌫";
    if (code >= 51 && code <= 67) return "🌦";
    if (code >= 71 && code <= 77) return "❄";
    if (code >= 80 && code <= 99) return "🌧";
    return "☁";
}


function applyWeatherAtmosphere(code) {
    document.body.classList.remove("weather-rain", "weather-fog", "weather-snow");

    if (code >= 45 && code <= 48) {
        document.body.classList.add("weather-fog");
    } else if ((code >= 51 && code <= 67) || (code >= 80 && code <= 99)) {
        document.body.classList.add("weather-rain");
    } else if (code >= 71 && code <= 77) {
        document.body.classList.add("weather-snow");
    }
}

async function loadWeather() {
    const temperature = document.getElementById("temperature");
    const pressure = document.getElementById("pressure");
    const humidity = document.getElementById("humidity");
    const weatherIcon = document.getElementById("weather-icon");
    const pressureLevel = document.getElementById("pressure-level");
    const weatherComment = document.getElementById("weather-comment");

    if (!temperature || !pressure || !humidity || !weatherIcon || !pressureLevel || !weatherComment) {
        console.log("Sendaの天気表示要素が見つかりません");
        return;
    }

    const location = typeof getSendaWeatherLocation === "function"
        ? getSendaWeatherLocation()
        : { latitude: 34.6937, longitude: 135.5023 };
    const parameters = new URLSearchParams({
        latitude: String(location.latitude),
        longitude: String(location.longitude),
        current: "temperature_2m,weather_code,surface_pressure,relative_humidity_2m",
        timezone: "Asia/Tokyo"
    });
    const url = `https://api.open-meteo.com/v1/forecast?${parameters}`;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Weather request failed: ${response.status}`);
        }

        const data = await response.json();
        const current = data.current;

        if (!current) {
            throw new Error("Weather data is missing current values");
        }

        const code = Number(current.weather_code);
        const pressureValue = Number(current.surface_pressure);
        const presentation = getPressurePresentation(pressureValue);

        temperature.textContent = `${Math.round(Number(current.temperature_2m))}℃`;
        pressure.textContent = `${pressureValue.toFixed(1)} hPa`;
        humidity.textContent = `湿度 ${Math.round(Number(current.relative_humidity_2m))}%`;
        weatherIcon.textContent = getWeatherIcon(code);
        pressureLevel.textContent = presentation.level;
        weatherComment.textContent = presentation.comment;
        applyWeatherAtmosphere(code);

        // message.jsから参照される既存変数へ反映。
        currentWeatherCode = code;
        currentPressure = pressureValue;
    } catch (error) {
        temperature.textContent = "--℃";
        pressure.textContent = "---- hPa";
        humidity.textContent = "湿度 --%";
        weatherIcon.textContent = "✦";
        pressureLevel.textContent = "気圧：取得できません";
        weatherComment.textContent = "通信が戻るまで、ここで待っていろ。";
        document.body.classList.remove("weather-rain", "weather-fog", "weather-snow");
        console.error("Senda weather error:", error);
    }
}
