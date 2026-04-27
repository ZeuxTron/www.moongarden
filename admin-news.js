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

  var form = document.getElementById("news-form");
  var formTitle = document.getElementById("form-title");
  var editSlug = document.getElementById("edit-slug");
  var fTitle = document.getElementById("f-title");
  var fSlug = document.getElementById("f-slug");
  var fExcerpt = document.getElementById("f-excerpt");
  var fBody = document.getElementById("f-body");
  var fDate = document.getElementById("f-date");
  var fHeroLayout = document.getElementById("f-hero-layout");
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
  var serverTagline = document.getElementById("server-tagline");
  var serverMeta1 = document.getElementById("server-meta1");
  var serverMeta2 = document.getElementById("server-meta2");
  var serverMeta3 = document.getElementById("server-meta3");
  var serverOrder = document.getElementById("server-order");
  var serverVisible = document.getElementById("server-visible");
  var serverFormMsg = document.getElementById("server-form-msg");
  var serverList = document.getElementById("server-list");
  var serverListMsg = document.getElementById("server-list-msg");
  var serverResetBtn = document.getElementById("server-reset");

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

  if (!form || !app || !denied || !shotForm || !serverForm) return;

  var mediaItems = [];
  var newsCache = [];
  var previewIndex = 0;
  var bodyPreviewTimer = null;

  function token() {
    try {
      return sessionStorage.getItem(MG_ACCESS) || "";
    } catch (e) {
      return "";
    }
  }

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
    if (fHeroLayout) fHeroLayout.value = "tl";
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
    serverTagline.value = "";
    serverMeta1.value = "";
    serverMeta2.value = "";
    serverMeta3.value = "";
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
          '</strong><div class="meta">' +
          escapeHtml(item.tagline || "") +
          '</div><div class="meta">order=' +
          escapeHtml(String(item.order || 0)) +
          " · " +
          escapeHtml(item.isVisible ? "виден" : "скрыт") +
          "</div>";
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
    if (fHeroLayout) {
      var hl = String(item.heroLayout || "").toLowerCase();
      fHeroLayout.value = hl === "lc" || hl === "br" ? hl : "tl";
    }
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
    serverTagline.value = item.tagline || "";
    serverMeta1.value = item.meta1 || "";
    serverMeta2.value = item.meta2 || "";
    serverMeta3.value = item.meta3 || "";
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
    if (newsModePanel) newsModePanel.hidden = !isNews;
    if (shotModePanel) shotModePanel.hidden = !isScreenshots;
    if (serverModePanel) serverModePanel.hidden = !isServers;
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
  if (fHeroLayout) {
    fHeroLayout.addEventListener("change", function () {
      if (previewIndex === 0) renderNewsPreview();
    });
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
    fd.append("tagline", tagline);
    fd.append("meta1", serverMeta1.value.trim());
    fd.append("meta2", serverMeta2.value.trim());
    fd.append("meta3", serverMeta3.value.trim());
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
  })();
})();
