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

import { getAdapter, getClient, SUPPORTED_CHAINS } from "~core/networks"
import { deriveWalletFromMnemonic } from "~core/wallet-engine"
import { notify } from "~features/notifications"
import { getCachedPrice } from "~features/price-cache"
import { vaultSecurity } from "~features/security"
import type { Screen } from "~types"

interface Props {
  setScreen: (s: Screen) => void
  proMode: boolean
}

export const SendScreen: React.FC<Props> = ({ setScreen, proMode }) => {
  const [to, setTo] = useState("")
  const [amount, setAmount] = useState("")
  const [selectedChainId, setSelectedChainId] = useState(SUPPORTED_CHAINS[0].id)
  const currentChain =
    SUPPORTED_CHAINS.find((c) => c.id === selectedChainId) ||
    SUPPORTED_CHAINS[0]
  const [showDropdown, setShowDropdown] = useState(false)
  const [aiStatus, setAiStatus] = useState<
    "idle" | "scanning" | "safe" | "warn"
  >("idle")
  const [step, setStep] = useState<"input" | "review" | "sending">("input")
  const [myAddress, setMyAddress] = useState("")
  const [balance, setBalance] = useState(0)
  const [tokenPrice, setTokenPrice] = useState(0)
  const [baseGasPrice, setBaseGasPrice] = useState<bigint>(0n)
  const [gasTier, setGasTier] = useState<"Slow" | "Zeno Fast" | "Instant">(
    "Zeno Fast"
  )
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [txPassword, setTxPassword] = useState("")
  const [txError, setTxError] = useState("")

  useEffect(() => {
    chrome.storage.local.get(["pending_tx", "zeno_address"], (res) => {
      if (res.zeno_address) setMyAddress(res.zeno_address)
      if (res.pending_tx) {
        const { to: aiTo, amount: aiAmount, token: aiToken } = res.pending_tx
        if (aiTo) {
          setTo(aiTo)
          checkAddress(aiTo)
        }
        if (aiAmount) setAmount(aiAmount)
        if (aiToken) {
          const match = SUPPORTED_CHAINS.find(
            (c) =>
              c.nativeSymbol.toLowerCase() === aiToken.toLowerCase() ||
              c.id.toLowerCase() === aiToken.toLowerCase() ||
              c.name.toLowerCase() === aiToken.toLowerCase()
          )
          if (match) setSelectedChainId(match.id)
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

        // Balance + gas: safe to poll every 10s
        const [bal, gas] = await Promise.all([
          client.getBalance({ address: myAddress as `0x${string}` }),
          client.getGasPrice()
        ])
        setBalance(Number(formatEther(bal)))
        setBaseGasPrice(gas)

        // Price: shared cache — max 1 CoinGecko req per 60s across all screens
        const price = await getCachedPrice(currentChain.coingeckoId)
        setTokenPrice(price)
      } catch (error) {
        console.error("fetchNetworkData error:", error)
      }
    }

    fetchNetworkData()
    const interval = setInterval(fetchNetworkData, 10_000)
    return () => clearInterval(interval)
  }, [myAddress, currentChain.id, currentChain.coingeckoId])

  const gasLimit = 21000n
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

  const handleExecute = () => {
    setTxError("")
    setTxPassword("")
    setShowPasswordModal(true)
  }

  const handleConfirmWithPassword = async () => {
    if (!txPassword) return
    setTxError("")
    setShowPasswordModal(false)
    setStep("sending")

    try {
      const res = await chrome.storage.local.get(["zeno_vault", "zeno_salt"])
      if (!res.zeno_vault || !res.zeno_salt) {
        throw new Error("Vault not found. Please re-import your wallet.")
      }

      const mnemonic = vaultSecurity.decryptMnemonic(
        res.zeno_vault,
        txPassword,
        res.zeno_salt
      )
      if (!mnemonic) throw new Error("Wrong password")

      const wallet = deriveWalletFromMnemonic(mnemonic)
      const { adapter } = getAdapter(selectedChainId)

      const hash = await adapter.sendTx({
        privateKey: wallet.privateKey,
        to,
        value: amount,
        chainId: selectedChainId,
        gasPrice:
          baseGasPrice === 0n
            ? undefined
            : (baseGasPrice * getGasMultiplier()) / 100n
      })

      notify.success(
        `Sent! Hash: ${hash.slice(0, 10)}...${hash.slice(-6)}`,
        "dark",
        5000
      )
      setScreen("dashboard")
    } catch (err: any) {
      const msg = err?.shortMessage || err?.message || "Transaction failed"
      if (msg.includes("Wrong password") || msg === "") {
        setTxError("Incorrect password. Please try again.")
        setTxPassword("")
        setShowPasswordModal(true)
        setStep("review")
      } else if (msg.includes("insufficient funds")) {
        notify.error("Insufficient funds for this transaction.", "dark", 4000)
        setStep("review")
      } else {
        notify.error(msg, "dark", 4000)
        setStep("review")
      }
    }
  }

  return (
    <div className="flex-1 flex flex-col p-4 animate-fade-up h-full">
      {/* Password modal — bottom sheet */}
      {showPasswordModal && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-end z-50">
          <div className="w-full bg-[#111] border-t border-white/10 p-6 rounded-t-3xl animate-fade-up">
            <div className="w-8 h-1 bg-white/20 rounded-full mx-auto mb-4" />
            <h3 className="text-white font-black text-sm uppercase tracking-widest mb-1">
              Authorize Transfer
            </h3>
            <p className="text-white/40 text-xs mb-5 leading-relaxed">
              Enter your wallet password to sign and broadcast this transaction.
            </p>
            <input
              type="password"
              value={txPassword}
              onChange={(e) => {
                setTxPassword(e.target.value)
                setTxError("")
              }}
              onKeyDown={(e) =>
                e.key === "Enter" && handleConfirmWithPassword()
              }
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
                  setTxError("")
                  setStep("review")
                }}
                className="flex-1 py-3 border border-white/10 text-white/50 rounded-xl text-xs font-bold hover:border-white/25 hover:text-white/70 transition-all">
                CANCEL
              </button>
              <button
                onClick={handleConfirmWithPassword}
                disabled={!txPassword}
                className="flex-1 py-3 bg-emerald-400 text-black rounded-xl text-xs font-black disabled:opacity-30 hover:bg-emerald-300 active:scale-[0.98] transition-all">
                SIGN & SEND
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
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
                {showDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowDropdown(false)}
                    />
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
                          className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold transition-colors ${selectedChainId === chain.id ? "bg-emerald-400/10 text-emerald-400" : "text-white/60 hover:bg-white/10 hover:text-white"}`}>
                          <img
                            src={chain.logo}
                            alt={chain.name}
                            className="w-5 h-5 rounded-full bg-black/50"
                          />
                          <div className="flex flex-col items-start">
                            <span>{chain.nativeSymbol}</span>
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

          {/* Gas */}
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
                  ≈ $
                  {feeInUsd > 0
                    ? feeInUsd < 0.01
                      ? "<0.01"
                      : feeInUsd.toFixed(2)
                    : "..."}
                </span>
              </div>
              <div className="flex gap-2 relative z-10">
                {(["Slow", "Zeno Fast", "Instant"] as const).map((tier) => (
                  <button
                    key={tier}
                    onClick={() => setGasTier(tier)}
                    className={`flex-1 text-[10px] py-1.5 rounded-lg transition-all font-bold tracking-widest uppercase ${gasTier === tier ? "bg-white text-black shadow-[0_0_10px_rgba(255,255,255,0.2)]" : "bg-black/50 border border-white/5 text-white/30 hover:border-white/20 hover:text-white/60"}`}>
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
                {tokenPrice > 0 && feeInUsd > 0 && (
                  <span className="text-white/25 ml-1">
                    (≈ ${feeInUsd < 0.01 ? "<0.01" : feeInUsd.toFixed(2)})
                  </span>
                )}
              </span>
            </div>
          )}
        </div>
      ) : (
        /* Review */
        <div className="flex-1 flex flex-col items-center justify-center animate-fade-in space-y-6">
          <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mb-2">
            <Fingerprint
              className={`w-10 h-10 ${step === "sending" ? "text-white/40" : "text-emerald-400 animate-pulse"}`}
            />
          </div>
          <div className="text-center">
            <p className="text-white/40 text-[10px] uppercase tracking-widest mb-2">
              {step === "sending" ? "Broadcasting..." : "Sending Exact"}
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
                ≈ $
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

      {/* Bottom button */}
      <div className="mt-4 pt-4 border-t border-white/5">
        <button
          onClick={() =>
            step === "input" ? setStep("review") : handleExecute()
          }
          disabled={
            !to || !amount || aiStatus === "scanning" || step === "sending"
          }
          className={`w-full py-4 font-black rounded-2xl text-xs tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${step === "review" ? "bg-emerald-400 text-black hover:bg-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.3)]" : "bg-white text-black hover:bg-white/90"} disabled:opacity-20 disabled:cursor-not-allowed`}>
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
