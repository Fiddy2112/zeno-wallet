import { SUPPORTED_CHAINS } from "~core/networks"
import type { CustomNetwork } from "./AddNetworkModal"
import { useEffect, useRef, useState } from "react"
import { Check, Globe, Search, X } from "lucide-react"

export type ChainFilter = "all" | string

interface Props {
    selected: ChainFilter,
    onChange: (v: ChainFilter) => void
    onClose: () => void
    customNetworks?: CustomNetwork[]
    showTestnet?: boolean
}

const TESTNETS = ["sepolia", "goerli"] 

const MAINNET_CHAINS = SUPPORTED_CHAINS.filter((c)=> c.vmType === "EVM" && !TESTNETS.includes(c.id) && c.id !== "solana" && c.id !== "bitcoin")

const TESTNET_CHAINS = SUPPORTED_CHAINS.filter((c)=> TESTNETS.includes(c.id))

export const NetworkSheet: React.FC<Props> = ({
    selected,
  onChange,
  onClose,
  customNetworks = [],
  showTestnet = false
}) => {
  const [tab, setTab] = useState<"popular" | "custom">("popular")
  const [search, setSearch] = useState("")
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(()=>{
    setTimeout(()=>searchRef.current?.focus(),3000)
  },[])

  const handleSelect = (v: ChainFilter)=>{
    onChange(v)
    chrome.storage.local.set({ zeno_chain_filter: v })
    onClose()
  }

  const allPopular = [
    ...MAINNET_CHAINS,
    ...(showTestnet ? TESTNET_CHAINS : [])
  ]

  const filtered = search.trim() ? allPopular.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.nativeSymbol.toLowerCase().includes(search.toLowerCase())) : allPopular

  const filteredCustom = search.trim() ? customNetworks.filter((n)=> n.name.toLowerCase().includes(search.toLowerCase()) || n.symbol.toLowerCase().includes(search.toLowerCase())) : customNetworks

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
 
      {/* Sheet */}
      <div className="relative bg-[#111] border-t border-white/10 rounded-t-3xl animate-fade-up flex flex-col"
        style={{ maxHeight: "82%" }}>
 
        {/* Handle */}
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mt-3 flex-shrink-0" />
 
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 flex-shrink-0">
          <h3 className="text-white font-black text-sm uppercase tracking-widest">Select Network</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all">
            <X className="w-3.5 h-3.5 text-white/60" />
          </button>
        </div>
 
        {/* Search */}
        <div className="px-5 pb-3 flex-shrink-0">
          <div className="flex items-center gap-2 bg-white/[0.05] border border-white/10 focus-within:border-white/25 rounded-xl px-3 py-2.5 transition-all">
            <Search className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search networks..."
              className="flex-1 bg-transparent text-white text-xs placeholder-white/25 outline-none"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-white/30 hover:text-white/60">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
 
        {/* Tabs */}
        {!search && customNetworks.length > 0 && (
          <div className="flex gap-1 px-5 pb-3 flex-shrink-0">
            {(["popular", "custom"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                  tab === t ? "bg-white text-black" : "text-white/40 hover:text-white/70"
                }`}>
                {t === "popular" ? "All Networks" : `Custom (${customNetworks.length})`}
              </button>
            ))}
          </div>
        )}
 
        {/* Network list */}
        <div className="flex-1 overflow-y-auto px-3 pb-5 custom-scrollbar">
 
          {/* "All networks" option */}
          {(tab === "popular" || search) && (
            <button
              onClick={() => handleSelect("all")}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl mb-1 transition-all ${
                selected === "all"
                  ? "bg-white/[0.08]"
                  : "hover:bg-white/[0.04]"
              }`}>
              <div className="w-9 h-9 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0">
                <Globe className="w-4 h-4 text-white/40" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-white text-sm font-bold">All networks</p>
                <p className="text-white/30 text-[10px]">Show all chains</p>
              </div>
              {selected === "all" && (
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              )}
            </button>
          )}
 
          {/* Popular / filtered chains */}
          {(tab === "popular" || search) && (
            <>
              {/* Mainnet */}
              {filtered.filter((c) => !TESTNETS.includes(c.id)).length > 0 && (
                <>
                  {!search && (
                    <p className="text-white/20 text-[10px] font-bold uppercase tracking-widest px-3 py-2">
                      Mainnet
                    </p>
                  )}
                  {filtered.filter((c) => !TESTNETS.includes(c.id)).map((chain) => (
                    <button
                      key={chain.id}
                      onClick={() => handleSelect(chain.id)}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl mb-0.5 transition-all ${
                        selected === chain.id ? "bg-white/[0.08]" : "hover:bg-white/[0.04]"
                      }`}>
                      <img
                        src={chain.logo}
                        alt={chain.name}
                        className="w-9 h-9 rounded-2xl bg-black/50 flex-shrink-0"
                      />
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-white text-sm font-bold truncate">{chain.name}</p>
                        <p className="text-white/30 text-[10px] font-mono">{chain.nativeSymbol}</p>
                      </div>
                      {selected === chain.id && (
                        <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </>
              )}
 
              {/* Testnet section */}
              {showTestnet && filtered.filter((c) => TESTNETS.includes(c.id)).length > 0 && (
                <>
                  <p className="text-yellow-400/40 text-[10px] font-bold uppercase tracking-widest px-3 py-2 flex items-center gap-1.5 mt-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-400/40" />
                    Testnet
                  </p>
                  {filtered.filter((c) => TESTNETS.includes(c.id)).map((chain) => (
                    <button
                      key={chain.id}
                      onClick={() => handleSelect(chain.id)}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl mb-0.5 transition-all ${
                        selected === chain.id ? "bg-white/[0.08]" : "hover:bg-white/[0.04]"
                      }`}>
                      <img
                        src={chain.logo}
                        alt={chain.name}
                        className="w-9 h-9 rounded-2xl bg-black/50 flex-shrink-0 opacity-60"
                      />
                      <div className="flex-1 text-left">
                        <p className="text-white/70 text-sm font-bold">{chain.name}</p>
                        <p className="text-yellow-400/40 text-[10px]">testnet · no real value</p>
                      </div>
                      {selected === chain.id && (
                        <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </>
              )}
 
              {/* No search results */}
              {search && filtered.length === 0 && filteredCustom.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-white/20 text-xs">No networks found for "{search}"</p>
                </div>
              )}
            </>
          )}
 
          {/* Custom networks tab */}
          {(tab === "custom" || search) && customNetworks.length > 0 && (
            <>
              {tab === "custom" && !search && (
                <p className="text-white/20 text-[10px] font-bold uppercase tracking-widest px-3 py-2">
                  Custom Networks
                </p>
              )}
              {(search ? filteredCustom : customNetworks).map((net) => (
                <button
                  key={net.id}
                  onClick={() => handleSelect(net.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl mb-0.5 transition-all ${
                    selected === net.id ? "bg-white/[0.08]" : "hover:bg-white/[0.04]"
                  }`}>
                  <div className="w-9 h-9 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0">
                    <Globe className="w-4 h-4 text-white/30" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-white text-sm font-bold truncate">{net.name}</p>
                    <p className="text-white/30 text-[10px] font-mono">{net.symbol} · Chain {net.chainId}</p>
                  </div>
                  {selected === net.id && (
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  )}
                </button>
              ))}
              {tab === "custom" && customNetworks.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-white/20 text-xs">No custom networks yet</p>
                  <p className="text-white/10 text-[10px] mt-1">Add one in Settings</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
