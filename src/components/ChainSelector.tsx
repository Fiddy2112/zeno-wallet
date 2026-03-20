import { Check, ChevronDown, Globe } from "lucide-react"
import { useState } from "react"

import { SUPPORTED_CHAINS } from "~core/networks"

export type ChainFilter = "all" | string

interface Props {
  selected: ChainFilter
  onChange: (v: ChainFilter) => void
}

export const EVM_CHAINS = SUPPORTED_CHAINS.filter(
  (c) => c.vmType === "EVM" && c.id !== "solana" && c.id !== "bitcoin"
)

export const ChainSelector: React.FC<Props> = ({ selected, onChange }) => {
  const [open, setOpen] = useState(false)

  const currentChain = EVM_CHAINS.find((c) => c.id === selected)
  const label =
    selected === "all" ? "All networks" : currentChain?.name || "All networks"
  const logo = selected === "all" ? null : currentChain?.logo

  const handleChange = (v: ChainFilter) => {
    onChange(v)
    // Persist so ReceiveScreen can read it
    chrome.storage.local.set({ zeno_chain_filter: v })
    setOpen(false)
  }

  return (
    <div className="relative" id="tour-network">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 glass px-2.5 py-1 rounded-full hover:bg-white/[0.08] transition-all">
        {logo ? (
          <img src={logo} alt={label} className="w-3.5 h-3.5 rounded-full" />
        ) : (
          <Globe className="w-3 h-3 text-white/40" />
        )}
        <span className="text-white/60 text-[10px] font-mono leading-6 max-w-[72px] truncate">
          {label}
        </span>
        <ChevronDown
          className={`w-3 h-3 text-white/30 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute top-full right-0 mt-2 w-48 bg-[#181818] border border-white/10 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.6)] z-40 overflow-hidden animate-fade-in py-1">
            <button
              onClick={() => handleChange("all")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs transition-colors ${selected === "all" ? "text-white bg-white/[0.07]" : "text-white/50 hover:bg-white/[0.05] hover:text-white/80"}`}>
              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                <Globe className="w-3.5 h-3.5 text-white/50" />
              </div>
              <span className="font-medium flex-1 text-left">All networks</span>
              {selected === "all" && (
                <Check className="w-3 h-3 text-emerald-400" />
              )}
            </button>

            <div className="h-px bg-white/5 mx-3 my-1" />

            {EVM_CHAINS.map((chain) => (
              <button
                key={chain.id}
                onClick={() => handleChange(chain.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs transition-colors ${selected === chain.id ? "text-white bg-white/[0.07]" : "text-white/50 hover:bg-white/[0.05] hover:text-white/80"}`}>
                <img
                  src={chain.logo}
                  alt={chain.name}
                  className="w-6 h-6 rounded-full bg-black/50 flex-shrink-0"
                />
                <div className="flex flex-col items-start flex-1 min-w-0">
                  <span className="font-medium truncate w-full text-left">
                    {chain.name}
                  </span>
                  <span className="text-[9px] text-white/25 font-mono">
                    {chain.nativeSymbol}
                  </span>
                </div>
                {selected === chain.id && (
                  <Check className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
