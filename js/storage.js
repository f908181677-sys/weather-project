// =========================================================
// 我的天气 V25
// js/storage.js
// 本地数据统一管理
// =========================================================

const STORAGE_KEYS = {
  favorites: "weather-favorites-v25",
  theme: "weather-theme-v25",
  unit: "weather-unit-v25",
  lastLocation: "weather-last-location-v25"
};


// =========================================================
// 通用 JSON 保存
// =========================================================

function saveJSON(key, value) {
  try {
    localStorage.setItem(
      key,
      JSON.stringify(value)
    );

    return true;

  } catch (error) {
    console.error(
      "保存本地数据失败：",
      error
    );

    return false;
  }
}


// =========================================================
// 通用 JSON 读取
// =========================================================

function loadJSON(key, fallback = null) {
  try {
    const value =
      localStorage.getItem(key);

    if (!value) {
      return fallback;
    }

    return JSON.parse(value);

  } catch (error) {

    console.error(
      "读取本地数据失败：",
      error
    );

    return fallback;
  }
}


// =========================================================
// 删除数据
// =========================================================

export function removeStorage(key) {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(
      "删除本地数据失败：",
      error
    );
  }
}


// =========================================================
// 最后一次位置
// =========================================================

export function saveLastLocation(
  location
) {
  if (!location) {
    return false;
  }

  return saveJSON(
    STORAGE_KEYS.lastLocation,
    location
  );
}


export function loadLastLocation() {
  return loadJSON(
    STORAGE_KEYS.lastLocation,
    null
  );
}


// =========================================================
// 主题
// =========================================================

export function saveTheme(
  theme
) {
  return saveJSON(
    STORAGE_KEYS.theme,
    theme
  );
}


export function loadTheme() {
  return loadJSON(
    STORAGE_KEYS.theme,
    "light"
  );
}


// =========================================================
// 温度单位
// =========================================================

export function saveUnit(
  unit
) {
  return saveJSON(
    STORAGE_KEYS.unit,
    unit
  );
}


export function loadUnit() {
  return loadJSON(
    STORAGE_KEYS.unit,
    "celsius"
  );
}


// =========================================================
// 收藏城市
// =========================================================

export function saveFavorites(
  favorites
) {
  return saveJSON(
    STORAGE_KEYS.favorites,
    Array.isArray(favorites)
      ? favorites
      : []
  );
}


export function loadFavorites() {

  const favorites =
    loadJSON(
      STORAGE_KEYS.favorites,
      []
    );

  return Array.isArray(favorites)
    ? favorites
    : [];
}


// =========================================================
// 获取所有存储 Key
// =========================================================

export const KEYS = {
  ...STORAGE_KEYS
};