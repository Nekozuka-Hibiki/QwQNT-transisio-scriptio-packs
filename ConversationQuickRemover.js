// ==UserScript==
// @name         Conversation Quick Remover
// @description  Ctrl+左键点击移除会话
// @namespace    https://github.com/Nekozuka-Hibiki
// @version      0.1.2
// @author       Nekozuka-Hibiki
// @license      GPL-3.0
// @homepageURL  https://github.com/Nekozuka-Hibiki/QwQNT-transisio-scriptio-packs
// @run-at       main
// @reactive     true
// ==/UserScript==

(function () {
  "use strict";

  const debug = false;
  const log = debug ? console.log.bind(console, "[ConversationQuickRemover]") : () => {};

  const MENU_TEXT = "从消息列表中移除";
  const MAX_ATTEMPTS = 100;
  const INTERVAL = 20;   // ms，避免 1ms 忙轮询

  let busy = false;      // 防止连续触发

  async function removeConversation(conversationElement) {
    if (busy) return false;
    busy = true;

    try {
      const rightClickEvent = new MouseEvent("contextmenu", {
        bubbles: true,
        cancelable: true,
        view: window,
        button: 2,
      });
      conversationElement.dispatchEvent(rightClickEvent);

      let attempts = 0;
      while (attempts++ < MAX_ATTEMPTS) {
        const menuItem = Array.from(document.querySelectorAll(".q-context-menu-item"))
          .find(item => item.textContent === MENU_TEXT);
        if (menuItem) {
          menuItem.click();
          log("Conversation Removed");
          return true;
        }
        await new Promise((resolve) => setTimeout(resolve, INTERVAL));
      }

      log("Failed to remove conversation after maximum attempts");
      return false;
    } finally {
      busy = false;
    }
  }

  function handleClick(event) {
    if (!event.ctrlKey || event.shiftKey || event.altKey || event.metaKey) return;
    if (event.button !== 0) return;

    const targetElement = event.target.closest(".recent-contact-item");
    if (targetElement) {
      event.preventDefault();
      event.stopImmediatePropagation();
      removeConversation(targetElement);
    }
  }

  let isListening = false;
  function toggleListener(isEnabled) {
    if (isEnabled && !isListening) {
      document.body.addEventListener("mousedown", handleClick, { capture: true });
    } else if (!isEnabled && isListening) {
      document.body.removeEventListener("mousedown", handleClick, { capture: true });
    }
    isListening = isEnabled;
  }

  scriptio_toolkit.listen(toggleListener, true);
})();