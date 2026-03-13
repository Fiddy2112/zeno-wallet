# ⚡ Zeno Wallet: The Intelligent Nexus

Zeno is a next-generation Web3 crypto wallet that shifts from a mere tool to an AI-powered assistant.

## 🚀 Key Features

- **Dual-Mode UI:** Lite Mode (Intent-based) & Pro Mode (Alpha Hunting).
- **AI Security Guardian:** Real-time transaction simulation & risk assessment.
- **Account Abstraction (ERC-4337):** Gasless transactions and social login (zkLogin).
- **Cyberpunk Design:** High-tech, modern, and intuitive interface.

## Structure

```bash
src/
├── popup.tsx              # Root – orchestrates navigation state
├── style.css              # Updated with custom keyframes & scrollbar
├── components/
│   ├── BottomNav.tsx      # Nav bar (Dashboard / Send / Receive / AI / Settings)
│   ├── TokenCard.tsx      # Single token row (icon, name, balance, change%)
│   └── AIMessage.tsx      # AI chat bubble
└── screens/
    ├── WelcomeScreen.tsx
    ├── SetupPasswordScreen.tsx
    ├── SeedPhraseScreen.tsx
    ├── ImportWalletScreen.tsx
    ├── DashboardScreen.tsx
    ├── SendScreen.tsx
    ├── ReceiveScreen.tsx
    ├── SwapScreen.tsx
    ├── AIGuardianScreen.tsx
    └── SettingsScreen.tsx
```

## 🛠 Tech Stack

- **Framework:** [Plasmo](https://www.plasmo.com/) (Browser Extension Framework)
- **Library:** React + TypeScript
- **Styling:** Tailwind CSS
- **Web3:** Viem + Wagmi + Zinc (zkLogin)

## 📦 Development

1. Clone the repo
2. `pnpm install`
3. `pnpm dev`
