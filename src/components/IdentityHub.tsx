import { Copy, CopyCheck, Plus } from "lucide-react"
import type React from "react"
import { useState } from "react"

export const IdentityHub: React.FC<{
  accounts: any[]
  activeAddress: string
  onSelect: (addr: string) => void
  onAdd: (pass: string) => void
  onClose: () => void
}> = ({ accounts, activeAddress, onSelect, onAdd, onClose }) => {
  const [copied, setCopied] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

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

      <div className="mt-6 flex flex-col gap-3">
        {!isAdding ? (
          <button
            onClick={() => setIsAdding(true)}
            className="py-4 bg-white text-black font-black rounded-2xl text-[10px] tracking-[0.3em] hover:scale-[1.02] transition-all flex items-center gap-2 justify-center w-full shadow-[0_0_20px_rgba(255,255,255,0.1)]">
            <Plus className="w-3 h-3" /> CREATE NEW ACCOUNT
          </button>
        ) : (
          <div className="p-4 bg-white/[0.03] border border-white/10 rounded-2xl animate-fade-in">
            <p className="text-white/40 text-[9px] uppercase tracking-widest mb-3">
              Enter Password to Authorize
            </p>
            <input
              autoFocus
              type="password"
              placeholder="Unlock Password..."
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError("")
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && password) {
                  onAdd(password)
                  setIsAdding(false)
                  setPassword("")
                }
                if (e.key === "Escape") setIsAdding(false)
              }}
              className="w-full bg-white/[0.05] border border-white/10 focus:border-white/30 text-white placeholder-white/20 px-3 py-2.5 rounded-xl outline-none text-xs mb-3 transition-all font-mono"
            />
            {error && <p className="text-red-400 text-[10px] mb-3">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (password) {
                    onAdd(password)
                    setIsAdding(false)
                    setPassword("")
                  } else {
                    setError("Password required")
                  }
                }}
                className="flex-1 py-2 bg-white text-black font-bold rounded-lg text-[10px] hover:bg-white/90">
                CONFIRM
              </button>
              <button
                onClick={() => {
                  setIsAdding(false)
                  setPassword("")
                  setError("")
                }}
                className="flex-1 py-2 bg-white/5 border border-white/10 text-white/50 font-bold rounded-lg text-[10px] hover:bg-white/10">
                CANCEL
              </button>
            </div>
          </div>
        )}
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
