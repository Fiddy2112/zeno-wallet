import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronDown,
  Plus,
  Repeat
} from "lucide-react"
import { useEffect, useState } from "react"

import { IdentityHub } from "~components/IdentityHub"
import { TokenCard } from "~components/TokenCard"
import { askZeno } from "~features/ai-service"
import { notify } from "~features/notifications"
import { useDashboardTour } from "~features/useDashboardTour"
import {
  addNextAccount,
  importExternalAccount,
  removeAccount
} from "~features/wallet-logic"
import { useNetworkPortfolio } from "~hooks/usePortfolio"
import { mapToToken, type Screen, type Token } from "~types"

interface Props {
  setScreen: (s: Screen) => void
  proMode: boolean
  setProMode: (v: boolean) => void
}

const short = (a: string) => a.slice(0, 6) + "..." + a.slice(-4)

export const DashboardScreen: React.FC<Props> = ({
  setScreen,
  proMode,
  setProMode
}) => {
  const { startTour, shouldAutoStart } = useDashboardTour()

  // States
  const [showHub, setShowHub] = useState(false)
  const [accounts, setAccounts] = useState<any[]>([])
  const [address, setAddress] = useState<string>("")

  // AI Input
  const [aiInput, setAiInput] = useState("")
  const [isAiProcessing, setIsAiProcessing] = useState(false)

  // Market proxy
  const [marketData, setMarketData] = useState({ change24h: 0 })

  // get network portfolio
  const { networkGroups, isLoading } = useNetworkPortfolio(address)

  // total usd value
  const totalUsdValue = Number(
    networkGroups.reduce((sum, group) => sum + (group.totalUsd || 0), 0) || 0
  )
  const totalUsdStr = totalUsdValue.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
  const isPositive = marketData.change24h >= 0

  // Tour Auto-start
  useEffect(() => {
    if (shouldAutoStart()) {
      const t = setTimeout(startTour, 600)
      return () => clearTimeout(t)
    }
  }, [])

  // Load Accounts
  useEffect(() => {
    const loadAccounts = async () => {
      const res = await chrome.storage.local.get([
        "zeno_accounts",
        "zeno_address"
      ])
      if (res.zeno_address) setAddress(res.zeno_address)

      if (!res.zeno_accounts && res.zeno_address) {
        const initial = [
          { name: "Account 1", address: res.zeno_address, index: 0 }
        ]
        setAccounts(initial)
        await chrome.storage.local.set({ zeno_accounts: initial })
      } else {
        setAccounts(res.zeno_accounts || [])
      }
    }
    loadAccounts()
  }, [])

  // Fetch Proxy Market Data
  useEffect(() => {
    const fetchMarketProxy = async () => {
      try {
        const res = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd&include_24hr_change=true"
        )
        const data = await res.json()
        setMarketData({ change24h: data.ethereum?.usd_24h_change || 0 })
      } catch (error) {
        console.log("Market fetch error:", error)
      }
    }
    fetchMarketProxy()
  }, [])

  const handleAIInput = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && aiInput.trim()) {
      setIsAiProcessing(true)
      try {
        const result = await askZeno(aiInput, {
          user_address: address,
          user_balance: totalUsdValue,
          tokens: networkGroups.flatMap((g) => g.tokens)
        })

        if (result.intent === "SEND") {
          notify.success(result.ai_response, "dark", 3000)
          setScreen("send")
        } else {
          notify.info(result.ai_response, "dark", 3000)
        }

        if (result.risk_analysis?.score > 0.7) {
          notify.error(`RISK WARNING: ${result.risk_analysis.reason}`)
        }
      } catch (error) {
        notify.error("Zeno is busy, try again later!")
      } finally {
        setIsAiProcessing(false)
        setAiInput("")
      }
    }
  }

  const handleAddIdentity = async (pass: string) => {
    if (!pass) return
    try {
      const updated = await addNextAccount(pass)
      setAccounts(updated)
      notify.success("New Identity activated!", "dark", 3000)
    } catch (error) {
      notify.error("Incorrect password!", "dark", 3000)
    }
  }

  const handleImportIdentity = async (
    type: "key" | "mnemonic",
    value: string,
    name: string
  ) => {
    try {
      const updated = await importExternalAccount(type, value, name)
      setAccounts(updated)
      notify.success("Account imported successfully!", "dark", 3000)
    } catch (error) {
      notify.error(error.message || "Failed to import account.", "dark", 3000)
      throw error
    }
  }

  const handleRemoveIdentity = async (addrToRemove: string) => {
    try {
      const { updatedAccounts, newActiveAddress } =
        await removeAccount(addrToRemove)
      setAccounts(updatedAccounts)
      // If you accidentally delete the currently selected example,
      // the Console will automatically switch to a different example.
      if (address.toLowerCase() === addrToRemove.toLowerCase()) {
        setAddress(newActiveAddress)
      }
      notify.success("Account remove successfully!", "dark", 3000)
    } catch (error: any) {
      notify.error(error.message || "Failed to remove account.", "dark", 3000)
      throw error
    }
  }

  return (
    <>
      {/* IdentityHub */}
      {showHub && (
        <IdentityHub
          accounts={accounts}
          activeAddress={address}
          onSelect={(addr) => {
            chrome.storage.local.set({ zeno_address: addr })
            setAddress(addr)
            setShowHub(false)
          }}
          onAdd={handleAddIdentity}
          onImport={handleImportIdentity}
          onRemove={handleRemoveIdentity}
          onClose={() => setShowHub(false)}
        />
      )}
      <div className="flex-1 flex flex-col overflow-hidden h-full">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div
              id="tour-logo"
              className="w-6 h-6 bg-white rounded flex items-center justify-center font-black text-black italic text-xs flex-shrink-0">
              Z
            </div>
            <button
              id="tour-address"
              onClick={() => setShowHub(true)}
              className="flex items-center gap-1.5 glass px-2.5 py-1 rounded-full hover:bg-white/[0.08] transition-all leading-6">
              <span className="text-white/70 text-xs font-mono">
                {address ? short(address) : "Loading..."}
              </span>
              <span className="text-white/30 text-[12px] ">
                <ChevronDown className="w-3 h-3" />
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div id="tour-network" className="glass px-2 py-1 rounded-full">
              <span className="text-white/50 text-[10px] font-mono leading-6">
                Multi-chain
              </span>
            </div>
            <button
              onClick={startTour}
              title="Start guided tour"
              className="w-6 h-6 flex items-center justify-center text-white/20 hover:text-white/60 transition-colors text-xs rounded-full border border-white/10 hover:border-white/25">
              ?
            </button>
            <button
              id="tour-mode-toggle"
              onClick={() => setProMode(!proMode)}
              className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition-all ${proMode ? "bg-white text-black" : "border border-white/20 text-white/50 hover:border-white/40"}`}>
              {proMode ? "PRO" : "LITE"}
            </button>
          </div>
        </div>

        {/* Balance */}
        <div id="tour-balance" className="px-4 py-4 text-center flex-shrink-0">
          <p className="text-white/30 text-xs uppercase tracking-widest mb-1">
            Total Net Worth
          </p>
          <h2 className="text-4xl font-black text-white tracking-tight mb-1">
            {isLoading ? "..." : `$${totalUsdStr}`}
          </h2>

          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-2">
              <span
                className={
                  isPositive
                    ? "text-emerald-400 text-xs font-semibold"
                    : "text-red-400 text-xs font-semibold"
                }>
                {isPositive ? "+" : ""}
                {marketData.change24h.toFixed(2)}% Market (24h)
              </span>
            </div>
          </div>

          {proMode && (
            <div className="mx-4 mt-2 bg-black/80 border border-white/5 p-3 rounded-2xl shadow-inner relative">
              <input
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyDown={handleAIInput}
                disabled={isAiProcessing}
                placeholder={
                  isAiProcessing
                    ? "AI is thinking..."
                    : "Ask Zeno: 'Send 0.01 eth to 0x...'"
                }
                className="bg-transparent w-full text-xs text-white placeholder-white/20 outline-none"
              />
            </div>
          )}

          {/* Pro: AI risk score */}
          {proMode && (
            <div className="mt-3 inline-flex items-center gap-2 glass px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-glow" />
              <span className="text-white/60 text-[10px] font-medium">
                AI Risk Score:
              </span>
              <span className="text-emerald-400 text-[10px] font-bold">
                LOW — Safe to transact
              </span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div
          id="tour-actions"
          className="flex justify-center gap-6 px-4 pb-4 flex-shrink-0">
          {[
            {
              label: "Send",
              icon: <ArrowUpRight className="w-5 h-5 text-emerald-400" />,
              screen: "send"
            },
            {
              label: "Receive",
              icon: <ArrowDownLeft className="w-5 h-5 text-emerald-400" />,
              screen: "receive"
            },
            {
              label: "Swap",
              icon: <Repeat className="w-5 h-5 text-emerald-400" />,
              screen: "swap"
            },
            {
              label: "Buy",
              icon: <Plus className="w-5 h-5 text-emerald-400" />,
              screen: "dashboard"
            }
          ].map((a) => (
            <button
              key={a.label}
              onClick={() => setScreen(a.screen as Screen)}
              className="flex flex-col items-center gap-1.5 group">
              <div className="w-11 h-11 glass rounded-2xl flex items-center justify-center text-white text-base hover:bg-white/[0.1] transition-all active:scale-95">
                {a.icon}
              </div>
              <span className="text-white/40 text-[10px] group-hover:text-white/70 transition-colors">
                {a.label}
              </span>
            </button>
          ))}
        </div>

        {/* Tour anchor: asset list */}
        <div
          id="tour-assets"
          className="flex-1 overflow-y-auto px-2 pb-2 custom-scrollbar">
          <div className="flex items-center justify-between px-3 pb-2">
            <span className="text-white/30 text-[10px] uppercase tracking-widest">
              Portfolio Nexus
            </span>
            {proMode && (
              <span className="text-white/30 text-[10px] uppercase tracking-widest">
                Alpha mode
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="text-center text-white/30 text-xs py-8 animate-pulse">
              Scanning multi-chain nexus...
            </div>
          ) : networkGroups.length > 0 ? (
            networkGroups.map((group) => (
              <div key={group.chainId} className="mb-6 animate-fade-in">
                {/* Network Header */}
                <div className="flex items-center justify-between px-3 mb-2">
                  <div className="flex items-center gap-2">
                    <img
                      src={group.chainLogo}
                      alt={group.chainName}
                      className="w-4 h-4 rounded-full"
                    />
                    <span className="text-white/60 text-[10px] font-bold tracking-wider uppercase">
                      {group.chainName}
                    </span>
                  </div>
                  <span className="text-white/40 text-[10px] font-mono">
                    $
                    {group.totalUsd.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </span>
                </div>

                <div className="space-y-1">
                  {group.tokens.map((token: any, index: number) => (
                    <TokenCard
                      key={
                        token.address ||
                        `${group.chainId}-${token.symbol}-${index}`
                      }
                      token={mapToToken(token)}
                    />
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-white/20 text-xs py-8">
              No assets found across networks.
            </div>
          )}
        </div>
      </div>
    </>
  )
}
