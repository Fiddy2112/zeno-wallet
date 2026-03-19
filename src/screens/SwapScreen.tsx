import {
  ArrowLeftIcon,
  Bot,
  ChevronDown,
  Repeat,
  Settings2,
  ShieldCheck,
  Zap
} from "lucide-react"
import React, { useEffect, useState } from "react"

import { notify } from "~features/notifications"
import type { Screen } from "~types"

interface Props {
  setScreen: (s: Screen) => void
  proMode: boolean
}

const SWAP_TOKENS = [
  {
    id: "ethereum",
    symbol: "ETH",
    name: "Ethereum",
    logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
    balance: "1.2847"
  },
  {
    id: "usd-coin",
    symbol: "USDC",
    name: "USD Coin",
    logo: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png",
    balance: "850.00"
  },
  {
    id: "arbitrum",
    symbol: "ARB",
    name: "Arbitrum",
    logo: "https://cryptologos.cc/logos/arbitrum-arb-logo.png",
    balance: "340.12"
  },
  {
    id: "uniswap",
    symbol: "UNI",
    name: "Uniswap",
    logo: "https://cryptologos.cc/logos/uniswap-uni-logo.png",
    balance: "22.50"
  }
]

export const SwapScreen: React.FC<Props> = ({ setScreen, proMode }) => {
  const [fromToken, setFromToken] = useState(SWAP_TOKENS[0])
  const [toToken, setToToken] = useState(SWAP_TOKENS[1])
  const [fromAmt, setFromAmt] = useState("")
  const [slippage, setSlippage] = useState("0.5")

  // ui state
  const [showFromDropdown, setShowFromDropdown] = useState(false)
  const [showToDropdown, setShowToDropdown] = useState(false)
  const [step, setStep] = useState<"input" | "review" | "swapping">("input")

  // price state
  const [prices, setPrices] = useState<Record<string, number>>({})
  const [isFetchingPrice, setIsFetchingPrice] = useState(true)

  // init & ai fill
  useEffect(() => {
    chrome.storage.local.get(["pending_tx"], (res) => {
      if (res.pending_tx) {
        // ai fill intent="SWAP", params={from: "ETH", to: "USDC", amount: "0.5"}
        const { from, to, amount } = res.pending_tx

        if (from) {
          const matchedFrom = SWAP_TOKENS.find(
            (t) => t.symbol.toLowerCase() === from.toLowerCase()
          )
          if (matchedFrom) setFromToken(matchedFrom)
        }
        if (to) {
          const matchedTo = SWAP_TOKENS.find(
            (t) => t.symbol.toLowerCase() === to.toLowerCase()
          )
          if (matchedTo) setToToken(matchedTo)
        }
        if (amount) setFromAmt(amount)

        chrome.storage.local.remove("pending_tx")
      }
    })
  }, [])

  // get price from coingecko
  useEffect(() => {
    const fetchPrices = async () => {
      setIsFetchingPrice(true)
      try {
        const ids = SWAP_TOKENS.map((t) => t.id).join(",")
        const res = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`
        )
        const data = await res.json()

        const priceMap: Record<string, number> = {}
        SWAP_TOKENS.forEach((t) => {
          priceMap[t.id] = data[t.id]?.usd || 0
        })
        setPrices(priceMap)
      } catch (error) {
        console.error("Lỗi lấy giá swap", error)
      } finally {
        setIsFetchingPrice(false)
      }
    }
    fetchPrices()
    const interval = setInterval(fetchPrices, 15000) // update price every 15s
    return () => clearInterval(interval)
  }, [])

  // flip & calculate
  const flip = () => {
    setFromToken(toToken)
    setToToken(fromToken)
    setFromAmt("")
  }

  const fromPriceUsd = prices[fromToken.id] || 0
  const toPriceUsd = prices[toToken.id] || 0

  // exchange rate
  const exchangeRate = toPriceUsd > 0 ? fromPriceUsd / toPriceUsd : 0

  // to amount
  const toAmt =
    Number(fromAmt) > 0 && exchangeRate > 0
      ? (Number(fromAmt) * exchangeRate).toFixed(6)
      : ""

  const fromUsdValue = Number(fromAmt) * fromPriceUsd

  const handleExecute = () => {
    setStep("swapping")
    notify.info("Routing through Zeno AI Aggregator...", "dark", 2000)
    setTimeout(() => {
      notify.success(
        `Swap successful! Received ${toAmt} ${toToken.symbol}`,
        "dark",
        4000
      )
      setScreen("dashboard")
    }, 3000)
  }

  // custom dropdown
  const renderDropdown = (
    type: "from" | "to",
    currentToken: (typeof SWAP_TOKENS)[0],
    show: boolean,
    setShow: (v: boolean) => void,
    setToken: (t: (typeof SWAP_TOKENS)[0]) => void
  ) => (
    <div className="relative">
      <button
        onClick={() => setShow(!show)}
        className="bg-[#1a1a1a] border border-white/10 hover:border-white/30 text-white text-xs font-bold px-3 py-2.5 rounded-xl outline-none cursor-pointer flex items-center gap-2 transition-all flex-shrink-0 min-w-[100px] justify-between shadow-inner">
        <div className="flex items-center gap-2">
          <img
            src={currentToken.logo}
            alt={currentToken.symbol}
            className="w-5 h-5 rounded-full bg-white/10 p-0.5"
          />
          <span className="text-sm">{currentToken.symbol}</span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-white/50 transition-transform duration-300 ${show ? "rotate-180" : ""}`}
        />
      </button>

      {show && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setShow(false)} />
          <div className="absolute top-full left-0 mt-2 w-[160px] bg-[#1a1a1a] border border-white/10 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.8)] z-30 overflow-hidden animate-fade-in py-1">
            {SWAP_TOKENS.map((t) => (
              <button
                key={t.symbol}
                onClick={() => {
                  setToken(t)
                  setShow(false)
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold transition-colors ${
                  currentToken.symbol === t.symbol
                    ? "bg-emerald-400/10 text-emerald-400"
                    : "text-white/60 hover:bg-white/10 hover:text-white"
                }`}>
                <img
                  src={t.logo}
                  alt={t.symbol}
                  className="w-5 h-5 rounded-full bg-white/10 p-0.5"
                />
                <div className="flex flex-col items-start">
                  <span>{t.symbol}</span>
                  <span className="text-[9px] font-normal opacity-50">
                    {t.name}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )

  return (
    <div className="flex-1 flex flex-col p-4 animate-fade-up h-full bg-[#080808]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() =>
            step === "review" ? setStep("input") : setScreen("dashboard")
          }
          className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:bg-white/10 hover:text-white transition-all">
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div className="flex flex-col">
          <h2 className="text-lg font-black text-white uppercase tracking-wider">
            {step === "input" ? "Swap Nexus" : "Review Swap"}
          </h2>
        </div>
      </div>

      {step === "input" ? (
        <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-1 relative">
          {/* from */}
          <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-4 transition-all focus-within:border-emerald-400/30">
            <div className="flex items-center justify-between mb-3">
              <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">
                You Pay
              </span>
              <span className="text-white/40 text-[10px] font-mono">
                Balance: {fromToken.balance} {fromToken.symbol}
              </span>
            </div>
            <div className="flex items-center gap-3">
              {renderDropdown(
                "from",
                fromToken,
                showFromDropdown,
                setShowFromDropdown,
                setFromToken
              )}
              <div className="flex-1 flex flex-col items-end">
                <input
                  value={fromAmt}
                  onChange={(e) => setFromAmt(e.target.value)}
                  placeholder="0"
                  type="number"
                  className="w-full bg-transparent text-white text-right text-3xl font-bold outline-none placeholder-white/10 font-mono"
                />
              </div>
            </div>
            <div className="flex justify-between items-center mt-2">
              <button
                onClick={() => setFromAmt(fromToken.balance)}
                className="text-[9px] font-bold tracking-widest text-emerald-400 hover:text-emerald-300 transition-colors uppercase">
                USE MAX
              </button>
              <span className="text-white/30 text-[11px] font-mono">
                {fromAmt ? `≈ $${fromUsdValue.toFixed(2)}` : "$0.00"}
              </span>
            </div>
          </div>

          {/* flip */}
          <div className="flex justify-center -my-5 relative z-10 pointer-events-none">
            <button
              onClick={flip}
              className="pointer-events-auto w-10 h-10 bg-[#080808] border-4 border-[#080808] rounded-xl flex items-center justify-center text-white hover:text-emerald-400 bg-white/5 hover:bg-white/10 transition-all active:scale-90 duration-300">
              <Repeat className="w-4 h-4" />
            </button>
          </div>

          {/* to */}
          <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-4 mt-2">
            <div className="flex items-center justify-between mb-3">
              <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">
                You Receive
              </span>
              <span className="text-white/40 text-[10px] font-mono">
                Balance: {toToken.balance} {toToken.symbol}
              </span>
            </div>
            <div className="flex items-center gap-3">
              {renderDropdown(
                "to",
                toToken,
                showToDropdown,
                setShowToDropdown,
                setToToken
              )}
              <div className="flex-1 flex flex-col items-end">
                <div
                  className={`text-3xl font-bold font-mono truncate w-full text-right ${toAmt ? "text-white" : "text-white/20"}`}>
                  {isFetchingPrice ? "..." : toAmt || "0"}
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-2">
              <span className="text-white/30 text-[11px] font-mono">
                {toAmt
                  ? `≈ $${(Number(toAmt) * toPriceUsd).toFixed(2)}`
                  : "$0.00"}
              </span>
            </div>
          </div>

          {/* details */}
          {fromAmt && Number(fromAmt) > 0 && (
            <div className="bg-[#121212] border border-white/5 rounded-2xl p-4 mt-4 animate-fade-in space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-white/40 font-bold uppercase tracking-widest text-[9px]">
                  Rate
                </span>
                <span className="text-white/80 font-mono">
                  1 {fromToken.symbol} ={" "}
                  {exchangeRate > 0 ? exchangeRate.toFixed(4) : "..."}{" "}
                  {toToken.symbol}
                </span>
              </div>

              {proMode && (
                <>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/40 font-bold uppercase tracking-widest text-[9px]">
                      Price Impact
                    </span>
                    <span className="text-emerald-400 font-mono font-bold">
                      {"< 0.05%"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/40 font-bold uppercase tracking-widest text-[9px] flex items-center gap-1">
                      Max Slippage <Settings2 className="w-3 h-3" />
                    </span>
                    <div className="flex gap-1.5 bg-black/50 p-1 rounded-lg border border-white/5">
                      {["0.1", "0.5", "1.0"].map((s) => (
                        <button
                          key={s}
                          onClick={() => setSlippage(s)}
                          className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                            slippage === s
                              ? "bg-white text-black"
                              : "text-white/40 hover:text-white"
                          }`}>
                          {s}%
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs pt-2 border-t border-white/5">
                    <span className="text-white/40 font-bold uppercase tracking-widest text-[9px]">
                      Route
                    </span>
                    <span className="text-emerald-400 text-[10px] flex items-center gap-1 font-bold">
                      <Bot className="w-3 h-3" /> Zeno AI Aggregator
                    </span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      ) : (
        /* review swap */
        <div className="flex-1 flex flex-col items-center justify-center animate-fade-in space-y-6">
          <div className="relative flex items-center justify-center w-full mb-4">
            <div className="w-16 h-16 bg-[#1a1a1a] border-2 border-[#080808] rounded-full z-10 flex items-center justify-center -mr-4 shadow-xl">
              <img
                src={fromToken.logo}
                alt="from"
                className="w-8 h-8 rounded-full"
              />
            </div>
            <div className="w-10 h-10 bg-emerald-400/20 rounded-full z-0 flex items-center justify-center">
              <ArrowLeftIcon className="w-4 h-4 text-emerald-400 rotate-180" />
            </div>
            <div className="w-16 h-16 bg-[#1a1a1a] border-2 border-[#080808] rounded-full z-10 flex items-center justify-center -ml-4 shadow-xl">
              <img
                src={toToken.logo}
                alt="to"
                className="w-8 h-8 rounded-full"
              />
            </div>
          </div>

          <div className="text-center w-full">
            <p className="text-white/40 text-[10px] uppercase tracking-widest mb-2">
              You will receive exactly
            </p>
            <h1 className="text-4xl font-black text-white font-mono break-all px-4">
              {toAmt}
            </h1>
            <p className="text-xl text-emerald-400 font-bold mt-1">
              {toToken.symbol}
            </p>
          </div>

          <div className="w-full bg-white/[0.02] border border-white/5 p-4 rounded-2xl space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-white/40 text-[10px] uppercase tracking-widest">
                Paying
              </span>
              <span className="text-white text-xs font-mono font-bold">
                {fromAmt} {fromToken.symbol}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/40 text-[10px] uppercase tracking-widest">
                Exchange Rate
              </span>
              <span className="text-white text-xs font-mono">
                1 {fromToken.symbol} = {exchangeRate.toFixed(4)}{" "}
                {toToken.symbol}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-emerald-400 text-[10px] uppercase tracking-widest font-bold">
                Execution
              </span>
              <span className="text-emerald-400 text-xs font-mono font-bold flex items-center gap-1">
                <Zap className="w-3 h-3" /> Zeno Fast
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Execute */}
      <div className="mt-4 pt-4 border-t border-white/5">
        <button
          onClick={() =>
            step === "input" ? setStep("review") : handleExecute()
          }
          disabled={
            !fromAmt ||
            Number(fromAmt) <= 0 ||
            fromToken.symbol === toToken.symbol ||
            step === "swapping"
          }
          className={`w-full py-4 font-black rounded-2xl text-xs tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${
            step === "review"
              ? "bg-emerald-400 text-black hover:bg-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.3)]"
              : "bg-white text-black hover:bg-white/90"
          } disabled:opacity-20 disabled:cursor-not-allowed`}>
          {step === "swapping"
            ? "ROUTING TRANSACTION..."
            : step === "review"
              ? "CONFIRM SWAP"
              : "REVIEW SWAP"}
        </button>
      </div>
    </div>
  )
}
