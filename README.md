[![License: GPL-3.0](https://img.shields.io/badge/license-GPL--3.0-blue.svg)](https://opensource.org/license/GPL-3.0)

**QwQNT 框架下 Transisio / Scriptio 插件的自用脚本与样式合集**

- `scriptio/` — 用户脚本（`.js`）
- `transisio/` — 用户样式（`.css`）

> 自用为主，部分移植自开源社区

## 前置

- QwQNT 框架
- Scriptio 插件 — 加载 `.js` 脚本
- Transisio 插件 — 加载样式文件
- 可选插件：[lite-tools](https://github.com/xiyuesaves/lite_tools)

## 脚本

### 1. [Chat-QuickRepeat](./Chat-QuickRepeat.js)

绘制类原生 +1 按钮，双击复读当前消息

- 支持文本、图片消息
- 优先调用 `lite_tools.nativeCall`，其次 `IpcInterceptor`，最后回退原生 `ipcRenderer`

### 2. [UI-QuickRemover](./UI-QuickRemover.js)

Ctrl + 左键点击会话，快速移除

### 3. [UI-QuickGroupFile](./UI-QuickGroupFile.js)

“群应用”按钮替换为“群文件”

- 自动替换图标，移除原生下拉菜单

### 4. [Chat-ShowSendTime](./Chat-ShowSendTime.js)

显示消息发送时间

- 支持自定义时间格式、日期格式、时区

## 样式

### 1. [ui-management](./ui-management.css)

窗口 UI 管理器，隐藏侧边栏、顶栏按钮等 QQ 窗口 UI 元素

### 2. [customize-panels](./customize-panels.css)

隐藏 QQNT 原生设置界面与更多菜单中的选项

### 3. [chat-enhancements](./chat-enhancements.css)

聊天界面增强：隐藏自己的头像和昵称（兼容 lite-tools）、高亮艾特、移除右键表情回应
