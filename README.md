<div align="center">

# 🌤️ Weather Assistant

**Smart forecasts, gradients, and a prediction API — on your phone and on the web.**

[![Expo](https://img.shields.io/badge/Expo-SDK%2054-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React_Native-0.81.5-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactnative.dev)
[![React](https://img.shields.io/badge/React-19.1-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Private](https://img.shields.io/badge/License-Private-E63946?style=for-the-badge)](#)

<br/>

🗺️ **GPS & cities** · 📊 **Risk & labels** · 🔔 **Daily reminders** · 🌗 **Light / dark**

<sub>Built with Expo · React Native · TypeScript</sub>

</div>

---

## ✨ Highlights

| | |
|:---:|:---|
| 🎬 | **Animated splash** → smooth handoff to a **3-tab** app (Home · Test · Settings). |
| 🏠 | **Home** loads predictions from **your location** or a **saved city** — pull to refresh, shimmer while loading. |
| 🧪 | **Test** mode: type weather numbers yourself; optional **`explain=true`** for per-label breakdowns. |
| ⚙️ | **Settings**: city picker, notification time, permission hints (Expo Go limitations called out in-app). |
| 🎨 | **Purple–blue gradients**, haptics, **Reanimated** motion, **system theme** aware UI. |

---

## 🎯 Features

- 🚀 **Animated intro** — `app/index.tsx` runs a branded splash, then sends you to the tab navigator.
- 📍 **Home** — Calls `POST /predict` with coordinates from GPS or your stored city. Shows temperature, humidity, wind, pressure, clouds, UV, probabilities, risk, recommendations, and metadata when the API returns them.
- 🧫 **Manual test** — POST the same endpoint with a `features` body. Toggle **Detailed explanation** for `?explain=true` and `explanation.per_label`.
- 🏙️ **City list** — Turkey provinces plus hand-picked world cities; search and persist your choice.
- 🔔 **Notifications** — Schedule a daily local reminder; handler tries to refresh predictions before surfacing content where the OS allows it.
- 🌈 **Theming** — `userInterfaceStyle: automatic`; gradient cards, shimmer placeholders, tab haptics.

---

## 🛠️ Tech stack

<table>
<tr>
<td align="center" width="25%"><strong>⚡ Runtime</strong><br/><sub>Expo SDK <b>54</b><br/>RN <b>0.81.5</b><br/>React <b>19</b></sub></td>
<td align="center" width="25%"><strong>📐 Language</strong><br/><sub>TypeScript <b>~5.9</b></sub></td>
<td align="center" width="25%"><strong>🧭 Navigation</strong><br/><sub>Expo Router<br/>typed routes</sub></td>
<td align="center" width="25%"><strong>🎨 UI</strong><br/><sub>Linear Gradient<br/>Reanimated · Shimmer</sub></td>
</tr>
<tr>
<td align="center"><strong>📱 Device</strong><br/><sub>Location · Notifications<br/>AsyncStorage · Haptics</sub></td>
<td align="center"><strong>🔧 Tooling</strong><br/><sub>ESLint (Expo config)<br/>React Compiler <i>(experiment)</i></sub></td>
<td align="center"><strong>🏗️ Native</strong><br/><sub><b>New Architecture</b> on<br/><code>newArchEnabled</code></sub></td>
<td align="center"><strong>🖼️ Assets</strong><br/><sub>Expo Image<br/>splash & icons</sub></td>
</tr>
</table>

---

## 📱 Platform support

| 📱 iOS | 🤖 Android | 🌐 Web |
|:---:|:---:|:---:|
| ✅ Simulator & device | ✅ Emulator & device | ✅ `expo start --web` |
| Xcode for native builds | Android Studio | Modern browsers |

---

## 📋 Requirements

- 🟢 **Node.js** 18+ (LTS recommended)
- 📦 **npm** or compatible package manager
- 🍎 **Xcode** (iOS) / 🤖 **Android Studio** (Android) — or scan QR with **Expo Go** for quick runs

---

## 🚀 Getting started

```bash
git clone <your-repo-url>
cd weather-assistant-app
npm install
npx expo start
```

> 💡 **Tip:** Press **`i`** (iOS), **`a`** (Android), or **`w`** (web). Use **Expo Go** and scan the QR code from the terminal or dev tools.

### 📜 Scripts

| Command | What it does |
|:--------|:-------------|
| `npm start` | ▶️ Expo dev server |
| `npm run ios` | 🍎 Build & run iOS |
| `npm run android` | 🤖 Build & run Android |
| `npm run web` | 🌐 Web |
| `npm run lint` | 🔍 `expo lint` |
| `npm run reset-project` | ♻️ Template reset helper |

---

## 📂 Project layout

```
weather-assistant-app/
├── 📱 app/
│   ├── index.tsx           ✨ Splash → tabs
│   ├── _layout.tsx          Root stack + modal
│   ├── modal.tsx
│   └── (tabs)/
│       ├── _layout.tsx      🏠 🧪 ⚙️ Tabs
│       ├── index.tsx        Home / predictions
│       ├── test.tsx         Manual input + explain
│       └── settings.tsx     Cities & notifications
├── 🖼️ assets/images/
├── 🧩 components/
├── 📐 constants/theme.ts
├── 🪝 hooks/
└── ⚙️ services/
    ├── api.ts
    ├── city.ts
    ├── location.ts
    └── notifications.ts
```

---

## 🌐 Backend API

Default base URL lives in **`services/api.ts`** →  
`https://weather-assistant-api.onrender.com`

| Method | Endpoint | 📝 Purpose |
|:------:|:---------|:-----------|
| `POST` | `/predict` | `{ lat, lon }` **or** `{ features: { … } }` · add `?explain=true` for explanations |
| `GET` | `/health` | Expect `status === "ok"` & `model_loaded === true` for a healthy model |

🔧 To use another server, change **`API_BASE_URL`** in `services/api.ts` (or wire env vars).

---

## ⚠️ Permissions & notes

| Topic | Detail |
|:------|:-------|
| 📍 **Location** | Needed for GPS predictions when no city is saved — strings from Expo Location plugin in `app.json`. |
| 🔔 **Notifications** | OS + Expo rules apply; **Expo Go** may limit behavior (settings UI mentions this). |
| 🍎 **iOS background** | `UIBackgroundModes` includes notification / background entries for scheduled flows. |

---

## 📜 Use and licensing

| | |
|:--|:--|
| 🎓 **Educational** | Use for **learning**, **teaching**, **coursework**, and **non-commercial** experiments (Expo, React Native, APIs, etc.). |
| 💼 **Commercial** | **Contact the maintainer first** — redistribution or use in paid products/services needs **prior permission** (e.g. repo owner or an issue). |

🔒 Repository is **`private: true`** in `package.json`. The terms above apply together with host and visibility rules.

---

<div align="center">

**Made with ☀️ using Expo & React Native**

🚀 *Stay ahead of the forecast.*

</div>
