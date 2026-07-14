# Abyss Merge 🌊 深渊合成 — 海洋生物进化肉鸽（Android / iOS）

开局选天赋、途中捡装备，在不断变化的海况里把手绘海洋生物一路进化到第 19 阶。
用 **Capacitor** 打包成原生 Android / iOS app，纯 HTML5 Canvas 渲染，
**10 种语言 i18n**、**纯广告变现（AdMob 激励视频 + 插屏）**。

> ⚠️ **本作曾因 App Store Guideline 4.3(a)（Design - Spam，"像克隆"）被拒审一次。**
> 棋盘上**绝不显示 2 的幂**（内部照常是 2/4/8…，显示层一律走 `tierDisp()` 变成 `Lv.N`），
> 任何面向用户的地方都不许出现「2048」字样。详见 `CLAUDE.md` 的第 3 条铁律。

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

> **✅ 本项目（Abyss Merge）现状（2026-07-14）**：§1 AdMob 真实广告位（iOS+Android 双端）、§3 隐私政策 URL、§4 应用标识 **均已配齐**。
> iOS：1.0 因 4.3(a) spam 拒审 → 已彻底去 2048 化 + 改名 Abyss Merge，挂 build #3 **重新提交审核中**。
> Android：正式 AAB 已发 Google Play **internal 轨**。以下保留为配置参考 / 复用说明。

### 1. 真实 AdMob 广告位 —— `www/js/ads.js` ✅ 已完成
~~当前用 Google 测试广告位~~ → 真实广告位已填入（`ads.js` 的 `android`/`ios` 全有真 ID，`initializeForTesting` 随之自动关）。**用测试位跑真实流量会被 AdMob 封号**——已避开。
- **应用 ID（`~`）**：iOS `…~7490076385`（Info.plist `GADApplicationIdentifier`）、Android `…~1041052250`（AndroidManifest `com.google.android.gms.ads.APPLICATION_ID`）
- **广告位 ID（`/`）**：激励 iOS `…/2622938680` · Android `…/4271931810`；插屏 iOS `…/6074419916` · Android `…/4694568252`
- ⚠ 上线后**自测别点自己的真广告**（判无效流量）→ 先把测试机加进 AdMob Test devices。

> **AdMob 后台要分平台各建一个独立 app**（iOS、Android 是**两个** AdMob app，广告位 ID **不通用**）。每个 app 下各建 **Rewarded** + **Interstitial** 两个广告位。拿到的 ID 有两类，别搞混：
> - **应用 ID**：`ca-app-pub-xxx`**`~`**`xxx`（`~` 号）→ 放原生工程（下方）；
> - **广告位 ID**：`ca-app-pub-xxx`**`/`**`xxx`（`/` 号）→ 放 `ads.js` 的 `AD_UNITS`。

填入你自己的两类广告位（`ads.js` 里 android 一填上真 ID，`initializeForTesting` 就自动关、转投真广告——见 `init()` 的判据 `!AD_UNITS[platform]`）：
```js
const AD_UNITS              = { android:'ca-app-pub-你的ID/激励位', ios:'ca-app-pub-你的ID/激励位' };
const AD_UNITS_INTERSTITIAL = { android:'ca-app-pub-你的ID/插屏位', ios:'ca-app-pub-你的ID/插屏位' };
```
并在原生工程填入 AdMob **应用 ID**：
- Android: `android/app/src/main/AndroidManifest.xml` 加
  `<meta-data android:name="com.google.android.gms.ads.APPLICATION_ID" android:value="ca-app-pub-xxx~xxx"/>`
  （android 工程是 gitignore 的，改 `ads.js` 后要 `npx cap sync android` 才进包；manifest 改动 cap sync 不覆盖，本地维护即可）
- iOS: `ios/App/App/Info.plist` 加 `GADApplicationIdentifier`。

> ⚠ **正常现象别误判**：新建的 AdMob app 状态是 **Requires review**（等审核，几天），新广告位**数小时后**才有填充——刚建完显示「无广告/限量」不是你配错了。

### 2. 广告合规：UMP 同意 + iOS ATT
代码已接入合规流程（`ads.js` 的 `requestConsent()`：`initialize → requestConsentInfo → showConsentForm → ATT`），但**还需两处外部配置，否则弹不出同意框、审核必拒**：
- **AdMob 后台 → 隐私与消息**：创建一条 **GDPR 同意消息**和一条 **IDFA（ATT）消息**并发布——否则 `showConsentForm` 无表单可弹（status 恒为 `NOT_REQUIRED`）。
- **iOS `Info.plist`** 补：
  - `NSUserTrackingUsageDescription`（ATT 弹窗文案，如“用于展示更相关的广告”）；
  - `SKAdNetworkItems`（AdMob 官方 SKAdNetwork ID 列表）。
- 用 EU 测试地区自测：`requestConsentInfo({ debugGeography, testDeviceIdentifiers })` 强制弹同意框验证。

### 3. 隐私政策 URL（App Store / Play 都必填）
广告 app 必须提供隐私政策链接。仓库自带模板 `www/privacy.html`——填好联系邮箱后托管到任意静态站（可用 `ec2-nginx-static-deploy`），把 URL 填进两个商店的 App 隐私设置。同时按 SDK 数据收集情况填 Play「数据安全」表单 / App Store「App 隐私」标签。

### 4. 应用标识 —— `capacitor.config.json` ✅ 已完成
```json
{ "appId": "com.aispeeds.abyss2048", "appName": "Abyss Merge" }
```
包名两平台共用、**永久不可改**（连字符会破坏 Android，故用无连字符 `com.aispeeds.abyss2048`）。
⚠️ Bundle ID 里的 `abyss2048` 是历史遗留、改不了，但**用户和 ASO 都看不到**，苹果也未就此提出问题——不要因此把 2048 加回任何可见的地方。

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
