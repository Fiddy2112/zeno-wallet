import { ArrowLeftIcon, Copy, CopyCheck } from "lucide-react"
import React, { useEffect, useState } from "react"
import QRCode from "react-qr-code"

import { SUPPORTED_CHAINS } from "~core/networks"
import type { Screen } from "~types"

interface Props {
  setScreen: (s: Screen) => void
}

export const ReceiveScreen: React.FC<Props> = ({ setScreen }) => {
  const [address, setAddress] = useState<string>("Loading...")
  const [selectedChainId, setSelectedChainId] = useState(SUPPORTED_CHAINS[0].id)
  const [copied, setCopied] = useState(false)
  // multi-wallet
  const [wallets, setWallets] = useState<Record<string, string>>({
    EVM: "Loading...",
    SVM: "Generating...",
    BVM: "Generating..."
  })

  useEffect(() => {
    chrome.storage.local.get(["zeno_address", "zeno_multi_wallets"], (res) => {
      if (res.zeno_address) {
        // setAddress(res.zeno_address)
        setWallets({
          EVM: res.zeno_address,
          SVM: "5fbT9... (Solana Integration Soon)",
          BVM: "bc1q... (Bitcoin Integration Soon)",
          TVM: "TLu9T... (Tron Integration Soon)"
        })
      } else if (res.zeno_multi_wallets) {
        setWallets(res.zeno_multi_wallets)
      }
    })
  }, [])

  const copy = () => {
    if (address === "Loading...") return
    navigator.clipboard?.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const currentChain =
    SUPPORTED_CHAINS.find((c) => c.id === selectedChainId) ||
    SUPPORTED_CHAINS[0]
  // Fallback về EVM nếu quên khai báo vmType
  const activeAddress = wallets[currentChain.vmType || "EVM"] || wallets.EVM

  return (
    <div className="flex-1 flex flex-col p-4 animate-fade-up">
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => setScreen("dashboard")}
          className="w-8 h-8 glass rounded-xl flex items-center justify-center text-white/50 hover:text-white transition-colors">
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div className="flex flex-col">
          <h2 className="text-lg font-black text-white uppercase tracking-wider leading-none">
            Receive
          </h2>
          <span className="text-[9px] font-bold text-emerald-400 mt-1 tracking-widest uppercase">
            Multi-VM Enabled
          </span>
        </div>
      </div>

      {/* Network tabs */}
      <div className="flex gap-1.5 mb-5 overflow-x-auto custom-scrollbar pb-1">
        {SUPPORTED_CHAINS.map((chain) => (
          <button
            key={chain.id}
            onClick={() => {
              setSelectedChainId(chain.id)
              setCopied(false)
            }}
            className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-full flex-shrink-0 transition-all font-bold ${
              selectedChainId === chain.id
                ? "bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                : "bg-black/40 border border-white/10 text-white/50 hover:bg-white/10 hover:text-white"
            }`}>
            <img
              src={chain.logo}
              alt={chain.name}
              className={`w-3.5 h-3.5 rounded-full ${selectedChainId === chain.id ? "" : "opacity-50 grayscale"}`}
            />
            {chain.name}
          </button>
        ))}
      </div>

      {/* QR Code */}
      <div className="flex-1 flex flex-col items-center justify-center mb-5">
        <div className="glass rounded-2xl p-4 glow-sm">
          <div className="w-40 h-40 relative">
            <div className="absolute inset-0 flex items-center justify-center flex-col gap-0.5 p-0">
              {!activeAddress.includes("Soon") &&
              !activeAddress.includes("Loading") ? (
                <QRCode
                  value={activeAddress}
                  size={180}
                  bgColor="#ffffff"
                  fgColor="#000000"
                  level="Q"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col gap-0.5 p-0">
                  {Array.from({ length: 14 }).map((_, row) => (
                    <div key={row} className="flex gap-0.5 flex-1">
                      {Array.from({ length: 14 }).map((_, col) => {
                        // Corners (finder patterns)
                        const inTL = row < 5 && col < 5
                        const inTR = row < 5 && col > 8
                        const inBL = row > 8 && col < 5
                        const isBorderTL =
                          inTL &&
                          (row === 0 || row === 4 || col === 0 || col === 4)
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
              )}
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
      <div className="text-center mb-6 px-4">
        <p className="text-white/40 text-[10px] uppercase tracking-widest leading-relaxed">
          Send only{" "}
          <span
            className={`${
              currentChain.vmType === "SVM"
                ? "text-purple-400"
                : currentChain.vmType === "BVM"
                  ? "text-orange-400"
                  : "text-emerald-400"
            } font-bold`}>
            {currentChain.name} ({currentChain.vmType})
          </span>{" "}
          assets to this address.
        </p>
      </div>

      {/* Address */}
      <div
        className="w-full bg-[#121212] border border-white/5 rounded-2xl p-4 mb-4 flex flex-col items-center gap-2 cursor-pointer hover:bg-white/[0.04] transition-colors"
        onClick={copy}>
        <span className="text-white/30 text-[9px] font-bold uppercase tracking-widest flex items-center gap-1">
          {currentChain.vmType} Public Address
        </span>
        <p className="text-white text-sm font-mono break-all text-center leading-relaxed">
          {activeAddress}
        </p>
        <div className="mt-2 text-white/50 text-[10px] flex items-center gap-1 font-bold">
          {copied ? (
            <>
              <CopyCheck className="w-3 h-3 text-emerald-400" />{" "}
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" /> Tap to copy
            </>
          )}
        </div>
      </div>

      {/* Button */}
      <div className="pt-2 border-t border-white/5 mt-auto">
        <button
          onClick={copy}
          disabled={
            activeAddress.includes("Soon") || activeAddress.includes("Loading")
          }
          className={`w-full py-4 font-black rounded-2xl text-xs tracking-[0.2em] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed ${
            copied
              ? "bg-emerald-400 text-black shadow-[0_0_20px_rgba(52,211,153,0.3)]"
              : "bg-white text-black hover:bg-white/90"
          }`}>
          {copied ? "ADDRESS SECURED" : "COPY ADDRESS"}
        </button>
      </div>
    </div>
  )
}
