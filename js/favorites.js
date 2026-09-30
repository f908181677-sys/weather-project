// =========================================================
// 我的天气 V25
// js/favorites.js
// 收藏城市管理
// =========================================================

import {
  loadFavorites as loadStoredFavorites,
  saveFavorites as saveStoredFavorites
} from "./storage.js";


// =========================================================
// 最大收藏数量
// =========================================================

const MAX_FAVORITES = 8;


// =========================================================
// 读取收藏
// =========================================================

export function loadFavorites() {
  const favorites =
    loadStoredFavorites();

  if (!Array.isArray(favorites)) {
    return [];
  }

  return favorites.slice(
    0,
    MAX_FAVORITES
  );
}


// =========================================================
// 保存收藏
// =========================================================

export function saveFavorites(
  favorites
) {
  if (!Array.isArray(favorites)) {
    return false;
  }

  return saveStoredFavorites(
    favorites.slice(
      0,
      MAX_FAVORITES
    )
  );
}


// =========================================================
// 判断是否已经收藏
// =========================================================

export function isFavorite(
  favorites,
  location
) {
  if (
    !Array.isArray(favorites) ||
    !location
  ) {
    return false;
  }

  const latitude =
    Number(location.latitude);

  const longitude =
    Number(location.longitude);

  return favorites.some(
    item =>
      Math.abs(
        Number(item.latitude) -
        latitude
      ) < 0.0001 &&
      Math.abs(
        Number(item.longitude) -
        longitude
      ) < 0.0001
  );
}


// =========================================================
// 添加收藏
// =========================================================

export function addFavorite(
  favorites,
  location
) {

  if (!location) {
    return {
      favorites: Array.isArray(favorites)
        ? favorites
        : [],
      added: false,
      reason: "invalid"
    };
  }

  const currentFavorites =
    Array.isArray(favorites)
      ? [...favorites]
      : [];


  // 已经存在
  if (
    isFavorite(
      currentFavorites,
      location
    )
  ) {
    return {
      favorites: currentFavorites,
      added: false,
      reason: "exists"
    };
  }


  // 达到上限
  if (
    currentFavorites.length >=
    MAX_FAVORITES
  ) {
    return {
      favorites: currentFavorites,
      added: false,
      reason: "limit"
    };
  }


  const favorite = {
    id: createFavoriteId(location),

    name:
      location.name ||
      "未知城市",

    locationName:
      location.locationName ||
      location.name ||
      "未知位置",

    latitude:
      Number(location.latitude),

    longitude:
      Number(location.longitude),

    country:
      location.country ||
      "",

    state:
      location.state ||
      "",

    city:
      location.city ||
      "",

    district:
      location.district ||
      "",

    addedAt:
      Date.now()
  };


  currentFavorites.push(
    favorite
  );


  return {
    favorites: currentFavorites,
    added: true,
    reason: "added"
  };
}


// =========================================================
// 删除收藏
// =========================================================

export function removeFavorite(
  favorites,
  locationOrId
) {

  if (!Array.isArray(favorites)) {
    return [];
  }


  // 如果传入 ID
  if (
    typeof locationOrId === "string" ||
    typeof locationOrId === "number"
  ) {
    return favorites.filter(
      item =>
        String(item.id) !==
        String(locationOrId)
    );
  }


  // 如果传入城市对象
  if (locationOrId) {

    const latitude =
      Number(locationOrId.latitude);

    const longitude =
      Number(locationOrId.longitude);

    return favorites.filter(
      item =>
        !(
          Math.abs(
            Number(item.latitude) -
            latitude
          ) < 0.0001 &&
          Math.abs(
            Number(item.longitude) -
            longitude
          ) < 0.0001
        )
    );
  }


  return [...favorites];
}


// =========================================================
// 清空收藏
// =========================================================

export function clearFavorites() {
  return [];
}


// =========================================================
// 获取收藏数量
// =========================================================

export function getFavoriteCount(
  favorites
) {

  if (!Array.isArray(favorites)) {
    return 0;
  }

  return Math.min(
    favorites.length,
    MAX_FAVORITES
  );
}


// =========================================================
// 根据坐标查找收藏
// =========================================================

export function findFavorite(
  favorites,
  latitude,
  longitude
) {

  if (!Array.isArray(favorites)) {
    return null;
  }

  const lat =
    Number(latitude);

  const lon =
    Number(longitude);

  return (
    favorites.find(
      item =>
        Math.abs(
          Number(item.latitude) -
          lat
        ) < 0.0001 &&
        Math.abs(
          Number(item.longitude) -
          lon
        ) < 0.0001
    ) || null
  );
}


// =========================================================
// 创建收藏 ID
// =========================================================

function createFavoriteId(
  location
) {

  const lat =
    Number(location.latitude)
      .toFixed(4);

  const lon =
    Number(location.longitude)
      .toFixed(4);

  return `favorite-${lat}-${lon}`;
}


// =========================================================
// 最大收藏数量
// =========================================================

export function getMaxFavorites() {
  return MAX_FAVORITES;
}