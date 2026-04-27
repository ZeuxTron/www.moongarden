(function () {
  var API_BASE =
    (typeof window.__MG_API_BASE__ === "string" && window.__MG_API_BASE__) || "http://localhost:3000";
  var MG_ACCESS = "mg_access";

  var denied = document.getElementById("admin-denied");
  var app = document.getElementById("admin-app");
  var modeBtns = Array.prototype.slice.call(document.querySelectorAll("[data-admin-mode-btn]"));
  var newsModePanel = document.getElementById("admin-mode-news");
  var shotModePanel = document.getElementById("admin-mode-screenshots");

  var form = document.getElementById("news-form");
  var formTitle = document.getElementById("form-title");
  var editSlug = document.getElementById("edit-slug");
  var fTitle = document.getElementById("f-title");
  var fSlug = document.getElementById("f-slug");
  var fExcerpt = document.getElementById("f-excerpt");
  var fBody = document.getElementById("f-body");
  var fDate = document.getElementById("f-date");
  var fImage = document.getElementById("f-image");
  var formMsg = document.getElementById("form-msg");
  var listEl = document.getElementById("news-list");
  var listMsg = document.getElementById("list-msg");
  var btnReset = document.getElementById("btn-reset");

  var shotForm = document.getElementById("shot-form");
  var shotFormTitle = document.getElementById("shot-form-title");
  var shotEditId = document.getElementById("shot-edit-id");
  var shotTitle = document.getElementById("shot-title");
  var shotUrl = document.getElementById("shot-url");
  var shotOrder = document.getElementById("shot-order");
  var shotVisible = document.getElementById("shot-visible");
  var shotFormMsg = document.getElementById("shot-form-msg");
  var shotList = document.getElementById("shot-list");
  var shotListMsg = document.getElementById("shot-list-msg");
  var shotResetBtn = document.getElementById("shot-reset");

  if (!form || !app || !denied || !shotForm) return;

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

  function setFormMsg(text, isErr) {
    formMsg.textContent = text || "";
    formMsg.style.color = isErr ? "#f87171" : "";
  }
  function setShotFormMsg(text, isErr) {
    shotFormMsg.textContent = text || "";
    shotFormMsg.style.color = isErr ? "#f87171" : "";
  }

  function resetForm() {
    editSlug.value = "";
    fTitle.value = "";
    fSlug.value = "";
    fExcerpt.value = "";
    fBody.value = "";
    fDate.value = "";
    fImage.value = "";
    formTitle.textContent = "Новая новость";
    setFormMsg("");
  }
  function resetShotForm() {
    shotEditId.value = "";
    shotTitle.value = "";
    shotUrl.value = "";
    shotOrder.value = "0";
    shotVisible.checked = true;
    shotFormTitle.textContent = "Новый скриншот";
    setShotFormMsg("");
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
    try {
      var items = await apiJson("GET", "/admin/news");
      if (!Array.isArray(items) || !items.length) {
        listEl.innerHTML = "<li>Нет новостей</li>";
        return;
      }
      items.forEach(function (item) {
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
        actions.appendChild(bEdit);
        actions.appendChild(bDel);
        li.appendChild(left);
        li.appendChild(actions);
        listEl.appendChild(li);
      });
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
    formTitle.textContent = "Редактирование: " + item.slug;
    setFormMsg("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function startShotEdit(item) {
    shotEditId.value = item.id;
    shotTitle.value = item.title || "";
    shotUrl.value = item.imageUrl || "";
    shotOrder.value = String(item.order || 0);
    shotVisible.checked = item.isVisible !== false;
    shotFormTitle.textContent = "Редактирование скриншота";
    setShotFormMsg("");
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

  function switchMode(mode) {
    var isNews = mode !== "screenshots";
    if (newsModePanel) newsModePanel.hidden = !isNews;
    if (shotModePanel) shotModePanel.hidden = isNews;
    modeBtns.forEach(function (btn) {
      var active = btn.getAttribute("data-admin-mode-btn") === (isNews ? "news" : "screenshots");
      btn.classList.toggle("is-active", active);
    });
  }

  modeBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      switchMode(btn.getAttribute("data-admin-mode-btn"));
    });
  });

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    setFormMsg("");
    var fd = new FormData();
    fd.append("title", fTitle.value.trim());
    fd.append("excerpt", fExcerpt.value.trim());
    fd.append("body", fBody.value.trim());
    if (fDate.value) {
      var iso = new Date(fDate.value).toISOString();
      fd.append("publishedAt", iso);
    }
    var slugVal = fSlug.value.trim();
    if (slugVal && !editSlug.value) fd.append("slug", slugVal);
    if (fImage.files && fImage.files[0]) {
      fd.append("image", fImage.files[0]);
    } else if (!editSlug.value) {
      setFormMsg("Добавьте изображение.", true);
      return;
    }

    var isEdit = Boolean(editSlug.value);
    var url = isEdit
      ? API_BASE.replace(/\/$/, "") + "/admin/news/" + encodeURIComponent(editSlug.value)
      : API_BASE.replace(/\/$/, "") + "/admin/news";
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

  shotForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    setShotFormMsg("");
    var payload = {
      title: shotTitle.value.trim(),
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

  (async function init() {
    var ok = await checkAdmin();
    if (!ok) {
      denied.hidden = false;
      return;
    }
    denied.hidden = true;
    app.hidden = false;
    fDate.value = localIsoForInput(new Date());
    switchMode("news");
    await loadList();
    await loadShotList();
  })();
})();
