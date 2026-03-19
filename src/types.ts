export type Screen =
  | "welcome"
  | "setup-pass"
  | "seed-phrase"
  | "import"
  | "dashboard"
  | "send"
  | "receive"
  | "swap"
  | "ai"
  | "settings"
  | "unlock"

export type Tab = "dashboard" | "send" | "receive" | "ai" | "settings"

export interface Token {
  img: string
  name: string
  symbol: string
  balance: string
  usd: string
  change: number
  color: string
}

export const mapToToken = (token: any) => {
  const balanceNum = Number(token.balance || 0)
  const usdNum = Number(token.usdValue || 0)

  return {
    name: token.symbol,
    symbol: token.symbol,
    balance: balanceNum.toFixed(4),
    usd: `$ ${usdNum.toFixed(2)}`,
    change: token.change ?? 0,
    img: token.logo || getDefaultLogo(token.symbol),
    color: "#FFFFFF"
  }
}

const getDefaultLogo = (symbol: string) => {
  const map: Record<string, string> = {
    ETH: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
    BNB: "https://cryptologos.cc/logos/binance-coin-bnb-logo.png",
    USDT: "https://cryptologos.cc/logos/tether-usdt-logo.png"
  }

  return map[symbol] || map["ETH"]
}

export interface VMAdapter {
  type: string

  deriveAddress(seed: string, index?: number): string

  getBalance(address: string, chainConfig: any): Promise<string>

  sendTx(params: any): Promise<string>

  getTokens?(address: string, chainConfig: any): Promise<any[]>
}
