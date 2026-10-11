// ==UserScript==
// @name         Conversation Quick Remover
// @description  Ctrl+左键点击移除会话
// @namespace    https://github.com/Nekozuka-Hibiki
// @version      0.1.1
// @author       Nekozuka-Hibiki
// @license      GPL-3.0
// @homepageURL  https://github.com/Nekozuka-Hibiki/QwQNT-transisio-scriptio-packs
// @run-at       main
// @reactive     true
// ==/UserScript==
(function () {
  const debug = false; // 是否开启调试模式，开启后会在控制台输出日志
  const log = debug ? console.log.bind(console, "[ConversationQuickRemover]") : () => { };

  async function removeConversation(conversationElement) {
    const rightClickEvent = new MouseEvent("contextmenu", {
      bubbles: true,
      cancelable: true,
      view: window,
      button: 2,
    });
    conversationElement.dispatchEvent(rightClickEvent);

    let attempts = 0;
    const maxAttempts = 100;
    const interval = 1; // 每次尝试间隔1ms

    while (attempts++ < maxAttempts) {
      const menuItem = Array.from(document.querySelectorAll(".q-context-menu-item"))
        .find(item => item.textContent === "从消息列表中移除");
      if (menuItem) {
        menuItem.click();
        log("Conversation Removed");
        return true;
      }
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
    log("Failed to remove conversation after maximum attempts");
    return false;
  }

  function handleClick(event) {
    // 修改逻辑：必须是 Ctrl 键 + 左键 (button 0)
    if (!event.ctrlKey || event.shiftKey || event.altKey || event.metaKey) return;

    const targetElement = event.target.closest(".recent-contact-item");
    // 修改判断：检查左键 (0) 而不是中键 (1)
    if (targetElement && event.button === 0) {
      event.preventDefault();
      event.stopImmediatePropagation();
      removeConversation(targetElement);
    }
  }

  let isListening = false;
  function toggleListener(isEnabled) {
    if (isEnabled && !isListening) {
      // 保持 capture: true 以确保能拦截到事件
      document.body.addEventListener("mousedown", handleClick, { capture: true });
    } else if (!isEnabled && isListening) {
      document.body.removeEventListener("mousedown", handleClick, { capture: true });
    }
    isListening = isEnabled;
  }

  scriptio_toolkit.listen(toggleListener, true);
})();