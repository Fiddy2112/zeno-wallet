import React, { useState } from "react"

import type { Screen } from "~types"

interface Props {
  setScreen: (s: Screen) => void
}

const ADDR = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F"
const NETWORKS = ["Ethereum", "Arbitrum", "Base", "Polygon"]

export const ReceiveScreen: React.FC<Props> = ({ setScreen }) => {
  const [network, setNetwork] = useState("Ethereum")
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard?.writeText(ADDR)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex-1 flex flex-col p-4 animate-fade-up">
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => setScreen("dashboard")}
          className="w-8 h-8 glass rounded-xl flex items-center justify-center text-white/50 hover:text-white transition-colors">
          ←
        </button>
        <h2 className="text-lg font-bold text-white">Receive</h2>
      </div>

      {/* Network tabs */}
      <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1">
        {NETWORKS.map((n) => (
          <button
            key={n}
            onClick={() => setNetwork(n)}
            className={`text-xs px-3 py-1.5 rounded-full flex-shrink-0 transition-all font-medium ${
              network === n
                ? "bg-white text-black"
                : "border border-white/10 text-white/40 hover:border-white/25"
            }`}>
            {n}
          </button>
        ))}
      </div>

      {/* QR Code (CSS art) */}
      <div className="flex justify-center mb-5">
        <div className="glass rounded-2xl p-4 glow-sm">
          <div className="w-40 h-40 relative">
            {/* QR code simulation using CSS grid */}
            <div className="w-full h-full grid grid-cols-[1fr_auto_1fr] grid-rows-[1fr_auto_1fr] gap-1.5">
              {/* Corner squares */}
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`${i === 1 ? "col-start-2 row-start-2" : ""} ${i === 0 ? "col-start-1 row-start-1" : i === 1 ? "" : "col-start-3 row-start-1"}`}
                />
              ))}
            </div>
            {/* QR fake art */}
            <div className="absolute inset-0 flex flex-col gap-0.5 p-0">
              {Array.from({ length: 14 }).map((_, row) => (
                <div key={row} className="flex gap-0.5 flex-1">
                  {Array.from({ length: 14 }).map((_, col) => {
                    // Corners (finder patterns)
                    const inTL = row < 5 && col < 5
                    const inTR = row < 5 && col > 8
                    const inBL = row > 8 && col < 5
                    const isBorderTL =
                      inTL && (row === 0 || row === 4 || col === 0 || col === 4)
                    const isBorderTR =
                      inTR &&
                      (row === 0 || row === 4 || col === 9 || col === 13)
                    const isBorderBL =
                      inBL &&
                      (row === 9 || row === 13 || col === 0 || col === 4)
                    const isCenterTL =
                      inTL && row >= 1 && row <= 3 && col >= 1 && col <= 3
                    const isCenterTR =
                      inTR && row >= 1 && row <= 3 && col >= 10 && col <= 12
                    const isCenterBL =
                      inBL && row >= 10 && row <= 12 && col >= 1 && col <= 3
                    const dark =
                      isBorderTL ||
                      isBorderTR ||
                      isBorderBL ||
                      isCenterTL ||
                      isCenterTR ||
                      isCenterBL ||
                      (!inTL &&
                        !inTR &&
                        !inBL &&
                        (row + col * 3 + row * col) % 3 === 0)
                    return (
                      <div
                        key={col}
                        className={`flex-1 rounded-[1px] ${dark ? "bg-white" : "bg-transparent"}`}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
            {/* Center Z logo */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-black border border-white/20 rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-black italic">Z</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Network badge */}
      <p className="text-center text-white/30 text-xs mb-3">
        Only send <span className="text-white/60 font-semibold">{network}</span>{" "}
        assets to this address
      </p>

      {/* Address */}
      <div className="glass rounded-xl p-3 mb-4">
        <p className="text-white/50 text-[10px] uppercase tracking-wider mb-1.5">
          Your address
        </p>
        <p className="text-white text-xs font-mono break-all leading-relaxed">
          {ADDR}
        </p>
      </div>

      <button
        onClick={copy}
        className="w-full py-3.5 bg-white text-black font-bold rounded-xl text-sm tracking-wide hover:bg-white/90 transition-all active:scale-[0.98]">
        {copied ? "✓ COPIED!" : "COPY ADDRESS"}
      </button>
    </div>
  )
}
