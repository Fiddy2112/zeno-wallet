# Zeno Wallet — The Intelligent Nexus

<p align="center">
  <img src="assets/icon.png" width="80" height="80" alt="Zeno Logo" />
</p>

<p align="center">
  <strong>The next generation of Web3 security.</strong><br />
  A premium, AI-powered browser extension wallet that converts passive management into active protection.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Version-1.0.4--beta-white?style=flat-square" />
  <img src="https://img.shields.io/badge/AI-Gemini_1.5_Flash-blue?style=flat-square&logo=google-gemini" />
  <img src="https://img.shields.io/badge/Built_With-Plasmo-purple?style=flat-square" />
  <img src="https://img.shields.io/badge/Chain-Multi--chain_EVM-emerald?style=flat-square" />
  <img src="https://img.shields.io/badge/License-MIT-gray?style=flat-square" />
</p>

---

## Overview

Zeno isn't just a place to hold your private keys. It's an **Autonomous Web3 Commander**. By integrating a multi-provider AI engine (Gemini, Groq, OpenAI, Claude) directly into the wallet core, Zeno analyzes every intent, detects phishing in real-time, and simplifies the complex Web3 landscape into actionable intelligence.

---

## Features

### AI Core

- **Natural Language Intents** — Send crypto by typing `"Send 0.5 ETH to vitalik.eth"`
- **Multi-Provider AI Fallback** — Gemini → Groq (Llama 3) → OpenAI → Claude, automatic failover
- **Real-Time Risk Scoring** — Every AI-parsed request gets a risk score (0–1) with explanation
- **Conversation Memory** — AI remembers context across messages within a session
- **Rate-Limited Proxy** — Wallet-based rate limiting via Redis, prompt injection protection

### Security

- **AES-256 Vault** — Private keys encrypted with PBKDF2 + AES-256, never leave your device
- **Brute-Force Protection** — Vault locks after 5 failed attempts, 30s cooldown
- **Auto-Lock** — Configurable inactivity timer (15min to Never)
- **View Private Key / Seed Phrase** — Password-gated reveal with blur toggle

### Multi-Chain Portfolio

- **8 EVM Networks** — Ethereum, Arbitrum, Base, Optimism, Polygon, zkSync, Unichain, Sepolia
- **ERC-20 Token Balances** — Alchemy batch fetch across all chains
- **Live Prices** — CoinGecko with 60s TTL cache (rate limit safe)
- **Chain Filter** — Filter portfolio by network, synced across all screens

### Transactions

- **Send** — Real signing via viem `WalletClient`, gas tier selection (Slow / Fast / Instant)
- **Swap** — 0x Protocol integration for real DEX quotes and execution
- **Buy** — MoonPay (USD) + VNPay (VNĐ) fiat on-ramp
- **Transaction History** — Alchemy `getAssetTransfers` across all chains with explorer links
- **Receive** — QR code generation, synced with active chain

### UX

- **Pro / Lite Mode** — Lite for daily use, Pro unlocks AI input, MEV protection, slippage control
- **Guided Onboarding** — 9-step interactive tour via Driver.js
- **Identity Hub** — Multiple HD accounts + imported private keys
- **Chain Selector** — Dropdown with logo, synced to Settings and Receive screen
- **Custom UI Components** — `CustomSelect`, `ChainSelector` matching Zeno dark theme

---

## Tech Stack

```
src/
├── core/           # Wallet engine, chain clients, networks config
├── features/       # AI service, security (vault), notifications, price cache
├── hooks/          # usePortfolio (multi-chain), useNetworkPortfolio
├── screens/        # All screens (Dashboard, Send, Swap, Buy, History, AI, Settings...)
└── components/     # TokenCard, BottomNav, IdentityHub, ChainSelector, CustomSelect
```

| Layer        | Technology                                                   |
| :----------- | :----------------------------------------------------------- |
| Framework    | [Plasmo](https://www.plasmo.com/) — Chrome MV3               |
| AI Engine    | Gemini 1.5 Flash + Groq Llama 3 + GPT-4o Mini + Claude Haiku |
| AI Proxy     | Next.js on Vercel + Upstash Redis rate limiting              |
| Blockchain   | Viem v2, Ethers v6, Alchemy SDK                              |
| DEX          | 0x Protocol API                                              |
| Fiat On-Ramp | MoonPay, VNPay                                               |
| State / UI   | React 18, Tailwind CSS, Lucide Icons                         |
| Onboarding   | Driver.js                                                    |
| Security     | CryptoJS AES-256, PBKDF2                                     |

---

## Setup & Installation

### Requirements

- Node.js 18.x or higher
- pnpm

### Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Load in Chrome:

1. Navigate to `chrome://extensions`
2. Enable **Developer Mode**
3. Click **Load unpacked** → select `build/chrome-mv3-dev`

### Environment Variables

Create a `.env` file in the root:

```env
# Blockchain
PLASMO_PUBLIC_ALCHEMY_API_KEY=your_alchemy_key

# AI Proxy (self-hosted on Vercel)
PLASMO_PUBLIC_AI_PROXY_URL=https://your-proxy.vercel.app/api/chat

# Fiat On-Ramp
PLASMO_PUBLIC_MOONPAY_API_KEY=pk_live_your_key
PLASMO_PUBLIC_VNPAY_URL=https://pay.vnpay.vn/vpcpay.html
```

### AI Proxy Setup (`zeno-ai-proxy/`)

```env
GEMINI_API_KEY=AIza...
GROQ_API_KEY=gsk_...
OPENAI_API_KEY=sk-...          # optional
ANTHROPIC_API_KEY=sk-ant-...   # optional
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=...
```

Deploy to Vercel:

```bash
cd zeno-ai-proxy
vercel deploy
```

---

## Security Model

| Layer          | Implementation                                                                       |
| :------------- | :----------------------------------------------------------------------------------- |
| Key storage    | AES-256 encrypted, local only, never transmitted                                     |
| Key derivation | PBKDF2 SHA-256, 10,000 iterations                                                    |
| Unlock         | Password-gated, 5-attempt limit, 30s cooldown                                        |
| AI proxy       | Wallet-based rate limit (10 req/min), prompt injection detection, 24h block on abuse |
| Transactions   | User must enter password to sign every transaction                                   |
| Sensitive data | Private key / seed phrase require password re-entry to view                          |

---

## Screens

| Screen         | Description                                           |
| :------------- | :---------------------------------------------------- |
| Welcome        | Onboarding entry point                                |
| Setup Password | Create vault password with strength indicator         |
| Seed Phrase    | Generate + reveal 12-word mnemonic                    |
| Import Wallet  | Import via seed phrase or private key                 |
| Dashboard      | Portfolio overview, chain filter, AI input (Pro mode) |
| Send           | Transfer with gas tier, real tx signing               |
| Receive        | QR code, chain-synced                                 |
| Swap           | 0x Protocol DEX swap with live quotes                 |
| Buy            | MoonPay (USD) + VNPay (VNĐ) fiat on-ramp              |
| History        | Transaction history across all chains                 |
| AI Guardian    | Chat with Zeno AI, conversation memory                |
| Settings       | Security, networks, reveal keys, auto-lock            |
| Unlock         | Brute-force protected vault unlock                    |

---

## Legal

- [Privacy Policy](./PRIVACY.md)
- [Terms of Service](./TERMS.md)

---

<p align="center">
  <i>Zeno Protocol — Autonomous Web3 Commander</i>
</p>
