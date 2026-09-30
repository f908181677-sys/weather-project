// =========================================================
// 我的天气 V25
// js/weather.js
// 天气数据处理工具
// =========================================================


// =========================================================
// WMO 天气代码
// =========================================================

export function getWeatherInfo(code) {

  const weatherMap = {

    0: {
      icon: "☀️",
      description: "晴天",
      type: "sunny"
    },

    1: {
      icon: "🌤️",
      description: "大致晴朗",
      type: "sunny"
    },

    2: {
      icon: "⛅",
      description: "局部多云",
      type: "cloudy"
    },

    3: {
      icon: "☁️",
      description: "阴天",
      type: "cloudy"
    },

    45: {
      icon: "🌫️",
      description: "雾",
      type: "cloudy"
    },

    48: {
      icon: "🌫️",
      description: "冻雾",
      type: "cloudy"
    },

    51: {
      icon: "🌦️",
      description: "小毛毛雨",
      type: "rainy"
    },

    53: {
      icon: "🌦️",
      description: "毛毛雨",
      type: "rainy"
    },

    55: {
      icon: "🌧️",
      description: "较强毛毛雨",
      type: "rainy"
    },

    56: {
      icon: "🌧️",
      description: "冻毛毛雨",
      type: "rainy"
    },

    57: {
      icon: "🌧️",
      description: "强冻毛毛雨",
      type: "rainy"
    },

    61: {
      icon: "🌦️",
      description: "小雨",
      type: "rainy"
    },

    63: {
      icon: "🌧️",
      description: "中雨",
      type: "rainy"
    },

    65: {
      icon: "🌧️",
      description: "大雨",
      type: "rainy"
    },

    66: {
      icon: "🌧️",
      description: "冻雨",
      type: "rainy"
    },

    67: {
      icon: "🌧️",
      description: "强冻雨",
      type: "rainy"
    },

    71: {
      icon: "🌨️",
      description: "小雪",
      type: "snowy"
    },

    73: {
      icon: "❄️",
      description: "中雪",
      type: "snowy"
    },

    75: {
      icon: "❄️",
      description: "大雪",
      type: "snowy"
    },

    77: {
      icon: "🌨️",
      description: "雪粒",
      type: "snowy"
    },

    80: {
      icon: "🌦️",
      description: "阵雨",
      type: "rainy"
    },

    81: {
      icon: "🌧️",
      description: "中等阵雨",
      type: "rainy"
    },

    82: {
      icon: "⛈️",
      description: "强阵雨",
      type: "storm"
    },

    85: {
      icon: "🌨️",
      description: "阵雪",
      type: "snowy"
    },

    86: {
      icon: "❄️",
      description: "强阵雪",
      type: "snowy"
    },

    95: {
      icon: "⛈️",
      description: "雷雨",
      type: "storm"
    },

    96: {
      icon: "⛈️",
      description: "雷雨伴冰雹",
      type: "storm"
    },

    99: {
      icon: "⛈️",
      description: "强雷雨伴冰雹",
      type: "storm"
    }

  };

  return (
    weatherMap[Number(code)] || {
      icon: "🌤️",
      description: "未知天气",
      type: "cloudy"
    }
  );
}


// =========================================================
// 风向
// =========================================================

export function getWindDirection(
  degrees
) {

  if (
    degrees === null ||
    degrees === undefined ||
    Number.isNaN(Number(degrees))
  ) {
    return "--";
  }

  const value =
    ((Number(degrees) % 360) + 360) % 360;

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
    Math.round(value / 45) % 8;

  return `${directions[index]}风`;
}


// =========================================================
// 时间格式化
// =========================================================

export function formatTime(
  value
) {

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
      minute: "2-digit",
      hour12: false
    }
  );
}


// =========================================================
// 日期格式化
// =========================================================

export function formatDate(
  value
) {

  if (!value) {
    return "--";
  }

  const date =
    new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return `${date.getMonth() + 1}/${date.getDate()}`;
}


// =========================================================
// 星期
// =========================================================

export function getDayName(
  dateString,
  index = 0
) {

  if (index === 0) {
    return "今天";
  }

  if (index === 1) {
    return "明天";
  }

  const date =
    new Date(`${dateString}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  const weekdays = [
    "周日",
    "周一",
    "周二",
    "周三",
    "周四",
    "周五",
    "周六"
  ];

  return weekdays[date.getDay()];
}


// =========================================================
// 摄氏度 → 华氏度
// =========================================================

export function convertTemperature(
  celsius,
  unit = "celsius"
) {

  if (
    celsius === null ||
    celsius === undefined ||
    Number.isNaN(Number(celsius))
  ) {
    return null;
  }

  const value =
    Number(celsius);

  if (unit === "fahrenheit") {
    return value * 9 / 5 + 32;
  }

  return value;
}


// =========================================================
// 温度显示文本
// =========================================================

export function temperatureText(
  celsius,
  unit = "celsius"
) {

  const value =
    convertTemperature(
      celsius,
      unit
    );

  if (value === null) {
    return "--";
  }

  const rounded =
    Math.round(value);

  return unit === "fahrenheit"
    ? `${rounded}°F`
    : `${rounded}°C`;
}


// =========================================================
// AQI 等级
// =========================================================

export function getAQILevel(
  aqi
) {

  if (
    aqi === null ||
    aqi === undefined ||
    Number.isNaN(Number(aqi))
  ) {
    return "暂无数据";
  }

  const value =
    Number(aqi);

  if (value <= 50) {
    return "空气优良";
  }

  if (value <= 100) {
    return "空气良好";
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


// =========================================================
// 空气数据格式化
// =========================================================

export function formatAirValue(
  value
) {

  if (
    value === null ||
    value === undefined ||
    Number.isNaN(Number(value))
  ) {
    return "--";
  }

  return `${Math.round(Number(value))} μg/m³`;
}


// =========================================================
// 温度数据读取
// =========================================================

export function findTemperatureValue(
  celsius,
  unit = "celsius"
) {

  return convertTemperature(
    celsius,
    unit
  );
}