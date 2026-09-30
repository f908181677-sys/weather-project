// =========================================================
// 我的天气 V26
// js/app.js
// 应用主程序
// =========================================================

import {
  fetchWeather,
  fetchAirQuality,
  searchCities
} from "./api.js";

import {
  getWeatherInfo,
  getWindDirection,
  formatTime,
  formatDate,
  getDayName,
  temperatureText,
  getAQILevel,
  formatAirValue
} from "./weather.js";

import {
  loadFavorites,
  saveFavorites,
  isFavorite,
  addFavorite,
  removeFavorite,
  getFavoriteCount
} from "./favorites.js";

import {
  saveLastLocation,
  loadLastLocation
} from "./storage.js";

import {
  getLocationName,
  buildSearchLocationName,
  requestBrowserLocation
} from "./location.js";

import {
  drawTemperatureChart
} from "./chart.js";

import {
  $,
  setLoading,
  setStatus,
  showToast,
  showError,
  escapeHtml,
  loadTheme,
  toggleTheme,
  loadUnit,
  saveUnit,
  updateUnitButton,
  closeSuggestions,
  renderSearchSuggestions,
  updateClearSearchButton,
  updateFavoriteCount,
  setButtonLoading,
  updateNetworkStatus,
  cleanupUI
} from "./ui.js";


// =========================================================
// 应用状态
// =========================================================

const state = {

  weatherData: null,

  airData: null,

  currentLocation: null,

  favorites: [],

  unit: "celsius",

  hourlyCount: 24,

  searchTimer: null,

  refreshTimer: null,

  requestLoading: false,

  locationLoading: false,

  searchLoading: false,

  destroyed: false
};


// =========================================================
// DOM
// =========================================================

const elements = {

  searchInput:
    $("#searchInput"),

  searchButton:
    $("#searchButton"),

  clearSearch:
    $("#clearSearch"),

  searchSuggestions:
    $("#searchSuggestions"),

  locationButton:
    $("#locationButton"),

  themeToggle:
    $("#themeToggle"),

  unitToggle:
    $("#unitToggle"),

  refreshButton:
    $("#refreshButton"),

  favoriteButton:
    $("#favoriteButton"),

  hour12Button:
    $("#hour12Button"),

  hour24Button:
    $("#hour24Button"),

  favoritesList:
    $("#favoritesList"),

  favoriteCount:
    $("#favoriteCount"),

  locationName:
    $("#locationName"),

  updatedTime:
    $("#updatedTime"),

  weatherIcon:
    $("#weatherIcon"),

  currentTemperature:
    $("#currentTemperature"),

  weatherDescription:
    $("#weatherDescription"),

  feelsLike:
    $("#feelsLike"),

  currentHumidity:
    $("#currentHumidity"),

  currentWindSpeed:
    $("#currentWindSpeed"),

  currentWindDirection:
    $("#currentWindDirection"),

  detailFeelsLike:
    $("#detailFeelsLike"),

  detailHumidity:
    $("#detailHumidity"),

  detailWindSpeed:
    $("#detailWindSpeed"),

  detailWindDirection:
    $("#detailWindDirection"),

  detailVisibility:
    $("#detailVisibility"),

  detailUV:
    $("#detailUV"),

  detailSunrise:
    $("#detailSunrise"),

  detailSunset:
    $("#detailSunset"),

  hourlyList:
    $("#hourlyList"),

  temperatureChart:
    $("#temperatureChart"),

  forecastList:
    $("#forecastList"),

  aqiValue:
    $("#aqiValue"),

  aqiLevel:
    $("#aqiLevel"),

  pm25:
    $("#pm25"),

  pm10:
    $("#pm10"),

  ozone:
    $("#ozone"),

  nitrogenDioxide:
    $("#nitrogenDioxide")
};


// =========================================================
// 设置天气背景
// =========================================================

function updateWeatherBackground(
  weatherType
) {

  document.body.classList.remove(
    "weather-sunny",
    "weather-cloudy",
    "weather-rainy",
    "weather-snowy",
    "weather-storm"
  );

  const classMap = {

    sunny:
      "weather-sunny",

    cloudy:
      "weather-cloudy",

    rainy:
      "weather-rainy",

    snowy:
      "weather-snowy",

    storm:
      "weather-storm"
  };

  const className =
    classMap[weatherType];

  if (className) {

    document.body.classList.add(
      className
    );
  }
}


// =========================================================
// 加载天气
// =========================================================

async function loadWeather(
  latitude,
  longitude,
  locationName,
  extra = {}
) {

  if (
    state.requestLoading
  ) {
    return;
  }

  const lat =
    Number(latitude);

  const lon =
    Number(longitude);

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lon)
  ) {

    showToast(
      "位置坐标无效"
    );

    return;
  }

  state.requestLoading =
    true;

  setLoading(
    true,
    "正在获取天气数据..."
  );

  setStatus(
    "正在更新天气..."
  );

  setButtonLoading(
    elements.refreshButton,
    true,
    "更新中..."
  );

  try {

    const [
      weatherData,
      airData
    ] = await Promise.all([

      fetchWeather(
        lat,
        lon
      ),

      fetchAirQuality(
        lat,
        lon
      )
    ]);

    state.weatherData =
      weatherData;

    state.airData =
      airData;

    state.currentLocation = {

      id:
        extra.id ||
        createLocationId(
          lat,
          lon
        ),

      name:
        extra.name ||
        locationName ||
        "当前位置",

      locationName:
        locationName ||
        extra.locationName ||
        "当前位置",

      latitude:
        lat,

      longitude:
        lon,

      country:
        extra.country ||
        "",

      state:
        extra.state ||
        "",

      city:
        extra.city ||
        "",

      district:
        extra.district ||
        ""
    };

    saveLastLocation(
      state.currentLocation
    );

    renderAll();

    setStatus(
      `已更新：${state.currentLocation.locationName}`
    );

  } catch (error) {

    showError(
      error,
      "天气数据获取失败，请稍后再试"
    );

  } finally {

    state.requestLoading =
      false;

    setLoading(
      false
    );

    setButtonLoading(
      elements.refreshButton,
      false
    );
  }
}


// =========================================================
// 当前天气
// =========================================================

function renderCurrentWeather() {

  const weather =
    state.weatherData;

  const location =
    state.currentLocation;

  if (
    !weather ||
    !weather.current
  ) {
    return;
  }

  const current =
    weather.current;

  const info =
    getWeatherInfo(
      current.weather_code
    );

  updateWeatherBackground(
    info.type
  );

  if (
    elements.locationName
  ) {

    elements.locationName.textContent =
      location?.locationName ||
      "当前位置";
  }

  if (
    elements.updatedTime
  ) {

    elements.updatedTime.textContent =
      `更新于 ${formatDate(
        current.time
      )} ${formatTime(
        current.time
      )}`;
  }

  if (
    elements.weatherIcon
  ) {

    elements.weatherIcon.textContent =
      info.icon;
  }

  if (
    elements.currentTemperature
  ) {

    elements.currentTemperature.textContent =
      temperatureText(
        current.temperature_2m,
        state.unit
      );
  }

  if (
    elements.weatherDescription
  ) {

    elements.weatherDescription.textContent =
      info.description;
  }

  if (
    elements.feelsLike
  ) {

    elements.feelsLike.textContent =
      temperatureText(
        current.apparent_temperature,
        state.unit
      );
  }

  if (
    elements.currentHumidity
  ) {

    elements.currentHumidity.textContent =
      `${Math.round(
        current.relative_humidity_2m ?? 0
      )}%`;
  }

  if (
    elements.currentWindSpeed
  ) {

    elements.currentWindSpeed.textContent =
      `${Math.round(
        current.wind_speed_10m ?? 0
      )} km/h`;
  }

  if (
    elements.currentWindDirection
  ) {

    elements.currentWindDirection.textContent =
      getWindDirection(
        current.wind_direction_10m
      );
  }

  renderDetails();

  renderFavoriteButton();
}


// =========================================================
// 天气详细信息
// =========================================================

function renderDetails() {

  const weather =
    state.weatherData;

  if (
    !weather ||
    !weather.current
  ) {
    return;
  }

  const current =
    weather.current;

  const daily =
    weather.daily;

  if (
    elements.detailFeelsLike
  ) {

    elements.detailFeelsLike.textContent =
      temperatureText(
        current.apparent_temperature,
        state.unit
      );
  }

  if (
    elements.detailHumidity
  ) {

    elements.detailHumidity.textContent =
      `${Math.round(
        current.relative_humidity_2m ?? 0
      )}%`;
  }

  if (
    elements.detailWindSpeed
  ) {

    elements.detailWindSpeed.textContent =
      `${Math.round(
        current.wind_speed_10m ?? 0
      )} km/h`;
  }

  if (
    elements.detailWindDirection
  ) {

    elements.detailWindDirection.textContent =
      getWindDirection(
        current.wind_direction_10m
      );
  }

  if (
    elements.detailVisibility
  ) {

    const visibility =
      Number(
        current.visibility
      );

    if (
      Number.isFinite(
        visibility
      )
    ) {

      elements.detailVisibility.textContent =
        visibility >= 1000
          ? `${(
              visibility / 1000
            ).toFixed(1)} km`
          : `${Math.round(
              visibility
            )} m`;

    } else {

      elements.detailVisibility.textContent =
        "--";
    }
  }

  if (
    elements.detailUV
  ) {

    const uv =
      daily?.uv_index_max?.[0];

    elements.detailUV.textContent =
      Number.isFinite(
        Number(uv)
      )
        ? Number(uv).toFixed(1)
        : "--";
  }

  if (
    elements.detailSunrise
  ) {

    elements.detailSunrise.textContent =
      formatTime(
        daily?.sunrise?.[0]
      );
  }

  if (
    elements.detailSunset
  ) {

    elements.detailSunset.textContent =
      formatTime(
        daily?.sunset?.[0]
      );
  }
}


// =========================================================
// 24 小时天气
// =========================================================

function renderHourly() {

  const hourly =
    state.weatherData?.hourly;

  if (
    !hourly ||
    !elements.hourlyList
  ) {
    return;
  }

  const count =
    Math.min(
      state.hourlyCount,
      hourly.time.length
    );

  const items = [];

  for (
    let index = 0;
    index < count;
    index++
  ) {

    const time =
      hourly.time[index];

    const temperature =
      hourly.temperature_2m[index];

    const precipitation =
      hourly.precipitation_probability?.[index];

    const weatherCode =
      hourly.weather_code?.[index];

    const info =
      getWeatherInfo(
        weatherCode
      );

    items.push(`
      <div class="hourly-item">

        <div class="hourly-time">
          ${escapeHtml(
            formatTime(time)
          )}
        </div>

        <div class="hourly-icon">
          ${info.icon}
        </div>

        <div class="hourly-temperature">
          ${escapeHtml(
            temperatureText(
              temperature,
              state.unit
            )
          )}
        </div>

        <div class="hourly-rain">
          💧 ${
            Number.isFinite(
              Number(
                precipitation
              )
            )
              ? `${Math.round(
                  precipitation
                )}%`
              : "--"
          }
        </div>

      </div>
    `);
  }

  elements.hourlyList.innerHTML =
    items.join("");
}


// =========================================================
// 温度曲线
// =========================================================

function renderChart() {

  if (
    !elements.temperatureChart
  ) {
    return;
  }

  const hourly =
    state.weatherData?.hourly;

  if (!hourly) {
    return;
  }

  drawTemperatureChart(
    elements.temperatureChart,
    hourly,
    state.unit,
    state.hourlyCount
  );
}


// =========================================================
// 7 天预报
// =========================================================

function renderForecast() {

  const daily =
    state.weatherData?.daily;

  if (
    !daily ||
    !elements.forecastList
  ) {
    return;
  }

  const count =
    Math.min(
      daily.time.length,
      7
    );

  const items = [];

  for (
    let index = 0;
    index < count;
    index++
  ) {

    const date =
      daily.time[index];

    const code =
      daily.weather_code[index];

    const info =
      getWeatherInfo(
        code
      );

    const max =
      daily.temperature_2m_max?.[index];

    const min =
      daily.temperature_2m_min?.[index];

    const rain =
      daily.precipitation_probability_max?.[index];

    items.push(`
      <div class="forecast-item">

        <div class="forecast-day">
          ${escapeHtml(
            getDayName(
              date,
              index
            )
          )}
        </div>

        <div class="forecast-date">
          ${escapeHtml(
            date
          )}
        </div>

        <div class="forecast-icon">
          ${info.icon}
        </div>

        <div class="forecast-description">
          ${escapeHtml(
            info.description
          )}
        </div>

        <div class="forecast-temperature">

          <strong>
            ${escapeHtml(
              temperatureText(
                max,
                state.unit
              )
            )}
          </strong>

          <span>
            ${escapeHtml(
              temperatureText(
                min,
                state.unit
              )
            )}
          </span>

        </div>

        <div class="forecast-rain">
          💧 ${
            Number.isFinite(
              Number(rain)
            )
              ? `${Math.round(
                  rain
                )}%`
              : "--"
          }
        </div>

      </div>
    `);
  }

  elements.forecastList.innerHTML =
    items.join("");
}


// =========================================================
// 空气质量
// =========================================================

function renderAirQuality() {

  const air =
    state.airData;

  if (
    !air ||
    !elements.aqiValue
  ) {
    return;
  }

  const current =
    air.current ||
    {};

  const aqi =
    Number(
      current.us_aqi ??
      current.european_aqi
    );

  if (
    Number.isFinite(aqi)
  ) {

    elements.aqiValue.textContent =
      Math.round(aqi);

    elements.aqiLevel.textContent =
      getAQILevel(aqi);

  } else {

    elements.aqiValue.textContent =
      "--";

    elements.aqiLevel.textContent =
      "--";
  }

  if (
    elements.pm25
  ) {

    elements.pm25.textContent =
      formatAirValue(
        current.pm2_5
      );
  }

  if (
    elements.pm10
  ) {

    elements.pm10.textContent =
      formatAirValue(
        current.pm10
      );
  }

  if (
    elements.ozone
  ) {

    elements.ozone.textContent =
      formatAirValue(
        current.ozone
      );
  }

  if (
    elements.nitrogenDioxide
  ) {

    elements.nitrogenDioxide.textContent =
      formatAirValue(
        current.nitrogen_dioxide
      );
  }
}


// =========================================================
// 收藏按钮
// =========================================================

function renderFavoriteButton() {

  if (
    !elements.favoriteButton
  ) {
    return;
  }

  const favorite =
    isFavorite(
      state.favorites,
      state.currentLocation
    );

  elements.favoriteButton.textContent =
    favorite
      ? "★"
      : "☆";

  elements.favoriteButton.title =
    favorite
      ? "取消收藏"
      : "收藏城市";

  elements.favoriteButton.setAttribute(
    "aria-label",
    favorite
      ? "取消收藏"
      : "收藏城市"
  );

  elements.favoriteButton.classList.toggle(
    "active",
    favorite
  );
}


// =========================================================
// 收藏城市
// =========================================================

function renderFavorites() {

  if (
    !elements.favoritesList
  ) {
    return;
  }

  updateFavoriteCount(
    getFavoriteCount(
      state.favorites
    )
  );

  if (
    state.favorites.length === 0
  ) {

    elements.favoritesList.innerHTML = `
      <div class="empty-favorites">

        <div class="empty-favorites-icon">
          ⭐
        </div>

        <div>
          暂无收藏城市
        </div>

        <small>
          搜索城市或使用定位后，
          点击 ⭐ 即可收藏
        </small>

      </div>
    `;

    return;
  }

  elements.favoritesList.innerHTML =
    state.favorites
      .map(
        favorite =>
          createFavoriteCard(
            favorite
          )
      )
      .join("");

  bindFavoriteEvents();
}


// =========================================================
// 收藏卡片
// =========================================================

function createFavoriteCard(
  favorite
) {

  const active =
    isSameLocation(
      state.currentLocation,
      favorite
    );

  const current =
    active &&
    state.weatherData?.current
      ? state.weatherData.current
      : null;

  const weatherInfo =
    current
      ? getWeatherInfo(
          current.weather_code
        )
      : null;

  return `
    <div
      class="favorite-card ${
        active
          ? "active"
          : ""
      }"
      data-favorite-id="${escapeHtml(
        String(favorite.id)
      )}"
    >

      <button
        type="button"
        class="favorite-card-main"
        data-action="switch"
        data-id="${escapeHtml(
          String(favorite.id)
        )}"
      >

        <div class="favorite-card-top">

          <div class="favorite-city">
            ${escapeHtml(
              favorite.name ||
              "未知城市"
            )}
          </div>

        </div>

        <div class="favorite-location">
          ${escapeHtml(
            favorite.locationName ||
            "未知位置"
          )}
        </div>

        <div class="favorite-weather">

          <span class="favorite-weather-icon">
            ${
              weatherInfo?.icon ||
              "🌤️"
            }
          </span>

          <span class="favorite-weather-temperature">
            ${
              current
                ? escapeHtml(
                    temperatureText(
                      current.temperature_2m,
                      state.unit
                    )
                  )
                : "--"
            }
          </span>

        </div>

        <div class="favorite-weather-meta">

          <span>
            💧 ${
              current
                ? `${Math.round(
                    current.relative_humidity_2m ?? 0
                  )}%`
                : "--"
            }
          </span>

          <span>
            💨 ${
              current
                ? `${Math.round(
                    current.wind_speed_10m ?? 0
                  )} km/h`
                : "--"
            }
          </span>

        </div>

      </button>

      <button
        type="button"
        class="favorite-delete"
        data-action="delete"
        data-id="${escapeHtml(
          String(favorite.id)
        )}"
        aria-label="删除收藏"
        title="删除收藏"
      >
        ×
      </button>

    </div>
  `;
}


// =========================================================
// 绑定收藏按钮事件
// =========================================================

function bindFavoriteEvents() {

  if (
    !elements.favoritesList
  ) {
    return;
  }

  elements.favoritesList
    .querySelectorAll(
      "[data-action='switch']"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          event => {

            event.stopPropagation();

            const id =
              button.dataset.id;

            switchFavorite(
              id
            );
          }
        );
      }
    );

  elements.favoritesList
    .querySelectorAll(
      "[data-action='delete']"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          event => {

            event.stopPropagation();

            const id =
              button.dataset.id;

            deleteFavorite(
              id
            );
          }
        );
      }
    );
}


// =========================================================
// 切换收藏城市
// =========================================================

async function switchFavorite(
  id
) {

  const favorite =
    state.favorites.find(
      item =>
        String(item.id) ===
        String(id)
    );

  if (!favorite) {
    return;
  }

  await loadWeather(
    favorite.latitude,
    favorite.longitude,
    favorite.locationName,
    favorite
  );
}


// =========================================================
// 删除收藏
// =========================================================

function deleteFavorite(
  id
) {

  const favorite =
    state.favorites.find(
      item =>
        String(item.id) ===
        String(id)
    );

  if (!favorite) {
    return;
  }

  state.favorites =
    removeFavorite(
      state.favorites,
      id
    );

  saveFavorites(
    state.favorites
  );

  renderFavorites();

  renderFavoriteButton();

  showToast(
    `已取消收藏：${
      favorite.name ||
      "城市"
    }`
  );
}


// =========================================================
// 收藏 / 取消收藏当前城市
// =========================================================

function toggleFavorite() {

  if (
    !state.currentLocation
  ) {

    showToast(
      "请先获取天气"
    );

    return;
  }

  const exists =
    isFavorite(
      state.favorites,
      state.currentLocation
    );

  if (exists) {

    state.favorites =
      removeFavorite(
        state.favorites,
        state.currentLocation
      );

    saveFavorites(
      state.favorites
    );

    showToast(
      "已取消收藏"
    );

  } else {

    const result =
      addFavorite(
        state.favorites,
        state.currentLocation
      );

    if (
      result.reason ===
      "limit"
    ) {

      showToast(
        "最多只能收藏 8 个城市"
      );

      return;
    }

    if (
      result.reason ===
      "exists"
    ) {

      showToast(
        "这个城市已经收藏了"
      );

      return;
    }

    state.favorites =
      result.favorites;

    saveFavorites(
      state.favorites
    );

    showToast(
      "已加入收藏 ⭐"
    );
  }

  renderFavoriteButton();

  renderFavorites();
}


// =========================================================
// 搜索城市
// =========================================================

async function performSearch(
  keyword
) {

  const value =
    String(
      keyword || ""
    ).trim();

  if (!value) {

    closeSuggestions();

    return;
  }

  if (
    state.searchLoading
  ) {
    return;
  }

  state.searchLoading =
    true;

  try {

    const results =
      await searchCities(
        value
      );

    // 修正后的搜索回调
    renderSearchSuggestions(
      results,
      selectSearchResult,
      buildSearchLocationName
    );

  } catch (error) {

    showError(
      error,
      "城市搜索失败"
    );

  } finally {

    state.searchLoading =
      false;
  }
}


// =========================================================
// 选择搜索结果
// =========================================================

async function selectSearchResult(
  result,
  location
) {

  if (!result) {
    return;
  }

  closeSuggestions();

  if (
    elements.searchInput
  ) {

    elements.searchInput.value =
      result.name ||
      "";

    updateClearSearchButton();
  }

  const locationName =
    location?.locationName ||
    buildSearchLocationName(
      result
    );

  await loadWeather(
    result.latitude,
    result.longitude,
    locationName,
    {
      name:
        result.name,

      locationName,

      latitude:
        Number(
          result.latitude
        ),

      longitude:
        Number(
          result.longitude
        ),

      country:
        result.country ||
        "",

      state:
        result.admin1 ||
        "",

      city:
        result.admin2 ||
        result.name ||
        "",

      district:
        result.admin3 ||
        ""
    }
  );
}


// =========================================================
// 浏览器定位
// =========================================================

async function getMyLocation() {

  if (
    state.locationLoading
  ) {
    return;
  }

  if (
    !navigator.geolocation
  ) {

    showToast(
      "当前浏览器不支持定位"
    );

    return;
  }

  state.locationLoading =
    true;

  setButtonLoading(
    elements.locationButton,
    true,
    "定位中..."
  );

  setLoading(
    true,
    "正在获取当前位置..."
  );

  setStatus(
    "正在请求浏览器定位权限..."
  );

  try {

    const position =
      await requestBrowserLocation();

    const latitude =
      position.latitude;

    const longitude =
      position.longitude;

    setStatus(
      "定位成功，正在识别所在地区..."
    );

    const locationName =
      await getLocationName(
        latitude,
        longitude
      );

    await loadWeather(
      latitude,
      longitude,
      locationName,
      {
        name:
          getCityNameFromLocation(
            locationName
          ),

        locationName,

        latitude,

        longitude
      }
    );

    showToast(
      "定位成功 📍"
    );

  } catch (error) {

    showError(
      error,
      "定位失败，请检查浏览器位置权限"
    );

  } finally {

    state.locationLoading =
      false;

    setButtonLoading(
      elements.locationButton,
      false
    );

    setLoading(
      false
    );
  }
}


// =========================================================
// 刷新天气
// =========================================================

async function refreshWeather() {

  if (
    !state.currentLocation
  ) {

    showToast(
      "请先搜索城市或获取当前位置"
    );

    return;
  }

  await loadWeather(
    state.currentLocation.latitude,
    state.currentLocation.longitude,
    state.currentLocation.locationName,
    state.currentLocation
  );

  showToast(
    "天气已刷新"
  );
}


// =========================================================
// 切换温度单位
// =========================================================

function toggleUnit() {

  const nextUnit =
    state.unit ===
    "celsius"
      ? "fahrenheit"
      : "celsius";

  state.unit =
    saveUnit(
      nextUnit
    );

  updateUnitButton(
    state.unit
  );

  renderAll();

  showToast(
    state.unit === "celsius"
      ? "已切换到摄氏度"
      : "已切换到华氏度"
  );
}


// =========================================================
// 切换小时数量
// =========================================================

function setHourlyCount(
  count
) {

  state.hourlyCount =
    count === 12
      ? 12
      : 24;

  updateHourlyButtons();

  renderHourly();

  renderChart();
}


function updateHourlyButtons() {

  if (
    elements.hour12Button
  ) {

    elements.hour12Button.classList.toggle(
      "active",
      state.hourlyCount === 12
    );
  }

  if (
    elements.hour24Button
  ) {

    elements.hour24Button.classList.toggle(
      "active",
      state.hourlyCount === 24
    );
  }
}


// =========================================================
// 搜索框事件
// =========================================================

function setupSearch() {

  if (
    !elements.searchInput
  ) {
    return;
  }

  elements.searchInput.addEventListener(
    "input",
    () => {

      updateClearSearchButton();

      clearTimeout(
        state.searchTimer
      );

      const value =
        elements.searchInput.value.trim();

      if (!value) {

        closeSuggestions();

        return;
      }

      state.searchTimer =
        setTimeout(
          () => {

            performSearch(
              value
            );

          },
          450
        );
    }
  );

  elements.searchInput.addEventListener(
    "keydown",
    event => {

      if (
        event.key ===
        "Enter"
      ) {

        event.preventDefault();

        clearTimeout(
          state.searchTimer
        );

        const value =
          elements.searchInput.value.trim();

        if (value) {

          performSearch(
            value
          );
        }
      }

      if (
        event.key ===
        "Escape"
      ) {

        closeSuggestions();
      }
    }
  );

  if (
    elements.searchButton
  ) {

    elements.searchButton.addEventListener(
      "click",
      () => {

        clearTimeout(
          state.searchTimer
        );

        performSearch(
          elements.searchInput.value
        );
      }
    );
  }

  if (
    elements.clearSearch
  ) {

    elements.clearSearch.addEventListener(
      "click",
      () => {

        elements.searchInput.value =
          "";

        updateClearSearchButton();

        closeSuggestions();

        elements.searchInput.focus();
      }
    );
  }
}


// =========================================================
// 点击页面其他地方关闭搜索建议
// =========================================================

function setupOutsideClick() {

  document.addEventListener(
    "click",
    event => {

      const target =
        event.target;

      if (
        target.closest(
          ".search-container"
        )
      ) {
        return;
      }

      closeSuggestions();
    }
  );
}


// =========================================================
// 网络状态
// =========================================================

function setupNetworkStatus() {

  window.addEventListener(
    "offline",
    () => {

      updateNetworkStatus();

      showToast(
        "网络连接已断开"
      );
    }
  );

  window.addEventListener(
    "online",
    () => {

      setStatus(
        "网络已恢复"
      );

      showToast(
        "网络连接已恢复"
      );
    }
  );
}


// =========================================================
// 自动刷新
// =========================================================

function setupAutoRefresh() {

  clearInterval(
    state.refreshTimer
  );

  state.refreshTimer =
    setInterval(
      () => {

        if (
          state.destroyed
        ) {
          return;
        }

        if (
          !navigator.onLine
        ) {
          return;
        }

        if (
          state.requestLoading ||
          !state.currentLocation
        ) {
          return;
        }

        refreshWeather();

      },
      30 * 60 * 1000
    );
}


// =========================================================
// 窗口大小变化
// =========================================================

function setupResize() {

  let resizeTimer =
    null;

  window.addEventListener(
    "resize",
    () => {

      clearTimeout(
        resizeTimer
      );

      resizeTimer =
        setTimeout(
          () => {

            renderChart();

          },
          150
        );
    }
  );
}


// =========================================================
// 恢复上次位置
// =========================================================

async function restoreLastLocation() {

  const location =
    loadLastLocation();

  if (
    !location ||
    !Number.isFinite(
      Number(
        location.latitude
      )
    ) ||
    !Number.isFinite(
      Number(
        location.longitude
      )
    )
  ) {

    return;
  }

  try {

    await loadWeather(
      location.latitude,
      location.longitude,
      location.locationName ||
      location.name ||
      "上次位置",
      location
    );

  } catch (error) {

    console.error(
      "恢复上次位置失败：",
      error
    );
  }
}


// =========================================================
// 初始化
// =========================================================

async function init() {

  try {

    loadTheme();

    state.unit =
      loadUnit();

    updateUnitButton(
      state.unit
    );

    state.favorites =
      loadFavorites();

    updateFavoriteCount(
      getFavoriteCount(
        state.favorites
      )
    );

    updateHourlyButtons();

    updateNetworkStatus();

    setupSearch();

    setupOutsideClick();

    setupNetworkStatus();

    setupAutoRefresh();

    setupResize();

    setupButtons();

    renderFavorites();

    await restoreLastLocation();

    setStatus(
      state.currentLocation
        ? `当前：${
            state.currentLocation.locationName
          }`
        : "搜索城市或获取当前位置"
    );

  } catch (error) {

    showError(
      error,
      "应用初始化失败"
    );
  }
}


// =========================================================
// 所有按钮事件
// =========================================================

function setupButtons() {

  if (
    elements.locationButton
  ) {

    elements.locationButton.addEventListener(
      "click",
      getMyLocation
    );
  }

  if (
    elements.refreshButton
  ) {

    elements.refreshButton.addEventListener(
      "click",
      refreshWeather
    );
  }

  if (
    elements.favoriteButton
  ) {

    elements.favoriteButton.addEventListener(
      "click",
      toggleFavorite
    );
  }

  if (
    elements.themeToggle
  ) {

    elements.themeToggle.addEventListener(
      "click",
      () => {

        toggleTheme();

        renderChart();
      }
    );
  }

  if (
    elements.unitToggle
  ) {

    elements.unitToggle.addEventListener(
      "click",
      toggleUnit
    );
  }

  if (
    elements.hour12Button
  ) {

    elements.hour12Button.addEventListener(
      "click",
      () => {

        setHourlyCount(
          12
        );
      }
    );
  }

  if (
    elements.hour24Button
  ) {

    elements.hour24Button.addEventListener(
      "click",
      () => {

        setHourlyCount(
          24
        );
      }
    );
  }
}


// =========================================================
// 全部重新渲染
// =========================================================

function renderAll() {

  renderCurrentWeather();

  renderHourly();

  renderChart();

  renderForecast();

  renderAirQuality();

  renderFavorites();

  updateHourlyButtons();
}


// =========================================================
// 创建位置 ID
// =========================================================

function createLocationId(
  latitude,
  longitude
) {

  return (
    `location-${Number(
      latitude
    ).toFixed(4)}-${Number(
      longitude
    ).toFixed(4)}`
  );
}


// =========================================================
// 判断两个位置是否相同
// =========================================================

function isSameLocation(
  first,
  second
) {

  if (
    !first ||
    !second
  ) {
    return false;
  }

  return (
    Math.abs(
      Number(first.latitude) -
      Number(second.latitude)
    ) < 0.0001 &&

    Math.abs(
      Number(first.longitude) -
      Number(second.longitude)
    ) < 0.0001
  );
}


// =========================================================
// 从完整地区名称中取得城市名
// =========================================================

function getCityNameFromLocation(
  locationName
) {

  if (!locationName) {
    return "当前位置";
  }

  const parts =
    locationName
      .split("·")
      .map(
        item =>
          item.trim()
      )
      .filter(Boolean);

  if (
    parts.length >= 3
  ) {

    return parts[
      parts.length - 2
    ];
  }

  if (
    parts.length > 0
  ) {

    return parts[
      parts.length - 1
    ];
  }

  return "当前位置";
}


// =========================================================
// 页面关闭
// =========================================================

window.addEventListener(
  "beforeunload",
  () => {

    state.destroyed =
      true;

    clearInterval(
      state.refreshTimer
    );

    clearTimeout(
      state.searchTimer
    );

    cleanupUI();
  }
);


// =========================================================
// 启动应用
// =========================================================

document.addEventListener(
  "DOMContentLoaded",
  init
);