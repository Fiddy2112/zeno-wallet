import { Copy, CopyCheck, Plus, X } from "lucide-react"
import type React from "react"
import { useState } from "react"

import { AccountCard } from "~components/AccountCard"

export const IdentityHub: React.FC<{
  accounts: any[]
  activeAddress: string
  onSelect: (addr: string) => void
  onAdd: (pass: string) => void
  onImport: (
    type: "key" | "mnemonic",
    value: string,
    name: string
  ) => Promise<void>
  onRemove: (addr: string) => Promise<void>
  onClose: () => void
}> = ({
  accounts,
  activeAddress,
  onSelect,
  onAdd,
  onImport,
  onRemove,
  onClose
}) => {
  const [copied, setCopied] = useState<string | null>(null)
  const [deleteConfirmAddr, setDeleteConfirmAddr] = useState<string | null>(
    null
  )
  const [action, setAction] = useState<
    "none" | "add" | "import-key" | "import-seed"
  >("none")
  const [inputValue, setInputValue] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const short = (a: string) => a.slice(0, 6) + "..." + a.slice(-4)

  const copy = (e: React.MouseEvent, addr: string) => {
    e.stopPropagation()
    if (!addr) return
    navigator.clipboard?.writeText(addr)
    setCopied(addr)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleConfirm = async () => {
    if (!inputValue.trim()) {
      setError("This field cannot be empty")
      return
    }
    setError("")
    setLoading(true)
    try {
      if (action === "add") {
        await onAdd(inputValue)
      } else if (action === "import-key") {
        await onImport(
          "key",
          `${inputValue.startsWith("0x") ? inputValue.trim() : "0x" + inputValue.trim()}`,
          ""
        )
      } else if (action === "import-seed") {
        await onImport("mnemonic", inputValue.trim(), "")
      }
      // reset form
      setAction("none")
      setInputValue("")
    } catch (error) {
      setError(error.message || "Operation failed. Check your input.")
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setAction("none")
    setInputValue("")
    setError("")
  }

  return (
    <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-xl p-6 flex flex-col animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-white font-black italic text-xl tracking-tighter">
          ACCOUNTS
        </h3>
        <button
          onClick={onClose}
          className="text-white/20 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* account list */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
        {accounts.map((acc) => (
          <AccountCard
            key={acc.address}
            acc={acc}
            activeAddress={activeAddress}
            accountsLength={accounts.length}
            copiedAddr={copied}
            onSelect={onSelect}
            onCopy={copy}
            onRemove={onRemove}
          />
        ))}
      </div>

      {/* action area */}
      <div className="mt-6 flex flex-col gap-3">
        {action === "none" ? (
          <>
            <button
              onClick={() => setAction("add")}
              className="py-4 bg-white text-black font-black rounded-2xl text-[10px] tracking-[0.3em] hover:scale-[1.02] transition-all flex items-center gap-2 justify-center w-full shadow-[0_0_20px_rgba(255,255,255,0.1)]">
              <Plus className="w-3 h-3" /> CREATE NEW ACCOUNT
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setAction("import-key")}
                className="py-3 bg-white/5 border border-white/10 text-white/60 font-bold rounded-xl text-[9px] tracking-widest hover:bg-white/10 transition-colors">
                IMPORT PRIVATE KEY
              </button>
              <button
                onClick={() => setAction("import-seed")}
                className="py-3 bg-white/5 border border-white/10 text-white/60 font-bold rounded-xl text-[9px] tracking-widest hover:bg-white/10 transition-colors">
                IMPORT MNEMONIC
              </button>
            </div>
          </>
        ) : (
          <div className="p-4 bg-white/[0.03] border border-white/10 rounded-2xl animate-fade-in">
            <p className="text-white/40 text-[9px] uppercase tracking-widest mb-3 text-center">
              {action === "add" && "Enter Password to Authorize"}
              {action === "import-key" && "Paste Private Key (0x...)"}
              {action === "import-seed" && "Enter 12/24 Word Phrase"}
            </p>

            {action === "import-seed" ? (
              <textarea
                autoFocus
                placeholder="word1 word2 word3..."
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value)
                  setError("")
                }}
                className="w-full bg-black/50 border border-white/10 focus:border-white/30 text-white placeholder-white/20 px-4 py-3 rounded-xl outline-none text-xs mb-3 transition-all font-mono resize-none h-20"
              />
            ) : (
              <input
                autoFocus
                type={action === "add" ? "password" : "text"}
                placeholder={action === "add" ? "Unlock Password..." : "0x..."}
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value)
                  setError("")
                }}
                onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
                className="w-full bg-black/50 border border-white/10 focus:border-white/30 text-white placeholder-white/20 px-4 py-3 rounded-xl outline-none text-xs mb-3 transition-all font-mono text-center"
              />
            )}

            {error && (
              <p className="text-red-400 text-[10px] mb-3 text-center">
                {error}
              </p>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                disabled={loading}
                className="flex-1 py-3 bg-white/5 border border-white/10 text-white/50 font-bold rounded-xl text-[10px] tracking-widest hover:bg-white/10 transition-colors disabled:opacity-50">
                CANCEL
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading || !inputValue}
                className="flex-1 py-3 bg-white text-black font-bold rounded-xl text-[10px] tracking-widest hover:bg-white/90 transition-all disabled:opacity-50">
                {loading ? "PROCESSING..." : "CONFIRM"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
