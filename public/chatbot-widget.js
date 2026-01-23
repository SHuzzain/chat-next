(function() {
    'use strict';
    
    // Configuration
    const config = window.ChatbotConfig || {};
    const chatbotUrl = config.chatbotUrl;
    const token = config.token || '';
    const origin = config.origin || '';
    
    
    // Create widget container
    const widgetId = 'mindchamps-chatbot-widget';
    
    // Check if widget already exists
    if (document.getElementById(widgetId)) {
      return;
    }
    
    // Create iframe
    const iframe = document.createElement('iframe');
    iframe.id = widgetId;
    iframe.src = `${chatbotUrl}/?token=${token}&origin=${origin}`;
    iframe.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 80px;
      height: 80px;
      border: none;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      z-index: 999999;
      background: transparent;
    `;
    iframe.allow = 'clipboard-read; clipboard-write';
    
    // Append to body
    document.body.appendChild(iframe);
    
    // Handle resize messages from iframe
    window.addEventListener('message', function(event) {
      if (event.origin !== chatbotUrl) return;
      
      if (event.data.type === 'resize') {
        iframe.style.width = event.data.width || 360;
        iframe.style.height = event.data.height || 500;
      }
      
      if (event.data.type === 'close') {
        iframe.style.display = 'none';
      }
      
      if (event.data.type === 'open') {
        iframe.style.display = 'block';
      }
    });
    
    // Make widget accessible globally
    window.ChatbotConfig = {
      open: function() {
        iframe.style.display = 'block';
        iframe.contentWindow.postMessage({ type: 'open' }, chatbotUrl);
      },
      close: function() {
        iframe.style.display = 'none';
        iframe.contentWindow.postMessage({ type: 'close' }, chatbotUrl);
      },
      toggle: function() {
        if (iframe.style.display === 'none') {
          this.open();
        } else {
          this.close();
        }
      }
    };
  })();