import { Copy, CopyCheck, Plus } from "lucide-react"
import type React from "react"
import { useState } from "react"

export const IdentityHub: React.FC<{
  accounts: any[]
  activeAddress: string
  onSelect: (addr: string) => void
  onAdd: () => void
  onClose: () => void
}> = ({ accounts, activeAddress, onSelect, onAdd, onClose }) => {
  const [copied, setCopied] = useState(false)

  const short = (a: string) => a.slice(0, 6) + "..." + a.slice(-4)

  const copy = () => {
    if (!accounts || accounts.length === 0) return
    navigator.clipboard?.writeText(accounts[0].address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const onImportKey = () => {}

  const onImportSeed = () => {}

  return (
    <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-xl p-6 flex flex-col animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-white font-black italic text-xl tracking-tighter">
          ACCOUNTS
        </h3>
        <button
          onClick={onClose}
          className="text-white/20 hover:text-white transition-colors">
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
        {accounts.map((acc) => (
          <div
            key={acc.address}
            className={`group p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-4 ${
              activeAddress === acc.address
                ? "bg-white border-white"
                : "bg-white/[0.03] border-white/5 hover:border-white/20"
            }`}>
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${
                activeAddress === acc.address
                  ? "bg-black text-white"
                  : "bg-white/10 text-white/30"
              }`}>
              {acc.type === "imported" ? "IMP" : acc.index + 1}
            </div>
            <div className="flex-1 flex items-center justify-between">
              <div
                onClick={() => onSelect(acc.address)}
                className="flex items-center flex-col gap-2">
                <p
                  className={`font-bold text-sm ${activeAddress === acc.address ? "text-black" : "text-white"}`}>
                  {acc.name}
                </p>
                <p
                  className={`text-[10px] font-mono ${activeAddress === acc.address ? "text-black/40" : "text-white/20"}`}>
                  {acc.address ? short(acc.address) : "Loading..."}
                </p>
              </div>
              <div className="flex items-center gap-2" onClick={copy}>
                <span className="text-black/20 text-[12px] ">
                  {copied ? (
                    <CopyCheck className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-2">
        <button
          onClick={onAdd}
          className="mt-6 py-4 bg-white text-black font-black rounded-2xl text-[10px] tracking-[0.3em] hover:scale-[1.02] transition-all flex items-center gap-2 justify-center w-full">
          <Plus className="w-3 h-3" /> CREATE NEW ACCOUNT
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onImportKey}
            className="py-3 bg-white/5 border border-white/10 text-white/60 font-bold rounded-xl text-[9px] tracking-widest hover:bg-white/10">
            IMPORT PRIVATE KEY
          </button>
          <button
            onClick={onImportSeed}
            className="py-3 bg-white/5 border border-white/10 text-white/60 font-bold rounded-xl text-[9px] tracking-widest hover:bg-white/10">
            IMPORT MNEMONIC
          </button>
        </div>
      </div>
    </div>
  )
}
