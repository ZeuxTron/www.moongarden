(function () {
  var header = document.querySelector(".site-header");
  var scroller = document.querySelector("[data-site-scroll-area]");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var mobileMq = window.matchMedia("(max-width: 560px), (pointer: coarse)");

  function headerScrollPad() {
    if (!header) return 12;
    if (mobileMq.matches) return 18;
    return 12;
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
  var mobileMq = window.matchMedia("(max-width: 560px), (pointer: coarse)");
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
  var infoEntry = null;
  var newsEntry = null;
  for (var si = 0; si < sections.length; si++) {
    if (sections[si].id === "info") {
      infoEntry = sections[si];
    }
    if (sections[si].id === "news") {
      newsEntry = sections[si];
    }
  }

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
    var rootHeight = scroller ? scroller.clientHeight : window.innerHeight || 0;
    var bestId = "top";
    var activationLine = mobileMq.matches ? 170 : 120;
    var focusLine = rootHeight * (mobileMq.matches ? 0.42 : 0.35);

    if (infoEntry && infoEntry.el) {
      var infoRect = infoEntry.el.getBoundingClientRect();
      var infoTop = infoRect.top - rootTop;
      var infoBottom = infoRect.bottom - rootTop;
      var infoVisible = infoTop < rootHeight * 0.65 && infoBottom > rootHeight * 0.2;
      var atEnd = false;
      if (scroller) {
        atEnd = scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 4;
      } else {
        var pageHeight = document.documentElement.scrollHeight || document.body.scrollHeight || 0;
        var scrollY = window.scrollY || window.pageYOffset || 0;
        atEnd = scrollY + (window.innerHeight || 0) >= pageHeight - 4;
      }
      if (atEnd || infoVisible) {
        setActive("info");
        return;
      }
    }

    if (newsEntry && newsEntry.el) {
      var newsRect = newsEntry.el.getBoundingClientRect();
      var newsBottom = newsRect.bottom - rootTop;
      if (newsBottom < focusLine) {
        setActive("info");
        return;
      }
    }

    var passedByFocus = "top";
    sections.forEach(function (entry) {
      if (entry.id === "top" || entry.id === "info") return;
      var rectFocus = entry.el.getBoundingClientRect();
      var topFocus = rectFocus.top - rootTop;
      if (topFocus <= focusLine) passedByFocus = entry.id;
    });
    if (passedByFocus !== "top") {
      setActive(passedByFocus);
      return;
    }

    var bestOverlap = 0;
    var lastPassedId = "top";
    sections.forEach(function (entry) {
      if (entry.id === "top") return;
      var rect = entry.el.getBoundingClientRect();
      var top = rect.top - rootTop;
      var bottom = rect.bottom - rootTop;
      var overlap = Math.max(0, Math.min(bottom, rootHeight) - Math.max(top, 0));
      if (overlap > bestOverlap) {
        bestOverlap = overlap;
        bestId = entry.id;
      }
      if (top <= activationLine) {
        lastPassedId = entry.id;
      }
    });
    if (bestOverlap < 24 && lastPassedId !== "top") {
      bestId = lastPassedId;
    }
    setActive(bestId);
  }

  if ("IntersectionObserver" in window && !mobileMq.matches) {
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
    var ticking = false;
    var onScroll = function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        pickByScroll();
      });
    };
    if (scroller) scroller.addEventListener("scroll", onScroll, { passive: true });
    else window.addEventListener("scroll", onScroll, { passive: true });
  } else {
    var tickingFallback = false;
    var onScrollFallback = function () {
      if (tickingFallback) return;
      tickingFallback = true;
      requestAnimationFrame(function () {
        tickingFallback = false;
        pickByScroll();
      });
    };
    if (scroller) scroller.addEventListener("scroll", onScrollFallback, { passive: true });
    else window.addEventListener("scroll", onScrollFallback, { passive: true });
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

(function () {
  var root = document.getElementById("site-lightbox");
  if (!root) {
    window.siteLightbox = { open: function () {}, close: function () {} };
    return;
  }
  var imgEl = root.querySelector(".site-lightbox__img");
  var capEl = root.querySelector("[data-lightbox-caption]");
  var btnPrev = root.querySelector("[data-lightbox-prev]");
  var btnNext = root.querySelector("[data-lightbox-next]");
  var closeEls = root.querySelectorAll("[data-lightbox-close]");

  var items = [];
  var index = 0;
  var onIndexChange = null;
  var isOpen = false;
  var closeTimer = null;

  function render() {
    if (!imgEl || !items.length) return;
    var it = items[index] || {};
    imgEl.src = it.src || "";
    imgEl.alt = it.alt || "";
    if (capEl) {
      var cap = it.caption != null && it.caption !== "" ? it.caption : it.alt || "";
      if (cap) {
        capEl.textContent = cap;
        capEl.hidden = false;
      } else {
        capEl.textContent = "";
        capEl.hidden = true;
      }
    }
    var multi = items.length > 1;
    if (btnPrev) btnPrev.hidden = !multi;
    if (btnNext) btnNext.hidden = !multi;
  }

  function go(i) {
    if (!items.length) return;
    index = (i + items.length) % items.length;
    render();
    if (typeof onIndexChange === "function") onIndexChange(index);
  }

  function onDocKey(e) {
    if (!isOpen) return;
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      close();
    }
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;
    root.classList.remove("is-open");
    document.removeEventListener("keydown", onDocKey, true);
    if (closeTimer) clearTimeout(closeTimer);
    closeTimer = setTimeout(function () {
      closeTimer = null;
      root.setAttribute("hidden", "");
      root.setAttribute("aria-hidden", "true");
      items = [];
      onIndexChange = null;
      if (imgEl) {
        imgEl.removeAttribute("src");
        imgEl.alt = "";
      }
    }, 280);
  }

  function open(opts) {
    opts = opts || {};
    if (opts.items && opts.items.length) {
      items = opts.items.map(function (x) {
        return {
          src: x.src || "",
          alt: x.alt || "",
          caption: x.caption != null ? x.caption : undefined,
        };
      });
    } else if (opts.src) {
      items = [{ src: opts.src, alt: opts.alt || "", caption: opts.caption }];
    } else {
      return;
    }
    index = Math.max(0, Math.min(opts.index || 0, items.length - 1));
    if (opts.caption != null && items[index]) items[index].caption = opts.caption;
    onIndexChange = typeof opts.onIndexChange === "function" ? opts.onIndexChange : null;

    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }
    root.removeAttribute("hidden");
    root.setAttribute("aria-hidden", "false");
    isOpen = true;
    render();
    document.addEventListener("keydown", onDocKey, true);
    requestAnimationFrame(function () {
      root.classList.add("is-open");
    });
  }

  closeEls.forEach(function (el) {
    el.addEventListener("click", function () {
      close();
    });
  });
  if (btnPrev) btnPrev.addEventListener("click", function () { go(index - 1); });
  if (btnNext) btnNext.addEventListener("click", function () { go(index + 1); });

  window.siteLightbox = { open: open, close: close };
})();

window.initGallerySlider = function () {
  var shots = document.querySelectorAll(".gallery-shot");
  var prev = document.querySelector("[data-gallery-prev]");
  var next = document.querySelector("[data-gallery-next]");
  var dotsRoot = document.querySelector("[data-gallery-dots]");

  if (!shots.length) return;

  var index = 0;

  function collectGalleryItems() {
    var out = [];
    for (var s = 0; s < shots.length; s++) {
      var img = shots[s].querySelector("img");
      if (!img) continue;
      var lb = img.getAttribute("data-lightbox-src");
      out.push({
        src: (lb && lb.trim()) || img.currentSrc || img.src || "",
        alt: img.getAttribute("alt") || "",
      });
    }
    return out;
  }

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
        if (window.siteLightbox && typeof window.siteLightbox.open === "function") {
          var galleryItems = collectGalleryItems();
          if (galleryItems.length) {
            window.siteLightbox.open({
              items: galleryItems,
              index: idx,
              onIndexChange: function (i) {
                go(i);
              },
            });
          }
        }
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
  /** Якорь вида #slug новости — не запускать автопрокрутку слайдов. */
  var autoAdvanceDisabled = false;
  var disableAutoOnMobile = window.matchMedia("(max-width: 560px), (pointer: coarse)").matches;
  var hoverPaused = false;
  var isPointerDown = false;
  var pointerStartX = 0;
  var pointerStartY = 0;
  var pointerId = null;
  var coarsePointer =
    typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches;
  var swipeThreshold = coarsePointer ? 36 : 48;

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
    if (autoAdvanceDisabled) return;
    if (hoverPaused) return;
    if (disableAutoOnMobile) return;
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
    if (autoAdvanceDisabled) {
      stopAuto();
    } else if (!hoverPaused) {
      scheduleAuto();
    } else {
      stopAuto();
    }
  }

  function indexFromHash() {
    var h = window.location.hash.slice(1);
    if (!h) return 0;
    for (var i = 0; i < slides.length; i++) {
      if (slides[i].id === h) return i;
    }
    return 0;
  }

  function hashMatchesNewsSlide() {
    var h = window.location.hash.slice(1);
    if (!h) return false;
    for (var j = 0; j < slides.length; j++) {
      if (slides[j].id === h) return true;
    }
    return false;
  }

  function scrollToHashNewsArticle() {
    var hid = window.location.hash.slice(1);
    if (!hid) return;
    requestAnimationFrame(function () {
      var el = document.getElementById(hid);
      if (el && typeof el.scrollIntoView === "function") {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
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

  autoAdvanceDisabled = hashMatchesNewsSlide();
  go(indexFromHash());
  if (autoAdvanceDisabled) {
    stopAuto();
    scrollToHashNewsArticle();
  }
};

(function () {
  function apiBase() {
    var b =
      typeof window.__MG_API_BASE__ === "string" && String(window.__MG_API_BASE__).trim();
    return (b ? b.replace(/\/$/, "") : "http://localhost:3000");
  }
  function applyLauncherDownloadUrlFromConfig() {
    var u =
      typeof window.__MG_LAUNCHER_DOWNLOAD_URL__ === "string" &&
      window.__MG_LAUNCHER_DOWNLOAD_URL__.trim();
    if (!u) return;
    document.querySelectorAll("a[data-mg-launcher-download]").forEach(function (a) {
      a.setAttribute("href", u.trim());
    });
  }
  async function applyLauncherDownloadUrlFromApi() {
    try {
      var r = await fetch(apiBase() + "/launcher/release");
      if (!r.ok) return;
      var data = await r.json();
      if (!data || !data.useCustomLauncherDownloadUrl) return;
      var u = data.effectiveLauncherDownloadUrl;
      if (typeof u !== "string" || !String(u).trim()) return;
      var href = String(u).trim();
      document.querySelectorAll("a[data-mg-launcher-download]").forEach(function (a) {
        a.setAttribute("href", href);
      });
    } catch (e) {}
  }
  applyLauncherDownloadUrlFromConfig();
  void applyLauncherDownloadUrlFromApi();
})();

(function () {
  var docsModal = document.getElementById("docs-modal");
  var docsModalTitle = document.getElementById("docs-modal-title");
  var docsModalContent = document.getElementById("docs-modal-content");
  var openers = document.querySelectorAll("[data-doc-open]");
  if (!docsModal || !docsModalTitle || !docsModalContent || !openers.length) return;

  var docs = {
    rules: {
      title: "Правила проекта",
      html:
        "<h3>Общие положения</h3>" +
        "<p>Уважайте других игроков и администрацию, не используйте оскорбления, дискриминацию и провокации в чате или личных сообщениях.</p>" +
        "<h3>Игровой процесс</h3>" +
        "<ul><li>Запрещены читы, дюпы, макросы и любой софт, дающий нечестное преимущество.</li><li>Запрещён гриферство, кража и умышленная порча чужих построек без согласия владельца.</li><li>Эксплуатация багов допускается только после сообщения администрации и до фикса запрещена.</li></ul>" +
        "<h3>Модерация</h3>" +
        "<p>За нарушение правил применяются предупреждения, муты, временные блокировки и бан. Администрация оставляет право пересмотра санкций в зависимости от ситуации.</p>",
    },
    privacy: {
      title: "Политика конфиденциальности",
      html:
        "<h3>Какие данные мы обрабатываем</h3>" +
        "<p>Для работы аккаунта мы храним технические данные профиля: логин, дату регистрации, служебные токены авторизации и настройки, необходимые для работы сервиса.</p>" +
        "<h3>Цели обработки</h3>" +
        "<p>Данные используются только для аутентификации, поддержки функций сайта/лаунчера, безопасности и предотвращения злоупотреблений.</p>" +
        "<h3>Передача и защита</h3>" +
        "<p>Мы не продаём персональные данные третьим лицам. Доступ к служебным данным ограничен, применяются стандартные меры защиты инфраструктуры и логирования.</p>" +
        "<h3>Обратная связь</h3>" +
        "<p>По вопросам удаления или уточнения данных обращайтесь в официальные каналы проекта (Discord/Telegram), указанные в футере сайта.</p>",
    },
  };

  function openDoc(kind) {
    var doc = docs[kind];
    if (!doc) return;
    docsModalTitle.textContent = doc.title;
    docsModalContent.innerHTML = doc.html;
    docsModal.hidden = false;
    docsModal.setAttribute("aria-hidden", "false");
  }

  function closeDoc() {
    docsModal.hidden = true;
    docsModal.setAttribute("aria-hidden", "true");
  }

  openers.forEach(function (btn) {
    btn.addEventListener("click", function () {
      openDoc(btn.getAttribute("data-doc-open"));
    });
  });

  docsModal.addEventListener("click", function (e) {
    var closeBtn = e.target && e.target.closest && e.target.closest("[data-doc-close]");
    if (closeBtn) closeDoc();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !docsModal.hidden) closeDoc();
  });
})();
