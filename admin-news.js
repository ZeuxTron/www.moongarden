(function () {
  var API_BASE =
    (typeof window.__MG_API_BASE__ === "string" && window.__MG_API_BASE__) || "http://localhost:3000";
  var MG_ACCESS = "mg_access";

  var denied = document.getElementById("admin-denied");
  var app = document.getElementById("admin-app");
  var adminHint = document.getElementById("admin-hint");
  var modeBtns = Array.prototype.slice.call(document.querySelectorAll("[data-admin-mode-btn]"));
  var newsModePanel = document.getElementById("admin-mode-news");
  var shotModePanel = document.getElementById("admin-mode-screenshots");
  var serverModePanel = document.getElementById("admin-mode-servers");
  var launcherModePanel = document.getElementById("admin-mode-launcher");

  var form = document.getElementById("news-form");
  var formTitle = document.getElementById("form-title");
  var editSlug = document.getElementById("edit-slug");
  var fTitle = document.getElementById("f-title");
  var fSlug = document.getElementById("f-slug");
  var fExcerpt = document.getElementById("f-excerpt");
  var fBody = document.getElementById("f-body");
  var fDate = document.getElementById("f-date");
  var fHeroLayout = document.getElementById("f-hero-layout");
  var fHeroLayoutTrigger = document.getElementById("f-hero-layout-trigger");
  var fHeroLayoutMenu = document.getElementById("f-hero-layout-menu");
  var fHeroLayoutLabel = document.getElementById("f-hero-layout-label");
  var fImage = document.getElementById("f-image");
  var fImageId = document.getElementById("f-image-id");
  var fImagePreview = document.getElementById("f-image-preview");
  var formMsg = document.getElementById("form-msg");
  var listEl = document.getElementById("news-list");
  var listMsg = document.getElementById("list-msg");
  var btnReset = document.getElementById("btn-reset");

  var shotForm = document.getElementById("shot-form");
  var shotFormTitle = document.getElementById("shot-form-title");
  var shotEditId = document.getElementById("shot-edit-id");
  var shotTitle = document.getElementById("shot-title");
  var shotUrl = document.getElementById("shot-url");
  var shotImageId = document.getElementById("shot-image-id");
  var shotImagePreview = document.getElementById("shot-image-preview");
  var shotOrder = document.getElementById("shot-order");
  var shotVisible = document.getElementById("shot-visible");
  var shotFormMsg = document.getElementById("shot-form-msg");
  var shotList = document.getElementById("shot-list");
  var shotListMsg = document.getElementById("shot-list-msg");
  var shotResetBtn = document.getElementById("shot-reset");

  var serverForm = document.getElementById("server-form");
  var serverFormTitle = document.getElementById("server-form-title");
  var serverEditId = document.getElementById("server-edit-id");
  var serverImage = document.getElementById("server-image");
  var serverTitle = document.getElementById("server-title");
  var serverSlug = document.getElementById("server-slug");
  var serverTagline = document.getElementById("server-tagline");
  var serverMeta1 = document.getElementById("server-meta1");
  var serverMeta2 = document.getElementById("server-meta2");
  var serverMeta3 = document.getElementById("server-meta3");
  var serverMcHost = document.getElementById("server-mc-host");
  var serverMcPort = document.getElementById("server-mc-port");
  var serverManifestUrl = document.getElementById("server-manifest-url");
  var serverManifestMirrors = document.getElementById("server-manifest-mirrors");
  var serverSyncStrict = document.getElementById("server-sync-strict");
  var serverOrder = document.getElementById("server-order");
  var serverVisible = document.getElementById("server-visible");
  var serverFormMsg = document.getElementById("server-form-msg");
  var serverList = document.getElementById("server-list");
  var serverListMsg = document.getElementById("server-list-msg");
  var serverResetBtn = document.getElementById("server-reset");

  var launcherForm = document.getElementById("launcher-release-form");
  var launcherVersion = document.getElementById("launcher-version");
  var launcherMinVersion = document.getElementById("launcher-min-version");
  var launcherSeverity = document.getElementById("launcher-severity");
  var launcherCustomUrl = document.getElementById("launcher-custom-url");
  var launcherDownloadUrl = document.getElementById("launcher-download-url");
  var launcherDefaultServerEnabled = document.getElementById("launcher-default-server-enabled");
  var launcherDefaultServerMcHost = document.getElementById("launcher-default-server-mc-host");
  var launcherDefaultServerMcPort = document.getElementById("launcher-default-server-mc-port");
  var launcherManifestUrl = document.getElementById("launcher-manifest-url");
  var launcherManifestMirrors = document.getElementById("launcher-manifest-mirrors");
  var launcherSyncStrict = document.getElementById("launcher-sync-strict");
  var launcherReleaseMsg = document.getElementById("launcher-release-msg");

  var lmBroadcastForm = document.getElementById("lm-broadcast-form");
  var lmBroadcastMsg = document.getElementById("lm-broadcast-msg");
  var lmBroadcastRead = document.getElementById("lm-broadcast-read");
  var lmBroadcastUnread = document.getElementById("lm-broadcast-unread");
  var lmBroadcastReceiptsBtn = document.getElementById("lm-broadcast-receipts-btn");
  var lmBroadcastDeleteBtn = document.getElementById("lm-broadcast-delete-btn");
  var lmPersonalForm = document.getElementById("lm-personal-form");
  var lmPersonalMsg = document.getElementById("lm-personal-msg");
  var lmPersonalReceiptsBtn = document.getElementById("lm-personal-receipts-btn");
  var lmPersonalDeleteBtn = document.getElementById("lm-personal-delete-btn");
  var lmPersonalReceiptsOut = document.getElementById("lm-personal-receipts-out");

  var mediaRoot = document.getElementById("admin-media-root");
  var mediaPark = document.getElementById("admin-media-park");
  var hostNews = document.getElementById("admin-media-host-news");
  var hostScreenshots = document.getElementById("admin-media-host-screenshots");
  var mediaList = document.getElementById("media-picker-list");
  var mediaMsg = document.getElementById("media-msg");
  var mediaUploadForm = document.getElementById("media-upload-form");
  var mediaUploadInput = document.getElementById("media-upload-input");

  var previewCounter = document.querySelector("[data-news-preview-counter]");
  var previewPrev = document.querySelector("[data-news-preview-prev]");
  var previewNext = document.querySelector("[data-news-preview-next]");
  var previewBody = document.querySelector("[data-news-preview-body]");
  var previewBadge = previewBody && previewBody.querySelector(".admin-news-preview__badge");
  var previewImg = document.querySelector("[data-news-preview-img]");
  var previewTitle = document.querySelector("[data-news-preview-title]");
  var previewExcerpt = document.querySelector("[data-news-preview-excerpt]");
  var previewText = document.querySelector("[data-news-preview-text]");

  if (!form || !app || !denied || !shotForm || !serverForm || !launcherForm) return;

  var mediaItems = [];
  var newsCache = [];
  var previewIndex = 0;
  var bodyPreviewTimer = null;

  var HERO_LAYOUT_LABELS = {
    tl: "Слева сверху у текста",
    lc: "Слева, ниже (по центру колонки)",
    br: "Справа снизу",
  };

  function closeHeroLayoutMenu() {
    if (fHeroLayoutMenu) fHeroLayoutMenu.classList.remove("is-open");
    if (fHeroLayoutTrigger) fHeroLayoutTrigger.setAttribute("aria-expanded", "false");
  }

  function setHeroLayoutValue(raw) {
    if (!fHeroLayout) return;
    var k = String(raw || "").toLowerCase();
    if (k !== "lc" && k !== "br") k = "tl";
    fHeroLayout.value = k;
    if (fHeroLayoutLabel) fHeroLayoutLabel.textContent = HERO_LAYOUT_LABELS[k] || HERO_LAYOUT_LABELS.tl;
    var opts = document.querySelectorAll("[data-hero-layout]");
    for (var oi = 0; oi < opts.length; oi++) {
      var btn = opts[oi];
      var v = btn.getAttribute("data-hero-layout");
      btn.classList.toggle("is-selected", v === k);
    }
    if (previewIndex === 0) renderNewsPreview();
  }

  function token() {
    try {
      return localStorage.getItem(MG_ACCESS) || sessionStorage.getItem(MG_ACCESS) || "";
    } catch (e) {
      return "";
    }
  }

  function bindAdminPicker(opts) {
    var hidden = opts.hidden;
    var trigger = opts.trigger;
    var label = opts.label;
    var menu = opts.menu;
    var options = opts.options;
    if ((!options || !options.length) && menu) {
      options = menu.querySelectorAll('[role="option"]');
    }
    var defaultValue = opts.defaultValue != null ? String(opts.defaultValue) : "";
    var normalize =
      opts.normalize ||
      function (v) {
        return String(v || "");
      };
    var labels = opts.labels || {};
    var onChange = opts.onChange;

    function closeMenu() {
      if (menu) menu.classList.remove("is-open");
      if (trigger) trigger.setAttribute("aria-expanded", "false");
    }

    function applyValue(raw, silent) {
      var v = normalize(raw != null ? raw : "");
      if (hidden) hidden.value = v;
      var lab = labels[v] != null ? labels[v] : labels[defaultValue] != null ? labels[defaultValue] : v;
      if (label && lab != null && lab !== "") label.textContent = lab;
      if (options && options.length) {
        for (var i = 0; i < options.length; i++) {
          var btn = options[i];
          var ov = btn.getAttribute("data-value");
          btn.classList.toggle("is-selected", ov === v);
          btn.setAttribute("aria-selected", ov === v ? "true" : "false");
        }
      }
      if (!silent && typeof onChange === "function") onChange(v);
    }

    if (trigger && menu) {
      trigger.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        var open = menu.classList.toggle("is-open");
        trigger.setAttribute("aria-expanded", open ? "true" : "false");
      });
      document.addEventListener("click", function (e) {
        if (
          menu.classList.contains("is-open") &&
          !menu.contains(e.target) &&
          !trigger.contains(e.target)
        ) {
          closeMenu();
        }
      });
    }
    if (options && options.length) {
      for (var j = 0; j < options.length; j++) {
        (function (btn) {
          btn.addEventListener("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            var v = btn.getAttribute("data-value");
            applyValue(v);
            closeMenu();
          });
        })(options[j]);
      }
    }

    if (hidden && hidden.value) applyValue(hidden.value, true);
    else applyValue(defaultValue, true);

    return { setValue: applyValue, closeMenu: closeMenu };
  }

  var pickerLauncherSeverity = bindAdminPicker({
    hidden: launcherSeverity,
    trigger: document.getElementById("launcher-severity-trigger"),
    label: document.getElementById("launcher-severity-label"),
    menu: document.getElementById("launcher-severity-menu"),
    defaultValue: "simple",
    normalize: function (v) {
      return String(v || "").toLowerCase() === "critical" ? "critical" : "simple";
    },
    labels: {
      simple: "Simple — можно отложить («Позже»)",
      critical: "Legacy Critical — минимум = версия уведомления",
    },
  });

  var pickerLmBPrimaryMode = bindAdminPicker({
    hidden: document.getElementById("lm-b-primary-mode"),
    trigger: document.getElementById("lm-b-primary-mode-trigger"),
    label: document.getElementById("lm-b-primary-mode-label"),
    menu: document.getElementById("lm-b-primary-mode-menu"),
    defaultValue: "dismiss",
    normalize: function (v) {
      return String(v || "").toLowerCase() === "open_url" ? "open_url" : "dismiss";
    },
    labels: {
      dismiss: "Закрыть (Ок)",
      open_url: "Открыть ссылку (например «Перейти»)",
    },
  });

  var pickerLmPPrimaryMode = bindAdminPicker({
    hidden: document.getElementById("lm-p-primary-mode"),
    trigger: document.getElementById("lm-p-primary-mode-trigger"),
    label: document.getElementById("lm-p-primary-mode-label"),
    menu: document.getElementById("lm-p-primary-mode-menu"),
    defaultValue: "dismiss",
    normalize: function (v) {
      return String(v || "").toLowerCase() === "open_url" ? "open_url" : "dismiss";
    },
    labels: {
      dismiss: "Закрыть (Ок)",
      open_url: "Открыть ссылку",
    },
  });

  async function apiJson(method, path, bodyObj) {
    var headers = { Authorization: "Bearer " + token() };
    var opts = { method: method, headers: headers };
    if (bodyObj !== undefined) {
      opts.headers["Content-Type"] = "application/json";
      opts.body = JSON.stringify(bodyObj);
    }
    var r = await fetch(API_BASE.replace(/\/$/, "") + path, opts);
    var data = await r.json().catch(function () {
      return {};
    });
    if (!r.ok) throw new Error(data.error || "Ошибка " + r.status);
    return data;
  }

  async function checkAdmin() {
    var t = token();
    if (!t) return false;
    var r = await fetch(API_BASE.replace(/\/$/, "") + "/me", {
      headers: { Authorization: "Bearer " + t },
    });
    if (!r.ok) return false;
    var data = await r.json();
    return Boolean(data.isAdmin);
  }

  async function setAdminHintFromMe() {
    if (!adminHint) return;
    try {
      var r = await fetch(API_BASE.replace(/\/$/, "") + "/me", {
        headers: { Authorization: "Bearer " + token() },
      });
      if (!r.ok) return;
      var data = await r.json();
      var u = data.username ? String(data.username) : "";
      adminHint.textContent = u
        ? "Вы вошли с аккаунта администратора: «" + u + "»"
        : "Вы вошли как администратор.";
    } catch (e) {}
  }

  function bindMgFileInput(input) {
    if (!input) return;
    var wrap = input.closest(".mg-file");
    var nameEl = wrap && wrap.querySelector("[data-file-name]");
    if (!nameEl) return;
    function sync() {
      var f = input.files && input.files[0];
      nameEl.textContent = f ? f.name : "Файл не выбран";
    }
    input.addEventListener("change", sync);
    sync();
  }

  function syncServerFileLabel() {
    if (!serverImage) return;
    var wrap = serverImage.closest(".mg-file");
    var nameEl = wrap && wrap.querySelector("[data-file-name]");
    if (nameEl) nameEl.textContent = "Файл не выбран";
  }

  function syncMediaFileLabel() {
    if (!mediaUploadInput) return;
    var wrap = mediaUploadInput.closest(".mg-file");
    var nameEl = wrap && wrap.querySelector("[data-file-name]");
    if (nameEl) nameEl.textContent = "Файл не выбран";
  }

  function placeMediaHost(mode) {
    if (!mediaRoot || !mediaPark) return;
    if (mode === "news" && hostNews) {
      hostNews.appendChild(mediaRoot);
    } else if (mode === "screenshots" && hostScreenshots) {
      hostScreenshots.appendChild(mediaRoot);
    } else {
      mediaPark.appendChild(mediaRoot);
    }
  }

  function previewSlideCount() {
    return 1 + newsCache.length;
  }

  function clampPreviewIndex() {
    var n = previewSlideCount();
    if (n < 1) n = 1;
    if (previewIndex >= n) previewIndex = n - 1;
    if (previewIndex < 0) previewIndex = 0;
  }

  function firstBodyParagraph(text) {
    var paras = String(text || "")
      .split(/\n\s*\n/)
      .map(function (x) {
        return x.trim();
      })
      .filter(Boolean);
    return paras[0] || "";
  }

  function newsHeroClassFromKey(key) {
    var k = String(key || "").toLowerCase();
    if (k !== "tl" && k !== "lc" && k !== "br") k = "tl";
    return "site-news__hero site-news__hero--" + k;
  }

  function newsHeroClassFromForm() {
    return newsHeroClassFromKey(fHeroLayout && fHeroLayout.value);
  }

  function renderNewsPreview() {
    if (!previewBody || !previewTitle || !previewExcerpt || !previewText || !previewCounter) return;
    clampPreviewIndex();
    var total = previewSlideCount();
    previewCounter.textContent = previewIndex + 1 + " / " + total;

    if (previewIndex === 0) {
      if (previewBadge) {
        previewBadge.textContent = "Черновик";
        previewBadge.hidden = false;
      }
      previewTitle.textContent = fTitle.value.trim() || "Заголовок";
      previewExcerpt.textContent = fExcerpt.value.trim() || "Краткое описание";
      previewText.textContent = firstBodyParagraph(fBody.value) || "Текст новости…";
      var imgSrc = (fImagePreview && !fImagePreview.hidden && fImagePreview.src) || fImage.value.trim();
      if (imgSrc && previewImg) {
        previewImg.src = imgSrc;
        previewImg.className = newsHeroClassFromForm();
        previewImg.hidden = false;
      } else if (previewImg) {
        previewImg.hidden = true;
        previewImg.removeAttribute("src");
        previewImg.className = newsHeroClassFromForm();
      }
      return;
    }

    var item = newsCache[previewIndex - 1];
    if (!item) return;
    if (previewBadge) {
      previewBadge.textContent = "Опубликовано";
      previewBadge.hidden = false;
    }
    previewTitle.textContent = item.title || "";
    previewExcerpt.textContent = item.excerpt || "";
    previewText.textContent = firstBodyParagraph(item.body) || "";
    var url = String(item.imageUrl || "").trim();
    if (url && previewImg) {
      previewImg.src = url;
      previewImg.className = newsHeroClassFromKey(item.heroLayout);
      previewImg.hidden = false;
    } else if (previewImg) {
      previewImg.hidden = true;
      previewImg.removeAttribute("src");
      previewImg.className = newsHeroClassFromKey(item.heroLayout);
    }
  }

  function scheduleBodyPreview() {
    if (previewIndex !== 0) return;
    if (bodyPreviewTimer) clearTimeout(bodyPreviewTimer);
    bodyPreviewTimer = setTimeout(function () {
      bodyPreviewTimer = null;
      renderNewsPreview();
    }, 150);
  }

  function setFormMsg(text, isErr) {
    formMsg.textContent = text || "";
    formMsg.style.color = isErr ? "#f87171" : "";
  }
  function setShotFormMsg(text, isErr) {
    shotFormMsg.textContent = text || "";
    shotFormMsg.style.color = isErr ? "#f87171" : "";
  }
  function setServerFormMsg(text, isErr) {
    serverFormMsg.textContent = text || "";
    serverFormMsg.style.color = isErr ? "#f87171" : "";
  }

  function resetForm() {
    editSlug.value = "";
    fTitle.value = "";
    fSlug.value = "";
    fExcerpt.value = "";
    fBody.value = "";
    fDate.value = "";
    setHeroLayoutValue("tl");
    fImageId.value = "";
    fImage.value = "";
    if (fImagePreview) {
      fImagePreview.hidden = true;
      fImagePreview.removeAttribute("src");
    }
    formTitle.textContent = "Новая новость";
    setFormMsg("");
    previewIndex = 0;
    renderNewsPreview();
  }

  function resetShotForm() {
    shotEditId.value = "";
    shotTitle.value = "";
    shotImageId.value = "";
    shotUrl.value = "";
    if (shotImagePreview) {
      shotImagePreview.hidden = true;
      shotImagePreview.removeAttribute("src");
    }
    shotOrder.value = "0";
    shotVisible.checked = true;
    shotFormTitle.textContent = "Новый скриншот";
    setShotFormMsg("");
  }

  function setPreview(imgEl, src) {
    if (!imgEl) return;
    var url = String(src || "").trim();
    if (!url) {
      imgEl.hidden = true;
      imgEl.removeAttribute("src");
      return;
    }
    imgEl.src = url;
    imgEl.hidden = false;
  }

  function resetServerForm() {
    serverEditId.value = "";
    if (serverImage) serverImage.value = "";
    syncServerFileLabel();
    serverTitle.value = "";
    if (serverSlug) serverSlug.value = "";
    serverTagline.value = "";
    serverMeta1.value = "";
    serverMeta2.value = "";
    serverMeta3.value = "";
    if (serverMcHost) serverMcHost.value = "";
    if (serverMcPort) serverMcPort.value = "";
    if (serverManifestUrl) serverManifestUrl.value = "";
    if (serverManifestMirrors) serverManifestMirrors.value = "";
    if (serverSyncStrict) serverSyncStrict.checked = false;
    serverOrder.value = "0";
    serverVisible.checked = true;
    serverFormTitle.textContent = "Новая карточка сервера";
    setServerFormMsg("");
  }

  async function reorderNewsByIndex(fromIdx, toIdx) {
    if (!newsCache.length || fromIdx === toIdx) return;
    if (toIdx < 0 || toIdx >= newsCache.length) return;
    var slugs = newsCache.map(function (x) {
      return x.slug;
    });
    var t = slugs[fromIdx];
    slugs[fromIdx] = slugs[toIdx];
    slugs[toIdx] = t;
    listMsg.textContent = "";
    listMsg.style.color = "";
    try {
      await apiJson("POST", "/admin/news/reorder", { slugs: slugs });
      await loadList();
    } catch (e) {
      listMsg.textContent = e.message || String(e);
      listMsg.style.color = "#f87171";
    }
  }

  function localIsoForInput(d) {
    var pad = function (n) {
      return String(n).padStart(2, "0");
    };
    return (
      d.getFullYear() +
      "-" +
      pad(d.getMonth() + 1) +
      "-" +
      pad(d.getDate()) +
      "T" +
      pad(d.getHours()) +
      ":" +
      pad(d.getMinutes())
    );
  }

  async function loadList() {
    listMsg.textContent = "";
    listEl.innerHTML = "";
    newsCache = [];
    try {
      var items = await apiJson("GET", "/admin/news");
      if (!Array.isArray(items)) items = [];
      newsCache = items;
      if (!items.length) {
        listEl.innerHTML = "<li>Нет новостей</li>";
        previewIndex = 0;
        renderNewsPreview();
        return;
      }
      items.forEach(function (item, index) {
        var li = document.createElement("li");
        var left = document.createElement("div");
        left.innerHTML =
          "<strong>" +
          escapeHtml(item.title) +
          '</strong><div class="meta">' +
          escapeHtml(item.slug) +
          " · " +
          escapeHtml(item.publishedAt || "") +
          "</div>";
        var actions = document.createElement("div");
        actions.style.display = "flex";
        actions.style.gap = "8px";
        actions.style.flexWrap = "wrap";
        actions.style.alignItems = "center";
        var bUp = document.createElement("button");
        bUp.type = "button";
        bUp.className = "btn btn--ghost btn--sm";
        bUp.textContent = "↑";
        bUp.title = "Выше в списке";
        bUp.disabled = index === 0;
        bUp.addEventListener("click", function () {
          void reorderNewsByIndex(index, index - 1);
        });
        var bDown = document.createElement("button");
        bDown.type = "button";
        bDown.className = "btn btn--ghost btn--sm";
        bDown.textContent = "↓";
        bDown.title = "Ниже в списке";
        bDown.disabled = index === items.length - 1;
        bDown.addEventListener("click", function () {
          void reorderNewsByIndex(index, index + 1);
        });
        var bEdit = document.createElement("button");
        bEdit.type = "button";
        bEdit.className = "btn btn--ghost";
        bEdit.textContent = "Правка";
        bEdit.addEventListener("click", function () {
          startEdit(item);
        });
        var bDel = document.createElement("button");
        bDel.type = "button";
        bDel.className = "btn btn--ghost";
        bDel.textContent = "Удалить";
        bDel.addEventListener("click", function () {
          void deleteItem(item.slug);
        });
        actions.appendChild(bUp);
        actions.appendChild(bDown);
        actions.appendChild(bEdit);
        actions.appendChild(bDel);
        li.appendChild(left);
        li.appendChild(actions);
        listEl.appendChild(li);
      });
      clampPreviewIndex();
      renderNewsPreview();
    } catch (e) {
      listMsg.textContent = e.message || String(e);
      listMsg.style.color = "#f87171";
    }
  }

  async function loadShotList() {
    shotListMsg.textContent = "";
    shotList.innerHTML = "";
    try {
      var items = await apiJson("GET", "/admin/screenshots");
      if (!Array.isArray(items) || !items.length) {
        shotList.innerHTML = "<li>Нет скриншотов</li>";
        return;
      }
      items.forEach(function (item) {
        var li = document.createElement("li");
        var left = document.createElement("div");
        left.innerHTML =
          "<strong>" +
          escapeHtml(item.title || "") +
          '</strong><div class="meta">order=' +
          escapeHtml(String(item.order || 0)) +
          " · " +
          escapeHtml(item.isVisible ? "виден" : "скрыт") +
          '</div><div class="meta"><a href="' +
          escapeHtml(item.imageUrl || "") +
          '" target="_blank" rel="noopener">Открыть URL</a></div>';
        var actions = document.createElement("div");
        actions.style.display = "flex";
        actions.style.gap = "8px";
        actions.style.flexWrap = "wrap";

        var bEdit = document.createElement("button");
        bEdit.type = "button";
        bEdit.className = "btn btn--ghost";
        bEdit.textContent = "Правка";
        bEdit.addEventListener("click", function () {
          startShotEdit(item);
        });

        var bDel = document.createElement("button");
        bDel.type = "button";
        bDel.className = "btn btn--ghost";
        bDel.textContent = "Удалить";
        bDel.addEventListener("click", function () {
          void deleteShot(item.id);
        });

        actions.appendChild(bEdit);
        actions.appendChild(bDel);
        li.appendChild(left);
        li.appendChild(actions);
        shotList.appendChild(li);
      });
    } catch (e) {
      shotListMsg.textContent = e.message || String(e);
      shotListMsg.style.color = "#f87171";
    }
  }

  async function loadMediaList() {
    mediaItems = await apiJson("GET", "/admin/media");
    if (!Array.isArray(mediaItems)) mediaItems = [];
    renderMediaTiles();
  }

  async function loadServerList() {
    serverListMsg.textContent = "";
    serverList.innerHTML = "";
    try {
      var items = await apiJson("GET", "/admin/servers");
      if (!Array.isArray(items) || !items.length) {
        serverList.innerHTML = "<li>Нет карточек серверов</li>";
        return;
      }
      items.forEach(function (item) {
        var li = document.createElement("li");
        var left = document.createElement("div");
        left.innerHTML =
          "<strong>" +
          escapeHtml(item.title || "") +
          '</strong><div class="meta">slug=' +
          escapeHtml(item.slug || "") +
          '</div><div class="meta">' +
          escapeHtml(item.tagline || "") +
          '</div><div class="meta">order=' +
          escapeHtml(String(item.order || 0)) +
          " · " +
          escapeHtml(item.isVisible ? "виден" : "скрыт") +
          "</div>" +
          (item.mcHost || item.mcPort
            ? '<div class="meta">' +
              escapeHtml(String(item.mcHost || "")) +
              (item.mcPort != null ? ":" + escapeHtml(String(item.mcPort)) : "") +
              "</div>"
            : "");
        var actions = document.createElement("div");
        actions.style.display = "flex";
        actions.style.gap = "8px";
        actions.style.flexWrap = "wrap";
        var bEdit = document.createElement("button");
        bEdit.type = "button";
        bEdit.className = "btn btn--ghost";
        bEdit.textContent = "Правка";
        bEdit.addEventListener("click", function () {
          startServerEdit(item);
        });
        var bDel = document.createElement("button");
        bDel.type = "button";
        bDel.className = "btn btn--ghost";
        bDel.textContent = "Удалить";
        bDel.addEventListener("click", function () {
          void deleteServer(item.id);
        });
        actions.appendChild(bEdit);
        actions.appendChild(bDel);
        li.appendChild(left);
        li.appendChild(actions);
        serverList.appendChild(li);
      });
    } catch (e) {
      serverListMsg.textContent = e.message || String(e);
      serverListMsg.style.color = "#f87171";
    }
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function startEdit(item) {
    editSlug.value = item.slug;
    fTitle.value = item.title;
    fSlug.value = item.slug;
    fExcerpt.value = item.excerpt;
    fBody.value = item.body;
    fSlug.disabled = true;
    try {
      var d = new Date(item.publishedAt);
      if (!Number.isNaN(d.getTime())) fDate.value = localIsoForInput(d);
    } catch (e) {}
    fImage.value = "";
    fImageId.value = item.imageId || "";
    setHeroLayoutValue(item.heroLayout);
    setPreview(fImagePreview, item.imageUrl || "");
    formTitle.textContent = "Редактирование: " + item.slug;
    setFormMsg("");
    var idx = -1;
    for (var i = 0; i < newsCache.length; i++) {
      if (newsCache[i].slug === item.slug) {
        idx = i;
        break;
      }
    }
    previewIndex = idx >= 0 ? idx + 1 : 0;
    clampPreviewIndex();
    renderNewsPreview();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function startShotEdit(item) {
    shotEditId.value = item.id;
    shotTitle.value = item.title || "";
    shotImageId.value = item.imageId || "";
    shotUrl.value = item.imageUrl || "";
    setPreview(shotImagePreview, item.imageUrl || "");
    shotOrder.value = String(item.order || 0);
    shotVisible.checked = item.isVisible !== false;
    shotFormTitle.textContent = "Редактирование скриншота";
    setShotFormMsg("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function currentMediaTargetFromUi() {
    if (newsModePanel && !newsModePanel.hidden) return "news";
    if (shotModePanel && !shotModePanel.hidden) return "shot";
    return "";
  }

  function getSelectedMediaIdForTarget() {
    var t = currentMediaTargetFromUi();
    if (t === "news") return fImageId.value || "";
    if (t === "shot") return shotImageId.value || "";
    return "";
  }

  function applySelectedMedia(item) {
    if (!item) return;
    var t = currentMediaTargetFromUi();
    if (t !== "news" && t !== "shot") return;
    if (t === "news") {
      fImageId.value = item.fileId || item.id || "";
      fImage.value = item.url || "";
      setPreview(fImagePreview, item.url || "");
    } else {
      shotImageId.value = item.fileId || item.id || "";
      shotUrl.value = item.url || "";
      setPreview(shotImagePreview, item.url || "");
    }
    renderMediaTiles();
    if (previewIndex === 0) renderNewsPreview();
  }

  async function deleteMediaItem(item) {
    if (!item) return;
    if (!confirm("Удалить картинку из библиотеки и отвязать от новостей/скриншотов?")) return;
    await apiJson("DELETE", "/admin/media/" + encodeURIComponent(item.fileId || item.id));
    if ((fImageId.value || "") === (item.fileId || item.id)) {
      fImageId.value = "";
      fImage.value = "";
      setPreview(fImagePreview, "");
    }
    if ((shotImageId.value || "") === (item.fileId || item.id)) {
      shotImageId.value = "";
      shotUrl.value = "";
      setPreview(shotImagePreview, "");
    }
    await loadMediaList();
    await loadList();
    await loadShotList();
    renderNewsPreview();
  }

  function renderMediaTiles() {
    if (!mediaList) return;
    mediaList.innerHTML = "";
    if (!mediaItems.length) {
      mediaList.innerHTML =
        "<p class=\"admin-msg admin-media-picker__empty\">Библиотека пуста. Загрузите первое изображение.</p>";
      return;
    }
    var selectedId = getSelectedMediaIdForTarget();
    mediaItems.forEach(function (item) {
      var tile = document.createElement("article");
      tile.className = "admin-media-tile" + ((item.fileId || item.id) === selectedId ? " is-selected" : "");
      var img = document.createElement("img");
      img.src = item.thumbUrl || item.url;
      img.alt = "";
      var title = document.createElement("div");
      title.className = "admin-media-tile-title";
      title.textContent = item.title || item.fileId || "image";
      var actions = document.createElement("div");
      actions.className = "admin-media-tile-actions";
      var pickBtn = document.createElement("button");
      pickBtn.type = "button";
      pickBtn.className = "btn btn--ghost";
      pickBtn.textContent = "Выбрать";
      pickBtn.addEventListener("click", function () {
        applySelectedMedia(item);
      });
      var delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "btn btn--ghost";
      delBtn.textContent = "Удалить";
      delBtn.addEventListener("click", function () {
        void deleteMediaItem(item).catch(function (e) {
          mediaMsg.textContent = e.message || String(e);
          mediaMsg.style.color = "#f87171";
        });
      });
      actions.appendChild(pickBtn);
      actions.appendChild(delBtn);
      tile.appendChild(img);
      tile.appendChild(title);
      tile.appendChild(actions);
      mediaList.appendChild(tile);
    });
  }

  function startServerEdit(item) {
    serverEditId.value = item.id;
    if (serverImage) serverImage.value = "";
    syncServerFileLabel();
    serverTitle.value = item.title || "";
    if (serverSlug) serverSlug.value = item.slug || "";
    serverTagline.value = item.tagline || "";
    serverMeta1.value = item.meta1 || "";
    serverMeta2.value = item.meta2 || "";
    serverMeta3.value = item.meta3 || "";
    if (serverMcHost) serverMcHost.value = typeof item.mcHost === "string" ? item.mcHost : "";
    if (serverMcPort) {
      serverMcPort.value =
        item.mcPort != null && Number.isFinite(Number(item.mcPort)) ? String(item.mcPort) : "";
    }
    if (serverManifestUrl) serverManifestUrl.value = item.manifestUrl || "";
    if (serverManifestMirrors) {
      var mirrors = Array.isArray(item.manifestMirrors) ? item.manifestMirrors : [];
      serverManifestMirrors.value = mirrors.join("\n");
    }
    if (serverSyncStrict) serverSyncStrict.checked = String(item.syncMode || "").toLowerCase() === "strict";
    serverOrder.value = String(item.order || 0);
    serverVisible.checked = item.isVisible !== false;
    serverFormTitle.textContent = "Редактирование карточки сервера";
    setServerFormMsg("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteItem(slug) {
    if (!confirm("Удалить новость «" + slug + "»?")) return;
    try {
      await apiJson("DELETE", "/admin/news/" + encodeURIComponent(slug));
      await loadList();
      if (editSlug.value === slug) resetForm();
      fSlug.disabled = false;
    } catch (e) {
      alert(e.message || String(e));
    }
  }

  async function deleteShot(id) {
    if (!confirm("Удалить скриншот?")) return;
    try {
      await apiJson("DELETE", "/admin/screenshots/" + encodeURIComponent(id));
      await loadShotList();
      if (shotEditId.value === id) resetShotForm();
    } catch (e) {
      alert(e.message || String(e));
    }
  }

  function setLauncherMsg(text, isError) {
    if (!launcherReleaseMsg) return;
    launcherReleaseMsg.textContent = text || "";
    launcherReleaseMsg.style.color = isError ? "#f87171" : "";
  }

  function syncLauncherUrlField() {
    if (!launcherDownloadUrl || !launcherCustomUrl) return;
    var on = launcherCustomUrl.checked;
    launcherDownloadUrl.disabled = !on;
    launcherDownloadUrl.required = on;
  }

  function syncLauncherDefaultServerFields() {
    if (!launcherDefaultServerEnabled) return;
    var on = !!launcherDefaultServerEnabled.checked;
    if (launcherDefaultServerMcHost) launcherDefaultServerMcHost.disabled = !on;
    if (launcherDefaultServerMcPort) launcherDefaultServerMcPort.disabled = !on;
  }

  function setLmBroadcastMsg(text, isError) {
    if (!lmBroadcastMsg) return;
    lmBroadcastMsg.textContent = text || "";
    lmBroadcastMsg.style.color = isError ? "#f87171" : "";
  }
  function setLmPersonalMsg(text, isError) {
    if (!lmPersonalMsg) return;
    lmPersonalMsg.textContent = text || "";
    lmPersonalMsg.style.color = isError ? "#f87171" : "";
  }

  function renderLmUserList(ul, rows) {
    if (!ul) return;
    ul.innerHTML = "";
    if (!rows || !rows.length) {
      var li = document.createElement("li");
      li.textContent = "—";
      ul.appendChild(li);
      return;
    }
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      var item = document.createElement("li");
      var name = r.usernameDisplay || r.username || "?";
      var extra = r.readAt ? " · " + new Date(r.readAt).toLocaleString() : "";
      item.textContent = name + extra;
      ul.appendChild(item);
    }
  }

  async function refreshLmBroadcastReceipts() {
    if (!lmBroadcastRead || !lmBroadcastUnread) return;
    try {
      var d = await apiJson("GET", "/admin/launcher-messages/broadcast/receipts");
      renderLmUserList(lmBroadcastRead, d.read || []);
      renderLmUserList(lmBroadcastUnread, d.unread || []);
    } catch (e) {
      renderLmUserList(lmBroadcastRead, []);
      renderLmUserList(lmBroadcastUnread, []);
      setLmBroadcastMsg(e.message || String(e), true);
    }
  }

  async function loadLauncherMessagesAdmin() {
    if (!lmBroadcastForm) return;
    setLmBroadcastMsg("");
    setLmPersonalMsg("");
    try {
      var data = await apiJson("GET", "/admin/launcher-messages");
      var b = data.broadcast;
      var elTitle = document.getElementById("lm-b-title");
      var elBody = document.getElementById("lm-b-body");
      var elCv = document.getElementById("lm-b-cancel-visible");
      var elCl = document.getElementById("lm-b-cancel-label");
      var elPl = document.getElementById("lm-b-primary-label");
      var elPm = document.getElementById("lm-b-primary-mode");
      var elPu = document.getElementById("lm-b-primary-url");
      var elPil = document.getElementById("lm-b-primary-in-launcher");
      if (b) {
        if (elTitle) elTitle.value = b.title || "";
        if (elBody) elBody.value = b.body || "";
        if (elCv) elCv.checked = b.cancelVisible !== false;
        if (elCl) elCl.value = b.cancelLabel || "Отмена";
        if (elPl) elPl.value = b.primaryLabel || "Ок";
        if (elPm) elPm.value = b.primaryMode === "open_url" ? "open_url" : "dismiss";
        if (pickerLmBPrimaryMode) pickerLmBPrimaryMode.setValue(elPm ? elPm.value : "dismiss", true);
        if (elPu) elPu.value = b.primaryUrl || "";
        if (elPil) elPil.checked = b.primaryOpenInLauncher === true;
      } else {
        if (elTitle) elTitle.value = "";
        if (elBody) elBody.value = "";
        if (elCv) elCv.checked = true;
        if (elCl) elCl.value = "Отмена";
        if (elPl) elPl.value = "Ок";
        if (elPm) elPm.value = "dismiss";
        if (pickerLmBPrimaryMode) pickerLmBPrimaryMode.setValue("dismiss", true);
        if (elPu) elPu.value = "";
        if (elPil) elPil.checked = false;
      }
      await refreshLmBroadcastReceipts();
    } catch (e) {
      setLmBroadcastMsg(e.message || String(e), true);
    }
  }

  async function loadLauncherRelease() {
    setLauncherMsg("");
    try {
      var data = await apiJson("GET", "/admin/launcher-release");
      if (launcherVersion) {
        launcherVersion.value =
          data.releaseConfigured && data.latestVersion != null
            ? String(data.latestVersion)
            : "";
      }
      if (launcherMinVersion) {
        launcherMinVersion.value =
          data.minimumLauncherVersion != null && String(data.minimumLauncherVersion).trim()
            ? String(data.minimumLauncherVersion).trim()
            : "";
      }
      if (launcherSeverity) {
        launcherSeverity.value = data.updateSeverity === "critical" ? "critical" : "simple";
      }
      if (pickerLauncherSeverity && launcherSeverity) {
        pickerLauncherSeverity.setValue(launcherSeverity.value, true);
      }
      if (launcherCustomUrl) launcherCustomUrl.checked = !!data.useCustomLauncherDownloadUrl;
      if (launcherDownloadUrl) {
        launcherDownloadUrl.value = data.launcherDownloadUrl ? String(data.launcherDownloadUrl) : "";
      }
      if (launcherDefaultServerEnabled) launcherDefaultServerEnabled.checked = !!data.defaultServerCardEnabled;
      if (launcherDefaultServerMcHost) {
        launcherDefaultServerMcHost.value = data.defaultServerMcHost ? String(data.defaultServerMcHost) : "";
      }
      if (launcherDefaultServerMcPort) {
        launcherDefaultServerMcPort.value =
          data.defaultServerMcPort != null && Number.isFinite(Number(data.defaultServerMcPort))
            ? String(Number(data.defaultServerMcPort))
            : "";
      }
      if (launcherManifestUrl) {
        launcherManifestUrl.value = data.manifestUrl ? String(data.manifestUrl) : "";
      }
      if (launcherManifestMirrors) {
        var mirrors = data.manifestMirrors;
        if (Array.isArray(mirrors) && mirrors.length) {
          launcherManifestMirrors.value = mirrors.map(function (m) {
            return String(m || "").trim();
          }).filter(Boolean).join("\n");
        } else {
          launcherManifestMirrors.value = "";
        }
      }
      if (launcherSyncStrict) {
        launcherSyncStrict.checked = String(data.syncMode || "").toLowerCase() === "strict";
      }
      syncLauncherUrlField();
      syncLauncherDefaultServerFields();
    } catch (e) {
      setLauncherMsg(e.message || String(e), true);
    }
  }

  async function deleteServer(id) {
    if (!confirm("Удалить карточку сервера?")) return;
    try {
      await apiJson("DELETE", "/admin/servers/" + encodeURIComponent(id));
      await loadServerList();
      if (serverEditId.value === id) resetServerForm();
    } catch (e) {
      alert(e.message || String(e));
    }
  }

  function switchMode(mode) {
    var isNews = mode === "news";
    var isScreenshots = mode === "screenshots";
    var isServers = mode === "servers";
    var isLauncher = mode === "launcher";
    if (newsModePanel) newsModePanel.hidden = !isNews;
    if (shotModePanel) shotModePanel.hidden = !isScreenshots;
    if (serverModePanel) serverModePanel.hidden = !isServers;
    if (launcherModePanel) launcherModePanel.hidden = !isLauncher;
    if (isNews) placeMediaHost("news");
    else if (isScreenshots) placeMediaHost("screenshots");
    else placeMediaHost("servers");
    modeBtns.forEach(function (btn) {
      var active = btn.getAttribute("data-admin-mode-btn") === mode;
      btn.classList.toggle("is-active", active);
    });
    if (isNews || isScreenshots) {
      void loadMediaList().catch(function () {
        renderMediaTiles();
      });
    } else {
      renderMediaTiles();
    }
    if (isLauncher) {
      void loadLauncherRelease();
      void loadLauncherMessagesAdmin();
    }
  }

  modeBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      switchMode(btn.getAttribute("data-admin-mode-btn"));
    });
  });

  if (previewPrev) {
    previewPrev.addEventListener("click", function () {
      previewIndex -= 1;
      if (previewIndex < 0) previewIndex = previewSlideCount() - 1;
      renderNewsPreview();
    });
  }
  if (previewNext) {
    previewNext.addEventListener("click", function () {
      previewIndex += 1;
      if (previewIndex >= previewSlideCount()) previewIndex = 0;
      renderNewsPreview();
    });
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    setFormMsg("");
    var payload = {
      title: fTitle.value.trim(),
      excerpt: fExcerpt.value.trim(),
      body: fBody.value.trim(),
      imageId: (fImageId.value || "").trim(),
      imageUrl: (fImage.value || "").trim(),
      heroLayout: (fHeroLayout && fHeroLayout.value) || "tl",
    };
    if (fDate.value) {
      var iso = new Date(fDate.value).toISOString();
      payload.publishedAt = iso;
    }
    var slugVal = fSlug.value.trim();
    if (slugVal && !editSlug.value) payload.slug = slugVal;
    if (!payload.imageId && !payload.imageUrl) {
      setFormMsg("Добавьте изображение.", true);
      return;
    }

    var isEdit = Boolean(editSlug.value);
    var path = isEdit ? "/admin/news/" + encodeURIComponent(editSlug.value) : "/admin/news";
    var method = isEdit ? "PUT" : "POST";

    try {
      await apiJson(method, path, payload);
      setFormMsg("Сохранено.");
      fSlug.disabled = false;
      resetForm();
      await loadList();
    } catch (err) {
      setFormMsg(err.message || String(err), true);
    }
  });

  btnReset.addEventListener("click", function () {
    fSlug.disabled = false;
    resetForm();
  });

  shotResetBtn.addEventListener("click", function () {
    resetShotForm();
  });
  serverResetBtn.addEventListener("click", function () {
    resetServerForm();
  });

  shotForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    setShotFormMsg("");
    var payload = {
      title: shotTitle.value.trim(),
      imageId: (shotImageId.value || "").trim(),
      imageUrl: shotUrl.value.trim(),
      order: Number(shotOrder.value || 0),
      isVisible: !!shotVisible.checked,
    };
    var isEdit = Boolean(shotEditId.value);
    var method = isEdit ? "PUT" : "POST";
    var path = isEdit
      ? "/admin/screenshots/" + encodeURIComponent(shotEditId.value)
      : "/admin/screenshots";
    try {
      await apiJson(method, path, payload);
      setShotFormMsg("Сохранено.");
      resetShotForm();
      await loadShotList();
    } catch (err) {
      setShotFormMsg(err.message || String(err), true);
    }
  });

  ["input", "change"].forEach(function (ev) {
    if (fTitle) fTitle.addEventListener(ev, function () {
      if (previewIndex === 0) renderNewsPreview();
    });
    if (fExcerpt) fExcerpt.addEventListener(ev, function () {
      if (previewIndex === 0) renderNewsPreview();
    });
  });
  if (fBody) {
    fBody.addEventListener("input", scheduleBodyPreview);
  }
  if (fHeroLayoutTrigger && fHeroLayoutMenu) {
    fHeroLayoutTrigger.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      var open = fHeroLayoutMenu.classList.toggle("is-open");
      fHeroLayoutTrigger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.addEventListener("click", function (e) {
      if (
        fHeroLayoutMenu.classList.contains("is-open") &&
        !fHeroLayoutMenu.contains(e.target) &&
        !fHeroLayoutTrigger.contains(e.target)
      ) {
        closeHeroLayoutMenu();
      }
    });
    var heroOptBtns = document.querySelectorAll("[data-hero-layout]");
    for (var hi = 0; hi < heroOptBtns.length; hi++) {
      (function (btn) {
        btn.addEventListener("click", function () {
          var v = btn.getAttribute("data-hero-layout");
          setHeroLayoutValue(v);
          closeHeroLayoutMenu();
        });
      })(heroOptBtns[hi]);
    }
  }
  if (fImage) {
    fImage.addEventListener("input", function () {
      fImageId.value = "";
      setPreview(fImagePreview, fImage.value);
      if (previewIndex === 0) renderNewsPreview();
    });
  }
  if (shotUrl) {
    shotUrl.addEventListener("input", function () {
      shotImageId.value = "";
      setPreview(shotImagePreview, shotUrl.value);
    });
  }

  if (mediaUploadForm) {
    mediaUploadForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      mediaMsg.textContent = "";
      mediaMsg.style.color = "";
      if (!mediaUploadInput.files || !mediaUploadInput.files[0]) {
        mediaMsg.textContent = "Выберите файл перед загрузкой.";
        mediaMsg.style.color = "#f87171";
        return;
      }
      try {
        var fd = new FormData();
        fd.append("file", mediaUploadInput.files[0]);
        var r = await fetch(API_BASE.replace(/\/$/, "") + "/admin/media", {
          method: "POST",
          headers: { Authorization: "Bearer " + token() },
          body: fd,
        });
        var data = await r.json().catch(function () {
          return {};
        });
        if (!r.ok) throw new Error(data.error || "Ошибка " + r.status);
        mediaUploadInput.value = "";
        syncMediaFileLabel();
        mediaMsg.textContent = "Загрузка завершена.";
        await loadMediaList();
      } catch (err) {
        mediaMsg.textContent = err.message || String(err);
        mediaMsg.style.color = "#f87171";
      }
    });
  }

  if (launcherCustomUrl) {
    launcherCustomUrl.addEventListener("change", syncLauncherUrlField);
  }
  if (launcherDefaultServerEnabled) {
    launcherDefaultServerEnabled.addEventListener("change", syncLauncherDefaultServerFields);
  }
  launcherForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    setLauncherMsg("");
    try {
      var mirrorsLines = launcherManifestMirrors
        ? String(launcherManifestMirrors.value || "")
            .split(/\r?\n/)
            .map(function (s) {
              return s.trim();
            })
            .filter(Boolean)
        : [];
      await apiJson("PUT", "/admin/launcher-release", {
        latestVersion: launcherVersion ? launcherVersion.value.trim() : "",
        minimumLauncherVersion: launcherMinVersion ? launcherMinVersion.value.trim() : "",
        updateSeverity: launcherSeverity ? launcherSeverity.value : "simple",
        useCustomLauncherDownloadUrl: !!(launcherCustomUrl && launcherCustomUrl.checked),
        launcherDownloadUrl: launcherDownloadUrl ? launcherDownloadUrl.value.trim() : "",
        defaultServerCardEnabled: !!(launcherDefaultServerEnabled && launcherDefaultServerEnabled.checked),
        defaultServerMcHost: launcherDefaultServerMcHost ? launcherDefaultServerMcHost.value.trim() : "",
        defaultServerMcPort: launcherDefaultServerMcPort ? launcherDefaultServerMcPort.value.trim() : "",
        manifestUrl: launcherManifestUrl ? launcherManifestUrl.value.trim() : "",
        manifestMirrors: mirrorsLines,
        syncMode: launcherSyncStrict && launcherSyncStrict.checked ? "strict" : "soft",
      });
      setLauncherMsg("Сохранено.");
      await loadLauncherRelease();
    } catch (err) {
      setLauncherMsg(err.message || String(err), true);
    }
  });

  if (lmBroadcastForm) {
    lmBroadcastForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      setLmBroadcastMsg("");
      try {
        var elCv = document.getElementById("lm-b-cancel-visible");
        var elPil = document.getElementById("lm-b-primary-in-launcher");
        await apiJson("PUT", "/admin/launcher-messages/broadcast", {
          title: (document.getElementById("lm-b-title") || {}).value || "",
          body: (document.getElementById("lm-b-body") || {}).value || "",
          cancelVisible: !!(elCv && elCv.checked),
          cancelLabel: (document.getElementById("lm-b-cancel-label") || {}).value || "Отмена",
          primaryLabel: (document.getElementById("lm-b-primary-label") || {}).value || "Ок",
          primaryMode: (document.getElementById("lm-b-primary-mode") || {}).value || "dismiss",
          primaryUrl: (document.getElementById("lm-b-primary-url") || {}).value || "",
          primaryOpenInLauncher: !!(elPil && elPil.checked),
        });
        setLmBroadcastMsg("Сохранено. Ревизия увеличена — лаунчеры покажут сообщение заново непрочитавшим.");
        await loadLauncherMessagesAdmin();
      } catch (err) {
        setLmBroadcastMsg(err.message || String(err), true);
      }
    });
  }
  if (lmBroadcastReceiptsBtn) {
    lmBroadcastReceiptsBtn.addEventListener("click", function () {
      void refreshLmBroadcastReceipts();
    });
  }
  if (lmBroadcastDeleteBtn) {
    lmBroadcastDeleteBtn.addEventListener("click", async function () {
      setLmBroadcastMsg("");
      if (!confirm("Полностью удалить общее сообщение из БД?")) return;
      try {
        await apiJson("DELETE", "/admin/launcher-messages/broadcast");
        setLmBroadcastMsg("Общее сообщение удалено.");
        await loadLauncherMessagesAdmin();
      } catch (err) {
        setLmBroadcastMsg(err.message || String(err), true);
      }
    });
  }
  if (lmPersonalForm) {
    lmPersonalForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      setLmPersonalMsg("");
      var nick = ((document.getElementById("lm-p-username") || {}).value || "").trim().toLowerCase();
      if (!nick) {
        setLmPersonalMsg("Укажите ник.", true);
        return;
      }
      try {
        var elPCv = document.getElementById("lm-p-cancel-visible");
        await apiJson("PUT", "/admin/launcher-messages/personal/" + encodeURIComponent(nick), {
          title: (document.getElementById("lm-p-title") || {}).value || "",
          body: (document.getElementById("lm-p-body") || {}).value || "",
          cancelVisible: !!(elPCv && elPCv.checked),
          cancelLabel: (document.getElementById("lm-p-cancel-label") || {}).value || "Отмена",
          primaryLabel: (document.getElementById("lm-p-primary-label") || {}).value || "Ок",
          primaryMode: (document.getElementById("lm-p-primary-mode") || {}).value || "dismiss",
          primaryUrl: (document.getElementById("lm-p-primary-url") || {}).value || "",
        });
        setLmPersonalMsg("Сохранено для «" + nick + "».");
      } catch (err) {
        setLmPersonalMsg(err.message || String(err), true);
      }
    });
  }
  if (lmPersonalReceiptsBtn) {
    lmPersonalReceiptsBtn.addEventListener("click", async function () {
      setLmPersonalMsg("");
      var nick = ((document.getElementById("lm-p-username") || {}).value || "").trim().toLowerCase();
      if (!nick) {
        setLmPersonalMsg("Укажите ник.", true);
        return;
      }
      try {
        var d = await apiJson("GET", "/admin/launcher-messages/personal/" + encodeURIComponent(nick) + "/receipts");
        if (lmPersonalReceiptsOut) {
          lmPersonalReceiptsOut.hidden = false;
          lmPersonalReceiptsOut.textContent = JSON.stringify(d, null, 2);
        }
      } catch (err) {
        setLmPersonalMsg(err.message || String(err), true);
        if (lmPersonalReceiptsOut) lmPersonalReceiptsOut.hidden = true;
      }
    });
  }
  if (lmPersonalDeleteBtn) {
    lmPersonalDeleteBtn.addEventListener("click", async function () {
      setLmPersonalMsg("");
      var nick = ((document.getElementById("lm-p-username") || {}).value || "").trim().toLowerCase();
      if (!nick) {
        setLmPersonalMsg("Укажите ник.", true);
        return;
      }
      if (!confirm("Полностью удалить личное сообщение пользователя «" + nick + "» из БД?")) return;
      try {
        await apiJson("DELETE", "/admin/launcher-messages/personal/" + encodeURIComponent(nick));
        setLmPersonalMsg("Личное сообщение удалено для «" + nick + "».");
        if (lmPersonalReceiptsOut) {
          lmPersonalReceiptsOut.hidden = true;
          lmPersonalReceiptsOut.textContent = "";
        }
      } catch (err) {
        setLmPersonalMsg(err.message || String(err), true);
      }
    });
  }

  serverForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    setServerFormMsg("");
    var isEdit = Boolean(serverEditId.value);
    var fd = new FormData();
    var tagline = serverTagline.value
      .split(/[•,]/)
      .map(function (x) {
        return x.trim();
      })
      .filter(Boolean)
      .join(" • ");
    fd.append("title", serverTitle.value.trim());
    if (serverSlug) fd.append("slug", serverSlug.value.trim());
    fd.append("tagline", tagline);
    fd.append("meta1", serverMeta1.value.trim());
    fd.append("meta2", serverMeta2.value.trim());
    fd.append("meta3", serverMeta3.value.trim());
    if (serverMcHost) fd.append("mcHost", serverMcHost.value.trim());
    if (serverMcPort) fd.append("mcPort", String(serverMcPort.value || "").trim());
    if (serverManifestUrl) fd.append("manifestUrl", serverManifestUrl.value.trim());
    if (serverManifestMirrors) fd.append("manifestMirrors", serverManifestMirrors.value || "");
    if (serverSyncStrict) fd.append("syncMode", serverSyncStrict.checked ? "strict" : "soft");
    fd.append("order", String(Number(serverOrder.value || 0)));
    fd.append("isVisible", serverVisible.checked ? "true" : "false");
    if (serverImage.files && serverImage.files[0]) {
      fd.append("image", serverImage.files[0]);
    } else if (!isEdit) {
      setServerFormMsg("Добавьте изображение.", true);
      return;
    }
    var url = isEdit
      ? API_BASE.replace(/\/$/, "") + "/admin/servers/" + encodeURIComponent(serverEditId.value)
      : API_BASE.replace(/\/$/, "") + "/admin/servers";
    var method = isEdit ? "PUT" : "POST";
    try {
      var r = await fetch(url, {
        method: method,
        headers: { Authorization: "Bearer " + token() },
        body: fd,
      });
      var data = await r.json().catch(function () {
        return {};
      });
      if (!r.ok) throw new Error(data.error || "Ошибка " + r.status);
      setServerFormMsg("Сохранено.");
      resetServerForm();
      await loadServerList();
    } catch (err) {
      setServerFormMsg(err.message || String(err), true);
    }
  });

  bindMgFileInput(mediaUploadInput);
  bindMgFileInput(serverImage);

  (async function init() {
    var ok = await checkAdmin();
    if (!ok) {
      denied.hidden = false;
      app.hidden = true;
      if (adminHint) adminHint.textContent = "";
      return;
    }
    denied.hidden = true;
    app.hidden = false;
    await setAdminHintFromMe();
    fDate.value = localIsoForInput(new Date());
    switchMode("news");
    renderNewsPreview();
    await loadList();
    await loadShotList();
    await loadServerList();
    await loadMediaList();
    syncLauncherUrlField();
    syncLauncherDefaultServerFields();
  })();
})();
