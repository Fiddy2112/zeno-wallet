import { ArrowDownLeft, ArrowUpRight, Plus, Repeat } from "lucide-react"
import { useEffect, useState } from "react"
import { formatEther } from "viem"

import { TokenCard } from "~components/TokenCard"
import { publicClient } from "~core/chain"
import { zenoBrain } from "~features/ai-brain"
import { askZeno } from "~features/ai-service"
import { notify } from "~features/notifications"
import { useDashboardTour } from "~features/useDashboardTour"
import { fetchAllBalances } from "~hooks/useTokenBalances"
import type { Screen, Token } from "~types"

interface Props {
  setScreen: (s: Screen) => void
  proMode: boolean
  setProMode: (v: boolean) => void
}

interface CoinGeckoPrice {
  usd: number
  usd_24h_change: number
}

interface CoinGeckoPriceResponse {
  [id: string]: CoinGeckoPrice
}

const TOKENS: Token[] = [
  {
    img: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png",
    name: "Ethereum",
    symbol: "ETH",
    balance: "1.2847",
    usd: "$3,241.50",
    change: 2.14,
    color: "#A0A0FF"
  },
  {
    img: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/zksync/info/logo.png",
    name: "Zksync",
    symbol: "ZKSYNC",
    balance: "850.00",
    usd: "$850.00",
    change: 0.01,
    color: "#AAFFDD"
  },
  {
    img: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png",
    name: "Arbitrum",
    symbol: "ARB",
    balance: "340.12",
    usd: "$204.07",
    change: -3.22,
    color: "#CCAAFF"
  },
  {
    img: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/info/logo.png",
    name: "Base",
    symbol: "BASE",
    balance: "22.5",
    usd: "$157.50",
    change: 1.05,
    color: "#FF88CC"
  }
]

const short = (a: string) => a.slice(0, 6) + "..." + a.slice(-4)

export const DashboardScreen: React.FC<Props> = ({
  setScreen,
  proMode,
  setProMode
}) => {
  const { startTour, shouldAutoStart } = useDashboardTour()
  const [copied, setCopied] = useState(false)
  const [address, setAddress] = useState<string>("")
  const [balance, setBalance] = useState<string>("0.00")
  const [loading, setLoading] = useState(true)
  // AI input
  const [aiInput, setAiInput] = useState("")
  const [isAiProcessing, setIsAiProcessing] = useState(false)

  // Token
  const [tokens, setTokens] = useState<Token[]>([])

  // logic market data
  // profit/loss = (balance x currentPrice) x (priceRealTime / 100)
  const [marketData, setMarketData] = useState({ price: 0, change24h: 0 })

  // Auto-start tour for first-time users
  useEffect(() => {
    if (shouldAutoStart()) {
      const t = setTimeout(startTour, 600)
      return () => clearTimeout(t)
    }
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      const result = await chrome.storage.local.get(["zeno_address"])
      if (result.zeno_address) {
        setAddress(result.zeno_address)
        try {
          const balanceBigInt = await publicClient.getBalance({
            address: result.zeno_address as `0x${string}`
          })
          setBalance(Number(formatEther(balanceBigInt)).toFixed(4))
        } catch (error) {
          console.error("Balance fetch error:", error)
        }
      }
      setLoading(false)
    }

    fetchData()
    const interval = setInterval(fetchData, 15000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const updateBalances = async () => {
      const { zeno_address } = await chrome.storage.local.get(["zeno_address"])
      if (!zeno_address) return

      const ethTokens = [
        {
          name: "Ethereum",
          symbol: "ETH",
          decimals: 18,
          address: "0x0000000000000000000000000000000000000000",
          img: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png",
          color: "#A0A0FF",
          coingeckoId: "ethereum"
        },
        {
          name: "Tether",
          symbol: "USDT",
          decimals: 6,
          address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
          img: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png",
          color: "#26A17B",
          coingeckoId: "tether"
        },
        {
          name: "USD Coin",
          symbol: "USDC",
          decimals: 6,
          address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          img: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png",
          color: "#2775CA",
          coingeckoId: "usd-coin"
        },
        {
          name: "Dai",
          symbol: "DAI",
          decimals: 18,
          address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
          img: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png",
          color: "#F5AC37",
          coingeckoId: "dai"
        }
      ]

      try {
        // Fetch balances
        const balances = await fetchAllBalances(
          zeno_address as `0x${string}`,
          "ethereum",
          ethTokens
        )

        let priceData: CoinGeckoPriceResponse = {}
        try {
          const ids = ethTokens.map((t) => t.coingeckoId).join(",")
          const priceRes = await fetch(
            `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`
          )
          priceData = await priceRes.json()
        } catch (e) {
          console.error("Price fetch failed:", e)
        }

        const enrichedTokens: Token[] = balances.map((t: any) => {
          const priceInfo = priceData[t.coingeckoId] || {
            usd: 0,
            usd_24h_change: 0
          }
          const usdVal = Number(t.balance) * (priceInfo.usd || 0)
          return {
            ...t,
            usd:
              usdVal > 0 || Number(t.balance) > 0
                ? `$${usdVal.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}`
                : "$0.00",
            change: priceInfo.usd_24h_change || 0
          }
        })

        setTokens(enrichedTokens)

        // Update main dashboard price if it's ETH
        if (priceData.ethereum) {
          setMarketData({
            price: priceData.ethereum.usd,
            change24h: priceData.ethereum.usd_24h_change
          })
        }
      } catch (error) {
        console.error("Update balances error:", error)
      }
    }

    updateBalances()
    const interval = setInterval(updateBalances, 30000)
    return () => clearInterval(interval)
  }, [address])

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd&include_24hr_change=true"
        )
        const data: CoinGeckoPriceResponse = await res.json()
        setMarketData({
          price: data.ethereum.usd,
          change24h: data.ethereum.usd_24h_change
        })
      } catch (error) {
        console.log("Price fetch error:", error)
      }
    }
    fetchPrice()
    const interval = setInterval(fetchPrice, 60000)
    return () => clearInterval(interval)
  }, [])

  const totalUsdValue = Number(balance) * marketData.price
  const isPositive = marketData.change24h >= 0
  const absChangeUsd = Math.abs(
    (totalUsdValue * marketData.change24h) / 100
  ).toFixed(2)
  const totalUsdStr = totalUsdValue.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })

  const copy = () => {
    if (!address) return
    navigator.clipboard?.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleAIInput = async (e) => {
    if (e.key === "Enter" && aiInput.trim()) {
      setIsAiProcessing(true)
      try {
        const result = await askZeno(aiInput, {
          user_address: address,
          user_balance: balance
        })

        if (result.intent === "SEND") {
          notify.success(result.ai_response, "dark", 3000)
          setScreen("send")
        } else if (result.intent === "UNKNOWN") {
          notify.warning(result.ai_response, "dark", 3000)
        } else {
          notify.info(result.ai_response, "dark", 3000)
        }

        if (result.risk_analysis.score > 0.7) {
          notify.error(`RISK WARNING: ${result.risk_analysis.reason}`)
        }
      } catch (error) {
        notify.error(
          "Zeno is busy processing other data, bro, try again later!"
        )
      } finally {
        setIsAiProcessing(false)
        setAiInput("")
      }
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          {/* Tour anchor: logo */}
          <div
            id="tour-logo"
            className="w-6 h-6 bg-white rounded flex items-center justify-center font-black text-black italic text-xs flex-shrink-0">
            Z
          </div>
          {/* Tour anchor: address */}
          <button
            id="tour-address"
            onClick={copy}
            className="flex items-center gap-1.5 glass px-2.5 py-1 rounded-full hover:bg-white/[0.08] transition-all leading-6">
            <span className="text-white/70 text-xs font-mono">
              {address ? short(address) : "Loading..."}
            </span>
            <span className="text-white/30 text-[10px] ">
              {copied ? "✓" : "⎘"}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Tour anchor: network */}
          <div id="tour-network" className="glass px-2 py-1 rounded-full">
            <span className="text-white/50 text-[10px] font-mono leading-6">
              Ethereum
            </span>
          </div>
          {/* Tour trigger button */}
          <button
            onClick={startTour}
            title="Start guided tour"
            className=" w-6 h-6 flex items-center justify-center text-white/20 hover:text-white/60 transition-colors text-xs rounded-full border border-white/10 hover:border-white/25">
            ?
          </button>
          {/* Tour anchor: mode toggle */}
          <button
            id="tour-mode-toggle"
            onClick={() => setProMode(!proMode)}
            className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition-all ${
              proMode
                ? "bg-white text-black"
                : "border border-white/20 text-white/50 hover:border-white/40"
            }`}>
            {proMode ? "PRO" : "LITE"}
          </button>
        </div>
      </div>

      {/* Tour anchor: balance */}
      <div id="tour-balance" className="px-4 py-4 text-center flex-shrink-0">
        <p className="text-white/30 text-xs uppercase tracking-widest mb-1">
          Total Balance
        </p>
        <h2 className="text-4xl font-black text-white tracking-tight mb-1">
          {loading ? "..." : `$${totalUsdStr}`}
        </h2>

        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-2">
            {isPositive ? (
              <span className="text-emerald-400 text-xs font-semibold">
                +${absChangeUsd} ({marketData.change24h.toFixed(2)}%) today
              </span>
            ) : (
              <span className="text-red-400 text-xs font-semibold">
                -${absChangeUsd} ({marketData.change24h.toFixed(2)}%) today
              </span>
            )}
          </div>
          <span className="text-white/20 text-[10px] font-mono">
            {balance} ETH
          </span>
        </div>

        {proMode && (
          <div className="mx-4 mt-2 bg-black/80 border border-white/5 p-3 rounded-2xl shadow-inner">
            <input
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              onKeyDown={handleAIInput}
              placeholder="Ask Zeno: 'Send 0.01 eth to 0x...'"
              className="bg-transparent w-full text-xs text-white placeholder-white/20 outline-none"
            />
          </div>
        )}

        {/* Pro: AI risk score */}
        {proMode && (
          <div className="mt-3 inline-flex items-center gap-2 glass px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-glow" />
            <span className="text-white/60 text-[10px] font-medium">
              AI Risk Score:{" "}
            </span>
            <span className="text-emerald-400 text-[10px] font-bold">
              LOW — Safe to transact
            </span>
          </div>
        )}
      </div>

      {/* Tour anchor: action buttons */}
      <div
        id="tour-actions"
        className="flex justify-center gap-6 px-4 pb-4 flex-shrink-0">
        {(
          [
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
          ] as { label: string; icon: React.ReactNode; screen: Screen }[]
        ).map((a) => (
          <button
            key={a.label}
            onClick={() => setScreen(a.screen)}
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

      {/* Pro extras */}
      {proMode && (
        <div className="px-4 pb-3 flex-shrink-0">
          <div className="glass rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-white/40 text-sm">⚡</span>
              <span className="text-white/60 text-xs font-medium">
                MEV Protection
              </span>
            </div>
            <div className="w-9 h-5 bg-white rounded-full relative cursor-pointer flex items-center px-0.5">
              <div className="w-4 h-4 bg-black rounded-full ml-auto" />
            </div>
          </div>
        </div>
      )}

      {/* Tour anchor: asset list */}
      <div id="tour-assets" className="flex-1 overflow-y-auto px-2 pb-2">
        <div className="flex items-center justify-between px-3 pb-2">
          <span className="text-white/30 text-[10px] uppercase tracking-widest">
            Assets
          </span>
          {proMode && (
            <span className="text-white/30 text-[10px] uppercase tracking-widest">
              Alpha mode
            </span>
          )}
        </div>
        {tokens.length > 0
          ? tokens.map((t) => <TokenCard key={t.symbol} token={t} />)
          : TOKENS.map((t) => <TokenCard key={t.symbol} token={t} />)}
      </div>
    </div>
  )
}
