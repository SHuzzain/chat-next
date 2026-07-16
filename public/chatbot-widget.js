(function () {
  "use strict";

  const config = window.ChatbotConfig || {};
  const chatbotUrl = config.chatbotUrl;
  const token = config.token || "";
  const origin = config.origin || "";
  const role = config.role || "";
  const rawTheme = config.theme || "light";
  const widgetId = config.widgetId;
  const theme =
    String(rawTheme).toLowerCase().trim() === "dark" ? "dark" : "light";


  if (document.getElementById(widgetId)) {
    return;
  }

  const iframe = document.createElement("iframe");
  iframe.id = widgetId;

  const roleParam = role ? `&role=${encodeURIComponent(role)}` : "";
  const themeParam = `&theme=${encodeURIComponent(theme)}`;

  iframe.src = `${chatbotUrl}/?token=${encodeURIComponent(
    token,
  )}&origin=${encodeURIComponent(origin)}${roleParam}${themeParam}`;

  iframe.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 80px;
    height: 80px;
    border: none;
    z-index: 999999;
    border-radius: 9999px;
    overflow: hidden;
  `;

  iframe.allow = "clipboard-read; clipboard-write";
  iframe.setAttribute("allowtransparency", "true");

  document.body.appendChild(iframe);

  const chatbotOrigin = new URL(chatbotUrl).origin;

  window.addEventListener("message", function (event) {
    if (event.origin !== chatbotOrigin) return;

    if (event.data.type === "resize") {
      iframe.style.width = event.data.width || "360px";
      iframe.style.height = event.data.height || "500px";
      iframe.style.borderRadius =
        event.data.width === "56px" ? "9999px" : "16px";
    }

    if (event.data.type === "close") {
      iframe.style.display = "none";
    }

    if (event.data.type === "open") {
      iframe.style.display = "block";
      iframe.style.borderRadius = "16px";
    }
  });

  window.ChatbotConfig = {
    ...config,

    open: function () {
      iframe.style.display = "block";
      iframe.contentWindow.postMessage({ type: "open" }, chatbotOrigin);
    },

    close: function () {
      iframe.style.display = "none";
      iframe.contentWindow.postMessage({ type: "close" }, chatbotOrigin);
    },

    toggle: function () {
      if (iframe.style.display === "none") {
        this.open();
      } else {
        this.close();
      }
    },

    setTheme: function (theme) {
      iframe.contentWindow.postMessage(
        {
          type: "theme",
          theme,
        },
        chatbotOrigin,
      );
    },
  };
})();
