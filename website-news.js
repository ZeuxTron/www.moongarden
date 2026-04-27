(function () {
  var API_BASE =
    (typeof window.__MG_API_BASE__ === "string" && window.__MG_API_BASE__) || "http://localhost:3000";
  var section = document.getElementById("news");
  var root = document.getElementById("news-root");
  var statusEl = document.getElementById("news-fetch-status");
  if (!section || !root) return;

  section.addEventListener("click", function (e) {
    var hero = e.target.closest(".site-news__hero");
    if (!hero || !section.contains(hero)) return;
    if (!window.siteLightbox || typeof window.siteLightbox.open !== "function") return;
    var lb = hero.getAttribute("data-lightbox-src");
    var src = (lb && lb.trim()) || hero.currentSrc || hero.src;
    if (!src) return;
    var art = hero.closest(".site-news-article");
    var titleEl = art && art.querySelector(".site-news-title");
    var caption = titleEl ? String(titleEl.textContent || "").trim() : "";
    window.siteLightbox.open({
      items: [{ src: src, alt: hero.getAttribute("alt") || "", caption: caption }],
      index: 0,
    });
  });

  var HERO_VARIANTS = ["site-news__hero--tl", "site-news__hero--lc", "site-news__hero--br"];
  var COLD_WAIT_MS = 20000;
  var FETCH_TIMEOUT_MS = 8000;
  var RETRY_DELAY_MS = 2500;
  var MAX_RETRIES = 8;

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function absApiUrl(path) {
    var p = String(path || "");
    if (p.startsWith("http://") || p.startsWith("https://")) return p;
    var base = String(API_BASE || "").replace(/\/$/, "");
    if (!p.startsWith("/")) p = "/" + p;
    return base + p;
  }

  function formatRuDate(iso) {
    try {
      var d = new Date(iso);
      if (Number.isNaN(d.getTime())) return "";
      return d.toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch (e) {
      return "";
    }
  }

  function navSvgPrev() {
    return (
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
      '<polyline points="15 18 9 12 15 6" /></svg>'
    );
  }

  function navSvgNext() {
    return (
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
      '<polyline points="9 18 15 12 9 6" /></svg>'
    );
  }

  function wait(ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms);
    });
  }

  function withTimeout(ms, taskFactory) {
    return new Promise(function (resolve, reject) {
      var done = false;
      var timer = setTimeout(function () {
        if (done) return;
        done = true;
        reject(new Error("timeout"));
      }, ms);
      Promise.resolve()
        .then(taskFactory)
        .then(function (value) {
          if (done) return;
          done = true;
          clearTimeout(timer);
          resolve(value);
        })
        .catch(function (err) {
          if (done) return;
          done = true;
          clearTimeout(timer);
          reject(err);
        });
    });
  }

  function renderWakeupStatus(elapsedSec) {
    root.innerHTML =
      '<div class="news-coldstart-box">' +
      '<p class="news-fetch-status news-fetch-status--wakeup">Сервер просыпается, подождите немного…</p>' +
      '<p class="news-fetch-substatus">Обычно это занимает до минуты. Прошло: ' +
      escapeHtml(String(elapsedSec)) +
      " сек.</p>" +
      "</div>";
  }

  function renderFallbackText(message, substatus) {
    root.innerHTML =
      '<div class="news-coldstart-box">' +
      '<p class="news-fetch-status">' +
      escapeHtml(message) +
      "</p>" +
      '<p class="news-fetch-substatus">' +
      escapeHtml(substatus || "") +
      "</p>" +
      "</div>";
  }

  function heroClassForItem(item, index) {
    var k = String(item.heroLayout || "").trim().toLowerCase();
    if (k === "tl" || k === "lc" || k === "br") {
      return "site-news__hero--" + k;
    }
    return HERO_VARIANTS[index % HERO_VARIANTS.length];
  }

  function buildArticleHtml(item, index) {
    var slug = escapeHtml(item.slug);
    var title = escapeHtml(item.title);
    var excerpt = escapeHtml(item.excerpt);
    var imgFull = escapeHtml(absApiUrl(item.imageUrl));
    var imgThumb = escapeHtml(absApiUrl(item.imageThumbUrl || item.imageUrl));
    var heroClass = heroClassForItem(item, index);
    var paras = String(item.body || "")
      .split(/\n\s*\n/)
      .map(function (x) {
        return x.trim();
      })
      .filter(Boolean);
    var bodyParts = "";
    for (var i = 0; i < paras.length; i++) {
      bodyParts += "<p>" + escapeHtml(paras[i]) + "</p>";
    }
    var dt = new Date(item.publishedAt);
    var iso = Number.isNaN(dt.getTime()) ? "" : dt.toISOString().slice(0, 10);
    var label = formatRuDate(item.publishedAt);
    return (
      '<article id="' +
      slug +
      '" class="site-news-article" data-news-slide>' +
      '<div class="site-news-card">' +
      '<div class="server-card-head site-news-head">' +
      '<span class="product-mark-box product-mark-box--site" aria-hidden="true">' +
      '<img class="product-mark product-mark--site" src="site/product.png" width="44" height="44" alt="" decoding="async" />' +
      "</span>" +
      '<div class="server-card-main">' +
      '<div class="server-card-title-row">' +
      '<h3 class="site-news-title">' +
      title +
      "</h3>" +
      "</div></div>" +
      '<div class="site-news-head-nav" aria-label="Навигация по новостям">' +
      '<button type="button" class="gallery-nav gallery-nav--prev" data-news-prev aria-label="Предыдущая новость">' +
      navSvgPrev() +
      "</button>" +
      '<button type="button" class="gallery-nav gallery-nav--next" data-news-next aria-label="Следующая новость">' +
      navSvgNext() +
      "</button>" +
      "</div></div>" +
      '<div class="server-meta-panel site-news-meta">' +
      '<div class="site-news-prose">' +
      '<img class="site-news__hero ' +
      heroClass +
      '" src="' +
      imgThumb +
      '" data-lightbox-src="' +
      imgFull +
      '" width="1200" height="675" alt="" decoding="async" referrerpolicy="no-referrer" title="Открыть в полный размер" />' +
      '<p class="site-news-lead">' +
      excerpt +
      "</p>" +
      bodyParts +
      "</div></div>" +
      '<p class="site-news-published"><time datetime="' +
      escapeHtml(iso) +
      '">' +
      escapeHtml(label) +
      "</time></p>" +
      "</div></article>"
    );
  }

  async function load() {
    try {
      var startedAt = Date.now();
      var retries = 0;
      var items = null;
      while (retries < MAX_RETRIES) {
        var elapsedMs = Date.now() - startedAt;
        if (elapsedMs >= COLD_WAIT_MS) {
          renderWakeupStatus(Math.max(1, Math.round(elapsedMs / 1000)));
        } else if (statusEl) {
          statusEl.textContent = "Загрузка новостей…";
        }

        try {
          var r = await withTimeout(FETCH_TIMEOUT_MS, function () {
            return fetch(API_BASE.replace(/\/$/, "") + "/news?limit=50");
          });
          if (!r.ok) throw new Error("HTTP " + r.status);
          items = await r.json();
          break;
        } catch (e) {
          retries += 1;
          if (retries >= MAX_RETRIES) throw e;
          await wait(RETRY_DELAY_MS);
        }
      }
      if (!Array.isArray(items) || !items.length) {
        root.innerHTML =
          '<p class="news-fetch-status">Новостей пока нет. Загляните позже.</p>';
        return;
      }
      var dots = "";
      for (var d = 0; d < items.length; d++) {
        dots +=
          '<button type="button" data-index="' +
          d +
          '" class="' +
          (d === 0 ? "is-active" : "") +
          '" aria-label="Новость ' +
          (d + 1) +
          '"></button>';
      }
      var articles = "";
      for (var i = 0; i < items.length; i++) {
        articles += buildArticleHtml(items[i], i);
      }
      root.innerHTML =
        '<div class="news-slider-viewport">' +
        '<div class="news-track" data-news-track>' +
        articles +
        "</div></div>" +
        '<div class="gallery-dots news-dots" data-news-dots>' +
        dots +
        "</div>";
      if (typeof window.initNewsSlider === "function") {
        window.initNewsSlider(section);
      }
    } catch (err) {
      renderFallbackText(
        "Сервер просыпается, подождите немного…",
        "Обычно это занимает до минуты. Обновите страницу чуть позже."
      );
    }
  }

  load();
})();
