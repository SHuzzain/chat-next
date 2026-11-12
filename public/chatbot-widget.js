(function () {
  var host = window;
  var config = host.ChatbotConfig || {};
  var chatbotUrl = String(config.chatbotUrl || "").replace(/\/$/, "");
  var widgetId = config.widgetId || "chatbot-widget";
  if (!chatbotUrl) return;

  var existing = host.ChatbotWidget;
  if (existing && typeof existing.sync === "function") {
    existing.sync(config);
    return;
  }

  var launcherId = widgetId + "-launcher";
  var iframe = document.getElementById(widgetId);
  var launcher = document.getElementById(launcherId);
  var ready = false;
  var open = false;

  function liveConfig() {
    return host.ChatbotConfig || config;
  }

  function themeOf(next) {
    return String((next && next.theme) || "light").toLowerCase() === "dark"
      ? "dark"
      : "light";
  }

  function embedSrc(theme) {
    return chatbotUrl + "/embed?theme=" + encodeURIComponent(theme);
  }

  function frameOrigin() {
    try {
      return iframe ? new URL(iframe.src).origin : chatbotUrl;
    } catch {
      return chatbotUrl;
    }
  }

  function postToFrame(payload) {
    if (!iframe || !iframe.contentWindow) return;
    iframe.contentWindow.postMessage(payload, frameOrigin());
  }

  function postSession() {
    var next = liveConfig();
    var token = String(next.token || "").trim();
    if (!token) return;
    postToFrame({
      type: "lms-init",
      token: token,
      role: next.role || "",
      theme: themeOf(next),
    });
  }

  function postTheme() {
    postToFrame({
      type: "theme",
      theme: themeOf(liveConfig()),
    });
  }

  var botIcon =
    '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">' +
    '<path d="M12 8V4H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<rect x="4" y="8" width="16" height="12" rx="2" stroke="currentColor" stroke-width="2"/>' +
    '<path d="M2 14h2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
    '<path d="M20 14h2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
    '<path d="M9 13v2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
    '<path d="M15 13v2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
    "</svg>";

  var closeIcon =
    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">' +
    '<path d="M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
    '<path d="m6 6 12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
    "</svg>";

  function setOpen(next) {
    open = next;
    if (iframe) iframe.style.display = open ? "block" : "none";
    if (launcher) {
      launcher.innerHTML = open ? closeIcon : botIcon;
      launcher.setAttribute(
        "aria-label",
        open ? "Close LMS assistant" : "Open LMS assistant",
      );
    }
    if (open) postSession();
  }

  function onHostMessage(event) {
    if (!iframe || event.source !== iframe.contentWindow) return;
    if (!event.data || event.data.type !== "lms-ready") return;
    ready = true;
    postSession();
  }

  if (!iframe) {
    launcher = document.createElement("button");
    launcher.id = launcherId;
    launcher.type = "button";
    launcher.setAttribute("aria-label", "Open LMS assistant");
    launcher.style.cssText = [
      "position:fixed",
      "right:20px",
      "bottom:20px",
      "z-index:2147483646",
      "width:56px",
      "height:56px",
      "padding:0",
      "border:0",
      "border-radius:999px",
      "background:#102B72",
      "color:#fff",
      "cursor:pointer",
      "box-shadow:0 8px 24px rgba(16,43,114,0.28)",
      "display:inline-flex",
      "align-items:center",
      "justify-content:center",
    ].join(";");
    launcher.innerHTML = botIcon;

    iframe = document.createElement("iframe");
    iframe.id = widgetId;
    iframe.title = "LMS assistant";
    iframe.src = embedSrc(themeOf(config));
    iframe.allow = "clipboard-write";
    iframe.style.cssText = [
      "position:fixed",
      "right:20px",
      "bottom:80px",
      "z-index:2147483647",
      "width:min(480px,calc(100vw - 32px))",
      "height:min(720px,calc(100dvh - 5rem))",
      "border:0",
      "border-radius:24px",
      "overflow:hidden",
      "box-shadow:0 16px 48px rgba(15,23,42,0.28)",
      "background:#fff",
      "display:none",
    ].join(";");

    iframe.addEventListener("load", function () {
      if (ready) postSession();
    });
    launcher.addEventListener("click", function () {
      setOpen(!open);
    });

    document.body.appendChild(iframe);
    document.body.appendChild(launcher);
    host.addEventListener("message", onHostMessage);
  }

  host.ChatbotWidget = {
    sync: function (next) {
      if (next && typeof next === "object") {
        host.ChatbotConfig = Object.assign({}, liveConfig(), next);
      }
      if (ready) postSession();
      else postTheme();
    },
    destroy: function () {
      host.removeEventListener("message", onHostMessage);
      if (iframe) iframe.remove();
      if (launcher) launcher.remove();
      delete host.ChatbotWidget;
    },
  };
})();
