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
