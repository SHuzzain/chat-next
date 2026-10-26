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

  function setOpen(next) {
    open = next;
    if (iframe) iframe.style.display = open ? "block" : "none";
    if (launcher) {
      launcher.textContent = open ? "Close" : "Chat";
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
    launcher.textContent = "Chat";
    launcher.style.cssText = [
      "position:fixed",
      "right:20px",
      "bottom:20px",
      "z-index:2147483646",
      "height:48px",
      "padding:0 18px",
      "border:0",
      "border-radius:999px",
      "background:#102B72",
      "color:#fff",
      "font:600 14px/1 system-ui,sans-serif",
      "cursor:pointer",
      "box-shadow:0 8px 24px rgba(16,43,114,0.28)",
    ].join(";");

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
      "width:min(400px,calc(100vw - 32px))",
      "height:min(640px,calc(100vh - 120px))",
      "border:0",
      "border-radius:16px",
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
