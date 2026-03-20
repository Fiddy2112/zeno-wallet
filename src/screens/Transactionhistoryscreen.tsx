import {
  ArrowDownLeft,
  ArrowLeftIcon,
  ArrowUpRight,
  ExternalLink,
  RefreshCw
} from "lucide-react"
import React, { useEffect, useState } from "react"

import { getChainConfig, SUPPORTED_CHAINS } from "~core/networks"
import type { Screen } from "~types"

interface Props {
  setScreen: (s: Screen) => void
}

type TxType = "send" | "receive" | "swap"

interface TxItem {
  hash: string
  type: TxType
  from: string
  to: string
  value: string
  symbol: string
  timestamp: string
  chainId: string
  status: "confirmed" | "pending" | "failed"
}

const short = (addr: string) =>
  addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "—"

const formatTime = (iso: string) => {
  const d = new Date(iso)
  const now = Date.now()
  const diff = now - d.getTime()
  if (diff < 60_000) return "Just now"
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3600_000)}h ago`
  return d.toLocaleDateString()
}

// EVM chains that have Alchemy URL configured
const FETCH_CHAINS = SUPPORTED_CHAINS.filter(
  (c) =>
    c.vmType === "EVM" &&
    c.alchemyUrl &&
    c.id !== "solana" &&
    c.id !== "bitcoin"
)

export const TransactionHistoryScreen: React.FC<Props> = ({ setScreen }) => {
  const [address, setAddress] = useState("")
  const [txs, setTxs] = useState<TxItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedChain, setSelectedChain] = useState<string>("all")
  const [error, setError] = useState("")

  useEffect(() => {
    chrome.storage.local.get("zeno_address", (res) => {
      if (res.zeno_address) setAddress(res.zeno_address)
    })
  }, [])

  useEffect(() => {
    if (!address) return
    fetchHistory()
  }, [address])

  const fetchHistory = async () => {
    setIsLoading(true)
    setError("")
    try {
      const results: TxItem[] = []

      await Promise.all(
        FETCH_CHAINS.map(async (chain) => {
          if (!chain.alchemyUrl) return
          try {
            // Fetch sent txs
            const sentRes = await fetch(chain.alchemyUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                jsonrpc: "2.0",
                method: "alchemy_getAssetTransfers",
                params: [
                  {
                    fromAddress: address,
                    category: ["external", "erc20"],
                    maxCount: "0xa",
                    withMetadata: true,
                    excludeZeroValue: true,
                    order: "desc"
                  }
                ],
                id: 1
              })
            }).then((r) => r.json())

            // Fetch received txs
            const receivedRes = await fetch(chain.alchemyUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                jsonrpc: "2.0",
                method: "alchemy_getAssetTransfers",
                params: [
                  {
                    toAddress: address,
                    category: ["external", "erc20"],
                    maxCount: "0xa",
                    withMetadata: true,
                    excludeZeroValue: true,
                    order: "desc"
                  }
                ],
                id: 2
              })
            }).then((r) => r.json())

            const sentTransfers = sentRes?.result?.transfers || []
            const receivedTransfers = receivedRes?.result?.transfers || []

            sentTransfers.forEach((t: any) => {
              results.push({
                hash: t.hash,
                type: "send",
                from: t.from,
                to: t.to,
                value: Number(t.value || 0).toFixed(4),
                symbol: t.asset || chain.nativeSymbol,
                timestamp:
                  t.metadata?.blockTimestamp || new Date().toISOString(),
                chainId: chain.id,
                status: "confirmed"
              })
            })

            receivedTransfers.forEach((t: any) => {
              if (t.from?.toLowerCase() !== address.toLowerCase()) {
                results.push({
                  hash: t.hash,
                  type: "receive",
                  from: t.from,
                  to: t.to,
                  value: Number(t.value || 0).toFixed(4),
                  symbol: t.asset || chain.nativeSymbol,
                  timestamp:
                    t.metadata?.blockTimestamp || new Date().toISOString(),
                  chainId: chain.id,
                  status: "confirmed"
                })
              }
            })
          } catch {
            // Silent fail per chain
          }
        })
      )

      // Sort by timestamp desc, deduplicate by hash
      const seen = new Set<string>()
      const deduped = results
        .filter((t) => {
          if (seen.has(t.hash)) return false
          seen.add(t.hash)
          return true
        })
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )

      setTxs(deduped)
    } catch {
      setError("Failed to load transaction history.")
    } finally {
      setIsLoading(false)
    }
  }

  const filteredTxs =
    selectedChain === "all"
      ? txs
      : txs.filter((t) => t.chainId === selectedChain)

  const getExplorerUrl = (tx: TxItem) => {
    const explorers: Record<string, string> = {
      ethereum: "https://etherscan.io/tx/",
      arbitrum: "https://arbiscan.io/tx/",
      base: "https://basescan.org/tx/",
      optimism: "https://optimistic.etherscan.io/tx/",
      polygon: "https://polygonscan.com/tx/",
      zksync: "https://explorer.zksync.io/tx/",
      sepolia: "https://sepolia.etherscan.io/tx/"
    }
    return (explorers[tx.chainId] || "https://etherscan.io/tx/") + tx.hash
  }

  return (
    <div className="flex-1 flex flex-col h-full animate-fade-up">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 flex-shrink-0">
        <button
          onClick={() => setScreen("dashboard")}
          className="w-8 h-8 glass rounded-xl flex items-center justify-center text-white/50 hover:text-white transition-colors">
          <ArrowLeftIcon className="w-4 h-4" />
        </button>
        <h2 className="text-lg font-black text-white uppercase tracking-wider flex-1">
          History
        </h2>
        <button
          onClick={fetchHistory}
          disabled={isLoading}
          className="w-8 h-8 glass rounded-xl flex items-center justify-center text-white/40 hover:text-white transition-colors disabled:opacity-30">
          <RefreshCw
            className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {/* Chain filter tabs */}
      <div className="flex gap-1.5 px-4 pb-3 overflow-x-auto custom-scrollbar flex-shrink-0">
        <button
          onClick={() => setSelectedChain("all")}
          className={`text-[10px] font-bold px-3 py-1.5 rounded-full flex-shrink-0 transition-all ${
            selectedChain === "all"
              ? "bg-white text-black"
              : "border border-white/10 text-white/40 hover:text-white/70"
          }`}>
          All
        </button>
        {FETCH_CHAINS.map((chain) => (
          <button
            key={chain.id}
            onClick={() => setSelectedChain(chain.id)}
            className={`flex items-center gap-1 text-[10px] font-bold px-3 py-1.5 rounded-full flex-shrink-0 transition-all ${
              selectedChain === chain.id
                ? "bg-white text-black"
                : "border border-white/10 text-white/40 hover:text-white/70"
            }`}>
            <img
              src={chain.logo}
              alt={chain.name}
              className="w-3 h-3 rounded-full"
            />
            {chain.name}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-16 bg-white/[0.02] rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-400/60 text-sm mb-3">{error}</p>
            <button
              onClick={fetchHistory}
              className="text-white/40 text-xs hover:text-white/70 transition-colors">
              Try again
            </button>
          </div>
        ) : filteredTxs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-white/20 text-sm">No transactions found</p>
            <p className="text-white/10 text-xs mt-1">
              {selectedChain !== "all"
                ? "Try switching to All networks"
                : "Send or receive to see history"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTxs.map((tx) => {
              const isSend = tx.type === "send"
              const chain = SUPPORTED_CHAINS.find((c) => c.id === tx.chainId)
              return (
                <div
                  key={tx.hash}
                  className="flex items-center gap-3 bg-white/[0.02] border border-white/5 rounded-2xl px-4 py-3 hover:bg-white/[0.04] transition-all group">
                  {/* Icon */}
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isSend ? "bg-red-500/10" : "bg-emerald-500/10"
                    }`}>
                    {isSend ? (
                      <ArrowUpRight className="w-4 h-4 text-red-400" />
                    ) : (
                      <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-white text-xs font-bold">
                        {isSend ? "Sent" : "Received"}
                      </span>
                      {chain && (
                        <img
                          src={chain.logo}
                          alt={chain.name}
                          className="w-3 h-3 rounded-full opacity-50"
                        />
                      )}
                    </div>
                    <p className="text-white/30 text-[10px] font-mono truncate">
                      {isSend
                        ? `To: ${short(tx.to)}`
                        : `From: ${short(tx.from)}`}
                    </p>
                  </div>

                  {/* Amount + time */}
                  <div className="text-right flex-shrink-0">
                    <p
                      className={`text-sm font-bold font-mono ${isSend ? "text-red-400" : "text-emerald-400"}`}>
                      {isSend ? "-" : "+"}
                      {tx.value} {tx.symbol}
                    </p>
                    <p className="text-white/25 text-[10px]">
                      {formatTime(tx.timestamp)}
                    </p>
                  </div>

                  {/* Explorer link */}
                  <a
                    href={getExplorerUrl(tx)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-6 h-6 flex items-center justify-center text-white/10 group-hover:text-white/40 transition-colors flex-shrink-0"
                    onClick={(e) => e.stopPropagation()}>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
