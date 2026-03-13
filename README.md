# ⚡ Zeno Wallet — The Intelligent Nexus

> A next-generation, AI-powered Web3 browser extension wallet built with Plasmo. Zeno shifts the wallet from a passive tool into an intelligent co-pilot that monitors, guides, and protects.

---

## ✨ Key Features

| Feature                  | Description                                                                             |
| ------------------------ | --------------------------------------------------------------------------------------- |
| **Dual-Mode UI**         | Lite Mode (intent-based, simple) & Pro Mode (alpha hunting, advanced analytics)         |
| **AI Security Guardian** | Real-time transaction simulation, threat detection & risk assessment via in-app AI chat |
| **Onboarding Tour**      | Interactive step-by-step guided tour powered by [Driver.js](https://driverjs.com)       |
| **Multi-Chain Support**  | Ethereum, Arbitrum, Base, Polygon — more chains added automatically                     |
| **Glassmorphism Design** | Dark, premium UI with micro-animations, custom scrollbars & dynamic glow effects        |
| **Account Abstraction**  | ERC-4337 ready — gasless transactions & social login (zkLogin) planned                  |

---

## 🗺 Guided Tour (Driver.js)

Zeno ships with a built-in interactive onboarding tour using **[Driver.js](https://driverjs.com)**:

- **Auto-starts** on first Dashboard visit (stored in `localStorage` as `zeno_tour_done`)
- **9 steps** covering every major UI element — logo, address, network, mode toggle, balance, actions, assets, AI nav & settings
- **Themed** to match Zeno's dark glassmorphism aesthetic (custom popover CSS in `style.css`)
- **Re-triggerable** at any time via the `?` button in the top-right corner of the Dashboard

### Tour Steps

1. Welcome to Zeno
2. Your Wallet Address (copy)
3. Network Selector
4. Lite / Pro Mode toggle
5. Total Balance display
6. Quick Actions (Send / Receive / Swap / Buy)
7. Asset list
8. AI Guardian nav tab
9. Settings nav tab

---

## 🏗 Project Structure

```
src/
├── popup.tsx                   # Root — orchestrates Screen navigation state
├── style.css                   # Tailwind base + custom keyframes, scrollbar & Driver.js theme
│
├── components/
│   ├── BottomNav.tsx           # Nav bar (Dashboard / Send / Receive / AI / Settings)
│   ├── TokenCard.tsx           # Single token row (icon, name, balance, change %)
│   └── AIMessage.tsx           # AI chat bubble component
│
├── features/
│   └── useDashboardTour.ts     # Driver.js tour hook (steps, auto-start, re-trigger)
│
└── screens/
    ├── WelcomeScreen.tsx        # Entry — Create wallet or Import
    ├── SetupPasswordScreen.tsx  # Password creation
    ├── SeedPhraseScreen.tsx     # Seed phrase reveal & backup confirmation
    ├── ImportWalletScreen.tsx   # Import via 12/24-word seed phrase
    ├── DashboardScreen.tsx      # Main wallet view (tour anchors, balance, assets)
    ├── SendScreen.tsx           # Send crypto with AI address verification
    ├── ReceiveScreen.tsx        # QR code + address copy
    ├── SwapScreen.tsx           # Token swap with slippage control
    ├── AIGuardianScreen.tsx     # AI chat interface
    └── SettingsScreen.tsx       # Account, security, network & preferences
```

---

## 🛠 Tech Stack

| Layer                   | Technology                                  |
| ----------------------- | ------------------------------------------- |
| **Extension Framework** | [Plasmo](https://www.plasmo.com/) `0.90.5`  |
| **UI Library**          | React 18 + TypeScript 5                     |
| **Styling**             | Tailwind CSS 3 + Vanilla CSS (custom layer) |
| **Onboarding Tour**     | [Driver.js](https://driverjs.com)           |
| **Web3 (planned)**      | Viem + Wagmi + zkLogin                      |
| **Package Manager**     | pnpm                                        |

---

## 📦 Development

### Prerequisites

- Node.js ≥ 18
- pnpm (`npm install -g pnpm`)

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/your-org/zeno-extension.git
cd zeno-extension

# 2. Install dependencies
pnpm install

# 3. Start dev server (loads as an unpacked extension)
pnpm dev
```

### Load as Unpacked Extension

1. Open Chrome → `chrome://extensions`
2. Enable **Developer Mode** (top-right toggle)
3. Click **Load unpacked** → select the `build/chrome-mv3-dev` folder

### Build for Production

```bash
pnpm build
# Output: build/chrome-mv3-prod/
```

### Package for Distribution

```bash
pnpm package
# Creates a .zip ready for the Chrome Web Store
```

---

## 📁 Key Files at a Glance

| File                               | Purpose                                                                    |
| ---------------------------------- | -------------------------------------------------------------------------- |
| `src/popup.tsx`                    | Defines the `Screen` union type, manages navigation state, renders screens |
| `src/features/useDashboardTour.ts` | All Driver.js tour logic — steps, theming options, auto-start logic        |
| `src/style.css`                    | Global styles + all `.zeno-tour-popover` CSS overrides for Driver.js       |
| `src/screens/DashboardScreen.tsx`  | Main screen with `id` anchors for each tour step                           |
| `src/components/BottomNav.tsx`     | Bottom nav with `id="tour-nav-ai"` and `id="tour-nav-settings"` anchors    |

---

## 🔒 Security Notes

- Passwords are stored locally via `localStorage` — **never** sent to a server
- Seed phrases are displayed in-app only and never leave the device
- AI Guardian performs client-side simulation before any transaction is signed
