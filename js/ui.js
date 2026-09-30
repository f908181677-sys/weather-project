// =========================================================
// 我的天气 V25
// js/ui.js
// 用户界面统一管理
// =========================================================


// =========================================================
// 快速获取 DOM 元素
// =========================================================

export function $(selector) {
  return document.querySelector(selector);
}


// =========================================================
// 加载状态
// =========================================================

export function setLoading(
  show,
  message = "正在加载天气数据..."
) {

  const overlay =
    $("#loadingOverlay");

  const text =
    $("#loadingText");


  if (!overlay) {
    return;
  }


  if (text) {
    text.textContent =
      message;
  }


  if (show) {

    overlay.classList.add(
      "show"
    );

    overlay.setAttribute(
      "aria-hidden",
      "false"
    );

  } else {

    overlay.classList.remove(
      "show"
    );

    overlay.setAttribute(
      "aria-hidden",
      "true"
    );
  }
}


// =========================================================
// 状态文字
// =========================================================

export function setStatus(
  message = ""
) {

  const element =
    $("#statusMessage");


  if (!element) {
    return;
  }


  element.textContent =
    message;
}


// =========================================================
// Toast 提示
// =========================================================

let toastTimer = null;


export function showToast(
  message,
  duration = 2600
) {

  const toast =
    $("#toast");


  if (!toast) {
    return;
  }


  toast.textContent =
    message;


  toast.classList.add(
    "show"
  );


  clearTimeout(
    toastTimer
  );


  toastTimer =
    setTimeout(() => {

      toast.classList.remove(
        "show"
      );

    }, duration);
}


// =========================================================
// 错误提示
// =========================================================

export function showError(
  error,
  fallbackMessage =
    "发生了一点问题，请稍后再试"
) {

  console.error(
    error
  );


  let message =
    fallbackMessage;


  if (
    error &&
    typeof error.message === "string" &&
    error.message.trim()
  ) {

    message =
      error.message.trim();
  }


  showToast(
    message,
    4000
  );


  setStatus(
    message
  );
}


// =========================================================
// HTML 安全处理
// =========================================================

export function escapeHtml(
  value
) {

  return String(
    value ?? ""
  )
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


// =========================================================
// 主题
// =========================================================

const THEME_KEY =
  "weather-theme-v25";


export function loadTheme() {

  try {

    const theme =
      localStorage.getItem(
        THEME_KEY
      );


    if (
      theme === "dark" ||
      theme === "light"
    ) {

      applyTheme(
        theme
      );

      return theme;
    }

  } catch (error) {

    console.error(
      "读取主题失败：",
      error
    );
  }


  // 默认根据系统设置
  const prefersDark =
    window.matchMedia &&
    window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;


  const theme =
    prefersDark
      ? "dark"
      : "light";


  applyTheme(
    theme
  );


  return theme;
}


export function toggleTheme() {

  const isDark =
    document.body.classList.contains(
      "dark"
    );


  const nextTheme =
    isDark
      ? "light"
      : "dark";


  applyTheme(
    nextTheme
  );


  try {

    localStorage.setItem(
      THEME_KEY,
      nextTheme
    );

  } catch (error) {

    console.error(
      "保存主题失败：",
      error
    );
  }


  return nextTheme;
}


function applyTheme(
  theme
) {

  const isDark =
    theme === "dark";


  document.body.classList.toggle(
    "dark",
    isDark
  );


  updateThemeButton(
    isDark
  );
}


function updateThemeButton(
  isDark
) {

  const button =
    $("#themeToggle");


  if (!button) {
    return;
  }


  button.textContent =
    isDark
      ? "☀️"
      : "🌙";


  button.setAttribute(
    "aria-label",
    isDark
      ? "切换到浅色模式"
      : "切换到深色模式"
  );


  button.title =
    isDark
      ? "切换到浅色模式"
      : "切换到深色模式";
}


// =========================================================
// 温度单位
// =========================================================

const UNIT_KEY =
  "weather-unit-v25";


export function loadUnit() {

  try {

    const unit =
      localStorage.getItem(
        UNIT_KEY
      );


    if (
      unit === "celsius" ||
      unit === "fahrenheit"
    ) {

      updateUnitButton(
        unit
      );

      return unit;
    }

  } catch (error) {

    console.error(
      "读取温度单位失败：",
      error
    );
  }


  updateUnitButton(
    "celsius"
  );


  return "celsius";
}


export function saveUnit(
  unit
) {

  const validUnit =
    unit === "fahrenheit"
      ? "fahrenheit"
      : "celsius";


  try {

    localStorage.setItem(
      UNIT_KEY,
      validUnit
    );

  } catch (error) {

    console.error(
      "保存温度单位失败：",
      error
    );
  }


  updateUnitButton(
    validUnit
  );


  return validUnit;
}


export function updateUnitButton(
  unit
) {

  const button =
    $("#unitToggle");


  if (!button) {
    return;
  }


  const isFahrenheit =
    unit === "fahrenheit";


  button.textContent =
    isFahrenheit
      ? "°F"
      : "°C";


  button.title =
    isFahrenheit
      ? "切换到摄氏度"
      : "切换到华氏度";


  button.setAttribute(
    "aria-label",
    button.title
  );
}


// =========================================================
// 搜索候选框
// =========================================================

export function closeSuggestions() {

  const container =
    $("#searchSuggestions");


  if (!container) {
    return;
  }


  container.innerHTML = "";


  container.classList.remove(
    "show"
  );
}


// =========================================================
// 搜索候选结果
// =========================================================

export function renderSearchSuggestions(
  results,
  onSelect,
  buildLocationName
) {

  const container =
    $("#searchSuggestions");


  if (!container) {
    return;
  }


  container.innerHTML = "";


  if (
    !Array.isArray(results) ||
    results.length === 0
  ) {

    closeSuggestions();

    return;
  }


  results.forEach(
    (result, index) => {

      const item =
        document.createElement(
          "button"
        );


      item.type =
        "button";


      item.className =
        "search-suggestion";


      const locationName =
        buildLocationName(
          result
        );


      const latitude =
        Number(
          result.latitude
        );


      const longitude =
        Number(
          result.longitude
        );


      item.innerHTML = `
        <span class="search-suggestion-icon">
          📍
        </span>

        <span class="search-suggestion-content">
          <strong>
            ${escapeHtml(
              result.name ||
              "未知城市"
            )}
          </strong>

          <small>
            ${escapeHtml(
              locationName
            )}
          </small>
        </span>
      `;


      item.dataset.index =
        String(index);


      item.addEventListener(
        "click",
        () => {

          onSelect(
            result,
            {
              latitude,
              longitude,
              locationName
            }
          );

          closeSuggestions();
        }
      );


      container.appendChild(
        item
      );
    }
  );


  container.classList.add(
    "show"
  );
}


// =========================================================
// 搜索框清空
// =========================================================

export function clearSearchInput() {

  const input =
    $("#searchInput");


  if (!input) {
    return;
  }


  input.value = "";


  input.focus();


  closeSuggestions();
}


// =========================================================
// 更新搜索清空按钮
// =========================================================

export function updateClearSearchButton() {

  const input =
    $("#searchInput");

  const button =
    $("#clearSearch");


  if (
    !input ||
    !button
  ) {
    return;
  }


  const hasValue =
    input.value.trim().length > 0;


  button.classList.toggle(
    "show",
    hasValue
  );
}


// =========================================================
// 更新收藏数量
// =========================================================

export function updateFavoriteCount(
  count
) {

  const element =
    $("#favoriteCount");


  if (!element) {
    return;
  }


  element.textContent =
    String(count);
}


// =========================================================
// 设置按钮禁用状态
// =========================================================

export function setButtonLoading(
  button,
  loading,
  loadingText = "加载中..."
) {

  if (!button) {
    return;
  }


  if (loading) {

    if (
      !button.dataset.originalText
    ) {

      button.dataset.originalText =
        button.textContent;
    }


    button.disabled =
      true;


    button.textContent =
      loadingText;

  } else {

    button.disabled =
      false;


    if (
      button.dataset.originalText
    ) {

      button.textContent =
        button.dataset.originalText;

      delete button.dataset.originalText;
    }
  }
}


// =========================================================
// 网络状态
// =========================================================

export function updateNetworkStatus() {

  if (
    navigator.onLine
  ) {

    setStatus("");

    return true;
  }


  setStatus(
    "当前处于离线状态，暂时无法获取最新天气"
  );


  return false;
}


// =========================================================
// 页面卸载前清理 Toast
// =========================================================

export function cleanupUI() {

  clearTimeout(
    toastTimer
  );

  toastTimer =
    null;
}