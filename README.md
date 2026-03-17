# Zeno Wallet — The Intelligent Nexus

<p align="center">
  <img src="https://raw.githubusercontent.com/plasmo-corp/plasmo/main/packages/plasmo/assets/icon.png" width="80" height="80" alt="Zeno Logo" />
</p>

<p align="center">
  <strong>The next generation of Web3 security.</strong><br />
  A premium, AI-powered browser extension wallet that converts passive management into active protection.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Version-1.0.4--beta-white?style=flat-square" alt="Version" />
  <img src="https://img.shields.io/badge/Powered_By-Gemini_Pro-blue?style=flat-square&logo=google-gemini" alt="AI Powered" />
  <img src="https://img.shields.io/badge/Built_With-Plasmo-purple?style=flat-square" alt="Plasmo" />
  <img src="https://img.shields.io/badge/Security-AI_Guardian-emerald?style=flat-square" alt="Security" />
</p>

---

## The Zeno Philosophy

Zeno isn't just a place to hold your private keys. It's an **Autonomous Web3 Commander**. By integrating **Google Gemini Pro** directly into the wallet core, Zeno analyzes every intent, detects phishing in real-time, and simplifies the complex Web3 landscape into actionable intelligence.

---

## Premium Features

### Zeno Core (AI Interface)

- **Natural Language Intents**: Send crypto by simply typing "Send 0.5 ETH to vitalik.eth".
- **Risk Analysis**: Every AI-parsed request gets a real-time risk score (0-1) and a safety explanation.
- **Context-Aware**: Understands your balances, recent transactions, and network status to provide better advice.

### Intelligent Security

- **AI Guardian**: Real-time monitoring of your wallet activity for suspicious behavior.
- **Phishing Detection**: Automated analysis of recipient addresses and smart contract interactions.
- **Auto-Lock System**: Customizable security timers (15m to "Never") to protect your vault when inactive.

### 🌐 Multi-Chain Nexus

- **Unified Portfolio**: Track ETH, BNB, MATIC, ARB, OP, and BASE assets in one view.
- **Real-Time Market Data**: Live price tracking and 24h performance metrics powered by CoinGecko.
- **Identity Hub**: Manage multiple HD accounts and imported private keys with a sleek, unified interface.

### Elite UX/UI

- **Glassmorphism Design**: A stunning dark-mode interface with vibrant glow effects and micro-animations.
- **Guided Onboarding**: A comprehensive 9-step interactive tour powered by **Driver.js**.
- **Pro/Lite Modes**: Switch between a simplified interface and an advanced "Degen" dashboard with MEV protection.

---

## Interactive Tour

New users are greeted with a structural walkthrough of the Zeno Nexus:

1. **Logo & Identity**: The heart of your autonomous commander.
2. **Address Management**: Quick access to your public identity.
3. **Multi-Chain Selector**: Seamlessly jump between L1s and L2s.
4. **Mode Toggle**: Lite for daily use, Pro for the heavy hitters.
5. **Portfolio Valuation**: Your net worth across the entire ecosystem.
6. **Action Center**: The command hub for Send, Receive, and Swap.
7. **Asset Nexus**: Detailed token breakdown with live pricing.
8. **AI Guardian**: Your direct line to Zeno Core.
9. **Command Center (Settings)**: Fine-tune your security and preferences.

---

## Architecture & Tech Stack

```bash
src/
├── core/             # Wallet engine, chain clients & crypto logic
├── features/         # AI Service (Gemini), Notifications, Security
├── hooks/            # usePortfolio (Multi-chain), Token balances
├── screens/          # Dashboard, AI Guardian, Identity/Unlock screens
└── components/       # Custom UI kit (TokenCard, BottomNav, etc.)
```

| Layer            | Technology                                     |
| :--------------- | :--------------------------------------------- |
| **Framework**    | [Plasmo](https://www.plasmo.com/) (Chrome MV3) |
| **Intelligence** | Google Gemini Pro API                          |
| **Blockchain**   | Ethers v6, Viem, Alchemy SDK                   |
| **State/UI**     | React 18, Tailwind CSS, Lucide Icons           |
| **Onboarding**   | Driver.js                                      |

---

## Setup & Installation

### Build Requirements

- Node.js 18.x or higher
- pnpm

### Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

1. Open Chrome and navigate to `chrome://extensions`.
2. Enable **Developer Mode**.
3. Click **Load unpacked** and select the `build/chrome-mv3-dev` folder.

### Configuration

Create a `.env` file in the root directory:

```env
PLASMO_PUBLIC_ALCHEMY_API_KEY=your_alchemy_key
GEMINI_API_KEY=your_gemini_key
```

---

## Security

- **Local Sovereignty**: Private keys and seed phrases never leave your local storage.
- **Encryption**: AES-256 encryption via CryptoJS for vault storage.
- **Transparency**: AI analysis is provided as a tool; the final signature always rests with the human commander.

---

<p align="center">
  <i>Zeno Protocol — Autonomous Web3 Commander</i>
</p>
