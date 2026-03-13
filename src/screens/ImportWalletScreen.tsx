import React, { useState } from "react"

import type { Screen } from "~popup"

interface Props {
  setScreen: (s: Screen) => void
}

export const ImportWalletScreen: React.FC<Props> = ({ setScreen }) => {
  const [phrase, setPhrase] = useState("")
  const [error, setError] = useState("")

  const words = phrase.trim().split(/\s+/).filter(Boolean)
  const isValid = words.length === 12 || words.length === 24

  const handleImport = () => {
    if (!isValid) {
      setError(
        `Enter a 12 or 24-word seed phrase. You entered ${words.length} word${words.length !== 1 ? "s" : ""}.`
      )
      return
    }
    localStorage.setItem("zeno_onboarded", "true")
    setScreen("setup-pass")
  }

  return (
    <div className="flex-1 flex flex-col p-6 animate-fade-up">
      <button
        onClick={() => setScreen("welcome")}
        className="text-white/40 text-sm mb-6 flex items-center gap-1 hover:text-white/80 transition-colors w-fit">
        ← Back
      </button>

      <h2 className="text-2xl font-extrabold text-white mb-1">Import Wallet</h2>
      <p className="text-white/40 text-sm mb-8 leading-relaxed">
        Enter your 12 or 24-word secret recovery phrase, separated by spaces.
      </p>

      {/* Textarea */}
      <div className="relative mb-2">
        <textarea
          value={phrase}
          onChange={(e) => {
            setPhrase(e.target.value)
            setError("")
          }}
          placeholder="word1 word2 word3 word4 word5 word6..."
          rows={5}
          className="w-full bg-white/[0.04] border border-white/10 focus:border-white/30 text-white placeholder-white/20 px-4 py-3.5 rounded-xl outline-none text-sm transition-all resize-none font-mono leading-relaxed"
        />
        {words.length > 0 && (
          <div
            className={`absolute bottom-3 right-3 text-[10px] font-mono px-2 py-0.5 rounded-full border ${isValid ? "text-emerald-400 border-emerald-400/30 bg-emerald-400/5" : "text-white/30 border-white/10"}`}>
            {words.length}/12
          </div>
        )}
      </div>

      {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

      <div className="glass rounded-xl p-3 mb-6 flex gap-2.5">
        <span className="text-white/40 text-base">🔐</span>
        <p className="text-white/35 text-xs leading-relaxed">
          Your phrase is processed locally and never leaves your device.
        </p>
      </div>

      <div className="mt-auto">
        <button
          onClick={handleImport}
          disabled={words.length === 0}
          className="w-full py-3.5 bg-white text-black font-bold rounded-xl text-sm tracking-wide hover:bg-white/90 transition-all active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed">
          IMPORT WALLET
        </button>
      </div>
    </div>
  )
}
