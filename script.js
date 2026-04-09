// Weather App JavaScript
let currentUnit = "metric";
let currentWeatherData = null;
let recentCities = [];

// DOM Elements
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const loadingSpinner = document.getElementById('loadingSpinner');
const weatherContentDiv = document.getElementById('weatherContent');
const errorMsgDiv = document.getElementById('errorMsg');
const recentContainer = document.getElementById('recentContainer');
const unitBtns = document.querySelectorAll('.unit-btn');
const tempUnitSymSpan = document.getElementById('tempUnitSym');
const mainTempSpan = document.getElementById('mainTemp');
const feelsLikeSpan = document.getElementById('feelsLike');
const windSpan = document.getElementById('windSpeed');
const windUnitSpan = document.getElementById('windUnit');
const sunriseSpan = document.getElementById('sunriseTime');
const sunsetSpan = document.getElementById('sunsetTime');
const humiditySpan = document.getElementById('humidity');
const conditionSpan = document.getElementById('conditionText');
const cityNameSpan = document.getElementById('cityName');
const weatherIconElem = document.getElementById('weatherIcon');
const precipSpan = document.getElementById('precipProb');

// Load recent cities from localStorage
function loadRecentCities() {
    const stored = localStorage.getItem('weather_recent_cities');
    if (stored) {
        try {
            recentCities = JSON.parse(stored);
            if (!Array.isArray(recentCities)) recentCities = [];
        } catch (e) {
            recentCities = [];
        }
    }
    recentCities = recentCities.slice(0, 5);
    renderRecentChips();
}

function saveRecentCities() {
    localStorage.setItem('weather_recent_cities', JSON.stringify(recentCities.slice(0, 5)));
}

function addRecentCity(cityName) {
    if (!cityName) return;
    const cleaned = cityName.trim();
    if (cleaned === "") return;
    recentCities = recentCities.filter(c => c.toLowerCase() !== cleaned.toLowerCase());
    recentCities.unshift(cleaned);
    if (recentCities.length > 5) recentCities.pop();
    saveRecentCities();
    renderRecentChips();
}

function renderRecentChips() {
    recentContainer.innerHTML = '';
    if (recentCities.length === 0) {
        recentContainer.innerHTML = '<span style="color: #9aaebf; font-size:0.8rem;"><i class="fas fa-map-marker-alt"></i> No recent cities</span>';
        return;
    }
    recentCities.forEach((city, index) => {
        const chip = document.createElement('div');
        chip.className = 'recent-chip';
        chip.innerHTML = `
            <i class="fas fa-history"></i> ${city}
            <span class="delete-city" data-index="${index}">
                <i class="fas fa-times-circle"></i>
            </span>
        `;
        
        // Click on city name to search
        chip.addEventListener('click', (e) => {
            if (!e.target.closest('.delete-city')) {
                cityInput.value = city;
                fetchWeatherData(city);
            }
        });
        
        // Click on delete icon to remove individual city
        const deleteBtn = chip.querySelector('.delete-city');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            removeCityAtIndex(index);
        });
        
        recentContainer.appendChild(chip);
    });
}

// Remove individual city
function removeCityAtIndex(index) {
    recentCities.splice(index, 1);
    saveRecentCities();
    renderRecentChips();
}

function setThemeByCondition(conditionText) {
    const cond = conditionText.toLowerCase();
    const body = document.body;
    if (cond.includes('thunder') || cond.includes('storm')) {
        body.setAttribute('data-theme', 'thunder');
    } else if (cond.includes('rain') || cond.includes('drizzle') || cond.includes('shower')) {
        body.setAttribute('data-theme', 'rain');
    } else if (cond.includes('cloud')) {
        body.setAttribute('data-theme', 'clouds');
    } else if (cond.includes('clear') || cond.includes('sunny')) {
        body.setAttribute('data-theme', 'clear');
    } else if (cond.includes('snow')) {
        body.setAttribute('data-theme', 'snow');
    } else {
        body.setAttribute('data-theme', 'default');
    }
}

function setLoading(loading) {
    if (loading) {
        loadingSpinner.classList.remove('hidden');
        weatherContentDiv.classList.add('hidden');
        errorMsgDiv.classList.add('hidden');
    } else {
        loadingSpinner.classList.add('hidden');
        weatherContentDiv.classList.remove('hidden');
    }
}

function showError(message) {
    setLoading(false);
    weatherContentDiv.classList.add('hidden');
    errorMsgDiv.classList.remove('hidden');
    errorMsgDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${message}`;
    setTimeout(() => {
        if (errorMsgDiv && !errorMsgDiv.classList.contains('hidden')) {
            errorMsgDiv.classList.add('hidden');
        }
    }, 5000);
}

function mapWeatherCodeToText(code) {
    const codes = {
        0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
        45: "Foggy", 48: "Fog", 51: "Light drizzle", 53: "Moderate drizzle",
        55: "Dense drizzle", 61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
        71: "Light snow", 73: "Moderate snow", 75: "Heavy snow", 80: "Rain showers",
        81: "Moderate showers", 82: "Violent showers", 95: "Thunderstorm", 96: "Thunderstorm"
    };
    return codes[code] || "Variable clouds";
}

function getWeatherIconClass(code, isDay) {
    if (code === 0) return isDay ? "fas fa-sun" : "fas fa-moon";
    if (code === 1 || code === 2) return isDay ? "fas fa-cloud-sun" : "fas fa-cloud-moon";
    if (code === 3) return "fas fa-cloud";
    if ([45, 48].includes(code)) return "fas fa-smog";
    if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return "fas fa-cloud-rain";
    if ([71, 73, 75].includes(code)) return "fas fa-snowflake";
    if ([95, 96].includes(code)) return "fas fa-bolt";
    return "fas fa-cloud";
}

function getMiniIcon(code) {
    if ([0].includes(code)) return "☀️";
    if ([1, 2].includes(code)) return "⛅";
    if ([3].includes(code)) return "☁️";
    if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return "🌧️";
    if ([95, 96].includes(code)) return "⛈️";
    if ([71, 73, 75].includes(code)) return "❄️";
    return "🌤️";
}

async function fetchWeatherData(cityName) {
    setLoading(true);
    errorMsgDiv.classList.add('hidden');

    try {
        // Step 1: Geocoding API
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`;
        const geoResponse = await fetch(geoUrl);
        
        if (!geoResponse.ok) {
            throw new Error("Geocoding service error");
        }
        
        const geoData = await geoResponse.json();

        if (!geoData.results || geoData.results.length === 0) {
            throw new Error(`"${cityName}" not found. Please check spelling.`);
        }

        const { latitude, longitude, name, country } = geoData.results[0];
        const displayName = `${name}, ${country}`;
        cityNameSpan.innerText = displayName;

        // Step 2: Weather API
        const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=temperature_2m,relativehumidity_2m,weathercode,windspeed_10m,precipitation_probability&daily=weathercode,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max&timezone=auto&forecast_days=7`;
        const weatherResponse = await fetch(forecastUrl);
        
        if (!weatherResponse.ok) {
            throw new Error("Weather service error");
        }
        
        const weather = await weatherResponse.json();

        if (!weather.current_weather) {
            throw new Error("Weather data unavailable");
        }

        const current = weather.current_weather;
        const hourly = weather.hourly;
        const daily = weather.daily;

        // Find current hour index
        let currentHourIndex = 0;
        for (let i = 0; i < hourly.time.length; i++) {
            if (hourly.time[i] === current.time) {
                currentHourIndex = i;
                break;
            }
        }

        // Get precipitation
        let precipValue = 0;
        if (hourly.precipitation_probability && hourly.precipitation_probability[currentHourIndex] !== undefined) {
            precipValue = hourly.precipitation_probability[currentHourIndex];
        } else {
            const code = current.weathercode;
            if ([51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96].includes(code)) precipValue = 75;
            else if ([71, 73, 75].includes(code)) precipValue = 55;
            else precipValue = Math.floor(Math.random() * 20);
        }

        // Get humidity
        let humidityValue = 65;
        if (hourly.relativehumidity_2m && hourly.relativehumidity_2m[currentHourIndex]) {
            humidityValue = hourly.relativehumidity_2m[currentHourIndex];
        }

        const weatherPackage = {
            currentTempC: current.temperature,
            currentWindKmph: current.windspeed,
            feelsLikeC: current.temperature,
            humidity: humidityValue,
            conditionCode: current.weathercode,
            hourlyData: hourly,
            dailyData: daily,
            sunrise: daily.sunrise[0],
            sunset: daily.sunset[0],
            precipitationPercent: precipValue
        };
        
        currentWeatherData = weatherPackage;

        const conditionText = mapWeatherCodeToText(current.weathercode);
        conditionSpan.innerText = conditionText;
        humiditySpan.innerText = weatherPackage.humidity;
        precipSpan.innerText = weatherPackage.precipitationPercent;
        setThemeByCondition(conditionText);

        // Check if day or night
        const now = new Date(current.time);
        const sunrise = new Date(daily.sunrise[0]);
        const sunset = new Date(daily.sunset[0]);
        const isDay = now >= sunrise && now <= sunset;
        weatherIconElem.className = getWeatherIconClass(current.weathercode, isDay);

        // Format sunrise/sunset times
        const riseDate = new Date(daily.sunrise[0]);
        const setDate = new Date(daily.sunset[0]);
        sunriseSpan.innerText = riseDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        sunsetSpan.innerText = setDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        updateDisplayByUnit(currentUnit);
        renderHourlyForecast(hourly, current.time, currentUnit);
        renderWeeklyForecast(daily, currentUnit);

        addRecentCity(displayName);
        setLoading(false);

    } catch (err) {
        console.error("Fetch error:", err);
        showError(err.message || "Unable to fetch weather data. Please check your connection and try again.");
        setLoading(false);
    }
}

function updateDisplayByUnit(unit) {
    if (!currentWeatherData) return;
    
    const tempC = currentWeatherData.currentTempC;
    const tempF = (tempC * 9 / 5) + 32;
    const windKmph = currentWeatherData.currentWindKmph;
    const windMph = windKmph * 0.621371;
    const feelsC = currentWeatherData.feelsLikeC;
    const feelsF = (feelsC * 9 / 5) + 32;

    if (unit === "metric") {
        mainTempSpan.innerText = Math.round(tempC);
        feelsLikeSpan.innerText = Math.round(feelsC);
        windSpan.innerText = Math.round(windKmph);
        windUnitSpan.innerText = "km/h";
        tempUnitSymSpan.innerText = "C";
    } else {
        mainTempSpan.innerText = Math.round(tempF);
        feelsLikeSpan.innerText = Math.round(feelsF);
        windSpan.innerText = Math.round(windMph);
        windUnitSpan.innerText = "mph";
        tempUnitSymSpan.innerText = "F";
    }
    
    if (currentWeatherData.hourlyData) {
        renderHourlyForecast(currentWeatherData.hourlyData, null, unit);
    }
    if (currentWeatherData.dailyData) {
        renderWeeklyForecast(currentWeatherData.dailyData, unit);
    }
}

function renderHourlyForecast(hourly, currentTimeStr, unit) {
    const container = document.getElementById('hourlyContainer');
    if (!container) return;
    container.innerHTML = '';

    if (!hourly || !hourly.time) {
        container.innerHTML = '<div class="placeholder-text">Hourly forecast data unavailable</div>';
        return;
    }

    const nowHour = currentTimeStr ? new Date(currentTimeStr).getHours() : new Date().getHours();
    let startIdx = 0;
    for (let i = 0; i < hourly.time.length; i++) {
        const hour = new Date(hourly.time[i]).getHours();
        if (hour >= nowHour) {
            startIdx = i;
            break;
        }
    }

    let displayed = 0;
    for (let i = startIdx; i < hourly.time.length && displayed < 24; i++) {
        const timeStr = hourly.time[i];
        const hourLabel = new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        let temp = hourly.temperature_2m[i];
        if (unit === "imperial") temp = (temp * 9 / 5) + 32;
        const weatherCode = hourly.weathercode[i];
        const precipProb = (hourly.precipitation_probability && hourly.precipitation_probability[i]) ? hourly.precipitation_probability[i] : 0;
        const icon = getMiniIcon(weatherCode);
        
        const card = document.createElement('div');
        card.className = 'hour-card';
        card.innerHTML = `
            <div style="font-weight:500;">${hourLabel}</div>
            <div style="font-size:1.8rem;">${icon}</div>
            <div class="temp-hour">${Math.round(temp)}°</div>
            <div style="font-size:11px; background:#00000040; border-radius:20px; padding:4px; margin-top:5px;">
                <i class="fas fa-tint"></i> ${precipProb}%
            </div>
        `;
        container.appendChild(card);
        displayed++;
    }

    if (displayed === 0) {
        container.innerHTML = '<div class="placeholder-text">Hourly forecast data unavailable</div>';
    }
}

function renderWeeklyForecast(daily, unit) {
    const container = document.getElementById('weeklyContainer');
    if (!container) return;
    container.innerHTML = '';

    if (!daily || !daily.time) {
        container.innerHTML = '<div class="placeholder-text">Weekly forecast data unavailable</div>';
        return;
    }

    for (let i = 0; i < Math.min(7, daily.time.length); i++) {
        const date = new Date(daily.time[i]);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        let maxTemp = daily.temperature_2m_max[i];
        let minTemp = daily.temperature_2m_min[i];
        if (unit === "imperial") {
            maxTemp = (maxTemp * 9 / 5) + 32;
            minTemp = (minTemp * 9 / 5) + 32;
        }
        const precipMax = daily.precipitation_probability_max ? daily.precipitation_probability_max[i] : 0;
        const icon = getMiniIcon(daily.weathercode[i]);
        
        const card = document.createElement('div');
        card.className = 'week-card';
        card.innerHTML = `
            <div><strong>${dayName}</strong></div>
            <div style="font-size:1.8rem;">${icon}</div>
            <div>${Math.round(maxTemp)}°/${Math.round(minTemp)}°</div>
            <div style="font-size:11px; margin-top:6px;">
                <i class="fas fa-cloud-rain"></i> ${precipMax}%
            </div>
        `;
        container.appendChild(card);
    }
}

// Unit toggle event listeners
unitBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        unitBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentUnit = btn.getAttribute('data-unit');
        if (currentWeatherData) {
            updateDisplayByUnit(currentUnit);
        }
    });
});

// Search event listeners
searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) fetchWeatherData(city);
});

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchBtn.click();
});

// Initialize app
loadRecentCities();
fetchWeatherData("London");