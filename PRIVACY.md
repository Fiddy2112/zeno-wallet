# Privacy Policy

**Zeno Wallet**
Last updated: March 2026

## 1. Overview

Zeno Wallet ("Zeno", "we", "us") is a self-custody browser extension wallet. We are committed to protecting your privacy. This policy explains what data we collect, how we use it, and your rights.

## 2. Data We Collect

**We do NOT collect or store:**

- Private keys
- Seed phrases / mnemonic phrases
- Passwords
- Transaction signing data

All cryptographic keys and seed phrases are encrypted locally on your device using AES-256 encryption and never transmitted to any server.

**We DO process (temporarily, not stored):**

- Your wallet address — used only to fetch on-chain data (balances, transactions) from public blockchain APIs
- AI queries you type — sent to our AI proxy server (zeno-ai-proxy.vercel.app) to process intent. Not stored after processing.
- Portfolio value — used as context for AI responses. Not stored.

## 3. Third-Party Services

Zeno integrates with the following third-party services:

| Service       | Purpose                          | Privacy Policy                               |
| ------------- | -------------------------------- | -------------------------------------------- |
| Alchemy       | Blockchain RPC, token balances   | https://www.alchemy.com/policies/privacy     |
| CoinGecko     | Token prices                     | https://www.coingecko.com/en/privacy         |
| Google Gemini | AI intent parsing                | https://policies.google.com/privacy          |
| MoonPay       | Fiat-to-crypto purchases         | https://www.moonpay.com/legal/privacy_policy |
| Upstash Redis | Rate limiting (hashed keys only) | https://upstash.com/trust/privacy.pdf        |

When you use MoonPay to purchase cryptocurrency, you are subject to MoonPay's own KYC/AML requirements and privacy policy. Zeno does not receive or store any payment information.

## 4. Local Storage

Zeno stores the following data locally in your browser (`chrome.storage.local`):

- Encrypted vault (AES-256 encrypted mnemonic)
- Encryption salt
- Public wallet address
- User preferences (pro mode, auto-lock timer, selected network)
- AI chat history (stored locally, never uploaded)
- Token price cache (TTL 60 seconds)

This data never leaves your device except as described in Section 3.

## 5. Blockchain Data

Blockchain transactions are public by nature. When you send or receive cryptocurrency, that data is recorded permanently on the public blockchain and is visible to anyone. Zeno does not control or have access to modify on-chain data.

## 6. Children's Privacy

Zeno is not intended for users under the age of 18. We do not knowingly collect data from minors.

## 7. Security

- Private keys and seed phrases are encrypted with AES-256 before storage
- PBKDF2 key derivation with 10,000 iterations
- Auto-lock after configurable inactivity period
- Brute-force protection: wallet locked after 5 failed password attempts

## 8. Your Rights

You can delete all locally stored data at any time by using the "Reset Wallet" option in Settings, or by uninstalling the extension. This action is irreversible — ensure you have your seed phrase backed up before doing so.

## 9. Changes to This Policy

We may update this policy from time to time. We will notify users of significant changes via the extension update notes.

## 10. Contact

For privacy-related questions, please open an issue at:
https://github.com/Fiddy2112/zeno-wallet/issues
