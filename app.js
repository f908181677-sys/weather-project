/* =========================================================
   我的天气 V21
   ========================================================= */


/* =========================================================
   1. API 配置
========================================================= */

const API = {
  weather:
    "https://api.open-meteo.com/v1/forecast",

  geocoding:
    "https://geocoding-api.open-meteo.com/v1/search",

  air:
    "https://air-quality-api.open-meteo.com/v1/air-quality",

  reverseGeocoding:
    "https://nominatim.openstreetmap.org/reverse"
};


/* =========================================================
   2. LocalStorage
========================================================= */

const STORAGE = {
  favorites: "weather-favorites-v21",
  theme: "weather-theme-v21",
  unit: "weather-unit-v21",
  lastLocation: "weather-last-location-v21"
};


/* =========================================================
   3. 全局状态
========================================================= */

const state = {
  lastLocation: null,

  favorites: [],

  weatherData: null,

  airData: null,

  hourlyData: null,

  selectedHourCount: 12,

  unit: "C",

  searchTimer: null,

  refreshTimer: null,

  toastTimer: null
};


/* =========================================================
   4. DOM 工具
========================================================= */

function $(id) {
  return document.getElementById(id);
}


/* =========================================================
   5. LocalStorage 工具
========================================================= */

function loadStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);

    if (!value) {
      return fallback;
    }

    return JSON.parse(value);
  } catch (error) {
    console.warn(
      `读取 LocalStorage 失败: ${key}`,
      error
    );

    return fallback;
  }
}


function saveStorage(key, value) {
  try {
    localStorage.setItem(
      key,
      JSON.stringify(value)
    );
  } catch (error) {
    console.warn(
      `保存 LocalStorage 失败: ${key}`,
      error
    );
  }
}


/* =========================================================
   6. UI 状态
========================================================= */

function setLoading(show, message = "正在获取天气...") {
  const overlay = $("loadingOverlay");

  const text = $("loadingText");

  if (!overlay) {
    return;
  }

  text.textContent = message;

  overlay.classList.toggle(
    "show",
    show
  );
}


function setStatus(message = "") {
  const element =
    $("statusMessage");

  if (element) {
    element.textContent = message;
  }
}


function showToast(message) {
  const toast = $("toast");

  if (!toast) {
    return;
  }

  clearTimeout(state.toastTimer);

  toast.textContent = message;

  toast.classList.add("show");

  state.toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}


function handleError(error, fallbackMessage) {
  console.error(error);

  const message =
    error?.message ||
    fallbackMessage ||
    "发生未知错误";

  setStatus(`⚠️ ${message}`);

  showToast(`⚠️ ${message}`);

  setLoading(false);
}


/* =========================================================
   7. 网络请求工具
========================================================= */

async function requestJSON(
  url,
  options = {}
) {
  const response =
    await fetch(url, {
      ...options,

      headers: {
        Accept: "application/json",
        ...(options.headers || {})
      }
    });

  if (!response.ok) {
    throw new Error(
      `网络请求失败：${response.status}`
    );
  }

  const data =
    await response.json();

  return data;
}


/* =========================================================
   8. 天气代码
========================================================= */

function getWeatherInfo(code) {

  const map = {

    0: {
      icon: "☀️",
      text: "晴天",
      type: "sunny"
    },

    1: {
      icon: "🌤️",
      text: "大部晴朗",
      type: "sunny"
    },

    2: {
      icon: "⛅",
      text: "局部多云",
      type: "cloudy"
    },

    3: {
      icon: "☁️",
      text: "阴天",
      type: "cloudy"
    },

    45: {
      icon: "🌫️",
      text: "雾",
      type: "cloudy"
    },

    48: {
      icon: "🌫️",
      text: "雾凇",
      type: "cloudy"
    },

    51: {
      icon: "🌦️",
      text: "小毛毛雨",
      type: "rainy"
    },

    53: {
      icon: "🌦️",
      text: "毛毛雨",
      type: "rainy"
    },

    55: {
      icon: "🌧️",
      text: "较强毛毛雨",
      type: "rainy"
    },

    61: {
      icon: "🌧️",
      text: "小雨",
      type: "rainy"
    },

    63: {
      icon: "🌧️",
      text: "中雨",
      type: "rainy"
    },

    65: {
      icon: "🌧️",
      text: "大雨",
      type: "rainy"
    },

    71: {
      icon: "🌨️",
      text: "小雪",
      type: "snowy"
    },

    73: {
      icon: "❄️",
      text: "中雪",
      type: "snowy"
    },

    75: {
      icon: "❄️",
      text: "大雪",
      type: "snowy"
    },

    80: {
      icon: "🌦️",
      text: "阵雨",
      type: "rainy"
    },

    81: {
      icon: "🌧️",
      text: "中阵雨",
      type: "rainy"
    },

    82: {
      icon: "⛈️",
      text: "强阵雨",
      type: "storm"
    },

    95: {
      icon: "⛈️",
      text: "雷雨",
      type: "storm"
    },

    96: {
      icon: "⛈️",
      text: "雷雨伴冰雹",
      type: "storm"
    },

    99: {
      icon: "⛈️",
      text: "强雷雨伴冰雹",
      type: "storm"
    }

  };

  return (
    map[code] || {
      icon: "🌤️",
      text: "未知天气",
      type: "cloudy"
    }
  );
}


/* =========================================================
   9. 风向
========================================================= */

function getWindDirection(degrees) {

  if (
    degrees === null ||
    degrees === undefined ||
    Number.isNaN(Number(degrees))
  ) {
    return "--";
  }

  const directions = [
    "北",
    "东北",
    "东",
    "东南",
    "南",
    "西南",
    "西",
    "西北"
  ];

  const index =
    Math.round(Number(degrees) / 45) % 8;

  return directions[index];
}


/* =========================================================
   10. 时间工具
========================================================= */

function formatTime(value) {

  if (!value) {
    return "--";
  }

  const date =
    new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return date.toLocaleTimeString(
    "zh-CN",
    {
      hour: "2-digit",
      minute: "2-digit"
    }
  );
}


function formatDate(value) {

  if (!value) {
    return "--";
  }

  const date =
    new Date(`${value}T00:00:00`);

  return date.toLocaleDateString(
    "zh-CN",
    {
      month: "long",
      day: "numeric"
    }
  );
}


function getDayName(
  dateString,
  index
) {

  if (index === 0) {
    return "今天";
  }

  if (index === 1) {
    return "明天";
  }

  const date =
    new Date(
      `${dateString}T00:00:00`
    );

  return date.toLocaleDateString(
    "zh-CN",
    {
      weekday: "short"
    }
  );
}


/* =========================================================
   11. 温度单位
========================================================= */

function convertTemperature(
  celsius
) {

  if (
    celsius === null ||
    celsius === undefined ||
    Number.isNaN(Number(celsius))
  ) {
    return "--";
  }

  if (state.unit === "F") {
    return (
      Number(celsius) * 9 / 5 + 32
    ).toFixed(1);
  }

  return Number(celsius).toFixed(1);
}


function temperatureText(
  celsius
) {

  const value =
    convertTemperature(celsius);

  if (value === "--") {
    return "--";
  }

  return `${value}°`;
}


/* =========================================================
   12. 地理位置名称
========================================================= */

function buildLocationName(
  address
) {

  if (!address) {
    return "未知位置";
  }

  const parts = [

    address.country,

    address.state ||
    address.province,

    address.city ||
    address.town ||
    address.municipality,

    address.city_district ||
    address.district ||
    address.county

  ];

  const result = [];

  for (const part of parts) {

    if (
      part &&
      !result.includes(part)
    ) {
      result.push(part);
    }
  }

  return (
    result.join(" · ") ||
    "未知位置"
  );
}


async function getLocationName(
  latitude,
  longitude
) {

  const params =
    new URLSearchParams({
      lat: latitude,
      lon: longitude,
      format: "json",
      zoom: "10",
      addressdetails: "1"
    });

  const data =
    await requestJSON(
      `${API.reverseGeocoding}?${params}`
    );

  return buildLocationName(
    data.address
  );
}


/* =========================================================
   13. 搜索结果名称
========================================================= */

function buildSearchLocationName(
  result
) {

  const parts = [

    result.country,

    result.admin1,

    result.admin2,

    result.name

  ];

  const output = [];

  for (const part of parts) {

    if (
      part &&
      !output.includes(part)
    ) {
      output.push(part);
    }
  }

  return output.join(" · ");
}


/* =========================================================
   14. 获取天气
========================================================= */

async function fetchWeather(
  latitude,
  longitude
) {

  const params =
    new URLSearchParams({

      latitude,
      longitude,

      current: [
        "temperature_2m",
        "relative_humidity_2m",
        "apparent_temperature",
        "weather_code",
        "wind_speed_10m",
        "wind_direction_10m",
        "visibility"
      ].join(","),

      hourly: [
        "temperature_2m",
        "relative_humidity_2m",
        "apparent_temperature",
        "precipitation_probability",
        "weather_code"
      ].join(","),

      daily: [
        "weather_code",
        "temperature_2m_max",
        "temperature_2m_min",
        "precipitation_probability_max",
        "sunrise",
        "sunset",
        "uv_index_max"
      ].join(","),

      forecast_days: "7",

      timezone: "auto"
    });

  return requestJSON(
    `${API.weather}?${params}`
  );
}


/* =========================================================
   15. 获取空气质量
========================================================= */

async function fetchAirQuality(
  latitude,
  longitude
) {

  const params =
    new URLSearchParams({

      latitude,
      longitude,

      current: [
        "european_aqi",
        "us_aqi",
        "pm10",
        "pm2_5",
        "ozone",
        "nitrogen_dioxide"
      ].join(","),

      timezone: "auto"
    });

  return requestJSON(
    `${API.air}?${params}`
  );
}


/* =========================================================
   16. 加载完整天气
========================================================= */

async function loadWeather(
  location
) {

  setLoading(
    true,
    "正在获取天气数据..."
  );

  setStatus(
    `正在加载 ${location.name} ...`
  );

  try {

    const [
      weather,
      air
    ] = await Promise.all([
      fetchWeather(
        location.latitude,
        location.longitude
      ),

      fetchAirQuality(
        location.latitude,
        location.longitude
      )
    ]);

    state.weatherData =
      weather;

    state.airData =
      air;

    state.hourlyData =
      weather.hourly;

    state.lastLocation =
      location;

    saveStorage(
      STORAGE.lastLocation,
      location
    );

    renderWeather();

    renderAirQuality();

    renderFavorites();

    updateWeatherBackground();

    setStatus(
      `已更新：${location.name}`
    );

  } catch (error) {

    handleError(
      error,
      "天气数据获取失败"
    );

  } finally {

    setLoading(false);
  }
}


/* =========================================================
   17. 当前天气
========================================================= */

function renderCurrentWeather() {

  const weather =
    state.weatherData;

  const current =
    weather?.current;

  if (!current) {
    return;
  }

  const info =
    getWeatherInfo(
      current.weather_code
    );

  $("locationName")
    .textContent =
    state.lastLocation?.name ||
    "未知位置";

  $("updatedTime")
    .textContent =
    `更新于 ${formatTime(current.time)}`;

  $("weatherIcon")
    .textContent =
    info.icon;

  $("temperature")
    .textContent =
    temperatureText(
      current.temperature_2m
    );

  $("weatherDescription")
    .textContent =
    info.text;

  $("apparentTemperature")
    .textContent =
    temperatureText(
      current.apparent_temperature
    );

  $("humidity")
    .textContent =
    `${current.relative_humidity_2m}%`;

  $("windSpeed")
    .textContent =
    `${current.wind_speed_10m} km/h`;

  $("windDirection")
    .textContent =
    `${getWindDirection(
      current.wind_direction_10m
    )} ${current.wind_direction_10m}°`;

  $("visibility")
    .textContent =
    current.visibility != null
      ? `${(
          current.visibility / 1000
        ).toFixed(1)} km`
      : "--";

  const daily =
    weather.daily;

  $("uvIndex")
    .textContent =
    daily?.uv_index_max?.[0] != null
      ? daily.uv_index_max[0]
      : "--";

  $("sunrise")
    .textContent =
    formatTime(
      daily?.sunrise?.[0]
    );

  $("sunset")
    .textContent =
    formatTime(
      daily?.sunset?.[0]
    );

  updateFavoriteButton();
}


/* =========================================================
   18. 未来小时
========================================================= */

function findCurrentHourIndex() {

  const hourly =
    state.hourlyData;

  if (!hourly?.time) {
    return 0;
  }

  const now =
    new Date();

  let closestIndex = 0;

  let closestDifference =
    Infinity;

  hourly.time.forEach(
    (time, index) => {

      const date =
        new Date(time);

      const difference =
        Math.abs(
          date.getTime() -
          now.getTime()
        );

      if (
        difference <
        closestDifference
      ) {

        closestDifference =
          difference;

        closestIndex =
          index;
      }
    }
  );

  return closestIndex;
}


function renderHourly() {

  const container =
    $("hourlyList");

  const hourly =
    state.hourlyData;

  if (
    !container ||
    !hourly
  ) {
    return;
  }

  const start =
    findCurrentHourIndex();

  const end =
    Math.min(
      start +
        state.selectedHourCount,
      hourly.time.length
    );

  container.innerHTML = "";

  for (
    let i = start;
    i < end;
    i++
  ) {

    const info =
      getWeatherInfo(
        hourly.weather_code[i]
      );

    const card =
      document.createElement(
        "div"
      );

    card.className =
      "hour-card";

    card.innerHTML = `
      <div class="hour-time">
        ${formatTime(hourly.time[i])}
      </div>

      <div class="hour-icon">
        ${info.icon}
      </div>

      <div class="hour-temp">
        ${temperatureText(
          hourly.temperature_2m[i]
        )}
      </div>

      <div class="hour-rain">
        💧 ${
          hourly.precipitation_probability?.[i] ??
          0
        }%
      </div>
    `;

    container.appendChild(card);
  }
}


/* =========================================================
   19. 温度图表
========================================================= */

function drawTemperatureChart() {

  const canvas =
    $("temperatureChart");

  const hourly =
    state.hourlyData;

  if (
    !canvas ||
    !hourly
  ) {
    return;
  }

  const wrapper =
    canvas.parentElement;

  const width =
    wrapper.clientWidth;

  const height =
    wrapper.clientHeight;

  const dpr =
    window.devicePixelRatio || 1;

  canvas.width =
    width * dpr;

  canvas.height =
    height * dpr;

  const ctx =
    canvas.getContext("2d");

  ctx.setTransform(
    dpr,
    0,
    0,
    dpr,
    0,
    0
  );

  ctx.clearRect(
    0,
    0,
    width,
    height
  );

  const start =
    findCurrentHourIndex();

  const count =
    Math.min(
      24,
      hourly.temperature_2m.length -
        start
    );

  if (count <= 1) {
    return;
  }

  const temperatures =
    hourly.temperature_2m.slice(
      start,
      start + count
    );

  const min =
    Math.min(...temperatures) - 2;

  const max =
    Math.max(...temperatures) + 2;

  const padding = {
    top: 25,
    right: 20,
    bottom: 35,
    left: 40
  };

  const chartWidth =
    width -
    padding.left -
    padding.right;

  const chartHeight =
    height -
    padding.top -
    padding.bottom;

  function x(index) {

    return (
      padding.left +
      (
        index /
        (count - 1)
      ) *
      chartWidth
    );
  }

  function y(value) {

    return (
      padding.top +
      (
        1 -
        (value - min) /
        (max - min)
      ) *
      chartHeight
    );
  }

  /* 网格 */

  ctx.strokeStyle =
    "rgba(100,100,100,0.15)";

  ctx.lineWidth = 1;

  for (
    let i = 0;
    i <= 4;
    i++
  ) {

    const value =
      min +
      (
        (max - min) *
        i /
        4
      );

    const yy =
      y(value);

    ctx.beginPath();

    ctx.moveTo(
      padding.left,
      yy
    );

    ctx.lineTo(
      width - padding.right,
      yy
    );

    ctx.stroke();

    ctx.fillStyle =
      "rgba(80,80,80,0.65)";

    ctx.font =
      "12px sans-serif";

    ctx.fillText(
      `${Math.round(value)}°`,
      5,
      yy + 4
    );
  }


  /* 折线 */

  ctx.beginPath();

  temperatures.forEach(
    (temperature, index) => {

      const xx =
        x(index);

      const yy =
        y(temperature);

      if (index === 0) {
        ctx.moveTo(
          xx,
          yy
        );
      } else {
        ctx.lineTo(
          xx,
          yy
        );
      }
    }
  );

  ctx.strokeStyle =
    "#4f6eff";

  ctx.lineWidth = 3;

  ctx.stroke();


  /* 数据点 */

  temperatures.forEach(
    (temperature, index) => {

      const xx =
        x(index);

      const yy =
        y(temperature);

      ctx.beginPath();

      ctx.arc(
        xx,
        yy,
        4,
        0,
        Math.PI * 2
      );

      ctx.fillStyle =
        "#ffffff";

      ctx.fill();

      ctx.strokeStyle =
        "#4f6eff";

      ctx.lineWidth = 2;

      ctx.stroke();
    }
  );
}


/* =========================================================
   20. 7天预报
========================================================= */

function renderForecast() {

  const container =
    $("forecastList");

  const daily =
    state.weatherData?.daily;

  if (
    !container ||
    !daily
  ) {
    return;
  }

  container.innerHTML = "";

  daily.time.forEach(
    (date, index) => {

      const info =
        getWeatherInfo(
          daily.weather_code[index]
        );

      const card =
        document.createElement(
          "div"
        );

      card.className =
        "forecast-card";

      card.innerHTML = `
        <div class="forecast-day">
          ${getDayName(
            date,
            index
          )}
        </div>

        <div class="forecast-icon">
          ${info.icon}
        </div>

        <div class="forecast-temp">
          ${temperatureText(
            daily.temperature_2m_max[index]
          )}
          /
          ${temperatureText(
            daily.temperature_2m_min[index]
          )}
        </div>

        <div class="forecast-rain">
          💧 ${
            daily
              .precipitation_probability_max[index] ??
            0
          }%
        </div>
      `;

      container.appendChild(card);
    }
  );
}


/* =========================================================
   21. 空气质量
========================================================= */

function getAQILevel(aqi) {

  if (
    aqi === null ||
    aqi === undefined ||
    Number.isNaN(Number(aqi))
  ) {
    return "--";
  }

  const value =
    Number(aqi);

  if (value <= 50) {
    return "优";
  }

  if (value <= 100) {
    return "良";
  }

  if (value <= 150) {
    return "轻度污染";
  }

  if (value <= 200) {
    return "中度污染";
  }

  if (value <= 300) {
    return "重度污染";
  }

  return "严重污染";
}


function formatAirValue(value) {

  if (
    value === null ||
    value === undefined ||
    Number.isNaN(Number(value))
  ) {
    return "--";
  }

  return Number(value).toFixed(1);
}


function renderAirQuality() {

  const current =
    state.airData?.current;

  if (!current) {
    return;
  }

  const aqi =
    current.us_aqi ??
    current.european_aqi;

  $("aqi")
    .textContent =
    aqi ?? "--";

  $("aqiLevel")
    .textContent =
    getAQILevel(aqi);

  $("pm25")
    .textContent =
    formatAirValue(
      current.pm2_5
    );

  $("pm10")
    .textContent =
    formatAirValue(
      current.pm10
    );

  $("ozone")
    .textContent =
    formatAirValue(
      current.ozone
    );

  $("nitrogenDioxide")
    .textContent =
    formatAirValue(
      current.nitrogen_dioxide
    );
}


/* =========================================================
   22. 天气背景
========================================================= */

function updateWeatherBackground() {

  const code =
    state.weatherData
      ?.current
      ?.weather_code;

  if (code === undefined) {
    return;
  }

  const info =
    getWeatherInfo(code);

  document.body.classList.remove(
    "weather-sunny",
    "weather-cloudy",
    "weather-rainy",
    "weather-snowy",
    "weather-storm"
  );

  document.body.classList.add(
    `weather-${info.type}`
  );
}


/* =========================================================
   23. 收藏城市
========================================================= */

function loadFavorites() {

  const favorites =
    loadStorage(
      STORAGE.favorites,
      []
    );

  state.favorites =
    Array.isArray(favorites)
      ? favorites
      : [];
}


function saveFavorites() {

  saveStorage(
    STORAGE.favorites,
    state.favorites
  );
}


function isFavorite(location) {

  return state.favorites.some(
    item =>
      Math.abs(
        Number(item.latitude) -
        Number(location.latitude)
      ) < 0.0001 &&
      Math.abs(
        Number(item.longitude) -
        Number(location.longitude)
      ) < 0.0001
  );
}


function addFavorite() {

  if (!state.lastLocation) {
    showToast("请先选择城市");
    return;
  }

  if (
    isFavorite(
      state.lastLocation
    )
  ) {

    showToast("这个城市已经收藏了");

    return;
  }

  if (
    state.favorites.length >= 8
  ) {

    showToast(
      "最多收藏 8 个城市"
    );

    return;
  }

  const location = {
    name:
      state.lastLocation.name,

    latitude:
      Number(
        state.lastLocation.latitude
      ),

    longitude:
      Number(
        state.lastLocation.longitude
      )
  };

  state.favorites.push(
    location
  );

  saveFavorites();

  renderFavorites();

  updateFavoriteButton();

  showToast("⭐ 收藏成功");
}


function removeFavorite(
  latitude,
  longitude
) {

  state.favorites =
    state.favorites.filter(
      item =>
        !(
          Math.abs(
            Number(item.latitude) -
            Number(latitude)
          ) < 0.0001 &&
          Math.abs(
            Number(item.longitude) -
            Number(longitude)
          ) < 0.0001
        )
    );

  saveFavorites();

  renderFavorites();

  updateFavoriteButton();

  showToast("已取消收藏");
}


async function openFavorite(
  favorite
) {

  await loadWeather({
    name: favorite.name,

    latitude:
      Number(
        favorite.latitude
      ),

    longitude:
      Number(
        favorite.longitude
      )
  });
}


function renderFavorites() {

  const container =
    $("favoritesList");

  if (!container) {
    return;
  }

  $("favoriteCount")
    .textContent =
    `${state.favorites.length} / 8`;

  container.innerHTML = "";

  if (
    state.favorites.length === 0
  ) {

    container.innerHTML = `
      <div class="favorite-card">
        <div class="favorite-name">
          还没有收藏城市
        </div>

        <div class="favorite-desc">
          搜索城市后点击「☆ 收藏城市」
        </div>
      </div>
    `;

    return;
  }


  state.favorites.forEach(
    favorite => {

      const card =
        document.createElement(
          "div"
        );

      card.className =
        "favorite-card";

      if (
        state.lastLocation &&
        Math.abs(
          Number(
            state.lastLocation.latitude
          ) -
          Number(
            favorite.latitude
          )
        ) < 0.0001 &&
        Math.abs(
          Number(
            state.lastLocation.longitude
          ) -
          Number(
            favorite.longitude
          )
        ) < 0.0001
      ) {

        card.classList.add(
          "active"
        );
      }

      const weather =
        getFavoriteWeather(
          favorite
        );

      card.innerHTML = `
        <div class="favorite-top">

          <div class="favorite-name">
            ${escapeHtml(
              favorite.name
            )}
          </div>

          <button
            class="favorite-remove"
            title="取消收藏"
          >
            ×
          </button>

        </div>

        <div class="favorite-weather">

          <div class="favorite-icon">
            ${weather.icon}
          </div>

          <div>

            <div class="favorite-temp">
              ${weather.temperature}
            </div>

            <div class="favorite-desc">
              ${weather.description}
            </div>

          </div>

        </div>

        <div class="favorite-meta">

          <span>
            💧 ${weather.humidity}
          </span>

          <span>
            💨 ${weather.wind}
          </span>

        </div>
      `;


      card.addEventListener(
        "click",
        () => {
          openFavorite(
            favorite
          );
        }
      );


      const removeButton =
        card.querySelector(
          ".favorite-remove"
        );

      removeButton.addEventListener(
        "click",
        event => {

          event.stopPropagation();

          removeFavorite(
            favorite.latitude,
            favorite.longitude
          );
        }
      );

      container.appendChild(card);
    }
  );
}


function getFavoriteWeather(
  favorite
) {

  const current =
    state.weatherData?.current;

  const currentLocation =
    state.lastLocation;

  if (
    current &&
    currentLocation &&
    Math.abs(
      Number(
        currentLocation.latitude
      ) -
      Number(
        favorite.latitude
      )
    ) < 0.0001 &&
    Math.abs(
      Number(
        currentLocation.longitude
      ) -
      Number(
        favorite.longitude
      )
    ) < 0.0001
  ) {

    const info =
      getWeatherInfo(
        current.weather_code
      );

    return {
      icon:
        info.icon,

      temperature:
        temperatureText(
          current.temperature_2m
        ),

      description:
        info.text,

      humidity:
        `${current.relative_humidity_2m}%`,

      wind:
        `${current.wind_speed_10m} km/h`
    };
  }

  return {
    icon: "🌤️",
    temperature: "--",
    description: "点击查看天气",
    humidity: "--",
    wind: "--"
  };
}


/* =========================================================
   24. 收藏按钮
========================================================= */

function updateFavoriteButton() {

  const button =
    $("favoriteBtn");

  if (!button) {
    return;
  }

  if (
    state.lastLocation &&
    isFavorite(
      state.lastLocation
    )
  ) {

    button.textContent =
      "★ 已收藏";

  } else {

    button.textContent =
      "☆ 收藏城市";
  }
}


/* =========================================================
   25. HTML 安全处理
========================================================= */

function escapeHtml(value) {

  return String(value)
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );
}


/* =========================================================
   26. 城市搜索
========================================================= */

async function searchCities(
  keyword
) {

  const params =
    new URLSearchParams({

      name: keyword,

      count: "8",

      language: "zh",

      format: "json"

    });

  const data =
    await requestJSON(
      `${API.geocoding}?${params}`
    );

  return data.results || [];
}


function renderSearchSuggestions(
  results
) {

  const container =
    $("searchSuggestions");

  if (!container) {
    return;
  }

  container.innerHTML = "";

  if (
    results.length === 0
  ) {

    container.innerHTML = `
      <div class="suggestion-item">
        没有找到相关城市
      </div>
    `;

    container.classList.add(
      "show"
    );

    return;
  }


  results.forEach(
    result => {

      const item =
        document.createElement(
          "div"
        );

      item.className =
        "suggestion-item";

      item.innerHTML = `
        <div class="suggestion-name">
          ${escapeHtml(
            result.name
          )}
        </div>

        <div class="suggestion-detail">
          ${escapeHtml(
            buildSearchLocationName(
              result
            )
          )}
        </div>
      `;

      item.addEventListener(
        "click",
        () => {

          selectSearchResult(
            result
          );
        }
      );

      container.appendChild(item);
    }
  );

  container.classList.add(
    "show"
  );
}


async function selectSearchResult(
  result
) {

  const location = {

    name:
      buildSearchLocationName(
        result
      ),

    latitude:
      Number(
        result.latitude
      ),

    longitude:
      Number(
        result.longitude
      )
  };

  $("cityInput").value =
    result.name;

  closeSuggestions();

  await loadWeather(
    location
  );
}


async function searchCity() {

  const input =
    $("cityInput");

  const keyword =
    input.value.trim();

  if (!keyword) {

    showToast(
      "请输入城市名称"
    );

    return;
  }

  try {

    setLoading(
      true,
      "正在搜索城市..."
    );

    const results =
      await searchCities(
        keyword
      );

    if (
      results.length === 0
    ) {

      showToast(
        "没有找到这个城市"
      );

      return;
    }

    await selectSearchResult(
      results[0]
    );

  } catch (error) {

    handleError(
      error,
      "城市搜索失败"
    );

  } finally {

    setLoading(false);
  }
}


function closeSuggestions() {

  $("searchSuggestions")
    ?.classList
    .remove("show");
}


/* =========================================================
   27. 实时搜索
========================================================= */

function setupLiveSearch() {

  const input =
    $("cityInput");

  if (!input) {
    return;
  }

  input.addEventListener(
    "input",
    () => {

      clearTimeout(
        state.searchTimer
      );

      const keyword =
        input.value.trim();

      if (keyword.length < 2) {

        closeSuggestions();

        return;
      }

      state.searchTimer =
        setTimeout(
          async () => {

            try {

              const results =
                await searchCities(
                  keyword
                );

              renderSearchSuggestions(
                results
              );

            } catch (error) {

              console.warn(
                "实时搜索失败",
                error
              );
            }

          },
          450
        );
    }
  );


  input.addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Enter"
      ) {

        searchCity();
      }

      if (
        event.key === "Escape"
      ) {

        closeSuggestions();
      }
    }
  );
}


/* =========================================================
   28. 获取我的位置
========================================================= */

function getMyLocation() {

  if (
    !navigator.geolocation
  ) {

    showToast(
      "当前浏览器不支持定位"
    );

    return;
  }

  setLoading(
    true,
    "正在获取你的位置..."
  );

  setStatus(
    "请在浏览器弹窗中允许位置权限"
  );

  navigator.geolocation.getCurrentPosition(

    async position => {

      try {

        const {
          latitude,
          longitude
        } = position.coords;

        const locationName =
          await getLocationName(
            latitude,
            longitude
          );

        await loadWeather({
          name:
            locationName,

          latitude,

          longitude
        });

      } catch (error) {

        handleError(
          error,
          "无法获取位置天气"
        );

      } finally {

        setLoading(false);
      }

    },

    error => {

      setLoading(false);

      let message =
        "定位失败";

      if (
        error.code ===
        error.PERMISSION_DENIED
      ) {

        message =
          "你拒绝了浏览器的位置权限";

      } else if (
        error.code ===
        error.POSITION_UNAVAILABLE
      ) {

        message =
          "暂时无法获取当前位置";

      } else if (
        error.code ===
        error.TIMEOUT
      ) {

        message =
          "定位请求超时";
      }

      handleError(
        new Error(message),
        message
      );
    },

    {
      enableHighAccuracy: true,

      timeout: 10000,

      maximumAge: 300000
    }
  );
}


/* =========================================================
   29. 刷新
========================================================= */

async function refreshWeather() {

  if (!state.lastLocation) {

    showToast(
      "还没有选择城市"
    );

    return;
  }

  await loadWeather(
    state.lastLocation
  );
}


/* =========================================================
   30. 主题
========================================================= */

function loadTheme() {

  const theme =
    localStorage.getItem(
      STORAGE.theme
    );

  if (theme === "dark") {

    document.body.classList.add(
      "dark"
    );

  } else {

    document.body.classList.remove(
      "dark"
    );
  }

  updateThemeButton();
}


function toggleTheme() {

  document.body.classList.toggle(
    "dark"
  );

  const isDark =
    document.body.classList.contains(
      "dark"
    );

  localStorage.setItem(
    STORAGE.theme,
    isDark
      ? "dark"
      : "light"
  );

  updateThemeButton();
}


function updateThemeButton() {

  const button =
    $("themeToggle");

  if (!button) {
    return;
  }

  const isDark =
    document.body.classList.contains(
      "dark"
    );

  button.textContent =
    isDark
      ? "☀️"
      : "🌙";
}


/* =========================================================
   31. 温度单位
========================================================= */

function loadUnit() {

  const unit =
    localStorage.getItem(
      STORAGE.unit
    );

  if (
    unit === "F" ||
    unit === "C"
  ) {

    state.unit =
      unit;
  }

  updateUnitButton();
}


function toggleUnit() {

  state.unit =
    state.unit === "C"
      ? "F"
      : "C";

  localStorage.setItem(
    STORAGE.unit,
    state.unit
  );

  updateUnitButton();

  renderWeather();
}


function updateUnitButton() {

  const button =
    $("unitToggle");

  if (!button) {
    return;
  }

  button.textContent =
    `°${state.unit}`;
}


/* =========================================================
   32. 完整渲染
========================================================= */

function renderWeather() {

  if (!state.weatherData) {
    return;
  }

  renderCurrentWeather();

  renderHourly();

  renderForecast();

  drawTemperatureChart();

  renderFavorites();
}


/* =========================================================
   33. 小时切换
========================================================= */

function setHourCount(
  count
) {

  state.selectedHourCount =
    count;

  $("hour12Btn")
    ?.classList.toggle(
      "active",
      count === 12
    );

  $("hour24Btn")
    ?.classList.toggle(
      "active",
      count === 24
    );

  renderHourly();
}


/* =========================================================
   34. 点击事件
========================================================= */

function setupEvents() {

  $("searchBtn")
    ?.addEventListener(
      "click",
      searchCity
    );

  $("locationBtn")
    ?.addEventListener(
      "click",
      getMyLocation
    );

  $("favoriteBtn")
    ?.addEventListener(
      "click",
      () => {

        if (
          state.lastLocation &&
          isFavorite(
            state.lastLocation
          )
        ) {

          removeFavorite(
            state.lastLocation.latitude,
            state.lastLocation.longitude
          );

        } else {

          addFavorite();
        }
      }
    );

  $("refreshBtn")
    ?.addEventListener(
      "click",
      refreshWeather
    );

  $("themeToggle")
    ?.addEventListener(
      "click",
      toggleTheme
    );

  $("unitToggle")
    ?.addEventListener(
      "click",
      toggleUnit
    );

  $("hour12Btn")
    ?.addEventListener(
      "click",
      () => {
        setHourCount(12);
      }
    );

  $("hour24Btn")
    ?.addEventListener(
      "click",
      () => {
        setHourCount(24);
      }
    );


  document.addEventListener(
    "click",
    event => {

      const searchBox =
        document.querySelector(
          ".search-box"
        );

      if (
        searchBox &&
        !searchBox.contains(
          event.target
        )
      ) {

        closeSuggestions();
      }
    }
  );


  window.addEventListener(
    "resize",
    () => {

      if (
        state.weatherData
      ) {

        drawTemperatureChart();
      }
    }
  );
}


/* =========================================================
   35. 恢复上次城市
========================================================= */

async function restoreLastLocation() {

  const location =
    loadStorage(
      STORAGE.lastLocation,
      null
    );

  if (
    !location ||
    location.latitude === undefined ||
    location.longitude === undefined
  ) {

    return;
  }

  await loadWeather({
    name:
      location.name ||
      "上次位置",

    latitude:
      Number(
        location.latitude
      ),

    longitude:
      Number(
        location.longitude
      )
  });
}


/* =========================================================
   36. 自动刷新
========================================================= */

function startAutoRefresh() {

  clearInterval(
    state.refreshTimer
  );

  state.refreshTimer =
    setInterval(
      () => {

        if (
          state.lastLocation
        ) {

          refreshWeather();
        }

      },
      30 * 60 * 1000
    );
}


/* =========================================================
   37. 初始化
========================================================= */

async function init() {

  loadTheme();

  loadUnit();

  loadFavorites();

  renderFavorites();

  setupEvents();

  setupLiveSearch();

  startAutoRefresh();

  try {

    await restoreLastLocation();

  } catch (error) {

    console.warn(
      "恢复上次城市失败",
      error
    );

    setStatus(
      "请输入城市或点击定位开始使用"
    );
  }
}


/* =========================================================
   38. 启动
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  init
);