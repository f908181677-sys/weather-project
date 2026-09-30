const https = require("https");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = 5500;

const DATA_DIR = path.join(__dirname, "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

// =========================
// HTTPS 证书
// =========================

const HTTPS_OPTIONS = {
  key: fs.readFileSync(
    path.join(__dirname, "certs", "local-key.pem")
  ),

  cert: fs.readFileSync(
    path.join(__dirname, "certs", "local-cert.pem")
  )
};

// =========================
// 数据目录
// =========================

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, "[]", "utf8");
}

// =========================
// 读取用户
// =========================

function readUsers() {
  try {
    return JSON.parse(
      fs.readFileSync(USERS_FILE, "utf8")
    );
  } catch {
    return [];
  }
}

// =========================
// 保存用户
// =========================

function saveUsers(users) {
  fs.writeFileSync(
    USERS_FILE,
    JSON.stringify(users, null, 2),
    "utf8"
  );
}

// =========================
// 返回 JSON
// =========================

function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",

    "Access-Control-Allow-Origin": "*",

    "Access-Control-Allow-Methods":
      "GET, POST, DELETE, OPTIONS",

    "Access-Control-Allow-Headers":
      "Content-Type, X-User-Id"
  });

  res.end(JSON.stringify(data));
}

// =========================
// 获取用户 ID
// =========================

function getUserId(req) {
  return (
    req.headers["x-user-id"] ||
    crypto.randomUUID()
  );
}

// =========================
// 地址缓存
// =========================
//
// 相同/非常接近的 GPS 坐标不重复查询
//

const addressCache = new Map();

// Nominatim 公共服务需要控制请求速度
let lastGeocodeTime = 0;

function wait(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

// =========================
// 反向地理编码
// =========================

function reverseGeocode(latitude, longitude) {

  // 将坐标稍微取整用于缓存
  const cacheKey =
    `${latitude.toFixed(5)},${longitude.toFixed(5)}`;

  if (addressCache.has(cacheKey)) {
    return Promise.resolve(
      addressCache.get(cacheKey)
    );
  }

  return new Promise(async (resolve) => {

    // 控制请求间隔
    const now = Date.now();

    const waitTime =
      Math.max(
        0,
        1100 - (now - lastGeocodeTime)
      );

    if (waitTime > 0) {
      await wait(waitTime);
    }

    lastGeocodeTime = Date.now();

    const requestPath =
      "/reverse" +
      `?format=jsonv2` +
      `&lat=${encodeURIComponent(latitude)}` +
      `&lon=${encodeURIComponent(longitude)}` +
      `&zoom=18` +
      `&addressdetails=1` +
      `&accept-language=zh-CN`;

    const request =
      https.request(
        {
          hostname:
            "nominatim.openstreetmap.org",

          path:
            requestPath,

          method:
            "GET",

          headers: {
            "User-Agent":
              "WeatherProject/1.0 (local weather website)",

            "Referer":
              "https://localhost:5500/"
          }
        },

        response => {

          let body = "";

          response.on(
            "data",
            chunk => {
              body += chunk;
            }
          );

          response.on(
            "end",
            () => {

              try {

                if (
                  response.statusCode !== 200
                ) {

                  resolve(null);
                  return;
                }

                const data =
                  JSON.parse(body);

                const result = {
                  displayName:
                    data.display_name ||
                    "",

                  address:
                    data.address ||
                    {}
                };

                addressCache.set(
                  cacheKey,
                  result
                );

                resolve(result);

              } catch {

                resolve(null);
              }
            }
          );
        }
      );

    request.on(
      "error",
      error => {

        console.error(
          "地址查询失败：",
          error.message
        );

        resolve(null);
      }
    );

    request.end();
  });
}

// =========================
// 静态文件
// =========================

function serveFile(res, filePath) {

  fs.readFile(
    filePath,
    (err, data) => {

      if (err) {

        res.writeHead(
          404,
          {
            "Content-Type":
              "text/plain; charset=utf-8"
          }
        );

        res.end("页面不存在");

        return;
      }

      const ext =
        path.extname(filePath);

      const contentTypes = {

        ".html":
          "text/html; charset=utf-8",

        ".css":
          "text/css; charset=utf-8",

        ".js":
          "application/javascript; charset=utf-8",

        ".json":
          "application/json; charset=utf-8",

        ".png":
          "image/png",

        ".jpg":
          "image/jpeg",

        ".jpeg":
          "image/jpeg",

        ".svg":
          "image/svg+xml",

        ".ico":
          "image/x-icon"
      };

      res.writeHead(
        200,
        {
          "Content-Type":
            contentTypes[ext] ||
            "application/octet-stream"
        }
      );

      res.end(data);
    }
  );
}

// =========================
// HTTPS 服务器
// =========================

const server =
  https.createServer(
    HTTPS_OPTIONS,
    async (req, res) => {

      // =========================
      // OPTIONS
      // =========================

      if (
        req.method === "OPTIONS"
      ) {

        res.writeHead(
          204,
          {
            "Access-Control-Allow-Origin":
              "*",

            "Access-Control-Allow-Methods":
              "GET, POST, DELETE, OPTIONS",

            "Access-Control-Allow-Headers":
              "Content-Type, X-User-Id"
          }
        );

        res.end();

        return;
      }

      // =========================
      // 获取全部用户
      // =========================

      if (
        req.method === "GET" &&
        req.url === "/api/users"
      ) {

        const users =
          readUsers();

        users.sort(
          (a, b) =>
            new Date(b.time) -
            new Date(a.time)
        );

        sendJSON(
          res,
          200,
          users
        );

        return;
      }

      // =========================
      // 删除全部用户
      // =========================

      if (
        req.method === "DELETE" &&
        req.url === "/api/users"
      ) {

        saveUsers([]);

        addressCache.clear();

        sendJSON(
          res,
          200,
          {
            success: true,
            message:
              "全部用户记录已清除"
          }
        );

        return;
      }

      // =========================
      // 删除单个用户
      // =========================

      if (
        req.method === "DELETE" &&
        req.url.startsWith(
          "/api/users/"
        )
      ) {

        const userId =
          decodeURIComponent(
            req.url.substring(
              "/api/users/".length
            )
          );

        const users =
          readUsers();

        const newUsers =
          users.filter(
            user =>
              user.id !== userId
          );

        if (
          newUsers.length ===
          users.length
        ) {

          sendJSON(
            res,
            404,
            {
              success: false,
              message:
                "没有找到这个用户"
            }
          );

          return;
        }

        saveUsers(
          newUsers
        );

        sendJSON(
          res,
          200,
          {
            success: true,
            message:
              "用户记录已删除"
          }
        );

        return;
      }

      // =========================
      // 接收用户定位
      // =========================

      if (
        req.method === "POST" &&
        req.url === "/api/location"
      ) {

        let body = "";

        req.on(
          "data",
          chunk => {
            body += chunk;
          }
        );

        req.on(
          "end",
          async () => {

            try {

              const data =
                JSON.parse(body);

              if (
                typeof data.latitude !==
                  "number" ||

                typeof data.longitude !==
                  "number"
              ) {

                sendJSON(
                  res,
                  400,
                  {
                    success: false,
                    message:
                      "定位数据无效"
                  }
                );

                return;
              }

              const users =
                readUsers();

              const userId =
                getUserId(req);

              // =========================
              // 查询详细地址
              // =========================

              let locationInfo = null;

              try {

                locationInfo =
                  await reverseGeocode(
                    data.latitude,
                    data.longitude
                  );

              } catch (error) {

                console.error(
                  "地址解析异常：",
                  error.message
                );
              }

              // =========================
              // 地址字段
              // =========================

              const address =
                locationInfo?.address ||
                {};

              const record = {

                id:
                  userId,

                city:
                  data.city ||
                  address.city ||
                  address.town ||
                  address.municipality ||
                  "未知位置",

                latitude:
                  data.latitude,

                longitude:
                  data.longitude,

                accuracy:
                  typeof data.accuracy ===
                    "number"
                    ? data.accuracy
                    : null,

                // =========================
                // 详细地址
                // =========================

                address: {

                  displayName:
                    locationInfo?.displayName ||
                    "",

                  country:
                    address.country ||
                    "",

                  state:
                    address.state ||
                    address.province ||
                    "",

                  city:
                    address.city ||
                    address.municipality ||
                    address.town ||
                    "",

                  district:
                    address.city_district ||
                    address.district ||
                    address.county ||
                    "",

                  town:
                    address.town ||
                    address.suburb ||
                    "",

                  village:
                    address.village ||
                    address.hamlet ||
                    "",

                  neighbourhood:
                    address.neighbourhood ||
                    "",

                  road:
                    address.road ||
                    address.pedestrian ||
                    address.footway ||
                    "",

                  houseNumber:
                    address.house_number ||
                    "",

                  postcode:
                    address.postcode ||
                    ""
                },

                time:
                  new Date().toISOString()
              };

              // =========================
              // 更新用户
              // =========================

              const existingIndex =
                users.findIndex(
                  user =>
                    user.id ===
                    userId
                );

              if (
                existingIndex >= 0
              ) {

                users[
                  existingIndex
                ] = record;

              } else {

                users.push(
                  record
                );
              }

              saveUsers(
                users
              );

              sendJSON(
                res,
                200,
                {
                  success: true,

                  userId:

                    userId,

                  address:
                    record.address
                }
              );

            } catch (error) {

              console.error(
                "定位数据处理失败：",
                error
              );

              sendJSON(
                res,
                400,
                {
                  success: false,
                  message:
                    "数据格式错误"
                }
              );
            }
          }
        );

        return;
      }

      // =========================
      // 静态网页文件
      // =========================

      let requestPath =
        req.url.split("?")[0];

      if (
        requestPath === "/"
      ) {

        requestPath =
          "/index.html";
      }

      const filePath =
        path.join(
          __dirname,
          requestPath
        );

      // 防止访问项目目录之外的文件
      if (
        !filePath.startsWith(
          __dirname
        )
      ) {

        sendJSON(
          res,
          403,
          {
            success: false,
            message:
              "禁止访问"
          }
        );

        return;
      }

      serveFile(
        res,
        filePath
      );
    }
  );

// =========================
// 启动服务器
// =========================

server.listen(
  PORT,
  () => {

    console.log("");

    console.log(
      "================================"
    );

    console.log(
      "天气网站 HTTPS 后台服务器已启动"
    );

    console.log(
      "================================"
    );

    console.log("");

    console.log(
      `天气网站：https://localhost:${PORT}`
    );

    console.log(
      `局域网网站：https://192.168.31.177:${PORT}`
    );

    console.log(
      `后台管理：https://localhost:${PORT}/admin.html`
    );

    console.log(
      `用户接口：https://localhost:${PORT}/api/users`
    );

    console.log("");

  }
);