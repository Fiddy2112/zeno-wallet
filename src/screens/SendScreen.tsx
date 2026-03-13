import React, { useState } from "react"

import type { Screen } from "~types"

interface Props {
  setScreen: (s: Screen) => void
}

const TOKENS = ["ETH", "USDC", "ARB", "UNI"]

export const SendScreen: React.FC<Props> = ({ setScreen }) => {
  const [to, setTo] = useState("")
  const [token, setToken] = useState("ETH")
  const [amount, setAmount] = useState("")
  const [aiStatus, setAiStatus] = useState<"idle" | "safe" | "warn">("idle")

  const checkAddress = (v: string) => {
    setTo(v)
    if (v.length === 42 && v.startsWith("0x")) {
      setTimeout(() => setAiStatus("safe"), 800)
    } else {
      setAiStatus("idle")
    }
  }

  return (
    <div className="flex-1 flex flex-col p-4 animate-fade-up">
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => setScreen("dashboard")}
          className="w-8 h-8 glass rounded-xl flex items-center justify-center text-white/50 hover:text-white transition-colors">
          ←
        </button>
        <h2 className="text-lg font-bold text-white">Send</h2>
      </div>

      <div className="space-y-3 flex-1">
        {/* To address */}
        <div>
          <label className="text-white/40 text-xs uppercase tracking-widest mb-1.5 block">
            Recipient
          </label>
          <input
            value={to}
            onChange={(e) => checkAddress(e.target.value)}
            placeholder="0x... or ENS name"
            className="w-full bg-white/[0.04] border border-white/10 focus:border-white/30 text-white placeholder-white/20 px-4 py-3 rounded-xl outline-none text-sm transition-all font-mono"
          />
          {/* AI Guardian status */}
          {aiStatus === "safe" && (
            <div className="flex items-center gap-2 mt-2 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-xs">AI Guardian: Address looks safe</span>
            </div>
          )}
          {aiStatus === "warn" && (
            <div className="flex items-center gap-2 mt-2 text-yellow-400">
              <span className="text-xs">
                ⚠ AI Guardian: Unknown contract detected
              </span>
            </div>
          )}
        </div>

        {/* Token + Amount */}
        <div>
          <label className="text-white/40 text-xs uppercase tracking-widest mb-1.5 block">
            Amount
          </label>
          <div className="flex gap-2">
            <select
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="bg-white/[0.06] border border-white/10 text-white text-sm px-3 py-3 rounded-xl outline-none cursor-pointer flex-shrink-0">
              {TOKENS.map((t) => (
                <option key={t} value={t} className="bg-black">
                  {t}
                </option>
              ))}
            </select>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              type="number"
              className="flex-1 bg-white/[0.04] border border-white/10 focus:border-white/30 text-white placeholder-white/20 px-4 py-3 rounded-xl outline-none text-sm transition-all"
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-white/25 text-xs">Balance: 1.2847 ETH</span>
            <button className="text-white/50 text-xs hover:text-white transition-colors">
              MAX
            </button>
          </div>
        </div>

        {/* Gas estimate */}
        <div className="glass rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/40 text-xs">Network Fee</span>
            <button className="text-white/50 text-[10px] border border-white/10 px-2 py-0.5 rounded-full hover:border-white/30 transition-all">
              ◈ AI Optimize
            </button>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white/70 text-sm font-mono">~0.0012 ETH</span>
            <span className="text-white/30 text-xs">≈ $3.02</span>
          </div>
          <div className="flex gap-2 mt-2">
            {["Slow", "Normal", "Fast"].map((s, i) => (
              <button
                key={s}
                className={`flex-1 text-[10px] py-1 rounded-lg transition-all ${i === 1 ? "bg-white text-black font-bold" : "border border-white/10 text-white/40 hover:border-white/25"}`}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        disabled={!to || !amount}
        className="w-full py-3.5 bg-white text-black font-bold rounded-xl text-sm tracking-wide mt-4 hover:bg-white/90 transition-all active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed">
        REVIEW TRANSACTION
      </button>
    </div>
  )
}
