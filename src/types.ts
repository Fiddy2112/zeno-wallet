export type Screen =
  | "welcome"
  | "setup-pass"
  | "seed-phrase"
  | "import"
  | "dashboard"
  | "send"
  | "receive"
  | "swap"
  | "buy"
  | "ai"
  | "settings"
  | "unlock"
  | "history"

export type Tab = "dashboard" | "send" | "receive" | "ai" | "settings"

export interface Token {
  img: string
  name: string
  symbol: string
  balance: string
  usd: string
  change: number
  color: string
  coingeckoId?: string
}

export const mapToToken = (token: any, chainCoingeckoId?: string): Token => {
  const balanceNum = Number(token.balance || 0)
  const usdNum = Number(token.usdValue || 0)

  const usdStr = usdNum > 0 ? `$${usdNum.toFixed(2)}` : "—"

  let balanceStr: string
  if (balanceNum === 0) {
    balanceStr = "0"
  } else if (balanceNum < 0.0001) {
    balanceStr = balanceNum.toFixed(6)
  } else if (balanceNum < 1) {
    balanceStr = balanceNum.toFixed(4)
  } else if (balanceNum >= 1000) {
    balanceStr = balanceNum.toLocaleString("en-US", { maximumFractionDigits: 2 })
  } else {
    balanceStr = balanceNum.toFixed(4)
  }

  return {
    name: token.name || token.symbol,
    symbol: token.symbol,
    balance: balanceStr,
    usd: usdStr,
    change: token.change ?? 0,
    img: token.logo || getDefaultLogo(token.symbol),
    color: "#FFFFFF",
    coingeckoId: token.coingeckoId || chainCoingeckoId
  }
}

const getDefaultLogo = (symbol: string): string => {
  const map: Record<string, string> = {
    ETH:   "https://cryptologos.cc/logos/ethereum-eth-logo.png",
    BNB:   "https://cryptologos.cc/logos/binance-coin-bnb-logo.png",
    MATIC: "https://cryptologos.cc/logos/polygon-matic-logo.png",
    USDT:  "https://cryptologos.cc/logos/tether-usdt-logo.png",
    USDC:  "https://cryptologos.cc/logos/usd-coin-usdc-logo.png",
    ARB:   "https://cryptologos.cc/logos/arbitrum-arb-logo.png",
    OP:    "https://cryptologos.cc/logos/optimism-ethereum-op-logo.png",
    BTC:   "https://cryptologos.cc/logos/bitcoin-btc-logo.png",
    SOL:   "https://cryptologos.cc/logos/solana-sol-logo.png",
  }
  return (
    map[symbol?.toUpperCase()] ||
    `https://via.placeholder.com/32/1a1a1a/ffffff?text=${(symbol || "?")[0]}`
  )
}

export interface VMAdapter {
  type: string
  deriveAddress(seed: string, index?: number): string
  getBalance(address: string, chainConfig: any): Promise<string>
  sendTx(params: any): Promise<string>
  getTokens?(address: string, chainConfig: any): Promise<any[]>
}