// ==UserScript==
// @name         Quick Group File
// @description  “群应用”按钮替换为“群文件”
// @namespace    https://github.com/Nekozuka-Hibiki
// @version      1.0.0
// @author       Nekozuka-Hibiki
// @license      GPL-3.0
// @homepageURL  https://github.com/Nekozuka-Hibiki/QwQNT-transisio-scriptio-packs
// @run-at       main
// @reactive     true
// ==/UserScript==

(function () {
  "use strict";

  const BTN_ID = "id-func-bar-group_application";
  const BTN    = "#" + BTN_ID;
  const MENU   = ".bar-more-menu";
  const FILE   = "#id-open_file";
  const ICON   = "/_upper_/resource/icons/open_file_24.svg#open_file_24";
  const LABEL  = "群文件";

  // document capture：只处理点击链路（高频 hover 不再挂文档层）
  const CLICK = ["pointerdown", "mousedown", "pointerup", "mouseup", "click"];
  // 按钮 capture：hover 拦截局部化（enter 不冒泡本来就得局部；over 一并移入）
  const HOVER = ["pointerenter", "mouseenter", "pointerover", "mouseover"];
  // 合成事件在 .bar-more-menu 层要截停的完整集合
  const GUARD = ["pointerdown", "mousedown", "pointerup", "mouseup", "click", "pointerover", "mouseover"];

  const SYNTH = [
    ["PointerEvent", "pointerdown", { buttons: 1, pointerId: 1, pointerType: "mouse", isPrimary: true }],
    ["MouseEvent",   "mousedown",   { buttons: 1 }],
    ["PointerEvent", "pointerup",   { buttons: 0, pointerId: 1, pointerType: "mouse", isPrimary: true }],
    ["MouseEvent",   "mouseup",     { buttons: 0 }],
    ["MouseEvent",   "click",       { buttons: 0 }],
  ];

  let bodyObs = null;   // 发现按钮重建
  let btnObs  = null;   // 按钮自身属性回归
  let currentBtn = null;
  let busy = false;
  const synthetic    = new WeakSet();
  const hoverPatched = new WeakSet();

  const killHover = (e) => {
    if (synthetic.has(e)) return;
    e.stopImmediatePropagation();
  };

  /* ---- 把按钮伪装成“群文件” ---- */
  function patch(btn) {
    const icon = btn.querySelector(".icon-item");
    if (icon && icon.getAttribute("aria-label") !== LABEL) icon.setAttribute("aria-label", LABEL);

    const use = btn.querySelector(".icon-item svg use");
    if (use && use.getAttribute("href") !== ICON) use.setAttribute("href", ICON);

    const arrow = btn.querySelector(".arrow");
    if (arrow && arrow.style.display !== "none") arrow.style.display = "none";

    if (!hoverPatched.has(btn)) {
      hoverPatched.add(btn);
      HOVER.forEach((t) => btn.addEventListener(t, killHover, true));
    }
  }

  /* ---- 绑定按钮：清理旧按钮 hover 监听、自身属性观察、hover 拦截 ---- */
  function bind(btn) {
    if (currentBtn && currentBtn !== btn) {
      HOVER.forEach((t) => currentBtn.removeEventListener(t, killHover, true));
      hoverPatched.delete(currentBtn);
    }
    currentBtn = btn;

    if (btnObs) btnObs.disconnect();
    btnObs = new MutationObserver(() => patch(btn));
    btnObs.observe(btn, {
      subtree: true,
      attributes: true,
      attributeFilter: ["href", "aria-label"],
    });
    patch(btn);
  }

  /* ---- body observer 回调：稳态下 isConnected 短路，几乎零开销 ---- */
  function onBodyMutation() {
    if (currentBtn && currentBtn.isConnected) return;  // 按钮还活着，无需查询
    const btn = document.getElementById(BTN_ID);
    if (btn && btn !== currentBtn) bind(btn);
  }

  /* ---- 向“群文件”派发完整鼠标序列；在 .bar-more-menu 处截停 ---- */
  function fireFullClick(el) {
    const menu = el.closest(MENU);
    const guard = (e) => { if (synthetic.has(e)) e.stopPropagation(); };
    if (menu) GUARD.forEach((t) => menu.addEventListener(t, guard, false));

    try {
      for (const [Ctor, type, extra] of SYNTH) {
        const ev = new window[Ctor](type, {
          bubbles: true, cancelable: true, view: window, button: 0, ...extra,
        });
        synthetic.add(ev);
        el.dispatchEvent(ev);
      }
    } finally {
      setTimeout(() => {
        if (menu) GUARD.forEach((t) => menu.removeEventListener(t, guard, false));
      }, 0);
    }
  }

  /* ---- document 上只处理点击链路 ---- */
  function onClick(e) {
    if (synthetic.has(e)) return;
    const btn = e.target.closest(BTN);
    if (!btn) return;
    if (btn !== currentBtn) bind(btn);   // 点击瞬间兜底：保证 hover 拦截已就位

    e.preventDefault();
    e.stopImmediatePropagation();

    if (e.type === "click" && !busy) {
      busy = true;
      try {
        const item = document.querySelector(FILE);
        if (item) fireFullClick(item);
      } finally {
        setTimeout(() => { busy = false; }, 200);
      }
    }
  }

  function start() {
    const btn = document.getElementById(BTN_ID);
    if (btn) bind(btn);

    bodyObs = new MutationObserver(onBodyMutation);
    bodyObs.observe(document.body, { childList: true, subtree: true });

    CLICK.forEach((t) => document.addEventListener(t, onClick, true));
  }

  function stop() {
    CLICK.forEach((t) => document.removeEventListener(t, onClick, true));
    if (bodyObs) { bodyObs.disconnect(); bodyObs = null; }
    if (btnObs)  { btnObs.disconnect();  btnObs  = null; }
    if (currentBtn) {
      HOVER.forEach((t) => currentBtn.removeEventListener(t, killHover, true));
      hoverPatched.delete(currentBtn);
      currentBtn = null;
    }
  }

  scriptio_toolkit.listen((on) => (on ? start() : stop()), true);
})();
