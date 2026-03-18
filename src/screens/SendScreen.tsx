import {
  AlertTriangle,
  ArrowLeftIcon,
  Bot,
  ChevronDown,
  Fingerprint,
  ShieldCheck
} from "lucide-react"
import React, { useEffect, useState } from "react"
import { formatEther, formatGwei } from "viem"

import { getClient, SUPPORTED_CHAINS } from "~core/networks"
import { notify } from "~features/notifications"
import type { Screen } from "~types"

interface Props {
  setScreen: (s: Screen) => void
  proMode: boolean
}

export const SendScreen: React.FC<Props> = ({ setScreen, proMode }) => {
  const [to, setTo] = useState("")
  const [amount, setAmount] = useState("")

  // Selected chain
  const [selectedChainId, setSelectedChainId] = useState(SUPPORTED_CHAINS[0].id)
  const currentChain =
    SUPPORTED_CHAINS.find((c) => c.id === selectedChainId) ||
    SUPPORTED_CHAINS[0]

  // Dropdown options
  const [showDropdown, setShowDropdown] = useState(false)

  // AI state
  const [aiStatus, setAiStatus] = useState<
    "idle" | "scanning" | "safe" | "warn"
  >("idle")
  const [step, setStep] = useState<"input" | "review" | "sending">("input")

  // Real-time state
  const [myAddress, setMyAddress] = useState("")
  const [balance, setBalance] = useState(0)
  const [tokenPrice, setTokenPrice] = useState(0)
  const [baseGasPrice, setBaseGasPrice] = useState<bigint>(0n)
  const [gasTier, setGasTier] = useState<"Slow" | "Zeno Fast" | "Instant">(
    "Zeno Fast"
  )

  // get address and check pending from AI
  useEffect(() => {
    chrome.storage.local.get(["pending_tx", "zeno_address"], (res) => {
      if (res.zeno_address) {
        setMyAddress(res.zeno_address)
      }

      if (res.pending_tx) {
        const { to: aiTo, amount: aiAmount, token: aiToken } = res.pending_tx
        if (aiTo) {
          setTo(aiTo)
          checkAddress(aiTo)
        }
        if (aiAmount) setAmount(aiAmount)
        if (aiToken) {
          const matchedChain = SUPPORTED_CHAINS.find(
            (c) =>
              c.nativeSymbol.toLowerCase() === aiToken.toLowerCase() ||
              c.id.toLowerCase() === aiToken.toLowerCase() ||
              c.name.toLowerCase() === aiToken.toLowerCase()
          )
          if (matchedChain) setSelectedChainId(matchedChain.id)
        }
        chrome.storage.local.remove("pending_tx")
      }
    })
  }, [])

  useEffect(() => {
    if (!myAddress) return

    const fetchNetworkData = async () => {
      try {
        const client = getClient(currentChain.id)

        const bal = await client.getBalance({
          address: myAddress as `0x${string}`
        })
        setBalance(Number(formatEther(bal)))
        // get gas current
        const gas = await client.getGasPrice()
        setBaseGasPrice(gas)

        // get price USD
        if (currentChain.coingeckoId) {
          const res = await fetch(
            `https://api.coingecko.com/api/v3/simple/price?ids=${currentChain.coingeckoId}&vs_currencies=usd`
          )
          const data = await res.json()
          setTokenPrice(data[currentChain.coingeckoId]?.usd || 0)
        }
      } catch (error) {
        console.error("Data network access error:", error)
      }
    }
    fetchNetworkData()

    const interval = setInterval(fetchNetworkData, 10000)
    return () => clearInterval(interval)
  }, [myAddress, currentChain.id, currentChain.coingeckoId])

  // calculate gas costs
  const gasLimit = 21000n // Standard ETH transfer limit

  const getGasMultiplier = () => {
    if (gasTier === "Slow") return 100n
    if (gasTier === "Zeno Fast") return 120n
    if (gasTier === "Instant") return 150n
    return 120n
  }

  const feeInWei =
    baseGasPrice === 0n
      ? 0n
      : (baseGasPrice * gasLimit * getGasMultiplier()) / 100n
  const feeInEth = Number(formatEther(feeInWei))
  const feeInUsd = feeInEth * tokenPrice

  const currentGweiInWei =
    baseGasPrice === 0n ? 0n : (baseGasPrice * getGasMultiplier()) / 100n
  const currentGwei = Number(formatGwei(currentGweiInWei))

  const handleUseMax = () => {
    const maxSend = balance - feeInEth
    if (maxSend > 0) {
      setAmount(maxSend.toFixed(6))
    } else {
      notify.error(
        "The balance is insufficient to pay the network fee.!",
        "dark",
        3000
      )
    }
  }

  const checkAddress = (v: string) => {
    setTo(v)
    if (v.length === 42 && v.startsWith("0x")) {
      setAiStatus("scanning")
      setTimeout(() => setAiStatus("safe"), 1500)
    } else {
      setAiStatus("idle")
    }
  }

  const handleExecute = async () => {
    setStep("sending")
    //  This calls -> client.sendTransaction()
    setTimeout(() => {
      notify.success(
        `Successfully sent ${amount} ${currentChain.nativeSymbol} to ${to.slice(0, 6)}...!`,
        "dark",
        4000
      )
      setScreen("dashboard")
    }, 2500)
  }

  return (
    <div className="flex-1 flex flex-col p-4 animate-fade-up h-full">
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() =>
            step === "review" ? setStep("input") : setScreen("dashboard")
          }
          className="w-8 h-8 glass rounded-xl flex items-center justify-center text-white/50 hover:text-white transition-colors">
          <ArrowLeftIcon className="w-4 h-4" />
        </button>
        <h2 className="text-lg font-black text-white uppercase tracking-wider">
          {step === "input" ? "Initiate Transfer" : "Review"}
        </h2>
      </div>

      {step === "input" ? (
        <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-1">
          {/* To address */}
          <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/5">
            <label className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5">
              Recipient Address
            </label>
            <input
              value={to}
              onChange={(e) => checkAddress(e.target.value)}
              placeholder="0x... or ENS name"
              className="w-full bg-black/40 border border-white/10 focus:border-white/30 text-white placeholder-white/20 px-4 py-3.5 rounded-xl outline-none text-xs transition-all font-mono"
            />

            {/* AI Guardian status */}
            {proMode && (
              <div className="mt-3 h-5 flex items-center">
                {aiStatus === "scanning" && (
                  <div className="flex items-center gap-2 text-white/50 animate-pulse">
                    <Bot className="w-3.5 h-3.5" />
                    <span className="text-[10px] tracking-widest uppercase">
                      Zeno is scanning address...
                    </span>
                  </div>
                )}
                {aiStatus === "safe" && (
                  <div className="flex items-center gap-2 text-emerald-400 animate-fade-in">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span className="text-[10px] tracking-widest uppercase font-bold">
                      Safe: No threats detected
                    </span>
                  </div>
                )}
                {aiStatus === "warn" && (
                  <div className="flex items-center gap-2 text-yellow-400 animate-fade-in">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span className="text-[10px] tracking-widest uppercase font-bold">
                      Warning: Suspicious contract
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Token + Amount */}
          <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/5">
            <label className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-2 block">
              Asset & Amount
            </label>
            <div className="flex gap-2">
              {/* Custom token dropdown */}
              <div className="relative w-[35%]">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="bg-black/40 border border-white/10 hover:border-white/30 hover:bg-white/5 text-white text-xs font-bold px-3 py-3.5 rounded-xl outline-none cursor-pointer flex items-center gap-2 transition-all flex-shrink-0 min-w-[80px] justify-between">
                  <div className="flex items-center gap-2 text-xs">
                    <img
                      src={currentChain.logo}
                      alt={currentChain.name}
                      className="w-4 h-4 rounded-full bg-black/50"
                    />
                    {currentChain.nativeSymbol}
                  </div>
                  <ChevronDown
                    className={`w-3 h-3 text-white/50 transition-transform duration-300 ${showDropdown ? "rotate-180" : ""}`}
                  />
                </button>

                {/* Dropdown Menu */}
                {showDropdown && (
                  <>
                    {/* Overlay */}
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowDropdown(false)}
                    />

                    {/* Box menu */}
                    <div className="absolute top-full left-0 mt-2 w-full min-w-[100px] bg-[#1a1a1a] border border-white/10 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.5)] z-20 overflow-hidden animate-fade-in py-1">
                      {SUPPORTED_CHAINS.map((chain) => (
                        <button
                          key={chain.id}
                          onClick={() => {
                            setSelectedChainId(chain.id)
                            setShowDropdown(false)
                            setBalance(0)
                            setBaseGasPrice(0n)
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold transition-colors ${
                            selectedChainId === chain.id
                              ? "bg-emerald-400/10 text-emerald-400"
                              : "text-white/60 hover:bg-white/10 hover:text-white"
                          }`}>
                          <img
                            src={chain.logo}
                            alt={chain.name}
                            className="w-5 h-5 rounded-full bg-black/50"
                          />
                          <div className="flex flex-col items-start">
                            <span>{chain.nativeSymbol}</span>{" "}
                            <span className="text-[9px] font-normal opacity-50">
                              {chain.name}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                type="number"
                className="w-[65%] bg-black/40 border border-white/10 focus:border-white/30 text-white placeholder-white/20 px-4 py-3 rounded-xl outline-none text-sm transition-all font-mono text-right"
              />
            </div>
            <div className="flex justify-between mt-3 px-1">
              <span className="text-white/30 text-[10px] font-mono">
                Vault: {balance > 0 ? balance.toFixed(4) : "0.00"}{" "}
                {currentChain.nativeSymbol}
              </span>
              <button
                onClick={handleUseMax}
                className="text-emerald-400 hover:text-emerald-300 text-[10px] font-bold tracking-widest transition-colors">
                USE MAX
              </button>
            </div>
          </div>

          {/* Gas estimate */}
          {proMode ? (
            <div className="bg-[#121212] border border-white/5 rounded-2xl p-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 opacity-10 pointer-events-none">
                <Bot className="w-16 h-16" />
              </div>
              <div className="flex items-center justify-between mb-3 relative z-10">
                <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">
                  Network Fee
                </span>
                <button
                  onClick={() => {
                    setGasTier("Zeno Fast")
                    notify.success(
                      "Zeno AI: MEV shield activated",
                      "dark",
                      2000
                    )
                  }}
                  className="text-emerald-400 bg-emerald-400/10 text-[9px] font-black border border-emerald-400/20 px-2.5 py-1 rounded-full hover:bg-emerald-400/20 transition-all uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Zeno Optimized
                </button>
              </div>
              <div className="flex items-center justify-between relative z-10 mb-3">
                <span className="text-white text-sm font-mono font-bold">
                  ~{feeInEth > 0 ? feeInEth.toFixed(7) : "..."}{" "}
                  {currentChain.nativeSymbol}
                </span>
                <span className="text-white/40 text-xs">
                  ≈ ${feeInUsd < 0.01 ? "<0.01" : feeInUsd.toFixed(2)}
                </span>
              </div>
              <div className="flex gap-2 relative z-10">
                {(["Slow", "Zeno Fast", "Instant"] as const).map((tier) => (
                  <button
                    key={tier}
                    onClick={() => setGasTier(tier)}
                    className={`flex-1 text-[10px] py-1.5 rounded-lg transition-all font-bold tracking-widest uppercase ${
                      gasTier === tier
                        ? "bg-white text-black shadow-[0_0_10px_rgba(255,255,255,0.2)]"
                        : "bg-black/50 border border-white/5 text-white/30 hover:border-white/20 hover:text-white/60"
                    }`}>
                    {tier}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex justify-between items-center text-white/40 text-xs border border-white/5 bg-white/[0.02] p-3 rounded-xl">
              <span>Network Fee</span>
              <span>
                ~{feeInEth > 0 ? feeInEth.toFixed(7) : "..."}{" "}
                {currentChain.nativeSymbol}
              </span>
            </div>
          )}
        </div>
      ) : (
        /* Review transaction */
        <div className="flex-1 flex flex-col items-center justify-center animate-fade-in space-y-6">
          <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mb-2">
            <Fingerprint className="w-10 h-10 text-emerald-400 animate-pulse" />
          </div>

          <div className="text-center">
            <p className="text-white/40 text-[10px] uppercase tracking-widest mb-2">
              Sending Exact
            </p>
            <h1 className="text-4xl font-black text-white">
              {amount}{" "}
              <span className="text-xl text-white/50">
                {currentChain.nativeSymbol}
              </span>
            </h1>

            <p className="text-white/30 text-xs mt-1 font-mono">
              ≈ $
              {tokenPrice > 0
                ? (Number(amount) * tokenPrice).toFixed(2)
                : "..."}
            </p>
          </div>

          <div className="w-full bg-white/[0.02] border border-white/5 p-4 rounded-2xl space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-white/40 text-[10px] uppercase tracking-widest">
                To Nexus
              </span>
              <span className="text-white text-xs font-mono">
                {to.slice(0, 8)}...{to.slice(-6)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-white/40 text-[10px] uppercase tracking-widest">
                Network Fee
              </span>
              <span className="text-white text-xs font-mono">
                ~$
                {tokenPrice > 0
                  ? feeInUsd > 0 && feeInUsd < 0.01
                    ? "<0.01"
                    : feeInUsd.toFixed(2)
                  : "..."}{" "}
                ({proMode ? gasTier : "Standard"})
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-emerald-400 text-[10px] uppercase tracking-widest font-bold">
                Security
              </span>
              <span className="text-emerald-400 text-xs font-mono font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Zeno Cleared
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Execute button */}
      <div className="mt-4 pt-4 border-t border-white/5">
        <button
          onClick={() =>
            step === "input" ? setStep("review") : handleExecute()
          }
          disabled={
            !to || !amount || aiStatus === "scanning" || step === "sending"
          }
          className={`w-full py-4 font-black rounded-2xl text-xs tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${
            step === "review"
              ? "bg-emerald-400 text-black hover:bg-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.3)]"
              : "bg-white text-black hover:bg-white/90"
          } disabled:opacity-20 disabled:cursor-not-allowed`}>
          {step === "sending"
            ? "BROADCASTING TO NETWORK..."
            : step === "review"
              ? "AUTHORIZE TRANSFER"
              : "REVIEW TRANSACTION"}
        </button>
      </div>
    </div>
  )
}
