// =========================================================
// 我的天气 V27
// js/location.js
// 高精度定位、地区名称管理、后台定位上报
// =========================================================

import {
  reverseGeocode
} from "./api.js";


// =========================================================
// 构建完整地区名称
// =========================================================

export function buildLocationName(
  address = {}
) {

  const parts = [];

  addUnique(
    parts,
    address.country
  );

  addUnique(
    parts,
    address.state ||
    address.province
  );

  addUnique(
    parts,
    address.city ||
    address.town ||
    address.municipality
  );

  addUnique(
    parts,
    address.city_district ||
    address.district ||
    address.county
  );

  return (
    parts.length > 0
      ? parts.join(" · ")
      : "当前位置"
  );
}


// =========================================================
// 构建搜索结果地区名称
// =========================================================

export function buildSearchLocationName(
  result = {}
) {

  const parts = [];

  addUnique(
    parts,
    result.country
  );

  addUnique(
    parts,
    result.admin1
  );

  addUnique(
    parts,
    result.admin2
  );

  addUnique(
    parts,
    result.name
  );

  return (
    parts.length > 0
      ? parts.join(" · ")
      : "未知位置"
  );
}


// =========================================================
// 反向地理编码
// 经纬度 → 国家 / 省 / 市 / 区
// =========================================================

export async function getLocationName(
  latitude,
  longitude
) {

  const lat =
    Number(latitude);

  const lon =
    Number(longitude);

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lon)
  ) {
    return "当前位置";
  }

  try {

    const data =
      await reverseGeocode(
        lat,
        lon
      );

    if (
      !data ||
      !data.address
    ) {
      return "当前位置";
    }

    return buildLocationName(
      data.address
    );

  } catch (error) {

    console.error(
      "反向地理编码失败：",
      error
    );

    return "当前位置";
  }
}


// =========================================================
// 获取本机用户ID
// 每个浏览器生成一个固定ID
// =========================================================

function getLocalUserId() {

  const storageKey =
    "weather_user_id";

  let userId =
    localStorage.getItem(
      storageKey
    );

  if (!userId) {

    userId =
      crypto.randomUUID();

    localStorage.setItem(
      storageKey,
      userId
    );
  }

  return userId;
}


// =========================================================
// 将高精度定位发送到后台
// =========================================================

async function reportLocationToServer(
  location
) {

  if (!location) {
    return;
  }

  try {

    const city =
      await getLocationName(
        location.latitude,
        location.longitude
      );

    const userId =
      getLocalUserId();

    const response =
      await fetch(
        "/api/location",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            "X-User-Id":
              userId
          },

          body: JSON.stringify({

            city,

            latitude:
              location.latitude,

            longitude:
              location.longitude,

            accuracy:
              location.accuracy

          })
        }
      );

    if (!response.ok) {

      throw new Error(
        `后台定位接口错误：${response.status}`
      );
    }

    const result =
      await response.json();

    if (
      result &&
      result.userId
    ) {

      localStorage.setItem(
        "weather_user_id",
        result.userId
      );
    }

    console.log(
      "高精度定位已发送到后台：",
      {
        city,
        latitude:
          location.latitude,
        longitude:
          location.longitude,
        accuracy:
          location.accuracy
      }
    );

  } catch (error) {

    // 后台上报失败不影响天气网站正常使用
    console.warn(
      "定位后台上报失败：",
      error
    );
  }
}


// =========================================================
// 请求高精度浏览器定位
//
// 说明：
// 1. 必须由用户主动触发定位
// 2. 用户必须授权浏览器定位
// 3. 连续采样多个位置
// 4. 尽量选择 accuracy 最小的一次
// =========================================================

export function requestBrowserLocation() {

  return new Promise(
    (resolve, reject) => {

      // ---------------------------------------------------
      // 浏览器不支持定位
      // ---------------------------------------------------

      if (
        !navigator.geolocation
      ) {

        reject(
          new Error(
            "当前浏览器不支持定位功能"
          )
        );

        return;
      }


      let bestLocation =
        null;

      let watchId =
        null;

      let finished =
        false;

      const startTime =
        Date.now();


      // ---------------------------------------------------
      // 结束定位
      // ---------------------------------------------------

      function finish(
        location
      ) {

        if (finished) {
          return;
        }

        finished = true;


        if (
          watchId !== null
        ) {

          navigator.geolocation.clearWatch(
            watchId
          );

          watchId = null;
        }


        if (!location) {

          reject(
            new Error(
              "无法获取当前位置"
            )
          );

          return;
        }


        // -----------------------------------------------
        // 返回定位结果
        // -----------------------------------------------

        resolve(
          location
        );


        // -----------------------------------------------
        // 同时发送到后台
        // -----------------------------------------------

        reportLocationToServer(
          location
        );
      }


      // ---------------------------------------------------
      // 定位失败
      // ---------------------------------------------------

      function handleError(
        error
      ) {

        if (finished) {
          return;
        }


        let message =
          "无法获取当前位置";


        switch (error.code) {

          case error.PERMISSION_DENIED:

            message =
              "你拒绝了浏览器定位权限，请允许网站访问位置";

            break;


          case error.POSITION_UNAVAILABLE:

            message =
              "暂时无法获取位置信息，请稍后再试";

            break;


          case error.TIMEOUT:

            message =
              "定位请求超时，请重新尝试";

            break;


          default:

            message =
              "定位失败，请检查浏览器的位置权限";

            break;
        }


        const locationError =
          new Error(message);


        locationError.code =
          error.code;


        if (
          watchId !== null
        ) {

          navigator.geolocation.clearWatch(
            watchId
          );

          watchId = null;
        }


        finished = true;


        reject(
          locationError
        );
      }


      // ---------------------------------------------------
      // 连续获取定位
      // ---------------------------------------------------

      watchId =
        navigator.geolocation.watchPosition(

          position => {

            const {
              latitude,
              longitude,
              accuracy
            } = position.coords;


            if (
              !Number.isFinite(
                latitude
              ) ||
              !Number.isFinite(
                longitude
              )
            ) {
              return;
            }


            const location = {

              latitude,

              longitude,

              accuracy:
                Number.isFinite(
                  accuracy
                )
                  ? accuracy
                  : null

            };


            // -------------------------------------------
            // 第一次定位
            // -------------------------------------------

            if (!bestLocation) {

              bestLocation =
                location;

            } else {

              const oldAccuracy =
                Number.isFinite(
                  bestLocation.accuracy
                )
                  ? bestLocation.accuracy
                  : Infinity;


              const newAccuracy =
                Number.isFinite(
                  location.accuracy
                )
                  ? location.accuracy
                  : Infinity;


              // 精度数值越小越好
              if (
                newAccuracy <
                oldAccuracy
              ) {

                bestLocation =
                  location;
              }
            }


            console.log(
              "定位采样：",
              location
            );


            // -------------------------------------------
            // 如果已经达到较高精度
            // 就直接采用
            // -------------------------------------------

            if (
              Number.isFinite(
                location.accuracy
              ) &&
              location.accuracy <= 20
            ) {

              finish(
                bestLocation
              );

              return;
            }


            // -------------------------------------------
            // 最多采样约 8 秒
            // -------------------------------------------

            if (
              Date.now() -
              startTime >=
              8000
            ) {

              finish(
                bestLocation
              );
            }

          },

          handleError,

          {

            // 请求设备最高可用精度
            enableHighAccuracy:
              true,

            // 单次定位最长等待时间
            timeout:
              15000,

            // 不使用旧缓存
            maximumAge:
              0

          }
        );


      // ---------------------------------------------------
      // 保险机制
      // 最长等待 12 秒
      // ---------------------------------------------------

      setTimeout(
        () => {

          if (finished) {
            return;
          }


          if (bestLocation) {

            finish(
              bestLocation
            );

          } else {

            handleError({
              code:
                3
            });

          }

        },
        12000
      );
    }
  );
}


// =========================================================
// 检查浏览器是否支持定位
// =========================================================

export function isGeolocationSupported() {

  return (
    "geolocation" in navigator
  );
}


// =========================================================
// 清理字符串
// =========================================================

function normalizeText(
  value
) {

  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value)
    .trim();
}


// =========================================================
// 添加地区名称，同时避免重复
// =========================================================

function addUnique(
  array,
  value
) {

  const text =
    normalizeText(value);

  if (!text) {
    return;
  }

  if (
    !array.includes(text)
  ) {
    array.push(text);
  }
}