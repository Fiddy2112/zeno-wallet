import { TrendingDown, TrendingUp, X } from "lucide-react"
import React, { useEffect, useRef, useState } from "react"

import type { Token } from "~types"

interface Props {
  token: Token
  coingeckoId?: string
  chainId?: string
}

interface PricePoint { t: number; p: number }

const COINGECKO_ID_MAP: Record<string, string> = {
  ETH: "ethereum", BTC: "bitcoin", BNB: "binancecoin",
  MATIC: "matic-network", ARB: "arbitrum", OP: "optimism",
  USDT: "tether", USDC: "usd-coin", DAI: "dai",
  UNI: "uniswap", LINK: "chainlink", AAVE: "aave",
  SOL: "solana", AVAX: "avalanche-2",
}

async function fetchChart(symbol: string, coingeckoId?: string):Promise<PricePoint[]>{
  const id = coingeckoId || COINGECKO_ID_MAP[symbol?.toUpperCase()]
  if(!id) return []
  try{
    const res = await fetch(`https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=7&interval=daily`)
    const data = await res.json()
    return (data.prices || []).map(([t, p]: [number, number]) => ({t, p}))
  }catch(error){
    return []
  }

}

// Mini sparkline
const Sparkline: React.FC<{points: PricePoint[]; positive: boolean}> = ({points, positive})=>{
  if(points.length < 2 ) return null
  const prices = points.map((p)=>p.p)
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const range = max - min || 1
  const w = 48, h = 20

  const coords = prices.map((p, i) => {
    const x = (i / (prices.length - 1)) * w
    const y = h - ((p - min) / range) * h
    return `${x},${y}`
  }).join(" ")

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="flex-shrink-0">
      <polyline
        points={coords}
        fill="none"
        stroke={positive ? "#34d399" : "#f87171"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const PriceChart:React.FC<{points: PricePoint[]; positive: boolean}> = ({ points, positive })=>{
  const svgRef = useRef<SVGSVGElement>(null)
  const [hover,setHover]=useState<{x:number; y:number; price:number; date:string}>(null)

  if(points.length < 2) return(
    <div className="h-32 flex items-center justify-center text-white/20 text-xs">
      No price data available
    </div>
  )

  const prices = points.map((p)=> p.p)
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const range = max - min || 1
  const w = 320, h = 100
  const pad = 4

  const toCoord = (p:number, i:number)=>({
    x: pad + (i / (prices.length - 1)) * (w - pad * 2),
    y: pad + (1 - (p - min) / range) * (h - pad * 2)
  })

  const pathPoints = prices.map((p, i)=> {
    const {x, y} = toCoord(p, i)
    return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`
  }).join(" ")

  // Area fill
  const firstPt = toCoord(prices[0], 0)
  const lastPt = toCoord(prices[prices.length - 1], prices.length - 1)
  const areaPath = `${pathPoints} L${lastPt.x},${h} L${firstPt.x},${h} Z`

  // color
  const color = positive ? "#34d399" : "#f87171"
  const gradId = `grad_${positive ? "g" : "r"}`

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) =>{
    if(!svgRef.current) return
    
    const rect = svgRef.current.getBoundingClientRect()
    const xRel = (e.clientX - rect.left) / rect.width
    const idx = Math.round(xRel * (points.length - 1))
    const clamped = Math.max(0, Math.min(points.length - 1, idx))
    const pt = toCoord(prices[clamped], clamped)
    setHover({
      x: pt.x,
      y: pt.y,
      price: prices[clamped],
      date: new Date(points[clamped].t).toLocaleDateString("en-US", {month: "short", day: "numeric"})
    })

  }

  return (
    <div className="relative">
      {/* Hover tooltip */}
      {hover && (
        <div
          className="absolute -top-8 bg-[#1a1a1a] border border-white/10 px-2 py-1 rounded-lg text-[10px] font-mono text-white pointer-events-none z-10 whitespace-nowrap"
          style={{ left: `${(hover.x / w) * 100}%`, transform: "translateX(-50%)" }}>
          ${hover.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} · {hover.date}
        </div>
      )}
 
      <svg
        ref={svgRef}
        viewBox={`0 0 ${w} ${h}`}
        className="w-full"
        style={{ height: 100 }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHover(null)}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
 
        {/* Area */}
        <path d={areaPath} fill={`url(#${gradId})`} />
 
        {/* Line */}
        <path d={pathPoints} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
 
        {/* Hover dot */}
        {hover && (
          <>
            <line x1={hover.x} y1={0} x2={hover.x} y2={h} stroke="white" strokeOpacity="0.1" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx={hover.x} cy={hover.y} r="4" fill={color} />
            <circle cx={hover.x} cy={hover.y} r="7" fill={color} fillOpacity="0.2" />
          </>
        )}
      </svg>
 
      {/* X axis labels */}
      <div className="flex justify-between mt-1 px-1">
        {points.filter((_, i) => i % Math.floor(points.length / 4) === 0 || i === points.length - 1).slice(0, 5).map((pt, i) => (
          <span key={i} className="text-[9px] text-white/20 font-mono">
            {new Date(pt.t).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        ))}
      </div>
    </div>
  )
}

// Token Detail Sheet

interface SheetProps {
  token: Token
  coingeckoId?: string
  onClose: () => void
}

const TokenDetailSheet: React.FC<SheetProps> = ({ token, coingeckoId, onClose })=>{
  const [chartData, setChartData] = useState<PricePoint[]>([])
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState<7 | 30 | 90>(7)
  const positive = token.change >= 0

  useEffect(()=>{
    setLoading(true)
    fetchChart(token.symbol, coingeckoId).then((data) => {
      setChartData(data)
      setLoading(false)
    })
  },[token.symbol, coingeckoId, range])

  const priceChange = chartData.length >=2 ? ((chartData[chartData.length - 1].p - chartData[0].p) / chartData[0].p) * 100
    : token.change

  const currentPrice = chartData.length > 0 ? chartData[chartData.length - 1].p
    : null

  const high7d = chartData.length > 0 ? Math.max(...chartData.map((p) => p.p)) : null
  const low7d  = chartData.length > 0 ? Math.min(...chartData.map((p) => p.p)) : null

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
 
      <div className="relative bg-[#111] border-t border-white/10 rounded-t-3xl animate-fade-up flex flex-col" style={{ maxHeight: "85%" }}>
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mt-3 flex-shrink-0" />
 
        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-4 pb-3 flex-shrink-0">
          <img src={token.img} alt={token.symbol} className="w-10 h-10 rounded-full bg-black/50" />
          <div className="flex-1 min-w-0">
            <p className="text-white font-black text-base">{token.symbol}</p>
            <p className="text-white/30 text-xs">{token.name}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all">
            <X className="w-3.5 h-3.5 text-white/60" />
          </button>
        </div>
 
        {/* Price + change */}
        <div className="px-5 pb-4 flex-shrink-0">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-white/30 text-[10px] uppercase tracking-widest mb-0.5">Current Price</p>
              <p className="text-3xl font-black text-white font-mono">
                {currentPrice
                  ? `$${currentPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: currentPrice < 1 ? 6 : 2 })}`
                  : token.usd}
              </p>
            </div>
            <div className={`flex items-center gap-1 px-3 py-1.5 rounded-xl ${priceChange >= 0 ? "bg-emerald-400/10" : "bg-red-400/10"}`}>
              {priceChange >= 0
                ? <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                : <TrendingDown className="w-3.5 h-3.5 text-red-400" />}
              <span className={`text-sm font-black ${priceChange >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {priceChange >= 0 ? "+" : ""}{priceChange.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
 
        {/* Chart */}
        <div className="flex-1 overflow-y-auto px-5 pb-5 custom-scrollbar">
          <div className="mb-4">
            {loading ? (
              <div className="h-28 flex items-center justify-center">
                <div className="flex gap-1">
                  {[1,2,3,4].map((i) => (
                    <div key={i} className="w-1 bg-white/20 rounded-full animate-pulse" style={{ height: 20 + i * 8, animationDelay: `${i * 0.1}s` }} />
                  ))}
                </div>
              </div>
            ) : (
              <PriceChart points={chartData} positive={priceChange >= 0} />
            )}
          </div>
 
          {/* 7d stats */}
          {!loading && chartData.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { label: "7d High", value: high7d ? `$${high7d.toLocaleString("en-US", { maximumFractionDigits: 2 })}` : "—" },
                { label: "7d Low",  value: low7d  ? `$${low7d.toLocaleString("en-US",  { maximumFractionDigits: 2 })}` : "—" },
                { label: "7d Change", value: `${priceChange >= 0 ? "+" : ""}${priceChange.toFixed(2)}%` },
              ].map((stat) => (
                <div key={stat.label} className="bg-white/[0.03] border border-white/5 rounded-xl p-3 text-center">
                  <p className="text-white/30 text-[9px] uppercase tracking-widest mb-1">{stat.label}</p>
                  <p className="text-white text-xs font-bold font-mono">{stat.value}</p>
                </div>
              ))}
            </div>
          )}
 
          {/* Your holdings */}
          <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 space-y-3">
            <p className="text-white/30 text-[10px] uppercase tracking-widest">Your Holdings</p>
            <div className="flex justify-between items-center">
              <span className="text-white/50 text-xs">Balance</span>
              <span className="text-white text-xs font-bold font-mono">{token.balance} {token.symbol}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/50 text-xs">Value</span>
              <span className="text-white text-xs font-bold font-mono">{token.usd}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export const TokenCard: React.FC<Props> = ({ token,coingeckoId }) => {
  const [showSheet, setShowSheet] = useState(false)
  const [sparkData, setSparkData] = useState<PricePoint[]>([])
  const positive = token.change >= 0

  useEffect(() => {
    const id = coingeckoId || COINGECKO_ID_MAP[token.symbol?.toUpperCase()]
    if (!id) return
    fetchChart(token.symbol, id).then(setSparkData)
  }, [token.symbol, coingeckoId])


  return (
    <>
      {showSheet && (
        <TokenDetailSheet
          token={token}
          coingeckoId={coingeckoId}
          onClose={() => setShowSheet(false)}
        />
      )}
 
      <div
        onClick={() => setShowSheet(true)}
        className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/[0.03] transition-all duration-200 group cursor-pointer active:scale-[0.98]">
 
        {/* Logo */}
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: token.color + "22" }}>
          <img src={token.img} alt={token.name} className="w-full h-full object-contain rounded-full" />
        </div>
 
        {/* Name + balance */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-white">{token.name}</span>
            <span className="text-sm font-semibold text-white">{token.usd}</span>
          </div>
          <div className="flex items-center justify-between mt-0.5">
            <span className="text-xs text-white/40 truncate max-w-[100px]">
              {token.balance} {token.symbol}
            </span>
            <div className="flex items-center gap-2">
              {/* Sparkline */}
              {sparkData.length > 1 && (
                <Sparkline points={sparkData} positive={positive} />
              )}
              <span className={`text-xs font-medium flex-shrink-0 ${positive ? "text-emerald-400" : "text-red-400"}`}>
                {token.usd === "—" ? "—" : `${positive ? "+" : ""}${token.change.toFixed(2)}%`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
