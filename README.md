# 🌤️ Weather Dashboard

A clean, responsive weather web app that delivers real-time conditions, hourly forecasts, and 7-day outlooks for any city in the world — with no API key required.

---

## ✨ Features

- **Current Weather** — Temperature, humidity, wind speed, feels-like, and precipitation probability
- **Hourly Forecast** — Scrollable 24-hour breakdown with icons and rain chance
- **7-Day Forecast** — Daily high/low temps, weather icons, and max precipitation
- **Sunrise & Sunset** — Displayed for the searched city's local timezone
- **Dynamic Theming** — Background gradient changes automatically based on weather conditions (clear, cloudy, rain, thunder, snow)
- **°C / °F Toggle** — Switch between metric and imperial units instantly
- **Recent Cities** — Last 5 searched cities saved to `localStorage` for quick re-access, with individual ✕ buttons to remove any entry
- **Fully Responsive** — Optimized for desktop, tablet, and mobile screens

---

## 🚀 Getting Started

No build tools or dependencies needed. Just open it in a browser.

### Option 1 — Open directly

Download or clone the project, then open `index.html` in any modern browser:

```
weather-dashboard/
├── index.html
├── style.css
└── script.js
```

### Option 2 — Serve locally (recommended)

Using Python:
```bash
python -m http.server 8080
```

Using Node.js (`serve` package):
```bash
npx serve .
```

Then visit `http://localhost:8080` in your browser.

---

## 🌐 APIs Used

This project is completely free to use — no API keys required.

| API | Purpose |
|-----|---------|
| [Open-Meteo Forecast API](https://open-meteo.com/) | Weather data (current, hourly, daily) |
| [Open-Meteo Geocoding API](https://open-meteo.com/en/docs/geocoding-api) | City name → latitude/longitude |

Both APIs are free and open-source with no authentication needed.

---

## 🛠️ Tech Stack

- **HTML5** — Semantic structure
- **CSS3** — Custom glassmorphism UI with CSS variables and media queries
- **Vanilla JavaScript (ES6+)** — Async/await fetch calls, DOM manipulation, localStorage
- **[Font Awesome 6](https://fontawesome.com/)** — Weather and UI icons
- **[Google Fonts — Inter](https://fonts.google.com/specimen/Inter)** — Typography

---

## 🗂️ File Overview

| File | Description |
|------|-------------|
| `index.html` | App structure and layout |
| `style.css` | All styling including themes, responsive breakpoints, and animations |
| `script.js` | Weather fetching, data parsing, unit conversion, and UI rendering |

---

## 📝 Notes

- The app defaults to **London** on load as a demo city.
- Recent cities persist in `localStorage` across sessions. Each chip has an **✕ button** to remove it individually.
- Weather condition codes follow the [WMO Weather Interpretation Codes](https://open-meteo.com/en/docs#weathervariables) standard used by Open-Meteo.

---

## 📄 License

This project is open source and free to use under the [MIT License](LICENSE).
