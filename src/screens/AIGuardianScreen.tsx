import { ArrowLeftIcon, ArrowUpIcon, Bot, Trash2 } from "lucide-react"
import React, { useEffect, useRef, useState } from "react"

import { AIMessage, type Message } from "~components/AIMessage"
import { askZeno } from "~features/ai-service"
import { useNetworkPortfolio } from "~hooks/usePortfolio"
import type { Screen } from "~types"

interface Props {
  setScreen: (s: Screen) => void
}

const STORAGE_KEY = "zeno_ai_history"
const MAX_HISTORY = 20 // keep last 20 messages in storage

const INITIAL: Message[] = [
  {
    role: "ai",
    text: "Hey! I'm your Zeno AI Guardian. I monitor your wallet 24/7 for threats, analyze transactions before you sign, and give you real-time DeFi alpha. How can I help?"
  }
]

const QUICK = [
  "Is my wallet safe?",
  "Analyze last transaction",
  "What's the gas now?",
  "DeFi opportunities"
]

export const AIGuardianScreen: React.FC<Props> = ({ setScreen }) => {
  const [messages, setMessages] = useState<Message[]>(INITIAL)
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [address, setAddress] = useState<string>("")
  const bottomRef = useRef<HTMLDivElement>(null)

  const { networkGroups } = useNetworkPortfolio(address)
  const totalUsdValue = networkGroups.reduce(
    (sum, g) => sum + (g.totalUsd || 0),
    0
  )

  // Load persisted chat history on mount
  useEffect(() => {
    chrome.storage.local.get(["zeno_address", STORAGE_KEY], (res) => {
      if (res.zeno_address) setAddress(res.zeno_address)
      if (res[STORAGE_KEY] && res[STORAGE_KEY].length > 0) {
        setMessages(res[STORAGE_KEY])
      }
    })
  }, [])

  // Auto-scroll on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Persist messages to storage (capped at MAX_HISTORY)
  const saveHistory = (msgs: Message[]) => {
    const toSave = msgs.slice(-MAX_HISTORY)
    chrome.storage.local.set({ [STORAGE_KEY]: toSave })
  }

  const clearHistory = () => {
    setMessages(INITIAL)
    chrome.storage.local.remove(STORAGE_KEY)
  }

  // Build context string from recent messages for AI memory
  const buildConversationContext = (msgs: Message[]) => {
    const recent = msgs.slice(-6) // last 6 messages as context
    return recent
      .map((m) => `${m.role === "user" ? "User" : "Zeno"}: ${m.text}`)
      .join("\n")
  }

  const send = async (text: string) => {
    if (!text.trim() || loading) return

    const userMsg: Message = { role: "user", text }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    saveHistory(updatedMessages)
    setInput("")
    setLoading(true)

    try {
      // Pass conversation context so AI has memory of prior turns
      const conversationContext = buildConversationContext(messages)

      const result = await askZeno(text, {
        user_address: address,
        user_balance: totalUsdValue,
        tokens: networkGroups.flatMap((g) => g.tokens),
        conversation_history: conversationContext // AI memory
      })

      const aiMsg: Message = { role: "ai", text: result.ai_response }
      const withAi = [...updatedMessages, aiMsg]
      setMessages(withAi)
      saveHistory(withAi)

      // Intent routing
      if (result.intent === "SEND" || result.intent === "SWAP") {
        if (result.params) {
          await chrome.storage.local.set({ pending_tx: result.params })
        }
        setTimeout(() => {
          setScreen(result.intent === "SEND" ? "send" : "swap")
        }, 1500)
      }

      // Risk warning
      if (result.risk_analysis?.score > 0.7) {
        const riskMsg: Message = {
          role: "ai",
          text: `⚠️ RISK WARNING: ${result.risk_analysis.reason}`
        }
        const withRisk = [...withAi, riskMsg]
        setMessages(withRisk)
        saveHistory(withRisk)
      }
    } catch {
      const errMsg: Message = {
        role: "ai",
        text: "Zeno network is currently congested. Please try again in a moment."
      }
      const withErr = [...updatedMessages, errMsg]
      setMessages(withErr)
      saveHistory(withErr)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden h-full bg-[#080808]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.05] flex-shrink-0 bg-black/40 backdrop-blur-md relative z-10">
        <button
          onClick={() => setScreen("dashboard")}
          className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:bg-white/10 hover:text-white transition-all">
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 flex-1">
          <div className="w-8 h-8 bg-emerald-400/10 border border-emerald-400/20 rounded-full flex items-center justify-center text-emerald-400">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <p className="text-white text-sm font-black tracking-wider uppercase leading-none">
              Zeno Nexus
            </p>
            <p className="text-emerald-400 text-[9px] font-bold tracking-widest mt-1 flex items-center gap-1.5 uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Active Monitoring
            </p>
          </div>
        </div>
        {/* Clear history button */}
        {messages.length > 1 && (
          <button
            onClick={clearHistory}
            title="Clear chat history"
            className="w-7 h-7 rounded-full flex items-center justify-center text-white/20 hover:bg-white/10 hover:text-white/60 transition-all">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 custom-scrollbar">
        {messages.map((m, i) => (
          <AIMessage key={i} msg={m} />
        ))}

        {loading && (
          <div className="flex gap-2 justify-start animate-fade-in">
            <div className="w-8 h-8 rounded-full bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center flex-shrink-0 text-emerald-400">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-[#121212] border border-white/5 px-4 py-3.5 rounded-2xl rounded-tl-sm">
              <div className="flex gap-1.5 items-center h-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick Actions */}
      <div className="px-3 pb-2 flex gap-1.5 overflow-x-auto custom-scrollbar flex-shrink-0">
        {QUICK.map((q) => (
          <button
            key={q}
            onClick={() => send(q)}
            disabled={loading}
            className="text-[10px] text-white/50 border border-white/10 bg-[#121212] px-3 py-2 rounded-full flex-shrink-0 hover:border-white/30 hover:text-white/80 transition-all whitespace-nowrap active:scale-95 disabled:opacity-50 font-bold tracking-wide">
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="px-3 pb-4 flex-shrink-0">
        <div className="flex gap-2 bg-[#121212] border border-white/10 focus-within:border-emerald-400/30 transition-colors rounded-2xl p-1.5">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send(input)}
            placeholder="Ask Zeno to send, swap, or analyze..."
            disabled={loading}
            className="flex-1 bg-transparent text-white text-sm placeholder-white/20 px-3 outline-none disabled:opacity-50"
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || loading}
            className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-black font-bold hover:bg-white/90 transition-all active:scale-95 disabled:opacity-20 disabled:bg-white/10 disabled:text-white/30 flex-shrink-0">
            <ArrowUpIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
