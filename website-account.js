(function () {
  var API_BASE = (typeof window.__MG_API_BASE__ === "string" && window.__MG_API_BASE__) || "http://localhost:3000";
  var MG_ACCESS = "mg_access";
  var MG_REFRESH = "mg_refresh";
  var MG_USER = "mg_site_session";
  var SKIN_SLOT_COUNT = 6;

  function mgSiteSessGet(k) {
    try {
      var v = localStorage.getItem(k);
      if (v != null && v !== "") return v;
      v = sessionStorage.getItem(k);
      if (v != null && v !== "") {
        try {
          localStorage.setItem(k, v);
        } catch (eMig) {}
      }
      return v;
    } catch (e0) {
      return null;
    }
  }
  function mgSiteSessSet(k, v) {
    var s = String(v != null ? v : "");
    try {
      localStorage.setItem(k, s);
    } catch (e1) {}
    try {
      sessionStorage.setItem(k, s);
    } catch (e2) {}
  }
  function mgSiteSessRemove(k) {
    try {
      localStorage.removeItem(k);
    } catch (e3) {}
    try {
      sessionStorage.removeItem(k);
    } catch (e4) {}
  }
  var NICK_RE = /^[a-zA-Z0-9_]{3,16}$/;

  var modal = document.getElementById("account-modal");
  var guestPanel = document.getElementById("account-guest");
  var cabinetPanel = document.getElementById("account-cabinet");
  var modalTitle = document.getElementById("account-modal-title");
  var viewLogin = document.getElementById("auth-view-login");
  var viewRegister = document.getElementById("auth-view-register");
  var headerAuthBtn = document.getElementById("header-auth-btn");
  var cabinetAdminTag = document.getElementById("cabinet-admin-tag");
  var cabinetNick = document.getElementById("cabinet-nickname");
  var cabinetJoined = document.getElementById("cabinet-joined");
  var skinPreviewCanvas = document.getElementById("skin-preview-canvas");
  var skinPreviewLabel = document.getElementById("skin-preview-label");
  var skinOptionsRoot = document.getElementById("skin-options");
  var skinSlotUploadInput = document.getElementById("skin-slot-upload");
  var skinSlotActions = document.getElementById("skin-slot-actions");
  var skinSlotApplyBtn = document.getElementById("skin-slot-apply");
  var skinSlotReplaceBtn = document.getElementById("skin-slot-replace");
  var skinSlotRemoveBtn = document.getElementById("skin-slot-remove");
  var skinClearModal = document.getElementById("cabinet-skin-clear-modal");
  var skinClearForm = document.getElementById("cabinet-skin-clear-form");
  var cabinetModelTrigger = document.getElementById("cabinet-model-trigger");
  var cabinetModelLabel = document.getElementById("cabinet-model-label");
  var cabinetModelCurrent = document.getElementById("cabinet-model-current");
  var cabinetModelMenu = document.getElementById("cabinet-model-menu");
  var cabinetModelOptions = document.querySelectorAll("[data-model-option]");
  var formLogin = document.getElementById("form-login");
  var formRegister = document.getElementById("form-register");
  var loginSubmitBtn = formLogin ? formLogin.querySelector("button[type='submit']") : null;
  var msgLogin = document.getElementById("account-msg-login");
  var msgRegister = document.getElementById("account-msg-register");
  var authSegmentedHead = document.getElementById("auth-segmented-head");
  var logoutBtn = document.getElementById("account-logout");
  var changeNickBtn = document.getElementById("account-change-nick");
  var changePasswordBtn = document.getElementById("account-change-password");
  var changeNickModal = document.getElementById("cabinet-change-nick-modal");
  var changeNickForm = document.getElementById("cabinet-change-nick-form");
  var changeNickHint = document.getElementById("cabinet-change-nick-hint");
  var changePasswordModal = document.getElementById("cabinet-change-password-modal");
  var changePasswordForm = document.getElementById("cabinet-change-password-form");
  var changePasswordHint = document.getElementById("cabinet-change-password-hint");
  var siteToast = document.getElementById("site-toast");
  var siteToastBody = document.getElementById("site-toast-body");
  var modalPanel = modal ? modal.querySelector(".site-modal__panel") : null;
  var openBtns = document.querySelectorAll("[data-auth-open]");
  var switchBtns = document.querySelectorAll("[data-auth-switch]");
  var segmentBtns = document.querySelectorAll("[data-auth-segment]");

  var lastFocusBeforeModal = null;
  var skinViewer = null;
  var selectedSkinSlot = -1;
  var pendingUploadSlot = -1;
  var MAX_SKIN_FILE_BYTES = 2 * 1024 * 1024;
  var toastTimer = null;
  var defaultSkinDataUrl = "";
  var lastMe = null;
  var skinBlobUrls = [];
  var skinThumbBySlot = [];

  if (
    !modal ||
    !guestPanel ||
    !cabinetPanel ||
    !formLogin ||
    !formRegister ||
    !skinOptionsRoot ||
    !modalPanel ||
    !viewLogin ||
    !viewRegister ||
    !headerAuthBtn
  ) {
    return;
  }

  function clearTokens() {
    mgSiteSessRemove(MG_ACCESS);
    mgSiteSessRemove(MG_REFRESH);
    mgSiteSessRemove(MG_USER);
  }

  function setTokens(access, refresh, username) {
    if (access) mgSiteSessSet(MG_ACCESS, access);
    if (refresh) mgSiteSessSet(MG_REFRESH, refresh);
    if (username) mgSiteSessSet(MG_USER, username);
  }

  function getSession() {
    return mgSiteSessGet(MG_USER) || "";
  }

  function setSession(nick) {
    if (nick) mgSiteSessSet(MG_USER, nick);
    else mgSiteSessRemove(MG_USER);
  }

  async function tryRefresh() {
    var rt = mgSiteSessGet(MG_REFRESH);
    if (!rt) return false;
    var r = await fetch(API_BASE + "/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: rt }),
      credentials: "include",
    });
    if (!r.ok) {
      clearTokens();
      return false;
    }
    var data = await r.json();
    setTokens(data.accessToken, data.refreshToken || rt, data.user && data.user.username);
    return true;
  }

  async function apiFetch(method, pathname, opts) {
    opts = opts || {};
    var skipAuth = opts.skipAuth;
    var isForm = Boolean(opts.formData);
    var headers = {};
    if (!isForm && opts.jsonBody !== undefined) headers["Content-Type"] = "application/json";
    var access = mgSiteSessGet(MG_ACCESS);
    if (access && !skipAuth) headers["Authorization"] = "Bearer " + access;
    if (isForm && access && !skipAuth) headers["Authorization"] = "Bearer " + access;

    var r = await fetch(API_BASE + pathname, {
      method: method,
      headers: headers,
      body: isForm ? opts.formData : opts.jsonBody !== undefined ? JSON.stringify(opts.jsonBody) : undefined,
      credentials: "include",
    });

    if (r.status === 401 && !skipAuth && pathname !== "/auth/refresh" && !opts._retried) {
      var ok = await tryRefresh();
      if (ok) return apiFetch(method, pathname, Object.assign({}, opts, { _retried: true }));
    }
    return r;
  }

  function revokeSkinBlobs() {
    skinBlobUrls.forEach(function (u) {
      try {
        URL.revokeObjectURL(u);
      } catch (e) {}
    });
    skinBlobUrls = [];
    skinThumbBySlot = [];
  }

  async function loadSkinThumbs(me) {
    revokeSkinBlobs();
    var urls = new Array(SKIN_SLOT_COUNT).fill(null);
    if (!me || !me.skinSlots) return urls;
    for (var i = 0; i < SKIN_SLOT_COUNT; i++) {
      var s = me.skinSlots[i];
      if (!s || !s.filled) continue;
      var r = await apiFetch("GET", "/me/skins/" + i);
      if (!r.ok) continue;
      var bl = await r.blob();
      var u = URL.createObjectURL(bl);
      urls[i] = u;
      skinBlobUrls.push(u);
    }
    skinThumbBySlot = urls;
    return urls;
  }

  function formatJoined(iso) {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch (err) {
      return "—";
    }
  }

  function normalizeMcNick(raw) {
    var n = (raw || "").trim();
    if (!NICK_RE.test(n)) return null;
    return n;
  }

  function validateSkinImage(file) {
    return new Promise(function (resolve, reject) {
      if (!file) {
        reject("Файл не выбран.");
        return;
      }
      if (file.type !== "image/png") {
        reject("Скин должен быть PNG.");
        return;
      }
      if (file.size > MAX_SKIN_FILE_BYTES) {
        reject("Скин слишком большой. Максимум 2 MB.");
        return;
      }
      var objectUrl = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        var w = img.naturalWidth;
        var h = img.naturalHeight;
        URL.revokeObjectURL(objectUrl);
        if (!((w === 64 && h === 64) || (w === 64 && h === 32))) {
          reject("Неверный размер скина. Поддерживается только 64x64 или 64x32.");
          return;
        }
        resolve(true);
      };
      img.onerror = function () {
        URL.revokeObjectURL(objectUrl);
        reject("Не удалось прочитать PNG как скин Minecraft.");
      };
      img.src = objectUrl;
    });
  }

  function syncHeader() {
    var nick = getSession();
    headerAuthBtn.classList.remove("is-auth-loading");
    headerAuthBtn.setAttribute("aria-busy", "false");
    headerAuthBtn.disabled = false;
    if (nick) {
      headerAuthBtn.textContent = "Личный кабинет";
      headerAuthBtn.setAttribute("data-auth-open", "cabinet");
      headerAuthBtn.setAttribute("aria-label", "Открыть личный кабинет");
    } else {
      headerAuthBtn.textContent = "Войти";
      headerAuthBtn.setAttribute("data-auth-open", "login");
      headerAuthBtn.setAttribute("aria-label", "Войти в аккаунт");
    }
  }

  function syncAuthSegments(isLogin) {
    for (var i = 0; i < segmentBtns.length; i++) {
      var seg = segmentBtns[i];
      var name = seg.getAttribute("data-auth-segment");
      var active = (name === "login" && isLogin) || (name === "register" && !isLogin);
      seg.classList.toggle("is-active", active);
      seg.setAttribute("aria-selected", active ? "true" : "false");
      seg.setAttribute("tabindex", active ? "0" : "-1");
    }
  }

  function countFilledSkins(me) {
    if (!me || !me.skinSlots) return 0;
    var n = 0;
    for (var i = 0; i < me.skinSlots.length; i++) {
      if (me.skinSlots[i] && me.skinSlots[i].filled) n++;
    }
    return n;
  }

  function renderSkinGrid(me) {
    skinOptionsRoot.innerHTML = "";
    for (var i = 0; i < SKIN_SLOT_COUNT; i++) {
      var slot = me.skinSlots[i];
      var filled = Boolean(slot && slot.filled);
      var btn = document.createElement("button");
      var isSelected = i === selectedSkinSlot;
      var isActive = i === me.activeSkinSlot;
      btn.type = "button";
      btn.className = "skin-option" + (isSelected ? " is-selected" : "") + (isActive ? " is-active" : "");
      btn.setAttribute("data-slot-index", String(i));
      btn.setAttribute("aria-pressed", isSelected ? "true" : "false");
      var preview = document.createElement("span");
      preview.className = "skin-option__preview";
      preview.setAttribute("aria-hidden", "true");
      if (filled && skinThumbBySlot[i]) {
        var img = document.createElement("img");
        img.src = skinThumbBySlot[i];
        img.alt = "";
        preview.appendChild(img);
        var downloadBtn = document.createElement("button");
        downloadBtn.type = "button";
        downloadBtn.className = "skin-option__download";
        downloadBtn.setAttribute("data-slot-download", String(i));
        downloadBtn.setAttribute("aria-label", "Скачать скин из слота " + (i + 1));
        downloadBtn.innerHTML =
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 3v12" stroke-linecap="round"/><path d="M7 11l5 5 5-5" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 21h14" stroke-linecap="round"/></svg>';
        btn.appendChild(downloadBtn);
      } else {
        var placeholder = document.createElement("span");
        placeholder.className = "skin-option__placeholder";
        placeholder.textContent = "Пусто";
        preview.appendChild(placeholder);
      }
      var lab = document.createElement("span");
      lab.className = "skin-option__label";
      lab.textContent = "Слот " + (i + 1) + (isActive ? " (активный)" : "");
      btn.appendChild(preview);
      btn.appendChild(lab);
      skinOptionsRoot.appendChild(btn);
    }
    if (skinSlotActions) {
      var hasSelected =
        selectedSkinSlot >= 0 &&
        me.skinSlots[selectedSkinSlot] &&
        me.skinSlots[selectedSkinSlot].filled;
      skinSlotActions.hidden = !hasSelected;
    }
    if (skinSlotRemoveBtn) {
      var fc = countFilledSkins(me);
      skinSlotRemoveBtn.disabled = fc <= 1;
      skinSlotRemoveBtn.title = fc <= 1 ? "Нельзя удалить последний скин" : "Очистить слот";
    }
  }

  function ensureSkinViewer() {
    if (skinViewer || !skinPreviewCanvas || !window.skinview3d) return;
    skinViewer = new window.skinview3d.SkinViewer({
      canvas: skinPreviewCanvas,
      width: skinPreviewCanvas.width,
      height: skinPreviewCanvas.height,
    });
    skinViewer.zoom = 0.95;
    skinViewer.fov = 70;
    skinViewer.animation = new window.skinview3d.IdleAnimation();
    safeLoadSkin(getDefaultSkinDataUrl(), "default");
  }

  function applySkinPreview(me, previewSlotIndex) {
    ensureSkinViewer();
    var activeIndex = typeof me.activeSkinSlot === "number" ? me.activeSkinSlot : -1;
    var hasPreviewSlot = typeof previewSlotIndex === "number" && previewSlotIndex >= 0;
    var visibleIndex = hasPreviewSlot ? previewSlotIndex : activeIndex;
    var labelPrefix = hasPreviewSlot && visibleIndex !== activeIndex ? "Предпросмотр слота: " : "Активный слот: ";
    var label = labelPrefix;
    var modelType = me.model === "alex" ? "slim" : "default";
    var src = null;
    if (visibleIndex >= 0 && skinThumbBySlot[visibleIndex]) {
      src = skinThumbBySlot[visibleIndex];
      label += "№" + (visibleIndex + 1);
    } else if (me.username) {
      src = API_BASE + "/skins/" + encodeURIComponent(me.username) + ".png";
      label += visibleIndex >= 0 ? "№" + (visibleIndex + 1) : "публичный";
    } else {
      label += "не выбран";
      src = getDefaultSkinDataUrl();
    }
    if (skinPreviewLabel) skinPreviewLabel.textContent = label;
    safeLoadSkin(src, modelType);
  }

  function showGuestPanel(view) {
    guestPanel.hidden = false;
    cabinetPanel.hidden = true;
    if (authSegmentedHead) authSegmentedHead.hidden = false;
    modalPanel.classList.remove("site-modal__panel--cabinet");
    modalPanel.classList.add("site-modal__panel--auth");

    var isLogin = view !== "register";
    viewLogin.hidden = !isLogin;
    viewRegister.hidden = isLogin;
    modalTitle.textContent = isLogin ? "Вход в аккаунт" : "Регистрация";
    modalTitle.classList.add("visually-hidden");
    syncAuthSegments(isLogin);
    msgLogin.textContent = "";
    msgRegister.textContent = "";
    if (cabinetModelMenu) cabinetModelMenu.classList.remove("is-open");
    if (cabinetModelTrigger) cabinetModelTrigger.setAttribute("aria-expanded", "false");
    if (cabinetAdminTag) {
      cabinetAdminTag.hidden = true;
      cabinetAdminTag.style.display = "none";
    }

    window.requestAnimationFrame(function () {
      try {
        if (isLogin) formLogin.elements.nickname.focus();
        else formRegister.elements.nickname.focus();
      } catch (err) {}
    });
  }

  async function fetchMe() {
    var r = await apiFetch("GET", "/me");
    if (!r.ok) throw new Error("me");
    return r.json();
  }

  async function showCabinet() {
    var nick = getSession();
    if (!nick) {
      showGuestPanel("login");
      return;
    }
    try {
      lastMe = await fetchMe();
    } catch (e) {
      clearTokens();
      syncHeader();
      showGuestPanel("login");
      return;
    }
    guestPanel.hidden = true;
    cabinetPanel.hidden = false;
    if (authSegmentedHead) authSegmentedHead.hidden = true;
    modalPanel.classList.remove("site-modal__panel--auth");
    modalPanel.classList.add("site-modal__panel--cabinet");
    modalTitle.textContent = "Личный кабинет";
    modalTitle.classList.remove("visually-hidden");
    cabinetNick.textContent = lastMe.username;
    if (cabinetAdminTag) {
      var isAdmin = Boolean(lastMe.isAdmin);
      cabinetAdminTag.hidden = !isAdmin;
      if (isAdmin) {
        cabinetAdminTag.removeAttribute("hidden");
        cabinetAdminTag.style.display = "inline-block";
      } else {
        cabinetAdminTag.style.display = "none";
      }
    }

    if (cabinetJoined) {
      var iso = lastMe.joinedAt;
      if (iso) {
        cabinetJoined.setAttribute("datetime", iso);
        cabinetJoined.textContent = formatJoined(iso);
      } else {
        cabinetJoined.textContent = "—";
        cabinetJoined.removeAttribute("datetime");
      }
    }
    var currentModel = lastMe.model === "alex" ? "alex" : "steve";
    var currentModelLabel = currentModel === "alex" ? "Alex (slim)" : "Steve (классика)";
    if (cabinetModelLabel) cabinetModelLabel.textContent = "Модель: " + currentModelLabel;
    if (cabinetModelCurrent) cabinetModelCurrent.textContent = "Сменить модель";
    if (cabinetModelOptions && cabinetModelOptions.length) {
      cabinetModelOptions.forEach(function (optionBtn) {
        var value = optionBtn.getAttribute("data-model-option");
        optionBtn.classList.toggle("is-selected", value === currentModel);
        optionBtn.setAttribute("aria-selected", value === currentModel ? "true" : "false");
      });
    }
    selectedSkinSlot = lastMe.activeSkinSlot;
    await loadSkinThumbs(lastMe);
    applySkinPreview(lastMe);
    renderSkinGrid(lastMe);
  }

  function openModal(mode, opener) {
    lastFocusBeforeModal = opener || document.activeElement;
    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("site-modal-open");

    if (mode === "cabinet" && getSession()) {
      guestPanel.hidden = true;
      cabinetPanel.hidden = true;
      if (authSegmentedHead) authSegmentedHead.hidden = true;
      modalPanel.classList.remove("site-modal__panel--auth");
      modalPanel.classList.add("site-modal__panel--cabinet", "site-modal__panel--loading");
      modalTitle.textContent = "Личный кабинет";
      modalTitle.classList.remove("visually-hidden");
      showCabinet().finally(function () {
        modalPanel.classList.remove("site-modal__panel--loading");
      });
    } else if (mode === "register") {
      modalPanel.classList.remove("site-modal__panel--loading");
      showGuestPanel("register");
    } else {
      modalPanel.classList.remove("site-modal__panel--loading");
      showGuestPanel("login");
    }

    modalPanel.focus();
  }

  function closeModal() {
    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("site-modal-open");
    var restore = lastFocusBeforeModal;
    lastFocusBeforeModal = null;
    if (restore && typeof restore.focus === "function") restore.focus();
  }

  function openCabinetMiniModal(kind) {
    if (kind === "nick" && changeNickModal && changeNickForm) {
      changeNickHint.textContent = "";
      changeNickModal.hidden = false;
      var nickInput = changeNickForm.elements.newNick;
      if (nickInput) {
        nickInput.value = getSession() || "";
        nickInput.focus();
        nickInput.select();
      }
      return;
    }
    if (kind === "password" && changePasswordModal && changePasswordForm) {
      changePasswordHint.textContent = "";
      changePasswordModal.hidden = false;
      var oldInput = changePasswordForm.elements.oldPassword;
      if (oldInput) oldInput.focus();
    }
  }

  function closeCabinetMiniModal(kind) {
    if (kind === "nick" && changeNickModal) {
      changeNickModal.hidden = true;
      changeNickForm.reset();
      changeNickHint.textContent = "";
      return;
    }
    if (kind === "password" && changePasswordModal) {
      changePasswordModal.hidden = true;
      changePasswordForm.reset();
      changePasswordHint.textContent = "";
    }
  }

  function showSiteToast(message, type) {
    if (!siteToast || !siteToastBody) return;
    siteToastBody.textContent = message;
    siteToastBody.classList.remove("is-success", "is-error");
    if (type === "success") siteToastBody.classList.add("is-success");
    if (type === "error") siteToastBody.classList.add("is-error");
    siteToast.hidden = false;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      siteToast.hidden = true;
      toastTimer = null;
    }, type === "success" ? 2400 : 3200);
  }

  function getDefaultSkinDataUrl() {
    if (defaultSkinDataUrl) return defaultSkinDataUrl;
    var canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    var ctx = canvas.getContext("2d");
    if (!ctx) return "";
    ctx.fillStyle = "#2a2438";
    ctx.fillRect(0, 0, 64, 64);
    ctx.fillStyle = "#3a3250";
    for (var y = 0; y < 64; y += 8) {
      for (var x = 0; x < 64; x += 8) {
        if (((x + y) / 8) % 2 === 0) ctx.fillRect(x, y, 8, 8);
      }
    }
    defaultSkinDataUrl = canvas.toDataURL("image/png");
    return defaultSkinDataUrl;
  }

  function safeLoadSkin(skinSrc, modelType) {
    if (!skinViewer) return;
    try {
      var result = skinViewer.loadSkin(skinSrc, { model: modelType });
      if (result && typeof result.then === "function") {
        result.catch(function () {
          if (skinSrc !== getDefaultSkinDataUrl()) safeLoadSkin(getDefaultSkinDataUrl(), modelType);
        });
      }
    } catch (err) {
      if (skinSrc !== getDefaultSkinDataUrl()) safeLoadSkin(getDefaultSkinDataUrl(), modelType);
    }
  }

  for (var o = 0; o < openBtns.length; o++) {
    openBtns[o].addEventListener("click", function () {
      if (this === headerAuthBtn && (headerAuthBtn.disabled || headerAuthBtn.getAttribute("aria-busy") === "true")) {
        return;
      }
      openModal(this.getAttribute("data-auth-open"), this);
    });
  }

  for (var s = 0; s < switchBtns.length; s++) {
    switchBtns[s].addEventListener("click", function () {
      var v = this.getAttribute("data-auth-switch");
      showGuestPanel(v === "register" ? "register" : "login");
    });
  }

  for (var g = 0; g < segmentBtns.length; g++) {
    segmentBtns[g].addEventListener("click", function () {
      showGuestPanel(this.getAttribute("data-auth-segment"));
    });
  }

  modal.addEventListener("click", function (e) {
    var el = e.target;
    if (el && el.closest && el.closest("[data-account-close]")) closeModal();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !modal.hidden) closeModal();
  });

  formLogin.addEventListener("submit", async function (e) {
    e.preventDefault();
    msgLogin.textContent = "";
    var loginBtnText = loginSubmitBtn ? loginSubmitBtn.textContent : "";
    if (loginSubmitBtn) {
      loginSubmitBtn.disabled = true;
      loginSubmitBtn.setAttribute("aria-busy", "true");
      loginSubmitBtn.textContent = "Входим...";
    }
    var nick = normalizeMcNick(formLogin.elements.nickname.value);
    var pass = formLogin.elements.password.value;
    if (!nick) {
      msgLogin.textContent = "Ник: латиница, цифры и _, от 3 до 16 символов (как в Minecraft).";
      if (loginSubmitBtn) {
        loginSubmitBtn.disabled = false;
        loginSubmitBtn.setAttribute("aria-busy", "false");
        loginSubmitBtn.textContent = loginBtnText || "Войти";
      }
      return;
    }
    try {
      var r = await apiFetch(
        "POST",
        "/auth/login",
        { jsonBody: { username: nick, password: pass }, skipAuth: true }
      );
      var data = await r.json().catch(function () { return {}; });
      if (!r.ok) {
        msgLogin.textContent = data.error || "Ошибка входа.";
        return;
      }
      setTokens(data.accessToken, data.refreshToken, data.user.username);
      setSession(data.user.username);
      syncHeader();
      await showCabinet();
    } finally {
      if (loginSubmitBtn) {
        loginSubmitBtn.disabled = false;
        loginSubmitBtn.setAttribute("aria-busy", "false");
        loginSubmitBtn.textContent = loginBtnText || "Войти";
      }
    }
  });

  formRegister.addEventListener("submit", async function (e) {
    e.preventDefault();
    msgRegister.textContent = "";
    var nick = normalizeMcNick(formRegister.elements.nickname.value);
    var pass = formRegister.elements.password.value;
    var pass2 = formRegister.elements.password2.value;
    if (!nick) {
      msgRegister.textContent = "Ник: латиница, цифры и _, от 3 до 16 символов (как в Minecraft).";
      return;
    }
    if (pass !== pass2) {
      msgRegister.textContent = "Пароли не совпадают.";
      return;
    }
    var r = await apiFetch(
      "POST",
      "/auth/register",
      { jsonBody: { username: nick, password: pass }, skipAuth: true }
    );
    var data = await r.json().catch(function () { return {}; });
    if (!r.ok) {
      msgRegister.textContent = data.error || "Ошибка регистрации.";
      return;
    }
    setTokens(data.accessToken, data.refreshToken, data.user.username);
    setSession(data.user.username);
    syncHeader();
    formRegister.reset();
    await showCabinet();
  });

  skinOptionsRoot.addEventListener("click", async function (e) {
    var downloadBtn = e.target.closest("[data-slot-download]");
    if (downloadBtn && skinOptionsRoot.contains(downloadBtn)) {
      e.stopPropagation();
      var downloadSlotIndex = Number(downloadBtn.getAttribute("data-slot-download"));
      if (Number.isNaN(downloadSlotIndex) || !lastMe) return;
      var slot = lastMe.skinSlots[downloadSlotIndex];
      if (!slot || !slot.filled) {
        showSiteToast("В этом слоте нет скина для скачивания.", "error");
        return;
      }
      var r = await apiFetch("GET", "/me/skins/" + downloadSlotIndex);
      if (!r.ok) return;
      var bl = await r.blob();
      var link = document.createElement("a");
      link.href = URL.createObjectURL(bl);
      link.download = "skin-slot-" + (downloadSlotIndex + 1) + ".png";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(function () { URL.revokeObjectURL(link.href); }, 2000);
      return;
    }

    var btn = e.target.closest(".skin-option");
    if (!btn || !skinOptionsRoot.contains(btn)) return;
    var slotIndex = Number(btn.getAttribute("data-slot-index"));
    if (Number.isNaN(slotIndex) || !lastMe) return;
    selectedSkinSlot = slotIndex;
    var slot = lastMe.skinSlots[slotIndex];
    if (!slot || !slot.filled) {
      pendingUploadSlot = slotIndex;
      if (skinSlotUploadInput) {
        skinSlotUploadInput.value = "";
        skinSlotUploadInput.click();
      }
      return;
    }
    applySkinPreview(lastMe, slotIndex);
    renderSkinGrid(lastMe);
  });

  if (skinSlotUploadInput) {
    skinSlotUploadInput.addEventListener("change", async function () {
      if (pendingUploadSlot < 0 || !skinSlotUploadInput.files || !skinSlotUploadInput.files[0]) return;
      if (!getSession()) return;
      var file = skinSlotUploadInput.files[0];
      try {
        await validateSkinImage(file);
      } catch (err) {
        showSiteToast(String(err || "Файл не прошёл проверку."), "error");
        pendingUploadSlot = -1;
        skinSlotUploadInput.value = "";
        return;
      }
      var fd = new FormData();
      fd.append("file", file, file.name || "skin.png");
      var r = await apiFetch("POST", "/me/skins/" + pendingUploadSlot, { formData: fd });
      pendingUploadSlot = -1;
      skinSlotUploadInput.value = "";
      if (!r.ok) {
        var err = await r.json().catch(function () { return {}; });
        showSiteToast(err.error || "Не удалось загрузить скин.", "error");
        return;
      }
      try {
        lastMe = await fetchMe();
      } catch (e) {
        return;
      }
      await loadSkinThumbs(lastMe);
      applySkinPreview(lastMe);
      renderSkinGrid(lastMe);
    });
  }

  if (skinSlotApplyBtn) {
    skinSlotApplyBtn.addEventListener("click", async function () {
      if (!lastMe || selectedSkinSlot < 0) return;
      var slot = lastMe.skinSlots[selectedSkinSlot];
      if (!slot || !slot.filled) return;
      var r = await apiFetch("PATCH", "/me/skins/active", { jsonBody: { activeSkinSlot: selectedSkinSlot } });
      if (!r.ok) return;
      lastMe.activeSkinSlot = selectedSkinSlot;
      applySkinPreview(lastMe);
      renderSkinGrid(lastMe);
    });
  }

  if (skinSlotReplaceBtn) {
    skinSlotReplaceBtn.addEventListener("click", function () {
      if (selectedSkinSlot < 0 || !skinSlotUploadInput) return;
      pendingUploadSlot = selectedSkinSlot;
      skinSlotUploadInput.value = "";
      skinSlotUploadInput.click();
    });
  }

  if (skinSlotRemoveBtn) {
    skinSlotRemoveBtn.addEventListener("click", function () {
      if (selectedSkinSlot < 0 || !skinClearModal || !lastMe) return;
      if (countFilledSkins(lastMe) <= 1) {
        showSiteToast("Нельзя удалить последний скин.", "error");
        return;
      }
      skinClearModal.hidden = false;
    });
  }

  if (skinClearForm) {
    skinClearForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      if (!lastMe || selectedSkinSlot < 0) return;
      var r = await apiFetch("DELETE", "/me/skins/" + selectedSkinSlot);
      if (r.status === 409) {
        var err409 = await r.json().catch(function () { return {}; });
        showSiteToast(err409.error || "Нельзя удалить последний скин.", "error");
        if (skinClearModal) skinClearModal.hidden = true;
        return;
      }
      if (!r.ok) return;
      if (skinClearModal) skinClearModal.hidden = true;
      try {
        lastMe = await fetchMe();
      } catch (e2) {
        return;
      }
      await loadSkinThumbs(lastMe);
      applySkinPreview(lastMe);
      renderSkinGrid(lastMe);
    });
  }

  if (cabinetModelTrigger && cabinetModelMenu) {
    cabinetModelTrigger.addEventListener("click", function (e) {
      e.stopPropagation();
      var isOpen = cabinetModelMenu.classList.toggle("is-open");
      cabinetModelTrigger.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
  }

  if (cabinetModelOptions && cabinetModelOptions.length) {
    cabinetModelOptions.forEach(function (optionBtn) {
      optionBtn.addEventListener("click", async function (e) {
        e.stopPropagation();
        if (!lastMe) return;
        var selected = optionBtn.getAttribute("data-model-option");
        var model = selected === "alex" ? "alex" : "steve";
        var r = await apiFetch("PATCH", "/me/model", { jsonBody: { model: model } });
        if (!r.ok) return;
        lastMe.model = model;
        applySkinPreview(lastMe);
        await showCabinet();
        if (cabinetModelMenu) cabinetModelMenu.classList.remove("is-open");
        if (cabinetModelTrigger) cabinetModelTrigger.setAttribute("aria-expanded", "false");
      });
    });
  }

  document.addEventListener("click", function (e) {
    if (!cabinetModelMenu || !cabinetModelTrigger) return;
    if (
      cabinetModelMenu.classList.contains("is-open") &&
      !cabinetModelMenu.contains(e.target) &&
      !cabinetModelTrigger.contains(e.target)
    ) {
      cabinetModelMenu.classList.remove("is-open");
      cabinetModelTrigger.setAttribute("aria-expanded", "false");
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (cabinetModelMenu && cabinetModelMenu.classList.contains("is-open")) {
      cabinetModelMenu.classList.remove("is-open");
      if (cabinetModelTrigger) cabinetModelTrigger.setAttribute("aria-expanded", "false");
    }
  });

  logoutBtn.addEventListener("click", async function () {
    await apiFetch("POST", "/auth/logout", { skipAuth: true }).catch(function () {});
    clearTokens();
    setSession("");
    revokeSkinBlobs();
    lastMe = null;
    syncHeader();
    showGuestPanel("login");
  });

  if (changeNickBtn) {
    changeNickBtn.disabled = true;
    changeNickBtn.setAttribute("aria-disabled", "true");
    changeNickBtn.addEventListener("click", function () {
      return;
    });
  }

  if (changeNickForm) {
    changeNickForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      if (!getSession()) return;
      var nextNick = normalizeMcNick(changeNickForm.elements.newNick.value);
      if (!nextNick) {
        changeNickHint.textContent = "Неверный ник. Разрешены латиница, цифры и _, длина 3-16.";
        return;
      }
      if (nextNick === getSession()) {
        closeCabinetMiniModal("nick");
        return;
      }
      var r = await apiFetch("PATCH", "/me/username", { jsonBody: { newUsername: nextNick } });
      var data = await r.json().catch(function () { return {}; });
      if (!r.ok) {
        changeNickHint.textContent = data.error || "Ошибка.";
        return;
      }
      setSession(data.username);
      syncHeader();
      closeCabinetMiniModal("nick");
      await showCabinet();
      showSiteToast("Ник успешно изменён.", "success");
    });
  }

  if (changePasswordBtn) {
    changePasswordBtn.addEventListener("click", function () {
      openCabinetMiniModal("password");
    });
  }

  if (changePasswordForm) {
    changePasswordForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      if (!getSession()) return;
      var oldPass = changePasswordForm.elements.oldPassword.value;
      var newPass = changePasswordForm.elements.newPassword.value;
      var repeatPass = changePasswordForm.elements.repeatPassword.value;
      if (!newPass.trim()) {
        changePasswordHint.textContent = "Новый пароль не может быть пустым.";
        return;
      }
      if (newPass !== repeatPass) {
        changePasswordHint.textContent = "Пароли не совпадают.";
        return;
      }
      var r = await apiFetch("PATCH", "/me/password", {
        jsonBody: { oldPassword: oldPass, newPassword: newPass },
      });
      var data = await r.json().catch(function () { return {}; });
      if (!r.ok) {
        changePasswordHint.textContent = data.error || "Ошибка.";
        return;
      }
      closeCabinetMiniModal("password");
      showSiteToast("Пароль успешно изменён.", "success");
    });
  }

  modal.addEventListener("click", function (e) {
    var closeKind = e.target && e.target.getAttribute && e.target.getAttribute("data-cabinet-modal-close");
    if (closeKind === "nick" || closeKind === "password") {
      closeCabinetMiniModal(closeKind);
    }
    if (closeKind === "skin-clear" && skinClearModal) {
      skinClearModal.hidden = true;
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (changeNickModal && !changeNickModal.hidden) closeCabinetMiniModal("nick");
    if (changePasswordModal && !changePasswordModal.hidden) closeCabinetMiniModal("password");
    if (skinClearModal && !skinClearModal.hidden) skinClearModal.hidden = true;
  });

  async function bootstrapSession() {
    if (!mgSiteSessGet(MG_ACCESS) && mgSiteSessGet(MG_REFRESH)) {
      await tryRefresh();
    }
    if (!mgSiteSessGet(MG_ACCESS)) {
      syncHeader();
      return;
    }
    try {
      var me = await fetchMe();
      setSession(me.username);
    } catch (e) {
      clearTokens();
    }
    syncHeader();
  }

  function applyAccountDeepLinkFromHash() {
    var raw = (window.location.hash || "").replace(/^#/, "");
    if (!raw) return;
    var h = raw.split(/[?&]/)[0].toLowerCase();
    if (h !== "cabinet" && h !== "lk") return;
    openModal("cabinet", document.body);
    try {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    } catch (e) {}
  }

  window.addEventListener("hashchange", applyAccountDeepLinkFromHash);

  window.addEventListener("storage", function (ev) {
    if (!ev || !ev.key) return;
    if (ev.key !== MG_ACCESS && ev.key !== MG_REFRESH && ev.key !== MG_USER) return;
    syncHeader();
    void bootstrapSession();
  });

  // Show consistent header label from stored session immediately, then refine after refresh/me.
  syncHeader();
  bootstrapSession();
  applyAccountDeepLinkFromHash();
})();
