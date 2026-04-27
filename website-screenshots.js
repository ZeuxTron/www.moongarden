(function () {
  var API_BASE =
    (typeof window.__MG_API_BASE__ === "string" && window.__MG_API_BASE__) || "http://localhost:3000";
  var gallery = document.querySelector("#gallery .gallery");
  var dotsRoot = document.querySelector("#gallery [data-gallery-dots]");
  if (!gallery || !dotsRoot) return;

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  async function loadScreenshots() {
    try {
      var r = await fetch(API_BASE.replace(/\/$/, "") + "/screenshots");
      if (!r.ok) throw new Error("HTTP " + r.status);
      var items = await r.json();
      if (!Array.isArray(items) || !items.length) return;

      var shotsHtml = "";
      var dotsHtml = "";
      for (var i = 0; i < items.length; i++) {
        var item = items[i] || {};
        var title = escapeHtml(item.title || "Скриншот " + (i + 1));
        var src = escapeHtml((item.image && item.image.url) || item.imageUrl || "");
        if (!src) continue;
        shotsHtml +=
          '<button type="button" class="gallery-shot' +
          (i === 0 ? " is-active" : "") +
          '" data-index="' +
          i +
          '">' +
          '<img src="' +
          src +
          '" alt="' +
          title +
          '" decoding="async" />' +
          "</button>";
        dotsHtml +=
          '<button type="button" data-index="' +
          i +
          '" ' +
          (i === 0 ? 'class="is-active" ' : "") +
          'aria-label="Слайд ' +
          (i + 1) +
          '"></button>';
      }
      if (!shotsHtml) return;
      gallery.innerHTML = shotsHtml;
      dotsRoot.innerHTML = dotsHtml;
      if (typeof window.initGallerySlider === "function") {
        window.initGallerySlider();
      }
    } catch (e) {}
  }

  void loadScreenshots();
})();
