/**
 * Базовый URL API MoonGarden.
 * Для продакшена см. [api-config.prod.example.js](api-config.prod.example.js) и [DEPLOY.md](../DEPLOY.md).
 */
(function () {
  if (typeof window.__MG_API_BASE__ === "string" && window.__MG_API_BASE__) return;
  window.__MG_API_BASE__ = "http://localhost:3000";
})();
