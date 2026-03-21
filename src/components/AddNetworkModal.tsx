import { Globe, Plus, Trash2, X } from "lucide-react"
import React, { useState } from "react"

import { notify } from "~features/notifications"

export interface CustomNetwork {
  id: string           // unique key: chain id as string e.g. "8453"
  name: string
  rpcUrl: string
  chainId: number
  symbol: string
  explorerUrl?: string
  logo?: string        // optional — default globe icon
  isCustom: true
}

interface Props {
  onClose: () => void
  onSave: (network: CustomNetwork) => void
}

const POPULAR_NETWORKS = [
  { name: "Ethereum Mainnet",   chainId: 1,     symbol: "ETH",  rpc: "https://eth.llamarpc.com",              explorer: "https://etherscan.io" },
  { name: "BNB Smart Chain",    chainId: 56,    symbol: "BNB",  rpc: "https://bsc-dataseed.binance.org",      explorer: "https://bscscan.com" },
  { name: "Avalanche C-Chain",  chainId: 43114, symbol: "AVAX", rpc: "https://api.avax.network/ext/bc/C/rpc", explorer: "https://snowtrace.io" },
  { name: "Fantom Opera",       chainId: 250,   symbol: "FTM",  rpc: "https://rpc.ftm.tools",                 explorer: "https://ftmscan.com" },
  { name: "Cronos",             chainId: 25,    symbol: "CRO",  rpc: "https://evm.cronos.org",                explorer: "https://cronoscan.com" },
]

export const AddNetworkModal: React.FC<Props> = ({ onClose, onSave }) => {
  const [name, setName] = useState("")
  const [rpcUrl, setRpcUrl] = useState("")
  const [chainId, setChainId] = useState("")
  const [symbol, setSymbol] = useState("")
  const [explorerUrl, setExplorerUrl] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [showQuickAdd, setShowQuickAdd] = useState(false)

  const validate = () => {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = "Network name is required"
    if (!rpcUrl.trim()) e.rpcUrl = "RPC URL is required"
    else if (!rpcUrl.startsWith("http")) e.rpcUrl = "Must be a valid URL (http/https)"
    if (!chainId.trim()) e.chainId = "Chain ID is required"
    else if (isNaN(Number(chainId)) || Number(chainId) <= 0) e.chainId = "Must be a valid number"
    if (!symbol.trim()) e.symbol = "Currency symbol is required"
    else if (symbol.length > 11) e.symbol = "Max 11 characters"
    if (explorerUrl && !explorerUrl.startsWith("http")) e.explorerUrl = "Must be a valid URL"
    return e
  }

  // Fetch chain info from RPC to auto-fill chain ID
  const handleRpcBlur = async () => {
    if (!rpcUrl || !rpcUrl.startsWith("http") || chainId) return
    try {
      const res = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", method: "eth_chainId", params: [], id: 1 })
      })
      const data = await res.json()
      if (data.result) {
        setChainId(String(parseInt(data.result, 16)))
      }
    } catch {}
  }

  const handleQuickAdd = (net: typeof POPULAR_NETWORKS[0]) => {
    setName(net.name)
    setRpcUrl(net.rpc)
    setChainId(String(net.chainId))
    setSymbol(net.symbol)
    setExplorerUrl(net.explorer)
    setShowQuickAdd(false)
  }

  const handleSave = async () => {
    const e = validate()
    if (Object.keys(e).length > 0) { setErrors(e); return }
    setLoading(true)

    const network: CustomNetwork = {
      id: `custom_${chainId}`,
      name: name.trim(),
      rpcUrl: rpcUrl.trim(),
      chainId: Number(chainId),
      symbol: symbol.trim().toUpperCase(),
      explorerUrl: explorerUrl.trim() || undefined,
      isCustom: true
    }

    // Save to chrome.storage
    const res = await chrome.storage.local.get("zeno_custom_networks")
    const existing: CustomNetwork[] = res.zeno_custom_networks || []

    // Check duplicate chain ID
    if (existing.some((n) => n.chainId === network.chainId)) {
      setErrors({ chainId: "A network with this Chain ID already exists" })
      setLoading(false)
      return
    }

    await chrome.storage.local.set({
      zeno_custom_networks: [...existing, network]
    })

    setLoading(false)
    onSave(network)
    notify.success(`${network.name} added!`, "dark", 2000)
    onClose()
  }

  return (
    <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex items-end z-50">
      <div className="w-full bg-[#111] border-t border-white/10 rounded-t-3xl animate-fade-up max-h-[92%] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0">
          <div className="w-8 h-1 bg-white/20 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-3" />
          <h3 className="text-white font-black text-sm uppercase tracking-widest">Add Network</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all">
            <X className="w-3.5 h-3.5 text-white/60" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar space-y-4">

          {/* Quick add popular networks */}
          <div>
            <button
              onClick={() => setShowQuickAdd((v) => !v)}
              className="w-full flex items-center justify-between py-2.5 px-4 bg-white/[0.03] border border-white/5 rounded-xl text-xs text-white/50 hover:text-white/70 hover:border-white/10 transition-all">
              <span className="font-bold">Quick add popular network</span>
              <Plus className={`w-3.5 h-3.5 transition-transform ${showQuickAdd ? "rotate-45" : ""}`} />
            </button>

            {showQuickAdd && (
              <div className="mt-2 bg-[#1a1a1a] border border-white/10 rounded-2xl overflow-hidden">
                {POPULAR_NETWORKS.map((net) => (
                  <button
                    key={net.chainId}
                    onClick={() => handleQuickAdd(net)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-xs text-white/60 hover:bg-white/5 hover:text-white transition-colors border-b border-white/5 last:border-0">
                    <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                      <Globe className="w-3.5 h-3.5 text-white/40" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-bold">{net.name}</p>
                      <p className="text-white/25 text-[10px]">Chain ID: {net.chainId} · {net.symbol}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="h-px bg-white/5" />

          {/* Network Name */}
          <div>
            <label className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-1.5 block">
              Network Name <span className="text-red-400">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: "" })) }}
              placeholder="e.g. BNB Smart Chain"
              className={`w-full bg-white/[0.04] border px-4 py-3 rounded-xl outline-none text-sm text-white placeholder-white/20 transition-all ${errors.name ? "border-red-500/50 focus:border-red-500/70" : "border-white/10 focus:border-white/30"}`}
            />
            {errors.name && <p className="text-red-400 text-[10px] mt-1">{errors.name}</p>}
          </div>

          {/* RPC URL */}
          <div>
            <label className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-1.5 block">
              RPC URL <span className="text-red-400">*</span>
            </label>
            <input
              value={rpcUrl}
              onChange={(e) => { setRpcUrl(e.target.value); setErrors((p) => ({ ...p, rpcUrl: "" })) }}
              onBlur={handleRpcBlur}
              placeholder="https://..."
              className={`w-full bg-white/[0.04] border px-4 py-3 rounded-xl outline-none text-sm text-white placeholder-white/20 font-mono transition-all ${errors.rpcUrl ? "border-red-500/50 focus:border-red-500/70" : "border-white/10 focus:border-white/30"}`}
            />
            {errors.rpcUrl && <p className="text-red-400 text-[10px] mt-1">{errors.rpcUrl}</p>}
            <p className="text-white/20 text-[10px] mt-1">Chain ID will be auto-detected on blur</p>
          </div>

          {/* Chain ID */}
          <div>
            <label className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-1.5 block">
              Chain ID <span className="text-red-400">*</span>
            </label>
            <input
              value={chainId}
              onChange={(e) => { setChainId(e.target.value); setErrors((p) => ({ ...p, chainId: "" })) }}
              placeholder="e.g. 56"
              type="number"
              className={`w-full bg-white/[0.04] border px-4 py-3 rounded-xl outline-none text-sm text-white placeholder-white/20 font-mono transition-all ${errors.chainId ? "border-red-500/50 focus:border-red-500/70" : "border-white/10 focus:border-white/30"}`}
            />
            {errors.chainId && <p className="text-red-400 text-[10px] mt-1">{errors.chainId}</p>}
          </div>

          {/* Currency Symbol */}
          <div>
            <label className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-1.5 block">
              Currency Symbol <span className="text-red-400">*</span>
            </label>
            <input
              value={symbol}
              onChange={(e) => { setSymbol(e.target.value.toUpperCase()); setErrors((p) => ({ ...p, symbol: "" })) }}
              placeholder="e.g. BNB"
              maxLength={11}
              className={`w-full bg-white/[0.04] border px-4 py-3 rounded-xl outline-none text-sm text-white placeholder-white/20 font-mono uppercase transition-all ${errors.symbol ? "border-red-500/50 focus:border-red-500/70" : "border-white/10 focus:border-white/30"}`}
            />
            {errors.symbol && <p className="text-red-400 text-[10px] mt-1">{errors.symbol}</p>}
          </div>

          {/* Block Explorer URL (optional) */}
          <div>
            <label className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-1.5 block">
              Block Explorer URL <span className="text-white/20">(optional)</span>
            </label>
            <input
              value={explorerUrl}
              onChange={(e) => { setExplorerUrl(e.target.value); setErrors((p) => ({ ...p, explorerUrl: "" })) }}
              placeholder="https://etherscan.io"
              className={`w-full bg-white/[0.04] border px-4 py-3 rounded-xl outline-none text-sm text-white placeholder-white/20 font-mono transition-all ${errors.explorerUrl ? "border-red-500/50 focus:border-red-500/70" : "border-white/10 focus:border-white/30"}`}
            />
            {errors.explorerUrl && <p className="text-red-400 text-[10px] mt-1">{errors.explorerUrl}</p>}
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full py-4 bg-white text-black font-black rounded-2xl text-xs tracking-[0.2em] hover:bg-white/90 active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed">
            {loading ? "SAVING..." : "SAVE NETWORK"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Manage custom networks modal ─────────────────────────────────────────────

interface ManageProps {
  onClose: () => void
  onDelete: (id: string) => void
  networks: CustomNetwork[]
}

export const ManageNetworksModal: React.FC<ManageProps> = ({ onClose, onDelete, networks }) => {
  const handleDelete = async (id: string) => {
    if (!confirm("Remove this network?")) return
    const res = await chrome.storage.local.get("zeno_custom_networks")
    const existing: CustomNetwork[] = res.zeno_custom_networks || []
    await chrome.storage.local.set({
      zeno_custom_networks: existing.filter((n) => n.id !== id)
    })
    onDelete(id)
    notify.success("Network removed", "dark", 2000)
  }

  return (
    <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex items-end z-50">
      <div className="w-full bg-[#111] border-t border-white/10 rounded-t-3xl animate-fade-up max-h-[80%] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0">
          <div className="w-8 h-1 bg-white/20 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-3" />
          <h3 className="text-white font-black text-sm uppercase tracking-widest">Custom Networks</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all">
            <X className="w-3.5 h-3.5 text-white/60" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar">
          {networks.length === 0 ? (
            <div className="text-center py-8">
              <Globe className="w-8 h-8 text-white/10 mx-auto mb-3" />
              <p className="text-white/20 text-xs">No custom networks added yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {networks.map((net) => (
                <div key={net.id} className="flex items-center gap-3 bg-white/[0.02] border border-white/5 rounded-2xl px-4 py-3">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                    <Globe className="w-4 h-4 text-white/30" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-bold truncate">{net.name}</p>
                    <p className="text-white/30 text-[10px] font-mono">Chain {net.chainId} · {net.symbol}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(net.id)}
                    className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center hover:bg-red-500/20 transition-all flex-shrink-0">
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}