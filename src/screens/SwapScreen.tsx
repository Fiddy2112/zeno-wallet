import {
  AlertTriangle,
  ArrowLeftIcon,
  Bot,
  ChevronDown,
  Repeat,
  Settings2,
  Zap
} from "lucide-react"
import React, { useEffect, useRef, useState } from "react"
import { formatEther, parseUnits } from "viem"

import { getAdapter, getChainConfig } from "~core/networks"
import { deriveWalletFromMnemonic } from "~core/wallet-engine"
import { notify } from "~features/notifications"
import { getCachedPrice } from "~features/price-cache"
import { vaultSecurity } from "~features/security"
import type { Screen } from "~types"

interface Props {
  setScreen: (s: Screen) => void
  proMode: boolean
}

// Token addresses on Ethereum mainnet
const SWAP_TOKENS = [
  {
    id: "ethereum",
    symbol: "ETH",
    name: "Ethereum",
    logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
    address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", // 0x native ETH sentinel
    decimals: 18
  },
  {
    id: "usd-coin",
    symbol: "USDC",
    name: "USD Coin",
    logo: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png",
    address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    decimals: 6
  },
  {
    id: "tether",
    symbol: "USDT",
    name: "Tether",
    logo: "https://cryptologos.cc/logos/tether-usdt-logo.png",
    address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    decimals: 6
  },
  {
    id: "arbitrum",
    symbol: "ARB",
    name: "Arbitrum",
    logo: "https://cryptologos.cc/logos/arbitrum-arb-logo.png",
    address: "0xB50721BCf8d664c30412Cfbc6cf7a15145234ad1",
    decimals: 18
  },
  {
    id: "uniswap",
    symbol: "UNI",
    name: "Uniswap",
    logo: "https://cryptologos.cc/logos/uniswap-uni-logo.png",
    address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
    decimals: 18
  }
]

type SwapToken = (typeof SWAP_TOKENS)[0]

// 0x API v2 — free tier, no API key needed for Ethereum mainnet
const ZEROX_API = "https://api.0x.org/swap/v1"

interface ZeroXQuote {
  buyAmount: string
  sellAmount: string
  price: string
  estimatedGas: string
  to: string
  data: string
  value: string
  allowanceTarget: string
  grossBuyAmount: string
  priceImpact?: string
}

export const SwapScreen: React.FC<Props> = ({ setScreen, proMode }) => {
  const [fromToken, setFromToken] = useState(SWAP_TOKENS[0])
  const [toToken, setToToken] = useState(SWAP_TOKENS[1])
  const [fromAmt, setFromAmt] = useState("")
  const [slippage, setSlippage] = useState("0.5")

  const [showFromDropdown, setShowFromDropdown] = useState(false)
  const [showToDropdown, setShowToDropdown] = useState(false)
  const [step, setStep] = useState<"input" | "review" | "swapping">("input")

  const [prices, setPrices] = useState<Record<string, number>>({})
  const [quote, setQuote] = useState<ZeroXQuote | null>(null)
  const [isFetchingQuote, setIsFetchingQuote] = useState(false)
  const [quoteError, setQuoteError] = useState("")

  // Password modal for swap confirm
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [txPassword, setTxPassword] = useState("")
  const [txError, setTxError] = useState("")

  const [myAddress, setMyAddress] = useState("")
  const quoteTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load address + pending AI fill
  useEffect(() => {
    chrome.storage.local.get(["zeno_address", "pending_tx"], (res) => {
      if (res.zeno_address) setMyAddress(res.zeno_address)
      if (res.pending_tx) {
        const { from, to, amount } = res.pending_tx
        if (from) {
          const match = SWAP_TOKENS.find(
            (t) => t.symbol.toLowerCase() === from.toLowerCase()
          )
          if (match) setFromToken(match)
        }
        if (to) {
          const match = SWAP_TOKENS.find(
            (t) => t.symbol.toLowerCase() === to.toLowerCase()
          )
          if (match) setToToken(match)
        }
        if (amount) setFromAmt(amount)
        chrome.storage.local.remove("pending_tx")
      }
    })
  }, [])

  // Fetch prices from cache
  useEffect(() => {
    const fetchPrices = async () => {
      const ids = [...new Set(SWAP_TOKENS.map((t) => t.id))]
      const priceMap: Record<string, number> = {}
      await Promise.all(
        ids.map(async (id) => {
          priceMap[id] = await getCachedPrice(id)
        })
      )
      setPrices(priceMap)
    }
    fetchPrices()
    const interval = setInterval(fetchPrices, 30_000)
    return () => clearInterval(interval)
  }, [])

  // Debounced 0x quote fetch
  useEffect(() => {
    if (
      !fromAmt ||
      Number(fromAmt) <= 0 ||
      fromToken.symbol === toToken.symbol
    ) {
      setQuote(null)
      setQuoteError("")
      return
    }
    if (quoteTimer.current) clearTimeout(quoteTimer.current)
    quoteTimer.current = setTimeout(fetchQuote, 600)
    return () => {
      if (quoteTimer.current) clearTimeout(quoteTimer.current)
    }
  }, [fromAmt, fromToken, toToken, slippage])

  const fetchQuote = async () => {
    setIsFetchingQuote(true)
    setQuoteError("")
    try {
      const sellAmount = parseUnits(fromAmt, fromToken.decimals).toString()
      const params = new URLSearchParams({
        sellToken: fromToken.address,
        buyToken: toToken.address,
        sellAmount,
        slippagePercentage: (Number(slippage) / 100).toString(),
        takerAddress: myAddress || undefined
      } as any)

      const res = await fetch(`${ZEROX_API}/quote?${params}`, {
        headers: { "0x-api-key": "" } // free tier
      })

      if (!res.ok) {
        const err = await res.json()
        setQuoteError(err?.reason || "Quote unavailable")
        setQuote(null)
        return
      }

      const data: ZeroXQuote = await res.json()
      setQuote(data)
    } catch {
      setQuoteError("Failed to fetch quote")
      setQuote(null)
    } finally {
      setIsFetchingQuote(false)
    }
  }

  const flip = () => {
    setFromToken(toToken)
    setToToken(fromToken)
    setFromAmt("")
    setQuote(null)
  }

  const fromPriceUsd = prices[fromToken.id] || 0
  const toPriceUsd = prices[toToken.id] || 0
  const fromUsdValue = Number(fromAmt) * fromPriceUsd

  // Display amount from 0x quote or fallback to price estimate
  const toAmtDisplay = quote
    ? (Number(quote.buyAmount) / 10 ** toToken.decimals).toFixed(6)
    : fromAmt && fromPriceUsd && toPriceUsd
      ? ((Number(fromAmt) * fromPriceUsd) / toPriceUsd).toFixed(6)
      : ""

  const toUsdValue = toAmtDisplay ? Number(toAmtDisplay) * toPriceUsd : 0
  const estimatedGasEth = quote
    ? Number(formatEther(BigInt(quote.estimatedGas) * 30_000_000_000n))
    : 0

  // Execute swap via 0x calldata + viem WalletClient
  const handleExecuteSwap = async () => {
    if (!txPassword || !quote) return
    setTxError("")
    setShowPasswordModal(false)
    setStep("swapping")

    try {
      const res = await chrome.storage.local.get(["zeno_vault", "zeno_salt"])
      if (!res.zeno_vault || !res.zeno_salt) throw new Error("Vault not found.")

      const mnemonic = vaultSecurity.decryptMnemonic(
        res.zeno_vault,
        txPassword,
        res.zeno_salt
      )
      if (!mnemonic || mnemonic.split(" ").length < 12)
        throw new Error("Wrong password")

      const wallet = deriveWalletFromMnemonic(mnemonic)
      const { adapter } = getAdapter("ethereum")

      const hash = await adapter.sendTx({
        privateKey: wallet.privateKey,
        to: quote.to,
        value:
          fromToken.symbol === "ETH"
            ? (Number(quote.value) / 1e18).toFixed(18)
            : "0",
        chainId: "ethereum",
        data: quote.data as `0x${string}`
      })

      notify.success(
        `Swap sent! Hash: ${hash.slice(0, 10)}...${hash.slice(-6)}`,
        "dark",
        5000
      )
      setScreen("dashboard")
    } catch (err: any) {
      const msg = err?.shortMessage || err?.message || "Swap failed"
      if (msg.includes("Wrong password")) {
        setTxError("Incorrect password.")
        setTxPassword("")
        setShowPasswordModal(true)
        setStep("review")
      } else {
        notify.error(msg, "dark", 4000)
        setStep("review")
      }
    }
  }

  const renderDropdown = (
    currentToken: SwapToken,
    show: boolean,
    setShow: (v: boolean) => void,
    setToken: (t: SwapToken) => void,
    excludeSymbol?: string
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
            {SWAP_TOKENS.filter((t) => t.symbol !== excludeSymbol).map((t) => (
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
      {/* Password modal */}
      {showPasswordModal && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-end z-50">
          <div className="w-full bg-[#111] border-t border-white/10 p-6 rounded-t-3xl animate-fade-up">
            <div className="w-8 h-1 bg-white/20 rounded-full mx-auto mb-4" />
            <h3 className="text-white font-black text-sm uppercase tracking-widest mb-1">
              Authorize Swap
            </h3>
            <p className="text-white/40 text-xs mb-5 leading-relaxed">
              Enter your wallet password to sign and broadcast this swap.
            </p>
            <input
              type="password"
              value={txPassword}
              onChange={(e) => {
                setTxPassword(e.target.value)
                setTxError("")
              }}
              onKeyDown={(e) => e.key === "Enter" && handleExecuteSwap()}
              placeholder="Wallet password"
              autoFocus
              className="w-full bg-white/[0.05] border border-white/10 focus:border-white/30 text-white placeholder-white/20 px-4 py-3.5 rounded-xl outline-none text-sm mb-2 transition-all"
            />
            {txError && (
              <p className="text-red-400 text-xs mb-3 flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3" />
                {txError}
              </p>
            )}
            <div className="flex gap-3 mt-3">
              <button
                onClick={() => {
                  setShowPasswordModal(false)
                  setTxPassword("")
                  setStep("review")
                }}
                className="flex-1 py-3 border border-white/10 text-white/50 rounded-xl text-xs font-bold hover:border-white/25 transition-all">
                CANCEL
              </button>
              <button
                onClick={handleExecuteSwap}
                disabled={!txPassword}
                className="flex-1 py-3 bg-emerald-400 text-black rounded-xl text-xs font-black disabled:opacity-30 hover:bg-emerald-300 active:scale-[0.98] transition-all">
                SIGN & SWAP
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() =>
            step === "review" ? setStep("input") : setScreen("dashboard")
          }
          className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:bg-white/10 hover:text-white transition-all">
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-black text-white uppercase tracking-wider">
          {step === "input" ? "Swap Nexus" : "Review Swap"}
        </h2>
      </div>

      {step === "input" ? (
        <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-1 relative">
          {/* From */}
          <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-4 transition-all focus-within:border-emerald-400/30">
            <div className="flex items-center justify-between mb-3">
              <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">
                You Pay
              </span>
            </div>
            <div className="flex items-center gap-3">
              {renderDropdown(
                fromToken,
                showFromDropdown,
                setShowFromDropdown,
                setFromToken,
                toToken.symbol
              )}
              <input
                value={fromAmt}
                onChange={(e) => setFromAmt(e.target.value)}
                placeholder="0"
                type="number"
                className="flex-1 bg-transparent text-white text-right text-3xl font-bold outline-none placeholder-white/10 font-mono"
              />
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-white/30 text-[11px] font-mono">
                {fromAmt ? `≈ $${fromUsdValue.toFixed(2)}` : "$0.00"}
              </span>
            </div>
          </div>

          {/* Flip */}
          <div className="flex justify-center -my-5 relative z-10 pointer-events-none">
            <button
              onClick={flip}
              className="pointer-events-auto w-10 h-10 bg-[#080808] border-4 border-[#080808] rounded-xl flex items-center justify-center text-white hover:text-emerald-400 bg-white/5 hover:bg-white/10 transition-all active:scale-90 duration-300">
              <Repeat className="w-4 h-4" />
            </button>
          </div>

          {/* To */}
          <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-4 mt-2">
            <div className="flex items-center justify-between mb-3">
              <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">
                You Receive
              </span>
              {isFetchingQuote && (
                <span className="text-white/30 text-[10px] animate-pulse">
                  Fetching quote...
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {renderDropdown(
                toToken,
                showToDropdown,
                setShowToDropdown,
                setToToken,
                fromToken.symbol
              )}
              <div
                className={`flex-1 text-right text-3xl font-bold font-mono ${toAmtDisplay ? "text-white" : "text-white/20"}`}>
                {isFetchingQuote ? "..." : toAmtDisplay || "0"}
              </div>
            </div>
            <div className="flex justify-end mt-2">
              <span className="text-white/30 text-[11px] font-mono">
                {toAmtDisplay ? `≈ $${toUsdValue.toFixed(2)}` : "$0.00"}
              </span>
            </div>
          </div>

          {/* Quote error */}
          {quoteError && (
            <div className="flex items-center gap-2 px-1">
              <AlertTriangle className="w-3 h-3 text-yellow-400 flex-shrink-0" />
              <span className="text-yellow-400/80 text-[10px]">
                {quoteError}
              </span>
            </div>
          )}

          {/* Details */}
          {fromAmt && Number(fromAmt) > 0 && !quoteError && (
            <div className="bg-[#121212] border border-white/5 rounded-2xl p-4 mt-4 animate-fade-in space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-white/40 font-bold uppercase tracking-widest text-[9px]">
                  Rate
                </span>
                <span className="text-white/80 font-mono">
                  {quote
                    ? `1 ${fromToken.symbol} = ${(Number(toAmtDisplay) / Number(fromAmt)).toFixed(4)} ${toToken.symbol}`
                    : fromPriceUsd && toPriceUsd
                      ? `1 ${fromToken.symbol} = ${(fromPriceUsd / toPriceUsd).toFixed(4)} ${toToken.symbol}`
                      : "—"}
                </span>
              </div>

              {quote && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-white/40 font-bold uppercase tracking-widest text-[9px]">
                    Est. Gas
                  </span>
                  <span className="text-white/60 font-mono">
                    ~{estimatedGasEth.toFixed(5)} ETH
                  </span>
                </div>
              )}

              {proMode && (
                <>
                  {quote?.priceImpact && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-white/40 font-bold uppercase tracking-widest text-[9px]">
                        Price Impact
                      </span>
                      <span
                        className={`font-mono font-bold ${Number(quote.priceImpact) > 2 ? "text-red-400" : "text-emerald-400"}`}>
                        {Number(quote.priceImpact).toFixed(2)}%
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/40 font-bold uppercase tracking-widest text-[9px] flex items-center gap-1">
                      Max Slippage <Settings2 className="w-3 h-3" />
                    </span>
                    <div className="flex gap-1.5 bg-black/50 p-1 rounded-lg border border-white/5">
                      {["0.1", "0.5", "1.0"].map((s) => (
                        <button
                          key={s}
                          onClick={() => setSlippage(s)}
                          className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${slippage === s ? "bg-white text-black" : "text-white/40 hover:text-white"}`}>
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
                      <Bot className="w-3 h-3" />{" "}
                      {quote ? "0x Protocol" : "Zeno AI Aggregator"}
                    </span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Review */
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
              You will receive
            </p>
            <h1 className="text-4xl font-black text-white font-mono break-all px-4">
              {toAmtDisplay}
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
                Est. Gas
              </span>
              <span className="text-white/60 text-xs font-mono">
                ~{estimatedGasEth.toFixed(5)} ETH
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/40 text-[10px] uppercase tracking-widest">
                Slippage
              </span>
              <span className="text-white text-xs font-mono">{slippage}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-emerald-400 text-[10px] uppercase tracking-widest font-bold">
                Route
              </span>
              <span className="text-emerald-400 text-xs font-mono font-bold flex items-center gap-1">
                <Zap className="w-3 h-3" />{" "}
                {quote ? "0x Protocol" : "Price estimate"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Execute button */}
      <div className="mt-4 pt-4 border-t border-white/5">
        <button
          onClick={() => {
            if (step === "input") setStep("review")
            else {
              setTxPassword("")
              setShowPasswordModal(true)
            }
          }}
          disabled={
            !fromAmt ||
            Number(fromAmt) <= 0 ||
            fromToken.symbol === toToken.symbol ||
            step === "swapping" ||
            isFetchingQuote
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
              : isFetchingQuote
                ? "GETTING QUOTE..."
                : "REVIEW SWAP"}
        </button>
      </div>
    </div>
  )
}
