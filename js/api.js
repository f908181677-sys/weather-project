// =========================================================
// 我的天气 V25
// js/api.js
// API 请求统一管理
// =========================================================

const WEATHER_API =
  "https://api.open-meteo.com/v1/forecast";

const GEO_API =
  "https://geocoding-api.open-meteo.com/v1/search";

const AIR_API =
  "https://air-quality-api.open-meteo.com/v1/air-quality";

const REVERSE_GEO_API =
  "https://nominatim.openstreetmap.org/reverse";


// =========================================================
// 通用 JSON 请求
// =========================================================

export async function requestJSON(
  url,
  options = {}
) {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, 15000);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(options.headers || {})
      }
    });

    if (!response.ok) {
      throw new Error(
        `请求失败：HTTP ${response.status}`
      );
    }

    const data = await response.json();

    return data;

  } catch (error) {

    if (error.name === "AbortError") {
      throw new Error(
        "网络请求超时，请检查网络后重试。"
      );
    }

    if (error instanceof TypeError) {
      throw new Error(
        "网络连接失败，请检查网络连接。"
      );
    }

    throw error;

  } finally {
    clearTimeout(timeout);
  }
}


// =========================================================
// 获取天气
// =========================================================

export async function fetchWeather(
  latitude,
  longitude
) {

  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),

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

  const url =
    `${WEATHER_API}?${params.toString()}`;

  return requestJSON(url);
}


// =========================================================
// 获取空气质量
// =========================================================

export async function fetchAirQuality(
  latitude,
  longitude
) {

  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),

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

  const url =
    `${AIR_API}?${params.toString()}`;

  return requestJSON(url);
}


// =========================================================
// 城市搜索
// =========================================================

export async function searchCities(
  keyword
) {

  const cleanKeyword =
    String(keyword || "").trim();

  if (!cleanKeyword) {
    return [];
  }

  const params = new URLSearchParams({
    name: cleanKeyword,
    count: "8",
    language: "zh",
    format: "json"
  });

  const url =
    `${GEO_API}?${params.toString()}`;

  const data =
    await requestJSON(url);

  return Array.isArray(data.results)
    ? data.results
    : [];
}


// =========================================================
// 反向地理编码
// 经纬度 → 国家 / 省 / 市 / 区
// =========================================================

export async function reverseGeocode(
  latitude,
  longitude
) {

  const params = new URLSearchParams({
    lat: latitude.toString(),
    lon: longitude.toString(),

    format: "json",

    addressdetails: "1",

    zoom: "18",

    "accept-language": "zh-CN"
  });

  const url =
    `${REVERSE_GEO_API}?${params.toString()}`;

  return requestJSON(url, {
    headers: {
      Accept: "application/json"
    }
  });
}