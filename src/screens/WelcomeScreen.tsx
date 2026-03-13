import React from "react"

import type { Screen } from "~popup"

interface Props {
  setScreen: (s: Screen) => void
}

export const WelcomeScreen: React.FC<Props> = ({ setScreen }) => (
  <div className="flex-1 flex flex-col justify-between p-6 animate-fade-up">
    {/* Ambient glow */}
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-white/[0.03] blur-[60px] rounded-full pointer-events-none" />

    {/* Logo */}
    <div className="flex items-center gap-2.5 z-10">
      <div className="w-8 h-8 bg-white rounded flex items-center justify-center font-black text-black italic text-sm">
        Z
      </div>
      <span className="text-lg font-black tracking-[0.25em] text-white uppercase">
        Zeno
      </span>
    </div>

    {/* Hero */}
    <div className="flex flex-col items-center text-center z-10 py-8">
      {/* Big Z mark */}
      <div className="w-20 h-20 rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-center mb-6 glow-sm">
        <span className="text-4xl font-black italic text-white">Z</span>
      </div>
      <h1 className="text-[26px] font-extrabold leading-tight text-white mb-3 tracking-tight">
        The Intelligent
        <br />
        Nexus.
      </h1>
      <p className="text-white/40 text-sm leading-relaxed max-w-[240px]">
        The wallet that thinks with you — AI-powered security, cross-chain,
        built for everyone.
      </p>
    </div>

    {/* Actions */}
    <div className="space-y-3 z-10">
      <button
        onClick={() => setScreen("setup-pass")}
        className="w-full py-3.5 bg-white text-black font-bold rounded-xl text-sm tracking-wide hover:bg-white/90 transition-all active:scale-[0.98] glow-btn">
        CREATE NEW WALLET
      </button>
      <button
        onClick={() => setScreen("import")}
        className="w-full py-3.5 border border-white/12 text-white font-semibold rounded-xl text-sm tracking-wide hover:border-white/25 hover:bg-white/[0.04] transition-all active:scale-[0.98]">
        I ALREADY HAVE A WALLET
      </button>
      <p className="text-center text-[10px] text-white/20 uppercase tracking-[0.2em] pt-2">
        Secured by Zeno AI Guardian
      </p>
    </div>
  </div>
)
