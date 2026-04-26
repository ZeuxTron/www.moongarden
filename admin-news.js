(function () {
  var API_BASE =
    (typeof window.__MG_API_BASE__ === "string" && window.__MG_API_BASE__) || "http://localhost:3000";
  var MG_ACCESS = "mg_access";

  var denied = document.getElementById("admin-denied");
  var app = document.getElementById("admin-app");
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

  if (!form || !app || !denied) return;

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

  (async function init() {
    var ok = await checkAdmin();
    if (!ok) {
      denied.hidden = false;
      return;
    }
    denied.hidden = true;
    app.hidden = false;
    fDate.value = localIsoForInput(new Date());
    await loadList();
  })();
})();
