[![License: GPL-3.0](https://img.shields.io/badge/license-GPL--3.0-blue.svg)](https://opensource.org/license/GPL-3.0)

**QwQNT 框架下 Transisio / Scriptio 插件的自用脚本与样式合集**

- `scriptio/` — 用户脚本（`.js`）
- `transisio/` — 用户样式（`.css` / `.styl`）

> 非官方项目，仅供个人使用与学习
> 部分自写，部分 fork 自其他项目

## 前置

- QwQNT 框架
- Scriptio 插件 — 加载 `.js` 脚本
- Transisio 插件 — 加载样式文件
- 可选插件：[lite-tools](https://github.com/xiyuesaves/lite_tools)

## 脚本

### 1. [QuickRepeat](./QuickRepeat.js)

绘制类原生 +1 按钮，双击复读当前消息

- 支持文本、图片消息
- 优先调用 `lite_tools.nativeCall`，其次 `IpcInterceptor`，最后回退原生 `ipcRenderer`

### 2. [ConversationQuickRemover](./ConversationQuickRemover.js)

Ctrl + 左键点击会话，快速移除

### 3. [ShowSendTime](./ShowSendTime.js)

显示消息发送时间

- 支持自定义时间格式、日期格式、时区

## 样式

### 1. [ui-management](./ui-management.css)

窗口 UI 管理器，隐藏侧边栏、顶栏按钮等 QQ 窗口 UI 元素

### 2. [customize-more-menu](./customize-more-menu.styl)

自定义隐藏 QQNT 主界面「更多」菜单中的项目

### 3. [customize-settings](./customize-settings.styl)

自定义隐藏 QQNT 原生设置界面选项

### 4. [hide-emoticon-response](./hide-emoticon-response.css)

移除右键消息上的表情回应

### 5. [hide-self](./hide-self.css)

隐藏居右的自己的头像和昵称（兼容 lite-tools）

### 6. [highlight-at](./highlight-at.css)

高亮艾特
