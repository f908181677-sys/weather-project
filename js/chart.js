// =========================================================
// 我的天气 V25
// js/chart.js
// 温度曲线图
// =========================================================

import {
  formatTime,
  findTemperatureValue
} from "./weather.js";


// =========================================================
// 绘制温度曲线
// =========================================================

export function drawTemperatureChart(
  canvas,
  hourlyData,
  unit = "celsius",
  hourCount = 24
) {

  if (
    !canvas ||
    !hourlyData ||
    !Array.isArray(hourlyData.time) ||
    !Array.isArray(hourlyData.temperature_2m)
  ) {
    return;
  }


  const times =
    hourlyData.time.slice(
      0,
      hourCount
    );

  const temperatures =
    hourlyData.temperature_2m.slice(
      0,
      hourCount
    );


  if (
    times.length === 0 ||
    temperatures.length === 0
  ) {
    return;
  }


  const rect =
    canvas.getBoundingClientRect();


  const dpr =
    window.devicePixelRatio || 1;


  const width =
    Math.max(
      rect.width,
      320
    );


  const height =
    300;


  canvas.width =
    width * dpr;

  canvas.height =
    height * dpr;


  canvas.style.height =
    `${height}px`;


  const ctx =
    canvas.getContext("2d");


  if (!ctx) {
    return;
  }


  ctx.setTransform(
    dpr,
    0,
    0,
    dpr,
    0,
    0
  );


  // =======================================================
  // 清空画布
  // =======================================================

  ctx.clearRect(
    0,
    0,
    width,
    height
  );


  // =======================================================
  // 转换温度
  // =======================================================

  const values =
    temperatures.map(
      temperature =>
        findTemperatureValue(
          temperature,
          unit
        )
    );


  const validValues =
    values.filter(
      Number.isFinite
    );


  if (
    validValues.length === 0
  ) {
    return;
  }


  // =======================================================
  // 图表区域
  // =======================================================

  const padding = {
    top: 35,
    right: 25,
    bottom: 55,
    left: 48
  };


  const chartWidth =
    width -
    padding.left -
    padding.right;


  const chartHeight =
    height -
    padding.top -
    padding.bottom;


  // =======================================================
  // 温度范围
  // =======================================================

  let minTemp =
    Math.min(
      ...validValues
    );


  let maxTemp =
    Math.max(
      ...validValues
    );


  // 给上下增加空间
  const range =
    Math.max(
      maxTemp - minTemp,
      4
    );


  minTemp -=
    range * 0.2;

  maxTemp +=
    range * 0.2;


  // =======================================================
  // 坐标转换
  // =======================================================

  function getX(index) {

    if (times.length === 1) {
      return (
        padding.left +
        chartWidth / 2
      );
    }

    return (
      padding.left +
      (
        index /
        (times.length - 1)
      ) *
      chartWidth
    );
  }


  function getY(value) {

    return (
      padding.top +
      (
        (maxTemp - value) /
        (maxTemp - minTemp)
      ) *
      chartHeight
    );
  }


  // =======================================================
  // 网格线
  // =======================================================

  ctx.save();


  ctx.lineWidth = 1;


  const gridCount = 4;


  for (
    let i = 0;
    i <= gridCount;
    i++
  ) {

    const y =
      padding.top +
      (
        i /
        gridCount
      ) *
      chartHeight;


    ctx.beginPath();

    ctx.moveTo(
      padding.left,
      y
    );

    ctx.lineTo(
      width - padding.right,
      y
    );


    ctx.strokeStyle =
      getGridColor();


    ctx.stroke();


    // 温度刻度
    const value =
      maxTemp -
      (
        i /
        gridCount
      ) *
      (
        maxTemp -
        minTemp
      );


    ctx.fillStyle =
      getTextColor();


    ctx.font =
      "12px -apple-system, BlinkMacSystemFont, sans-serif";


    ctx.textAlign =
      "right";

    ctx.textBaseline =
      "middle";


    ctx.fillText(
      `${Math.round(value)}°`,
      padding.left - 10,
      y
    );
  }


  ctx.restore();


  // =======================================================
  // 曲线渐变区域
  // =======================================================

  const gradient =
    ctx.createLinearGradient(
      0,
      padding.top,
      0,
      height
    );


  gradient.addColorStop(
    0,
    getFillColor()
  );


  gradient.addColorStop(
    1,
    "rgba(255,255,255,0)"
  );


  ctx.beginPath();


  values.forEach(
    (value, index) => {

      if (
        !Number.isFinite(value)
      ) {
        return;
      }


      const x =
        getX(index);

      const y =
        getY(value);


      if (index === 0) {

        ctx.moveTo(
          x,
          y
        );

      } else {

        ctx.lineTo(
          x,
          y
        );
      }
    }
  );


  const lastX =
    getX(
      values.length - 1
    );


  ctx.lineTo(
    lastX,
    height - padding.bottom
  );


  ctx.lineTo(
    padding.left,
    height - padding.bottom
  );


  ctx.closePath();


  ctx.fillStyle =
    gradient;


  ctx.fill();


  // =======================================================
  // 温度曲线
  // =======================================================

  ctx.beginPath();


  let lineStarted = false;


  values.forEach(
    (value, index) => {

      if (
        !Number.isFinite(value)
      ) {
        return;
      }


      const x =
        getX(index);

      const y =
        getY(value);


      if (!lineStarted) {

        ctx.moveTo(
          x,
          y
        );

        lineStarted = true;

      } else {

        ctx.lineTo(
          x,
          y
        );
      }
    }
  );


  ctx.strokeStyle =
    getLineColor();


  ctx.lineWidth = 3;

  ctx.lineCap =
    "round";

  ctx.lineJoin =
    "round";


  ctx.stroke();


  // =======================================================
  // 温度圆点
  // =======================================================

  values.forEach(
    (value, index) => {

      if (
        !Number.isFinite(value)
      ) {
        return;
      }


      const x =
        getX(index);

      const y =
        getY(value);


      ctx.beginPath();

      ctx.arc(
        x,
        y,
        4,
        0,
        Math.PI * 2
      );


      ctx.fillStyle =
        getPointColor();


      ctx.fill();


      ctx.lineWidth = 2;


      ctx.strokeStyle =
        getPointBorderColor();


      ctx.stroke();
    }
  );


  // =======================================================
  // 时间标签
  // =======================================================

  const labelStep =
    getLabelStep(
      times.length
    );


  ctx.fillStyle =
    getTextColor();


  ctx.font =
    "12px -apple-system, BlinkMacSystemFont, sans-serif";


  ctx.textAlign =
    "center";

  ctx.textBaseline =
    "top";


  times.forEach(
    (time, index) => {

      if (
        index % labelStep !== 0 &&
        index !== times.length - 1
      ) {
        return;
      }


      const x =
        getX(index);


      const label =
        formatTime(time);


      ctx.fillText(
        label,
        x,
        height - padding.bottom + 15
      );
    }
  );
}


// =========================================================
// 根据小时数量决定时间标签间隔
// =========================================================

function getLabelStep(
  count
) {

  if (count <= 6) {
    return 1;
  }

  if (count <= 12) {
    return 2;
  }

  if (count <= 18) {
    return 3;
  }

  return 4;
}


// =========================================================
// 获取当前主题颜色
// =========================================================

function getThemeColor(
  light,
  dark
) {

  const darkMode =
    document.body.classList.contains(
      "dark"
    );


  return darkMode
    ? dark
    : light;
}


// =========================================================
// 网格颜色
// =========================================================

function getGridColor() {

  return getThemeColor(
    "rgba(0, 0, 0, 0.08)",
    "rgba(255, 255, 255, 0.10)"
  );
}


// =========================================================
// 文字颜色
// =========================================================

function getTextColor() {

  return getThemeColor(
    "rgba(30, 41, 59, 0.72)",
    "rgba(255, 255, 255, 0.72)"
  );
}


// =========================================================
// 曲线颜色
// =========================================================

function getLineColor() {

  return getThemeColor(
    "#2563eb",
    "#60a5fa"
  );
}


// =========================================================
// 填充颜色
// =========================================================

function getFillColor() {

  return getThemeColor(
    "rgba(37, 99, 235, 0.18)",
    "rgba(96, 165, 250, 0.18)"
  );
}


// =========================================================
// 点颜色
// =========================================================

function getPointColor() {

  return getThemeColor(
    "#2563eb",
    "#60a5fa"
  );
}


// =========================================================
// 点边框颜色
// =========================================================

function getPointBorderColor() {

  return getThemeColor(
    "#ffffff",
    "#0f172a"
  );
}


// =========================================================
// 窗口变化时重新绘制
// =========================================================

export function redrawTemperatureChart(
  canvas,
  hourlyData,
  unit,
  hourCount
) {

  if (
    !canvas ||
    !hourlyData
  ) {
    return;
  }


  drawTemperatureChart(
    canvas,
    hourlyData,
    unit,
    hourCount
  );
}