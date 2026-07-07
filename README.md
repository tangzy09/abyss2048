# Deep Merge 🌊 — 海洋合并消除（Android / iOS）

一款海洋题材的 2048 风格合并消除休闲游戏，用 **Capacitor** 打包成原生 Android / iOS app。
纯 HTML5 Canvas 渲染，**自带 i18n（中文 / 英文）**、**纯广告变现（AdMob 激励视频 + 插屏）**。

> 本项目独立自包含，不依赖任何外部项目。

---

## 目录结构

```
app4096/
├─ capacitor.config.json     # Capacitor 配置（appId / 插件）
├─ package.json              # 依赖与脚本
├─ www/                      # 游戏本体（webDir，原生 app 加载这里）
│  ├─ index.html
│  ├─ css/style.css
│  ├─ audio/                 # 音效 / BGM
│  ├─ locales/               # i18n 文案：zh-CN.json / en.json
│  └─ js/
│     ├─ platform.js         # 原生/Web 抽象层（存储、能力检测）
│     ├─ i18n.js             # 轻量 i18n 引擎
│     ├─ ads.js              # AdMob 激励视频+插屏 + UMP/ATT 合规（Web 模拟）
│     ├─ constants.js        # 调色板 / 数值配置（文案由 i18n 注入）
│     ├─ logic.js            # 纯游戏逻辑状态机
│     ├─ skin.js             # 皮肤切换 + 顶部控制栏（语言/皮肤，全部免费）
│     ├─ render.js           # Canvas 渲染
│     └─ main.js             # 启动、音频、输入、事件分发
└─ resources/                # 放 icon.png / splash.png（可选，配合 @capacitor/assets）
```

---

## 本地预览（浏览器）

```bash
npm install
npm run serve        # 启动 http-server 并打开 http://localhost:5173
```

> 必须用 http 服务器打开（locales 用 `fetch` 加载，`file://` 不行）。
> 浏览器里广告为**模拟**：会弹 `confirm` 让你确认“看完激励视频 / 关闭插屏”。UMP/ATT 合规流程仅在原生端生效。

---

## 打包原生 app

```bash
npm install
npx cap add android          # 生成 /android（已在 .gitignore）
npx cap add ios              # 生成 /ios（需 macOS + Xcode）
npx cap sync                 # 每次改 www/ 或装插件后同步
npx cap open android         # 用 Android Studio 打开并运行
npx cap open ios             # 用 Xcode 打开并运行
```

要求：Node 18+、Android Studio（Android）、macOS + Xcode（iOS）、JDK 17。

---

## 上线前必须替换的配置（⚠ 缺一项就会被拒审 / 封号）

### 1. 真实 AdMob 广告位 —— `www/js/ads.js`
当前用 Google **测试广告位**（`initializeForTesting: true`）。**用测试位跑真实流量会被 AdMob 封号**。填入你自己的两类广告位：
```js
const AD_UNITS              = { android:'ca-app-pub-你的ID/激励位', ios:'ca-app-pub-你的ID/激励位' };
const AD_UNITS_INTERSTITIAL = { android:'ca-app-pub-你的ID/插屏位', ios:'ca-app-pub-你的ID/插屏位' };
```
并在原生工程填入 AdMob **应用 ID**：
- Android: `android/app/src/main/AndroidManifest.xml` 加
  `<meta-data android:name="com.google.android.gms.ads.APPLICATION_ID" android:value="ca-app-pub-xxx~xxx"/>`
- iOS: `ios/App/App/Info.plist` 加 `GADApplicationIdentifier`。

### 2. 广告合规：UMP 同意 + iOS ATT
代码已接入合规流程（`ads.js` 的 `requestConsent()`：`initialize → requestConsentInfo → showConsentForm → ATT`），但**还需两处外部配置，否则弹不出同意框、审核必拒**：
- **AdMob 后台 → 隐私与消息**：创建一条 **GDPR 同意消息**和一条 **IDFA（ATT）消息**并发布——否则 `showConsentForm` 无表单可弹（status 恒为 `NOT_REQUIRED`）。
- **iOS `Info.plist`** 补：
  - `NSUserTrackingUsageDescription`（ATT 弹窗文案，如“用于展示更相关的广告”）；
  - `SKAdNetworkItems`（AdMob 官方 SKAdNetwork ID 列表）。
- 用 EU 测试地区自测：`requestConsentInfo({ debugGeography, testDeviceIdentifiers })` 强制弹同意框验证。

### 3. 隐私政策 URL（App Store / Play 都必填）
广告 app 必须提供隐私政策链接。仓库自带模板 `www/privacy.html`——填好联系邮箱后托管到任意静态站（可用 `ec2-nginx-static-deploy`），把 URL 填进两个商店的 App 隐私设置。同时按 SDK 数据收集情况填 Play「数据安全」表单 / App Store「App 隐私」标签。

### 4. 应用标识 —— `capacitor.config.json`
```json
{ "appId": "com.app4096.deepmerge", "appName": "Deep Merge" }
```
改成你自己的包名 / 名称。

### 5. 图标与启动图
把 `resources/icon.png`（1024×1024）和 `resources/splash.png`（2732×2732）放好后：
```bash
npm i -D @capacitor/assets
npx capacitor-assets generate
```

---

## 变现设计（纯广告，无内购）

- **激励视频**（看完才给奖励）：
  1. 底部「📺 看广告抽装备」→ 看完领 **1 个**装备；
  2. 死亡界面「📺 看广告清除 ≤4 生物」→ 看完清屏续命。
- **插屏**：仅在**过第二关及以后**（进第三关起）进下一关时弹一次；过第一关、抽装备结束**不弹**。
- 全部皮肤免费，无买断、无恢复购买。合规流程见上「§2」。

---

## i18n

- 文案全部在 `www/locales/<lang>.json`，代码不含硬编码用户文案。
- **新增语言**：复制 `en.json` → 比如 `ja.json` 翻译，然后在 `www/js/i18n.js` 的
  `SUPPORTED` 数组里加 `'ja'`。引擎会按系统语言自动选择，右上角按钮可手动切换。
- 数值/配置（关卡尺寸、目标、概率等）在 `constants.js`，与文案解耦。
