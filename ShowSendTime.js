// ==UserScript==
// @name         ShowSendTime
// @description  显示消息发送时间
// @namespace    https://github.com/Nekozuka-Hibiki
// @version      0.3.1
// @author       Nekozuka-Hibiki
// @license      GPL-3.0
// @homepageURL  https://github.com/Nekozuka-Hibiki/QwQNT-transisio-scriptio-packs
// @run-at       main
// @reactive     true
// ==/UserScript==

(function () {
  "use strict";

  const TIME_FORMAT = "220";
  const DATE_FORMAT = "000";
  const SHOW_TIMEZONE = false;

  const FMT = { 1: "numeric", 2: "2-digit" };
  const CSS_ID = "sst-style";

  // 预先构造格式化器，避免每条消息重复 new
  const TIME_FORMATTER = new Intl.DateTimeFormat("zh-CN", {
    year: FMT[DATE_FORMAT[0]],
    month: FMT[DATE_FORMAT[1]],
    day: FMT[DATE_FORMAT[2]],
    hour: FMT[TIME_FORMAT[0]],
    minute: FMT[TIME_FORMAT[1]],
    second: FMT[TIME_FORMAT[2]],
    timeZoneName: SHOW_TIMEZONE ? "shortOffset" : undefined,
  });

  const FULL_FORMATTER = new Intl.DateTimeFormat("zh-CN", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false, timeZone: "Asia/Shanghai",
  });

  function fmtTime(ts) {
    return TIME_FORMATTER.format(new Date(ts));
  }

  function fmtFull(ts) {
    const p = FULL_FORMATTER.formatToParts(ts)
      .reduce((acc, { type, value }) => (acc[type] = value, acc), {});
    return `${p.year}年${p.month}月${p.day}日 ${p.hour}:${p.minute}:${p.second}`;
  }

  function injectStyle() {
    if (document.getElementById(CSS_ID)) return;
    const style = document.createElement("style");
    style.id = CSS_ID;
    style.textContent = `
      /* ============ 文本时间：内联跟在文本后面 ============ */
      .sst-time-text {
        display: inline-block;
        margin-left: 8px;
        font-size: 12px;
        line-height: 1;
        color: inherit;
        opacity: 0.6;
        white-space: nowrap;
        vertical-align: bottom;
        pointer-events: none;
        user-select: none;
        -webkit-user-select: none;
      }

      /* ============ 图片时间：hover 显示在右下角 ============ */
      .pic-element.sst-img-host {
        position: relative;
      }
      .sst-time-image {
        position: absolute;
        bottom: 8px;
        right: 10px;
        padding: 2px 6px;
        border-radius: 5px;
        background-color: rgba(0, 0, 0, 0.3);
        color: #fff;
        font-size: 12px;
        line-height: 14px;
        white-space: nowrap;
        opacity: 0;
        transition: opacity 150ms;
        pointer-events: none;
        user-select: none;
        -webkit-user-select: none;
      }
      .message:hover .sst-time-image {
        opacity: 1;
      }
    `;
    document.head.appendChild(style);
  }

  function getMsgRecord(messageEl) {
    const vues = messageEl.__VUE__;
    if (!vues) return null;
    for (const inst of new Set(vues)) {
      const rec = inst?.props?.msgRecord;
      if (rec?.msgId) return rec;
    }
    return null;
  }

  function isImageOnly(rec) {
    if (!rec.elements || rec.elements.length !== 1) return false;
    const el = rec.elements[0];
    if (el.elementType !== 2) return false;
    const sub = el.picElement?.picSubType;
    return sub === 0 || sub === 1;
  }

  function drawTime(messageEl) {
    if (!messageEl.classList.contains("message")) return;

    const rec = getMsgRecord(messageEl);
    if (!rec?.msgTime) return;

    if (messageEl.dataset.sstMsgId === rec.msgId &&
        messageEl.querySelector(".sst-time-text, .sst-time-image")) {
      return;
    }

    messageEl.querySelectorAll(".sst-time-text, .sst-time-image").forEach((el) => el.remove());
    messageEl.querySelectorAll(".sst-img-host").forEach((el) =>
      el.classList.remove("sst-img-host")
    );

    const ts = rec.msgTime * 1000;
    const timeText = fmtTime(ts);
    const timeTitle = fmtFull(ts);

    if (isImageOnly(rec)) {
      const picEl = messageEl.querySelector(".message-content .pic-element");
      if (!picEl) return;

      picEl.classList.add("sst-img-host");

      const timeEl = document.createElement("span");
      timeEl.className = "sst-time-image";
      timeEl.textContent = timeText;
      timeEl.title = timeTitle;
      picEl.appendChild(timeEl);
    } else {
      const content = messageEl.querySelector(".message-content");
      if (!content) return;

      const timeEl = document.createElement("span");
      timeEl.className = "sst-time-text";
      timeEl.textContent = timeText;
      timeEl.title = timeTitle;
      content.appendChild(timeEl);
    }

    messageEl.dataset.sstMsgId = rec.msgId;
  }

  let observer = null;

  function scanAll() {
    document.querySelectorAll(".message").forEach(drawTime);
  }

  function startObserver() {
    if (observer) return;
    observer = new MutationObserver((muts) => {
      for (const m of muts) {
        m.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;
          if (node.matches?.(".message")) {
            drawTime(node);
          } else {
            node.querySelectorAll?.(".message").forEach(drawTime);
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
    document.querySelectorAll(".sst-time-text, .sst-time-image").forEach((el) => el.remove());
    document.querySelectorAll(".sst-img-host").forEach((el) =>
      el.classList.remove("sst-img-host")
    );
  }

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