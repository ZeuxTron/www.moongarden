(function () {
  var API_BASE =
    (typeof window.__MG_API_BASE__ === "string" && window.__MG_API_BASE__) || "http://localhost:3000";
  var section = document.getElementById("news");
  var root = document.getElementById("news-root");
  var statusEl = document.getElementById("news-fetch-status");
  if (!section || !root) return;

  var HERO_VARIANTS = ["site-news__hero--tl", "site-news__hero--lc", "site-news__hero--br"];

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function absApiUrl(path) {
    var base = String(API_BASE || "").replace(/\/$/, "");
    var p = String(path || "");
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

  function buildArticleHtml(item, index) {
    var slug = escapeHtml(item.slug);
    var title = escapeHtml(item.title);
    var excerpt = escapeHtml(item.excerpt);
    var imgUrl = escapeHtml(absApiUrl(item.imageUrl));
    var heroClass = HERO_VARIANTS[index % HERO_VARIANTS.length];
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
      imgUrl +
      '" width="1200" height="675" alt="" decoding="async" />' +
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
      var r = await fetch(API_BASE.replace(/\/$/, "") + "/news?limit=50");
      if (!r.ok) throw new Error("HTTP " + r.status);
      var items = await r.json();
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
      var stub =
        "Новости сейчас недоступны. Загляните позже — мы обязательно что-нибудь расскажем.";
      if (statusEl) {
        statusEl.textContent = stub;
      } else {
        root.innerHTML =
          '<p class="news-fetch-status">' + escapeHtml(stub) + "</p>";
      }
    }
  }

  load();
})();
