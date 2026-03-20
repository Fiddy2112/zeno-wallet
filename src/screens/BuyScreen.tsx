import {
  ArrowLeftIcon,
  ChevronRight,
  CreditCard,
  Globe,
  ShieldCheck,
  Zap
} from "lucide-react"
import React, { useEffect, useState } from "react"

import { SUPPORTED_CHAINS } from "~core/networks"
import { notify } from "~features/notifications"
import type { Screen } from "~types"

interface Props {
  setScreen: (s: Screen) => void
}

type Provider = "moonpay" | "vnpay"
type PayMethod = "card" | "bank" | "ewallet"

const TOKENS = [
  {
    symbol: "ETH",
    name: "Ethereum",
    logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
    coingeckoId: "ethereum"
  },
  {
    symbol: "BNB",
    name: "BNB",
    logo: "https://cryptologos.cc/logos/binance-coin-bnb-logo.png",
    coingeckoId: "binancecoin"
  },
  {
    symbol: "USDT",
    name: "Tether",
    logo: "https://cryptologos.cc/logos/tether-usdt-logo.png",
    coingeckoId: "tether"
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    logo: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png",
    coingeckoId: "usd-coin"
  },
  {
    symbol: "BTC",
    name: "Bitcoin",
    logo: "https://cryptologos.cc/logos/bitcoin-btc-logo.png",
    coingeckoId: "bitcoin"
  }
]

const FIAT_OPTIONS = [
  { value: "50", label: "$50" },
  { value: "100", label: "$100" },
  { value: "200", label: "$200" },
  { value: "500", label: "$500" }
]

const VND_OPTIONS = [
  { value: "500000", label: "500K" },
  { value: "1000000", label: "1M" },
  { value: "2000000", label: "2M" },
  { value: "5000000", label: "5M" }
]

// MoonPay supported pay methods
const MOONPAY_METHODS: {
  id: PayMethod
  label: string
  icon: React.ReactNode
  note: string
}[] = [
  {
    id: "card",
    label: "Credit / Debit Card",
    icon: <CreditCard className="w-4 h-4" />,
    note: "Visa, Mastercard"
  },
  {
    id: "bank",
    label: "Bank Transfer",
    icon: <Globe className="w-4 h-4" />,
    note: "SEPA, ACH, Wire"
  }
]

// VNPay methods
const VNPAY_METHODS: {
  id: PayMethod
  label: string
  icon: React.ReactNode
  note: string
}[] = [
  {
    id: "bank",
    label: "Ngân hàng nội địa",
    icon: <Globe className="w-4 h-4" />,
    note: "Vietcombank, BIDV, Techcombank..."
  },
  {
    id: "ewallet",
    label: "Ví điện tử",
    icon: <Zap className="w-4 h-4" />,
    note: "MoMo, ZaloPay, VNPay QR"
  }
]

export const BuyScreen: React.FC<Props> = ({ setScreen }) => {
  const [address, setAddress] = useState("")
  const [provider, setProvider] = useState<Provider>("moonpay")
  const [selectedToken, setSelectedToken] = useState(TOKENS[0])
  const [amount, setAmount] = useState("100")
  const [payMethod, setPayMethod] = useState<PayMethod>("card")
  const [prices, setPrices] = useState<Record<string, number>>({})
  const [showTokenDropdown, setShowTokenDropdown] = useState(false)
  const [step, setStep] = useState<"select" | "confirm">("select")

  const isVND = provider === "vnpay"
  const currency = isVND ? "VND" : "USD"
  const quickAmounts = isVND ? VND_OPTIONS : FIAT_OPTIONS
  const methods = isVND ? VNPAY_METHODS : MOONPAY_METHODS

  useEffect(() => {
    chrome.storage.local.get("zeno_address", (res) => {
      if (res.zeno_address) setAddress(res.zeno_address)
    })
  }, [])

  // Fetch token prices
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const ids = TOKENS.map((t) => t.coingeckoId).join(",")
        const res = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`
        )
        const data = await res.json()
        const map: Record<string, number> = {}
        TOKENS.forEach((t) => {
          map[t.symbol] = data[t.coingeckoId]?.usd || 0
        })
        setPrices(map)
      } catch {}
    }
    fetchPrices()
  }, [])

  // Estimate how much crypto user gets
  const amountNum = Number(amount.replace(/,/g, "")) || 0
  const usdAmount = isVND ? amountNum / 25000 : amountNum // rough VND→USD
  const tokenPrice = prices[selectedToken.symbol] || 0
  const estimatedCrypto =
    tokenPrice > 0
      ? ((usdAmount * 0.97) / tokenPrice).toFixed(6) // 3% fee estimate
      : "—"

  // Build MoonPay URL
  const buildMoonPayUrl = () => {
    const base = "https://buy.moonpay.com"
    const params = new URLSearchParams({
      apiKey: process.env.PLASMO_PUBLIC_MOONPAY_API_KEY || "pk_test_123",
      currencyCode: selectedToken.symbol.toLowerCase(),
      walletAddress: address,
      baseCurrencyAmount: String(amountNum),
      baseCurrencyCode: "usd",
      colorCode: "%2334d399" // emerald
    })
    return `${base}?${params}`
  }

  // Build VNPay URL (sandbox / real depending on env)
  const buildVNPayUrl = () => {
    // VNPay typically requires a backend to generate signed URL
    // For now we direct to a landing page or show QR
    const base =
      process.env.PLASMO_PUBLIC_VNPAY_URL ||
      "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"
    const params = new URLSearchParams({
      vnp_Amount: String(amountNum * 100), // VNPay requires x100
      vnp_CurrCode: "VND",
      vnp_TxnRef: `ZENO-${Date.now()}`,
      vnp_OrderInfo: `Buy ${selectedToken.symbol} - Zeno Wallet`,
      vnp_ReturnUrl: "https://zeno-wallet.vercel.app/buy/success"
    })
    return `${base}?${params}`
  }

  const handleProceed = () => {
    if (!amount || amountNum <= 0) {
      notify.error("Please enter an amount.", "dark", 2000)
      return
    }

    const minUsd = isVND ? 100000 : 20 // min 100k VND or $20
    if (isVND && amountNum < minUsd) {
      notify.error("Minimum amount is 100,000 VND.", "dark", 2000)
      return
    }
    if (!isVND && amountNum < 20) {
      notify.error("Minimum amount is $20.", "dark", 2000)
      return
    }

    setStep("confirm")
  }

  const handleOpenProvider = () => {
    const url = provider === "moonpay" ? buildMoonPayUrl() : buildVNPayUrl()
    // Open in new tab (extension context)
    chrome.tabs.create({ url })
    notify.success(
      provider === "moonpay"
        ? "Opening MoonPay in a new tab..."
        : "Opening VNPay in a new tab...",
      "dark",
      2000
    )
    setScreen("dashboard")
  }

  const formatAmount = (val: string) => {
    const num = val.replace(/\D/g, "")
    if (isVND) return Number(num).toLocaleString("vi-VN")
    return num
  }

  return (
    <div className="flex-1 flex flex-col p-4 animate-fade-up h-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5 flex-shrink-0">
        <button
          onClick={() =>
            step === "confirm" ? setStep("select") : setScreen("dashboard")
          }
          className="w-8 h-8 glass rounded-xl flex items-center justify-center text-white/50 hover:text-white transition-colors">
          <ArrowLeftIcon className="w-4 h-4" />
        </button>
        <h2 className="text-lg font-black text-white uppercase tracking-wider">
          {step === "confirm" ? "Review Order" : "Buy Crypto"}
        </h2>
      </div>

      {step === "select" ? (
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pb-2">
          {/* Provider toggle */}
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-1 flex gap-1">
            {(["moonpay", "vnpay"] as Provider[]).map((p) => (
              <button
                key={p}
                onClick={() => {
                  setProvider(p)
                  setPayMethod(p === "moonpay" ? "card" : "bank")
                  setAmount(p === "moonpay" ? "100" : "1000000")
                }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  provider === p
                    ? "bg-white text-black"
                    : "text-white/40 hover:text-white/70"
                }`}>
                {p === "moonpay" ? "MoonPay (USD)" : "VNPay (VNĐ)"}
              </button>
            ))}
          </div>

          {/* Token selector */}
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
            <label className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-3 block">
              Token to buy
            </label>
            <div className="relative">
              <button
                onClick={() => setShowTokenDropdown(!showTokenDropdown)}
                className="w-full flex items-center justify-between bg-black/40 border border-white/10 hover:border-white/25 px-4 py-3 rounded-xl transition-all">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedToken.logo}
                    alt={selectedToken.symbol}
                    className="w-7 h-7 rounded-full"
                  />
                  <div className="text-left">
                    <p className="text-white text-sm font-bold">
                      {selectedToken.symbol}
                    </p>
                    <p className="text-white/30 text-[10px]">
                      {selectedToken.name}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white/40 text-xs font-mono">
                    {tokenPrice > 0 ? `$${tokenPrice.toLocaleString()}` : "..."}
                  </p>
                  <ChevronRight
                    className={`w-4 h-4 text-white/30 transition-transform ${showTokenDropdown ? "rotate-90" : ""}`}
                  />
                </div>
              </button>

              {showTokenDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowTokenDropdown(false)}
                  />
                  <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a1a] border border-white/10 rounded-2xl z-20 overflow-hidden py-1 shadow-[0_8px_30px_rgba(0,0,0,0.6)]">
                    {TOKENS.map((t) => (
                      <button
                        key={t.symbol}
                        onClick={() => {
                          setSelectedToken(t)
                          setShowTokenDropdown(false)
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                          selectedToken.symbol === t.symbol
                            ? "bg-emerald-400/10 text-emerald-400"
                            : "text-white/60 hover:bg-white/5 hover:text-white"
                        }`}>
                        <img
                          src={t.logo}
                          alt={t.symbol}
                          className="w-6 h-6 rounded-full"
                        />
                        <div className="flex-1 text-left">
                          <p className="text-xs font-bold">{t.symbol}</p>
                          <p className="text-[10px] opacity-50">{t.name}</p>
                        </div>
                        <span className="text-[10px] font-mono text-white/30">
                          {prices[t.symbol]
                            ? `$${prices[t.symbol].toLocaleString()}`
                            : ""}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Amount */}
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
            <label className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-3 block">
              Amount ({currency})
            </label>

            {/* Quick amounts */}
            <div className="flex gap-2 mb-3">
              {quickAmounts.map((q) => (
                <button
                  key={q.value}
                  onClick={() => setAmount(q.value)}
                  className={`flex-1 py-2 rounded-xl text-[10px] font-bold transition-all ${
                    amount === q.value
                      ? "bg-white text-black"
                      : "border border-white/10 text-white/40 hover:border-white/25 hover:text-white/70"
                  }`}>
                  {q.label}
                </button>
              ))}
            </div>

            {/* Custom input */}
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-sm font-mono">
                {isVND ? "₫" : "$"}
              </span>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
                placeholder="0"
                type="number"
                className="w-full bg-black/40 border border-white/10 focus:border-white/30 text-white pl-8 pr-4 py-3 rounded-xl outline-none text-sm font-mono transition-all"
              />
            </div>

            {/* Estimate */}
            {estimatedCrypto !== "—" && amountNum > 0 && (
              <div className="flex justify-between items-center mt-3 px-1">
                <span className="text-white/30 text-[10px]">
                  You receive approx.
                </span>
                <span className="text-emerald-400 text-xs font-bold font-mono">
                  ~{estimatedCrypto} {selectedToken.symbol}
                </span>
              </div>
            )}
          </div>

          {/* Payment method */}
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
            <label className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-3 block">
              Payment method
            </label>
            <div className="space-y-2">
              {methods.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setPayMethod(m.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    payMethod === m.id
                      ? "border-emerald-400/40 bg-emerald-400/5"
                      : "border-white/5 hover:border-white/15 hover:bg-white/[0.02]"
                  }`}>
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      payMethod === m.id
                        ? "bg-emerald-400/20 text-emerald-400"
                        : "bg-white/5 text-white/40"
                    }`}>
                    {m.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <p
                      className={`text-xs font-bold ${payMethod === m.id ? "text-white" : "text-white/60"}`}>
                      {m.label}
                    </p>
                    <p className="text-white/30 text-[10px]">{m.note}</p>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all ${
                      payMethod === m.id
                        ? "border-emerald-400 bg-emerald-400"
                        : "border-white/20"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="flex items-start gap-2.5 px-1">
            <ShieldCheck className="w-3.5 h-3.5 text-white/25 flex-shrink-0 mt-0.5" />
            <p className="text-white/25 text-[10px] leading-relaxed">
              {provider === "moonpay"
                ? "You will be redirected to MoonPay — a regulated fiat-to-crypto gateway. Zeno does not store payment info."
                : "Bạn sẽ được chuyển sang cổng VNPay. Zeno không lưu thông tin thanh toán của bạn."}
            </p>
          </div>
        </div>
      ) : (
        /* Confirm step */
        <div className="flex-1 flex flex-col animate-fade-in">
          <div className="flex-1 space-y-3">
            {/* Order summary card */}
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5">
              <div className="flex items-center gap-4 mb-5">
                <img
                  src={selectedToken.logo}
                  alt={selectedToken.symbol}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <p className="text-white/40 text-[10px] uppercase tracking-widest mb-1">
                    Buying
                  </p>
                  <p className="text-2xl font-black text-white">
                    ~{estimatedCrypto}
                  </p>
                  <p className="text-white/40 text-xs">{selectedToken.name}</p>
                </div>
              </div>

              <div className="space-y-3 border-t border-white/5 pt-4">
                <div className="flex justify-between">
                  <span className="text-white/40 text-[10px] uppercase tracking-widest">
                    You pay
                  </span>
                  <span className="text-white text-xs font-mono font-bold">
                    {isVND
                      ? `₫${Number(amount).toLocaleString("vi-VN")}`
                      : `$${amount}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40 text-[10px] uppercase tracking-widest">
                    Provider
                  </span>
                  <span className="text-white text-xs font-bold">
                    {provider === "moonpay" ? "MoonPay" : "VNPay"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40 text-[10px] uppercase tracking-widest">
                    Payment
                  </span>
                  <span className="text-white text-xs">
                    {methods.find((m) => m.id === payMethod)?.label}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40 text-[10px] uppercase tracking-widest">
                    Receive to
                  </span>
                  <span className="text-white/60 text-[10px] font-mono">
                    {address
                      ? `${address.slice(0, 8)}...${address.slice(-6)}`
                      : "—"}
                  </span>
                </div>
                <div className="flex justify-between border-t border-white/5 pt-3">
                  <span className="text-white/40 text-[10px] uppercase tracking-widest">
                    Est. fee
                  </span>
                  <span className="text-white/50 text-xs font-mono">~3%</span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5 px-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400/50 flex-shrink-0 mt-0.5" />
              <p className="text-white/25 text-[10px] leading-relaxed">
                {provider === "moonpay"
                  ? "MoonPay is a licensed money services business. Final rate may vary."
                  : "Tỷ giá cuối cùng sẽ được xác nhận trên trang VNPay."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Bottom button */}
      <div className="mt-4 pt-4 border-t border-white/5 flex-shrink-0">
        <button
          onClick={step === "select" ? handleProceed : handleOpenProvider}
          disabled={!amount || amountNum <= 0}
          className="w-full py-4 bg-emerald-400 text-black font-black rounded-2xl text-xs tracking-[0.2em] hover:bg-emerald-300 active:scale-[0.98] transition-all disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center gap-2">
          {step === "select"
            ? `CONTINUE WITH ${provider === "moonpay" ? "MOONPAY" : "VNPAY"}`
            : `OPEN ${provider === "moonpay" ? "MOONPAY" : "VNPAY"} →`}
        </button>
      </div>
    </div>
  )
}
