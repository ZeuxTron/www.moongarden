/**
 * Базовый URL API MoonGarden и опционально прямой URL установщика лаунчера.
 * Для продакшена см. [api-config.prod.example.js](api-config.prod.example.js) и [DEPLOY.md](../DEPLOY.md).
 */
(function () {
  window.__MG_API_BASE__ = "https://moongarden-bk9g.onrender.com";
  if (typeof window.__MG_LAUNCHER_DOWNLOAD_URL__ !== "string") {
    window.__MG_LAUNCHER_DOWNLOAD_URL__ = "";
  }
})();
