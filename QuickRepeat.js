// ==UserScript==
// @name         QuickRepeat (+1 Button)
// @description  绘制类原生 +1 按钮，双击复读
// @run-at       main
// @reactive     true
// @version      0.4.3
// @license      gpl-3.0
// ==/UserScript==

(function () {
  "use strict";

  const SUPPORTED = [1, 2];
  const CSS_ID = "qr-style";

  const ICON_SVG = `
    <svg width="23" height="23" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="14" cy="14" r="11.25" stroke="var(--brand_standard, #0099ff)" stroke-width="1.5"></circle>
      <path d="M6.81348 14.7051V13.3447H14.2168V14.7051H6.81348ZM9.83496 17.7402V10.3096H11.1953V17.7402H9.83496Z" fill="var(--brand_standard, #0099ff)"></path>
      <path d="M17.4727 18V9.71484H17.3633L14.8818 11.4854V9.98145L17.4795 8.13574H19.0107V18H17.4727Z" fill="var(--brand_standard, #0099ff)"></path>
    </svg>
  `;

  // ---------------- 样式 ----------------
  function injectStyle() {
    if (document.getElementById(CSS_ID)) return;
    const style = document.createElement("style");
    style.id = CSS_ID;
    style.textContent = `
      .plus-one-btn { display: none !important; }

      /* 关键：wrapper 收缩到气泡宽度 */
      .message-content__wrapper.qr-host {
        position: relative !important;
        overflow: visible !important;
        width: fit-content !important;
        max-width: 100% !important;
      }

      .qr-plus-btn {
        position: absolute;
        bottom: 0;
        width: 23px;
        height: 23px;
        display: none;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        opacity: 0.8;
        transition: opacity 150ms;
        z-index: 5;
        user-select: none;
        -webkit-user-select: none;
      }
      .qr-plus-btn svg { display: block; pointer-events: none; }
      .qr-plus-btn:hover { opacity: 1; }

      .qr-plus-btn.qr-self   { right: calc(100% + 4px); }
      .qr-plus-btn.qr-others { left:  calc(100% + 4px); }

      .message:hover .qr-plus-btn { display: flex; }
    `;
    document.head.appendChild(style);
  }

  // ---------------- 数据 ----------------
  function getMsgRecord(messageEl) {
    const vues = messageEl.__VUE__;
    if (!vues) return null;
    for (const inst of new Set(vues)) {
      const rec = inst?.props?.msgRecord;
      if (rec?.msgId) return rec;
    }
    return null;
  }

  function getPeer() {
    const aio = document.querySelector(".aio.vue-component");
    if (!aio?.__VUE__) return null;
    for (const inst of new Set(aio.__VUE__)) {
      const store = inst?.proxy?.commonAioStore;
      const uid = store?.curAioData?.header?.uid;
      if (uid) {
        return {
          chatType: store.curAioData.chatType,
          guildId: "",
          peerUid: uid,
        };
      }
    }
    return null;
  }

  // ---------------- 发送 ----------------
  function sendPlusOne(msgId, peer) {
    const request = {
      type: "request",
      eventName: "ntApi",
      cmdName: "nodeIKernelMsgService/forwardMsgWithComment",
      cmdType: "ntApi",
      payload: [
        {
          commentElements: [],
          dstContacts: [peer],
          msgAttributeInfos: new Map(),
          msgIds: [msgId],
          srcContact: peer,
        },
        null,
      ],
    };

    if (window.lite_tools?.nativeCall) {
      try {
        window.lite_tools.nativeCall(
          { type: "request", eventName: "ntApi" },
          request
        )?.catch?.(() => {});
      } catch (_) {}
      return;
    }

    if (window.IpcInterceptor) {
      const send =
        window.IpcInterceptor.send ||
        window.IpcInterceptor.sendIpc ||
        window.IpcInterceptor.emit;
      if (typeof send === "function") {
        try {
          send.call(window.IpcInterceptor, request);
        } catch (_) {}
        return;
      }
    }

    try {
      const { ipcRenderer } = require("electron");
      let id = 2;
      try {
        id = ipcRenderer.sendSync("ELECTRON_BROWSER_CURRENT_WEB_CONTENTS_ID") || 2;
      } catch (_) {}
      ipcRenderer.send("RM_IPCFROM_RENDERER" + id, request);
    } catch (_) {}
  }

  // ---------------- 绘制 ----------------
  function drawButton(messageEl) {
    if (!messageEl.classList.contains("message")) return;

    const rec = getMsgRecord(messageEl);
    if (!rec) return;
    if (!rec.elements?.some((e) => SUPPORTED.includes(e.elementType))) return;

    if (messageEl.dataset.qrMsgId === rec.msgId &&
        messageEl.querySelector(".qr-plus-btn")) {
      return;
    }

    messageEl.querySelectorAll(".qr-plus-btn").forEach((el) => el.remove());

    const wrapper = messageEl.querySelector(".message-content__wrapper");
    const bubble = messageEl.querySelector(".msg-content-container");
    if (!wrapper || !bubble) return;

    wrapper.classList.add("qr-host");

    const isSelf = bubble.classList.contains("container--self");

    const btn = document.createElement("div");
    btn.className = "qr-plus-btn no-copy " + (isSelf ? "qr-self" : "qr-others");
    btn.innerHTML = ICON_SVG;
    btn.title = "双击复读";

    btn.addEventListener("mousedown", (ev) => ev.preventDefault());

    btn.addEventListener("dblclick", (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      ev.stopImmediatePropagation();
      const peer = getPeer();
      if (!peer) return;
      sendPlusOne(rec.msgId, peer);
    });

    wrapper.appendChild(btn);
    messageEl.dataset.qrMsgId = rec.msgId;
  }

  // ---------------- 扫描 + 监听 ----------------
  let observer = null;

  function scanAll() {
    document.querySelectorAll(".message").forEach(drawButton);
  }

  function startObserver() {
    if (observer) return;
    observer = new MutationObserver((muts) => {
      for (const m of muts) {
        m.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;
          if (node.matches?.(".message")) {
            drawButton(node);
          } else {
            node.querySelectorAll?.(".message").forEach(drawButton);
          }
        });
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    scanAll();
  }

  function stopObserver() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    document.querySelectorAll(".qr-plus-btn").forEach((el) => el.remove());
    document.querySelectorAll(".qr-host").forEach((el) =>
      el.classList.remove("qr-host")
    );
  }

  // ---------------- 生命周期 ----------------
  injectStyle();

  let listening = false;
  function toggle(enabled) {
    if (enabled && !listening) {
      startObserver();
      listening = true;
    } else if (!enabled && listening) {
      stopObserver();
      listening = false;
    }
  }

  if (typeof scriptio_toolkit !== "undefined" && scriptio_toolkit.listen) {
    scriptio_toolkit.listen(toggle, true);
  } else {
    toggle(true);
  }
})();