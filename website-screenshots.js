(function () {

  var API_BASE =

    (typeof window.__MG_API_BASE__ === "string" && window.__MG_API_BASE__) || "http://localhost:3000";

  var gallery = document.querySelector("#gallery .gallery");

  var dotsRoot = document.querySelector("#gallery [data-gallery-dots]");

  if (!gallery || !dotsRoot) return;



  var FALLBACK_SLIDES = [

    { thumb: "site/gallery-shot1.png", full: "site/gallery-shot1.png", title: "Скриншот 1" },

    { thumb: "site/gallery-shot2.png", full: "site/gallery-shot2.png", title: "Скриншот 2" },

    { thumb: "site/gallery-shot3.png", full: "site/gallery-shot3.png", title: "Скриншот 3" },

    { thumb: "site/gallery-shot4.png", full: "site/gallery-shot4.png", title: "Скриншот 4" },

  ];



  function escapeHtml(s) {

    return String(s)

      .replace(/&/g, "&amp;")

      .replace(/</g, "&lt;")

      .replace(/>/g, "&gt;")

      .replace(/"/g, "&quot;");

  }



  function renderGallery(slides) {

    var shotsHtml = "";

    var dotsHtml = "";

    for (var i = 0; i < slides.length; i++) {

      var slide = slides[i] || {};

      var title = escapeHtml(slide.title || "Скриншот " + (i + 1));

      var thumb = escapeHtml(slide.thumb || "");

      var full = escapeHtml(slide.full || slide.thumb || "");

      if (!thumb) continue;

      shotsHtml +=

        '<button type="button" class="gallery-shot' +

        (i === 0 ? " is-active" : "") +

        '" data-index="' +

        i +

        '">' +

        '<img src="' +

        thumb +

        '" data-lightbox-src="' +

        full +

        '" alt="' +

        title +

        '" decoding="async" referrerpolicy="no-referrer" />' +

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

  }



  async function loadScreenshots() {

    try {

      var r = await fetch(API_BASE.replace(/\/$/, "") + "/screenshots");

      if (!r.ok) throw new Error("HTTP " + r.status);

      var items = await r.json();

      if (Array.isArray(items) && items.length) {

        var mapped = [];

        for (var i = 0; i < items.length; i++) {

          var item = items[i] || {};

          var full = (item.image && item.image.url) || item.imageUrl || "";

          var thumb =

            item.thumbUrl || (item.image && item.image.thumbUrl) || full;

          if (!full && !thumb) continue;

          if (!full) full = thumb;

          if (!thumb) thumb = full;

          mapped.push({

            thumb: thumb,

            full: full,

            title: item.title || "Скриншот " + (i + 1),

          });

        }

        if (mapped.length) {

          renderGallery(mapped);

          return;

        }

      }

    } catch (e) {}

    renderGallery(FALLBACK_SLIDES);

  }



  void loadScreenshots();

})();

