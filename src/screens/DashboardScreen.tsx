import React, { useState } from "react"

import type { Token } from "~components/TokenCard"
import { TokenCard } from "~components/TokenCard"
import type { Screen } from "~popup"

interface Props {
  setScreen: (s: Screen) => void
  proMode: boolean
  setProMode: (v: boolean) => void
}

const TOKENS: Token[] = [
  {
    icon: "Ξ",
    name: "Ethereum",
    symbol: "ETH",
    balance: "1.2847",
    usd: "$3,241.50",
    change: 2.14,
    color: "#A0A0FF"
  },
  {
    icon: "◎",
    name: "USD Coin",
    symbol: "USDC",
    balance: "850.00",
    usd: "$850.00",
    change: 0.01,
    color: "#AAFFDD"
  },
  {
    icon: "△",
    name: "Arbitrum",
    symbol: "ARB",
    balance: "340.12",
    usd: "$204.07",
    change: -3.22,
    color: "#CCAAFF"
  },
  {
    icon: "⬡",
    name: "Uniswap",
    symbol: "UNI",
    balance: "22.5",
    usd: "$157.50",
    change: 1.05,
    color: "#FF88CC"
  }
]

const ADDR = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F"
const short = (a: string) => a.slice(0, 6) + "..." + a.slice(-4)

export const DashboardScreen: React.FC<Props> = ({
  setScreen,
  proMode,
  setProMode
}) => {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard?.writeText(ADDR)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-white rounded flex items-center justify-center font-black text-black italic text-xs flex-shrink-0">
            Z
          </div>
          <button
            onClick={copy}
            className="flex items-center gap-1.5 glass px-2.5 py-1 rounded-full hover:bg-white/[0.08] transition-all">
            <span className="text-white/70 text-xs font-mono">
              {short(ADDR)}
            </span>
            <span className="text-white/30 text-[10px]">
              {copied ? "✓" : "⎘"}
            </span>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <div className="glass px-2 py-1 rounded-full">
            <span className="text-white/50 text-[10px] font-mono">
              Ethereum
            </span>
          </div>
          {/* Lite/Pro toggle */}
          <button
            onClick={() => setProMode(!proMode)}
            className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition-all ${
              proMode
                ? "bg-white text-black"
                : "border border-white/20 text-white/50 hover:border-white/40"
            }`}>
            {proMode ? "PRO" : "LITE"}
          </button>
        </div>
      </div>

      {/* Balance */}
      <div className="px-4 py-4 text-center flex-shrink-0">
        <p className="text-white/30 text-xs uppercase tracking-widest mb-1">
          Total Balance
        </p>
        <h2 className="text-4xl font-black text-white tracking-tight mb-1">
          $4,453.07
        </h2>
        <span className="text-emerald-400 text-xs font-semibold">
          +$92.14 (2.11%) today
        </span>

        {/* Pro: AI risk score */}
        {proMode && (
          <div className="mt-3 inline-flex items-center gap-2 glass px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-glow" />
            <span className="text-white/60 text-[10px] font-medium">
              AI Risk Score:{" "}
            </span>
            <span className="text-emerald-400 text-[10px] font-bold">
              LOW — Safe to transact
            </span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex justify-center gap-6 px-4 pb-4 flex-shrink-0">
        {(
          [
            { label: "Send", icon: "↑", screen: "send" },
            { label: "Receive", icon: "↓", screen: "receive" },
            { label: "Swap", icon: "⇌", screen: "swap" },
            { label: "Buy", icon: "+", screen: "dashboard" }
          ] as { label: string; icon: string; screen: Screen }[]
        ).map((a) => (
          <button
            key={a.label}
            onClick={() => setScreen(a.screen)}
            className="flex flex-col items-center gap-1.5 group">
            <div className="w-11 h-11 glass rounded-2xl flex items-center justify-center text-white text-base hover:bg-white/[0.1] transition-all active:scale-95">
              {a.icon}
            </div>
            <span className="text-white/40 text-[10px] group-hover:text-white/70 transition-colors">
              {a.label}
            </span>
          </button>
        ))}
      </div>

      {/* Pro extras */}
      {proMode && (
        <div className="px-4 pb-3 flex-shrink-0">
          <div className="glass rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-white/40 text-sm">⚡</span>
              <span className="text-white/60 text-xs font-medium">
                MEV Protection
              </span>
            </div>
            <div className="w-9 h-5 bg-white rounded-full relative cursor-pointer flex items-center px-0.5">
              <div className="w-4 h-4 bg-black rounded-full ml-auto" />
            </div>
          </div>
        </div>
      )}

      {/* Token list */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        <div className="flex items-center justify-between px-3 pb-2">
          <span className="text-white/30 text-[10px] uppercase tracking-widest">
            Assets
          </span>
          {proMode && (
            <span className="text-white/30 text-[10px] uppercase tracking-widest">
              Alpha mode
            </span>
          )}
        </div>
        {TOKENS.map((t) => (
          <TokenCard key={t.symbol} token={t} />
        ))}
      </div>
    </div>
  )
}
