import { ArrowLeftIcon, Copy, CopyCheck } from "lucide-react"
import React, { useEffect, useState } from "react"
import QRCode from "react-qr-code"

import { SUPPORTED_CHAINS } from "~core/networks"
import type { Screen } from "~types"

interface Props {
  setScreen: (s: Screen) => void
}

const EVM_CHAINS = SUPPORTED_CHAINS.filter(
  (c) => c.vmType === "EVM" && c.id !== "solana" && c.id !== "bitcoin"
)

export const ReceiveScreen: React.FC<Props> = ({ setScreen }) => {
  const [address, setAddress] = useState<string>("Loading...")
  const [selectedChainId, setSelectedChainId] = useState(SUPPORTED_CHAINS[0].id)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    chrome.storage.local.get(["zeno_address", "zeno_chain_filter"], (res) => {
      if (res.zeno_address) setAddress(res.zeno_address)
      // Sync with dashboard chain selector — if user had selected a specific chain
      if (res.zeno_chain_filter && res.zeno_chain_filter !== "all") {
        const match = EVM_CHAINS.find((c) => c.id === res.zeno_chain_filter)
        if (match) setSelectedChainId(match.id)
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
            Multi-chain
          </span>
        </div>
      </div>

      {/* Network tabs — only EVM chains */}
      <div className="flex gap-1.5 mb-5 overflow-x-auto custom-scrollbar pb-1">
        {EVM_CHAINS.map((chain) => (
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
        <div className="glass rounded-2xl p-4">
          <div className="w-40 h-40 relative flex items-center justify-center">
            {address !== "Loading..." ? (
              <QRCode
                value={address}
                size={160}
                bgColor="#ffffff"
                fgColor="#000000"
                level="Q"
              />
            ) : (
              <div className="w-40 h-40 bg-white/5 rounded-xl animate-pulse" />
            )}
            {/* Center Z logo */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-black border border-white/20 rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-black italic">Z</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chain badge below QR */}
        <div className="flex items-center gap-2 mt-3">
          <img
            src={currentChain.logo}
            alt={currentChain.name}
            className="w-4 h-4 rounded-full"
          />
          <span className="text-white/50 text-[10px] font-bold uppercase tracking-widest">
            {currentChain.name}
          </span>
        </div>
      </div>

      {/* Warning */}
      <p className="text-white/30 text-[10px] uppercase tracking-widest text-center mb-4 px-4 leading-relaxed">
        Send only{" "}
        <span className="text-emerald-400 font-bold">{currentChain.name}</span>{" "}
        assets to this address
      </p>

      {/* Address box */}
      <div
        className="w-full bg-[#121212] border border-white/5 rounded-2xl p-4 mb-4 flex flex-col items-center gap-2 cursor-pointer hover:bg-white/[0.04] transition-colors"
        onClick={copy}>
        <span className="text-white/30 text-[9px] font-bold uppercase tracking-widest">
          Public Address
        </span>
        <p className="text-white text-sm font-mono break-all text-center leading-relaxed">
          {address}
        </p>
        <div className="mt-1 text-white/50 text-[10px] flex items-center gap-1 font-bold">
          {copied ? (
            <>
              <CopyCheck className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" /> Tap to copy
            </>
          )}
        </div>
      </div>

      <div className="pt-2 border-t border-white/5 mt-auto">
        <button
          onClick={copy}
          disabled={address === "Loading..."}
          className={`w-full py-4 font-black rounded-2xl text-xs tracking-[0.2em] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-30 ${
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
