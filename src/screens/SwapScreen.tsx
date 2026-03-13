import React, { useState } from "react"

import type { Screen } from "~types"

interface Props {
  setScreen: (s: Screen) => void
}

const TOKENS = [
  { symbol: "ETH", balance: "1.2847" },
  { symbol: "USDC", balance: "850.00" },
  { symbol: "ARB", balance: "340.12" },
  { symbol: "UNI", balance: "22.5" }
]

export const SwapScreen: React.FC<Props> = ({ setScreen }) => {
  const [fromToken, setFromToken] = useState("ETH")
  const [toToken, setToToken] = useState("USDC")
  const [fromAmt, setFromAmt] = useState("")
  const [slippage, setSlippage] = useState("0.5")

  const flip = () => {
    setFromToken(toToken)
    setToToken(fromToken)
  }
  const toEstimate = fromAmt ? (parseFloat(fromAmt) * 2513.4).toFixed(2) : ""

  return (
    <div className="flex-1 flex flex-col p-4 animate-fade-up">
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => setScreen("dashboard")}
          className="w-8 h-8 glass rounded-xl flex items-center justify-center text-white/50 hover:text-white transition-colors">
          ←
        </button>
        <h2 className="text-lg font-bold text-white">Swap</h2>
      </div>

      {/* From */}
      <div className="glass rounded-2xl p-4 mb-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/30 text-xs">From</span>
          <span className="text-white/30 text-xs">
            Balance: {TOKENS.find((t) => t.symbol === fromToken)?.balance}{" "}
            {fromToken}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={fromToken}
            onChange={(e) => setFromToken(e.target.value)}
            className="bg-white/10 border border-white/10 text-white font-semibold text-sm px-3 py-2 rounded-xl outline-none cursor-pointer flex-shrink-0">
            {TOKENS.map((t) => (
              <option key={t.symbol} value={t.symbol} className="bg-black">
                {t.symbol}
              </option>
            ))}
          </select>
          <input
            value={fromAmt}
            onChange={(e) => setFromAmt(e.target.value)}
            placeholder="0.00"
            type="number"
            className="flex-1 bg-transparent text-white text-right text-2xl font-bold outline-none placeholder-white/20"
          />
        </div>
        <div className="flex justify-end mt-1">
          <span className="text-white/25 text-xs">
            {fromAmt ? `≈ $${(parseFloat(fromAmt) * 2513.4).toFixed(2)}` : ""}
          </span>
        </div>
      </div>

      {/* Flip button */}
      <div className="flex justify-center -my-0.5 z-10">
        <button
          onClick={flip}
          className="w-9 h-9 glass rounded-xl flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all active:rotate-180 duration-300">
          ⇌
        </button>
      </div>

      {/* To */}
      <div className="glass rounded-2xl p-4 mt-2 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/30 text-xs">To</span>
          <span className="text-white/30 text-xs">
            Balance: {TOKENS.find((t) => t.symbol === toToken)?.balance}{" "}
            {toToken}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={toToken}
            onChange={(e) => setToToken(e.target.value)}
            className="bg-white/10 border border-white/10 text-white font-semibold text-sm px-3 py-2 rounded-xl outline-none cursor-pointer flex-shrink-0">
            {TOKENS.map((t) => (
              <option key={t.symbol} value={t.symbol} className="bg-black">
                {t.symbol}
              </option>
            ))}
          </select>
          <div className="flex-1 text-right text-2xl font-bold text-white/60">
            {toEstimate || "—"}
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="glass rounded-xl p-3 mb-4 space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-white/40">Rate</span>
          <span className="text-white/70">1 ETH = 2,513.40 USDC</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/40">Price impact</span>
          <span className="text-emerald-400">{"< 0.01%"}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-white/40">Slippage</span>
          <div className="flex gap-1">
            {["0.1", "0.5", "1.0"].map((s) => (
              <button
                key={s}
                onClick={() => setSlippage(s)}
                className={`px-2 py-0.5 rounded-lg text-[10px] transition-all ${slippage === s ? "bg-white text-black font-bold" : "border border-white/10 text-white/40"}`}>
                {s}%
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-between">
          <span className="text-white/40">Route</span>
          <span className="text-white/50">Uniswap V3 ◈ AI optimized</span>
        </div>
      </div>

      <button
        disabled={!fromAmt || fromToken === toToken}
        className="w-full py-3.5 bg-white text-black font-bold rounded-xl text-sm tracking-wide hover:bg-white/90 transition-all active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed">
        SWAP
      </button>
    </div>
  )
}
