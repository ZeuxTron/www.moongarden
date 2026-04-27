(function () {
  var header = document.querySelector(".site-header");
  var scroller = document.querySelector("[data-site-scroll-area]");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function headerScrollPad() {
    return header ? 12 : 12;
  }

  document.addEventListener(
    "click",
    function (e) {
      if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest("a[href^='#']");
      if (!a) return;
      var href = a.getAttribute("href");
      if (!href || href === "#") return;

      var id = href.slice(1);
      var behavior = reduceMotion.matches ? "auto" : "smooth";

      if (id === "top") {
        e.preventDefault();
        if (scroller) scroller.scrollTo({ top: 0, behavior: behavior });
        else window.scrollTo({ top: 0, behavior: behavior });
        if (history.replaceState) history.replaceState(null, "", href);
        return;
      }

      var el = document.getElementById(id);
      if (!el) return;

      e.preventDefault();
      if (scroller) {
        var y =
          el.getBoundingClientRect().top -
          scroller.getBoundingClientRect().top +
          scroller.scrollTop -
          headerScrollPad();
        scroller.scrollTo({ top: Math.max(0, y), behavior: behavior });
      } else {
        var yWindow = el.getBoundingClientRect().top + window.scrollY - headerScrollPad();
        window.scrollTo({ top: Math.max(0, yWindow), behavior: behavior });
      }
      if (history.replaceState) history.replaceState(null, "", href);
    },
    false
  );
})();

(function () {
  var scroller = document.querySelector("[data-site-scroll-area]");
  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".nav-links a[href^='#']"));
  if (!navLinks.length) return;

  var map = {};
  var sections = [];
  navLinks.forEach(function (link) {
    var href = link.getAttribute("href");
    if (!href || href === "#") return;
    map[href.slice(1)] = link;
  });

  Object.keys(map).forEach(function (id) {
    var el = id === "top" ? document.getElementById("top") : document.getElementById(id);
    if (el) sections.push({ id: id, el: el });
  });
  if (!sections.length) return;

  function setActive(id) {
    navLinks.forEach(function (link) {
      var active = link.getAttribute("href") === "#" + id;
      link.classList.toggle("is-active", active);
      if (active) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }

  function pickByScroll() {
    var rootTop = scroller ? scroller.getBoundingClientRect().top : 0;
    var bestId = "top";
    var bestTop = Infinity;
    sections.forEach(function (entry) {
      if (entry.id === "top") return;
      var top = entry.el.getBoundingClientRect().top - rootTop;
      if (top <= 120 && Math.abs(top) < bestTop) {
        bestTop = Math.abs(top);
        bestId = entry.id;
      }
    });
    if (bestId === "top") {
      var scrollTop = scroller ? scroller.scrollTop : window.scrollY || window.pageYOffset || 0;
      if (scrollTop > 120) {
        var nearestId = "top";
        var nearest = Infinity;
        sections.forEach(function (entry) {
          if (entry.id === "top") return;
          var t = Math.abs(entry.el.getBoundingClientRect().top - rootTop);
          if (t < nearest) {
            nearest = t;
            nearestId = entry.id;
          }
        });
        bestId = nearestId;
      }
    }
    setActive(bestId);
  }

  if ("IntersectionObserver" in window) {
    var activeId = "top";
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting && entry.target && entry.target.id) {
            activeId = entry.target.id;
          }
        });
        setActive(activeId || "top");
      },
      {
        root: scroller || null,
        rootMargin: "-20% 0px -60% 0px",
        threshold: [0.1, 0.25, 0.5],
      }
    );
    sections.forEach(function (entry) {
      if (entry.id !== "top") io.observe(entry.el);
    });
    if (scroller) scroller.addEventListener("scroll", pickByScroll, { passive: true });
    else window.addEventListener("scroll", pickByScroll, { passive: true });
  } else {
    if (scroller) scroller.addEventListener("scroll", pickByScroll, { passive: true });
    else window.addEventListener("scroll", pickByScroll, { passive: true });
  }

  pickByScroll();
})();

(function () {
  var hero = document.querySelector(".hero");
  var scroller = document.querySelector("[data-site-scroll-area]");
  if (!hero) return;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function updateHeroOpacity() {
    if (reduceMotion.matches) {
      hero.style.removeProperty("--hero-opacity");
      return;
    }
    var y = scroller ? scroller.scrollTop : window.scrollY || window.pageYOffset;
    var heroH = hero.offsetHeight || 1;
    var fadeEnd = heroH * 0.72;
    var t = fadeEnd <= 0 ? 0 : y / fadeEnd;
    if (t < 0) t = 0;
    if (t > 1) t = 1;
    var opacity = 1 - t * 0.94;
    if (opacity < 0) opacity = 0;
    hero.style.setProperty("--hero-opacity", String(opacity));
  }

  var scheduled = false;
  function onScrollOrResize() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(function () {
      scheduled = false;
      updateHeroOpacity();
    });
  }

  if (scroller) scroller.addEventListener("scroll", onScrollOrResize, { passive: true });
  else window.addEventListener("scroll", onScrollOrResize, { passive: true });
  window.addEventListener("resize", onScrollOrResize);
  reduceMotion.addEventListener("change", updateHeroOpacity);
  updateHeroOpacity();
})();

window.initGallerySlider = function () {
  var shots = document.querySelectorAll(".gallery-shot");
  var prev = document.querySelector("[data-gallery-prev]");
  var next = document.querySelector("[data-gallery-next]");
  var dotsRoot = document.querySelector("[data-gallery-dots]");

  if (!shots.length) return;

  var index = 0;

  function go(i) {
    index = (i + shots.length) % shots.length;
    for (var s = 0; s < shots.length; s++) {
      shots[s].classList.toggle("is-active", s === index);
    }
    if (dotsRoot) {
      var dots = dotsRoot.querySelectorAll("button");
      for (var d = 0; d < dots.length; d++) {
        dots[d].classList.toggle("is-active", d === index);
      }
    }
  }

  if (prev) prev.onclick = function () { go(index - 1); };
  if (next) next.onclick = function () { go(index + 1); };

  if (dotsRoot) {
    dotsRoot.onclick = function (e) {
      var t = e.target;
      if (t && t.matches("button[data-index]")) {
        go(parseInt(t.getAttribute("data-index"), 10));
      }
    };
  }

  for (var i = 0; i < shots.length; i++) {
    (function (idx) {
      shots[idx].onclick = function () {
        go(idx);
      };
    })(i);
  }

  go(0);
};

(function () {
  if (typeof window.initGallerySlider === "function") {
    window.initGallerySlider();
  }
})();

window.initNewsSlider = function (newsSection) {
  if (!newsSection) return;
  var slides = newsSection.querySelectorAll("[data-news-slide]");
  var track = newsSection.querySelector("[data-news-track]");
  var viewport = newsSection.querySelector(".news-slider-viewport");
  var prevBtns = newsSection.querySelectorAll("[data-news-prev]");
  var nextBtns = newsSection.querySelectorAll("[data-news-next]");
  var dotsRoot = newsSection.querySelector("[data-news-dots]");

  if (!slides.length || !track) return;

  newsSection.style.setProperty("--news-slides", String(slides.length));

  var index = 0;
  var autoTimer = null;
  var intervalMs = 7000;
  var hoverPaused = false;
  var isPointerDown = false;
  var pointerStartX = 0;
  var pointerStartY = 0;
  var pointerId = null;
  var swipeThreshold = 48;

  function isInteractiveTarget(target) {
    if (!target || !target.closest) return false;
    return Boolean(
      target.closest(
        "a, button, input, textarea, select, label, [role='button'], [contenteditable='true']"
      )
    );
  }

  function isTextContentTarget(target) {
    if (!target || !target.closest) return false;
    return Boolean(
      target.closest(
        ".site-news-prose, .site-news-title, .site-news-lead, .site-news-published, p, h1, h2, h3, h4, h5, h6, time"
      )
    );
  }

  function stopAuto() {
    if (autoTimer) {
      clearInterval(autoTimer);
      autoTimer = null;
    }
  }

  function scheduleAuto() {
    stopAuto();
    if (hoverPaused) return;
    autoTimer = setInterval(function () {
      go(index + 1);
    }, intervalMs);
  }

  function syncTransform() {
    var pct = (100 / slides.length) * index;
    track.style.transform = "translateX(-" + pct + "%)";
  }

  function go(i) {
    index = (i + slides.length) % slides.length;
    syncTransform();
    for (var s = 0; s < slides.length; s++) {
      slides[s].setAttribute("aria-hidden", s === index ? "false" : "true");
    }
    if (dotsRoot) {
      var dots = dotsRoot.querySelectorAll("button");
      for (var d = 0; d < dots.length; d++) {
        dots[d].classList.toggle("is-active", d === index);
      }
    }
    if (!hoverPaused) scheduleAuto();
    else stopAuto();
  }

  function indexFromHash() {
    var h = window.location.hash.slice(1);
    if (!h) return 0;
    for (var i = 0; i < slides.length; i++) {
      if (slides[i].id === h) return i;
    }
    return 0;
  }

  if (dotsRoot) {
    dotsRoot.addEventListener("click", function (e) {
      var t = e.target;
      if (t && t.matches("button[data-index]")) {
        go(parseInt(t.getAttribute("data-index"), 10));
      }
    });
  }

  if (prevBtns.length) {
    prevBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        go(index - 1);
      });
    });
  }

  if (nextBtns.length) {
    nextBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        go(index + 1);
      });
    });
  }

  window.addEventListener("hashchange", function () {
    go(indexFromHash());
  });

  if (newsSection) {
    newsSection.addEventListener("mouseenter", function () {
      hoverPaused = true;
      stopAuto();
    });
    newsSection.addEventListener("mouseleave", function () {
      hoverPaused = false;
      scheduleAuto();
    });
  }

  if (viewport && window.PointerEvent) {
    viewport.addEventListener("pointerdown", function (e) {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      if (isInteractiveTarget(e.target)) return;
      /* На ПК не перехватываем pointer на текстовых узлах, чтобы не ломать выделение. */
      if (e.pointerType === "mouse" && isTextContentTarget(e.target)) return;
      isPointerDown = true;
      pointerId = e.pointerId;
      pointerStartX = e.clientX;
      pointerStartY = e.clientY;
      hoverPaused = true;
      stopAuto();
      viewport.classList.add("is-dragging");
      if (viewport.setPointerCapture) viewport.setPointerCapture(e.pointerId);
    });

    viewport.addEventListener("pointerup", function (e) {
      if (!isPointerDown || (pointerId !== null && e.pointerId !== pointerId)) return;
      var dx = e.clientX - pointerStartX;
      var dy = e.clientY - pointerStartY;
      if (Math.abs(dx) > swipeThreshold && Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0) go(index + 1);
        else go(index - 1);
      } else {
        scheduleAuto();
      }
      isPointerDown = false;
      pointerId = null;
      hoverPaused = false;
      viewport.classList.remove("is-dragging");
      if (viewport.releasePointerCapture && e.pointerId !== undefined) {
        try {
          viewport.releasePointerCapture(e.pointerId);
        } catch (err) {}
      }
    });

    viewport.addEventListener("pointercancel", function (e) {
      if (!isPointerDown || (pointerId !== null && e.pointerId !== pointerId)) return;
      isPointerDown = false;
      pointerId = null;
      hoverPaused = false;
      viewport.classList.remove("is-dragging");
      scheduleAuto();
    });
  }

  go(indexFromHash());
};

(function () {
  function applyLauncherDownloadUrl() {
    var u =
      typeof window.__MG_LAUNCHER_DOWNLOAD_URL__ === "string" &&
      window.__MG_LAUNCHER_DOWNLOAD_URL__.trim();
    if (!u) return;
    document.querySelectorAll("a[data-mg-launcher-download]").forEach(function (a) {
      a.setAttribute("href", u.trim());
    });
  }
  applyLauncherDownloadUrl();
})();
