import React, { useState } from "react"

import type { Screen } from "~types"

interface Props {
  setScreen: (s: Screen) => void
}

const MOCK_SEED = [
  "abandon",
  "ability",
  "able",
  "about",
  "above",
  "absent",
  "absorb",
  "abstract",
  "absurd",
  "abuse",
  "access",
  "account"
]

export const SeedPhraseScreen: React.FC<Props> = ({ setScreen }) => {
  const [revealed, setRevealed] = useState(false)
  const [backed, setBacked] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard?.writeText(MOCK_SEED.join(" "))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleContinue = () => {
    localStorage.setItem("zeno_onboarded", "true")
    setScreen("dashboard")
  }

  return (
    <div className="flex-1 flex flex-col p-6 animate-fade-up">
      <button
        onClick={() => setScreen("setup-pass")}
        className="text-white/40 text-sm mb-6 flex items-center gap-1 hover:text-white/80 transition-colors w-fit">
        ← Back
      </button>

      <h2 className="text-2xl font-extrabold text-white mb-1">Secret Phrase</h2>
      <p className="text-white/40 text-sm mb-6 leading-relaxed">
        Write these 12 words down in order. Never share them with anyone.
      </p>

      {/* Warning */}
      <div className="bg-yellow-500/[0.08] border border-yellow-500/20 rounded-xl p-3 mb-4 flex gap-2">
        <span className="text-yellow-400 text-sm">⚠</span>
        <p className="text-yellow-400/80 text-xs leading-relaxed">
          Anyone with your seed phrase can access your wallet permanently.
        </p>
      </div>

      {/* Seed grid */}
      <div className="relative mb-4">
        <div
          className={`grid grid-cols-3 gap-1.5 transition-all duration-300 ${!revealed ? "blur-sm select-none pointer-events-none" : ""}`}>
          {MOCK_SEED.map((word, i) => (
            <div
              key={i}
              className="glass rounded-lg px-2 py-2 flex items-center gap-1.5">
              <span className="text-white/25 text-[10px] w-4 text-right">
                {i + 1}
              </span>
              <span className="text-white text-xs font-mono font-medium">
                {word}
              </span>
            </div>
          ))}
        </div>
        {!revealed && (
          <button
            onClick={() => setRevealed(true)}
            className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-xl text-white font-semibold text-sm gap-2 hover:bg-black/40 transition-all">
            <span>👁</span> Click to reveal
          </button>
        )}
      </div>

      {revealed && (
        <button
          onClick={handleCopy}
          className="text-white/40 text-xs flex items-center gap-1.5 mb-4 hover:text-white/70 transition-colors">
          {copied ? "✓ Copied!" : "⎘ Copy to clipboard"}
        </button>
      )}

      {/* Confirm */}
      <label className="flex items-start gap-3 cursor-pointer mb-6 mt-auto">
        <div
          className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border transition-all mt-0.5 ${backed ? "bg-white border-white" : "border-white/20 hover:border-white/40"}`}
          onClick={() => setBacked(!backed)}>
          {backed && <span className="text-black text-xs font-bold">✓</span>}
        </div>
        <span className="text-white/50 text-xs leading-relaxed">
          I have written down my seed phrase and stored it in a safe place.
        </span>
      </label>

      <button
        onClick={handleContinue}
        disabled={!backed || !revealed}
        className="w-full py-3.5 bg-white text-black font-bold rounded-xl text-sm tracking-wide hover:bg-white/90 transition-all active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed">
        I'VE SAVED IT — CONTINUE
      </button>
    </div>
  )
}
