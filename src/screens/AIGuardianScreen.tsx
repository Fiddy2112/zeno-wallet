import { ArrowLeftIcon, ArrowUpIcon } from "lucide-react"
import React, { useEffect, useRef, useState } from "react"

import { AIMessage, type Message } from "~components/AIMessage"
import type { Screen } from "~types"

interface Props {
  setScreen: (s: Screen) => void
}

const INITIAL: Message[] = [
  {
    role: "ai",
    text: "Hey! I'm your Zeno AI Guardian. I monitor your wallet 24/7 for threats, analyze transactions before you sign, and give you real-time DeFi alpha. How can I help?"
  },
  {
    role: "ai",
    text: "Your portfolio is up 2.11% today. No suspicious activity detected. MEV protection has saved you an estimated $12.40 this week."
  }
]

const QUICK = [
  "Is my wallet safe?",
  "Analyze last transaction",
  "What's the gas now?",
  "DeFi opportunities"
]

const RESPONSES: Record<string, string> = {
  "Is my wallet safe?":
    "✅ All clear! No phishing approvals, no honeypot tokens, and no suspicious contract interactions detected in the last 30 days.",
  "Analyze last transaction":
    "Your last tx was a swap of 0.5 ETH → 1,256 USDC on Uniswap V3. Price impact was 0.02%. No MEV detected. Gas was optimal at that block.",
  "What's the gas now?":
    "⛽ Current gas: Base 12 gwei | Priority 1 gwei. A standard ETH transfer costs ≈ $0.42. Good time to transact.",
  "DeFi opportunities":
    "🔥 Top opportunities right now: 1) ETH/USDC on Uniswap V3 — 8.2% APR. 2) stETH yield — 4.1% APR. 3) ARB governance airdrop window open."
}

export const AIGuardianScreen: React.FC<Props> = ({ setScreen }) => {
  const [messages, setMessages] = useState<Message[]>(INITIAL)
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const send = (text: string) => {
    if (!text.trim() || loading) return
    const userMsg: Message = { role: "user", text }
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setLoading(true)
    setTimeout(() => {
      const reply =
        RESPONSES[text] ||
        "I'm analyzing that for you... In the meantime, remember: always verify contract addresses on Etherscan before signing any transaction."
      setMessages((prev) => [...prev, { role: "ai", text: reply }])
      setLoading(false)
    }, 900)
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.05] flex-shrink-0">
        <button
          onClick={() => setScreen("dashboard")}
          className="w-8 h-8 glass rounded-xl flex items-center justify-center text-white/50 hover:text-white transition-colors">
          <ArrowLeftIcon className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-sm italic">
            Z
          </div>
          <div>
            <p className="text-white text-sm font-semibold leading-none">
              Zeno AI Guardian
            </p>
            <p className="text-emerald-400 text-[10px] mt-0.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-ping" />
              Active — monitoring wallet
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((m, i) => (
          <AIMessage key={i} msg={m} />
        ))}
        {loading && (
          <div className="flex gap-2 justify-start animate-fade-in">
            <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs flex-shrink-0 italic">
              Z
            </div>
            <div className="glass px-4 py-3 rounded-2xl rounded-tl-sm">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick actions */}
      <div className="px-3 pb-2 flex gap-1.5 overflow-x-auto flex-shrink-0">
        {QUICK.map((q) => (
          <button
            key={q}
            onClick={() => send(q)}
            className="text-[10px] text-white/50 border border-white/10 px-2.5 py-1.5 rounded-full flex-shrink-0 hover:border-white/30 hover:text-white/80 transition-all whitespace-nowrap">
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="px-3 pb-3 flex-shrink-0">
        <div className="flex gap-2 glass rounded-xl p-1.5">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send(input)}
            placeholder="Ask Zeno anything..."
            className="flex-1 bg-transparent text-white text-sm placeholder-white/20 px-2 outline-none"
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim()}
            className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-black font-bold hover:bg-white/90 transition-all active:scale-95 disabled:opacity-30 text-sm flex-shrink-0">
            <ArrowUpIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
