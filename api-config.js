/**
 * Базовый URL API MoonGarden и опционально прямой URL установщика лаунчера.
 * Для продакшена см. [api-config.prod.example.js](api-config.prod.example.js) и [DEPLOY.md](../DEPLOY.md).
 */
(function () {
  if (typeof window.__MG_LAUNCHER_DOWNLOAD_URL__ !== "string") {
    window.__MG_LAUNCHER_DOWNLOAD_URL__ = "";
  }
  if (typeof window.__MG_API_BASE__ !== "string" || !window.__MG_API_BASE__) {
    window.__MG_API_BASE__ = "http://localhost:3000";
  }
})();
