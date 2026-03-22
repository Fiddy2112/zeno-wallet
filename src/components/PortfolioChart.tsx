import { useEffect, useRef, useState } from "react"

interface Snapshot {
    t: number    // timestamp ms
    v: number    // total USD value
}

type Range = "1D" | "7D" | "1M"

const RANGE_LABELS: Range[] = ["1D", "7D", "1M"]

const RANGE_MS:Record<Range, number> = {
    "1D": 24 * 60 * 60 * 1000,
    "7D": 7 * 24 * 60 * 60 * 1000,
    "1M": 30 * 24 * 60 * 60 * 1000,
}

const SNAPSHOT_KEY = "zeno_portfilio_snapshots"
const MAX_SNAPSHOTS = 720

export async function savePortfolioSnapshot(address: string, totalUsd: number) {
    if(totalUsd <= 0) return
    const key = `${SNAPSHOT_KEY}_${address.toLowerCase().slice(0,10)}`

    const res = await chrome.storage.local.get(key)
    const exitsting: Snapshot[] = res[key] || []

    const now = Date.now()

    const last = exitsting[exitsting.length - 1]
    if(last && now - last.t < 10 * 60 * 1000){
        exitsting[exitsting.length - 1] = {t: now, v: totalUsd}
    }else{
        exitsting.push({t: now, v: totalUsd})
    }

    const trimmed = exitsting.slice(-MAX_SNAPSHOTS)
    await chrome.storage.local.set({[key]: trimmed})
}

export async function loadPortfolioSnapshots(address:string):Promise<Snapshot[]>{
    const key = `${SNAPSHOT_KEY}_${address.toLowerCase().slice(0, 10)}`
    const res = await chrome.storage.local.get(key)
    return res[key] || []
}

// chart

interface Props {
    address:string
    currentValue: number
}

export const PortfolioChart: React.FC<Props> = ({address, currentValue})=>{
    const [snapshots, setSnapshots] = useState<Snapshot[]>([])
    const [range, setRange] = useState<Range>("7D")
    const [hover, setHover] = useState<Snapshot | null>(null)
    const svgRef = useRef<SVGSVGElement>(null)

    useEffect(()=>{
        loadPortfolioSnapshots(address).then(setSnapshots)
    },[address, currentValue])

    const cutoff = Date.now() - RANGE_MS[range]
    const filtered = snapshots.filter((s)=> s.t >= cutoff)

    const points:Snapshot[] = filtered.length > 0 ? [...filtered, {t: Date.now(), v: currentValue}] : currentValue > 0 ? [{t: Date.now() - RANGE_MS[range], v: currentValue}, {
        t: Date.now(), v: currentValue
    }] : []

    const values = points.map((p)=> p.v)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const range_ = max - min || max * 0.1 || 1
    const firstVal = points[0]?.v || 0
    const lastVal = points[points.length - 1]?.v || currentValue
    const change = firstVal > 0 ? ((lastVal - firstVal) / firstVal) * 100 : 0
    const positive = change >= 0

    // colors
    const color = positive ? "#34d399" : "#f87171"
    const W = 320, H = 80, PAD = 4

    const toX = (i: number) => PAD + (i / Math.max(points.length - 1, 1)) * (W - PAD * 2)
    const toY = (v: number) => PAD + (1 - (v - min) / range_) * (H - PAD * 8)

    const linePath = points.map((p, i) =>
        `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(p.v).toFixed(1)}`
    ).join(" ")

    const areaPath = points.length > 0
    ? `${linePath} L${toX(points.length - 1)},${H} L${toX(0)},${H} Z`
    : ""

    const  handleMouseMove = (e:React.MouseEvent<SVGSVGElement>)=>{
        if(!svgRef.current || points.length === 0)return
        
        const rect = svgRef.current.getBoundingClientRect()
        const xRel = (e.clientX - rect.left) / rect.width
        const idx = Math.round(xRel * (points.length - 1))
        const clamped = Math.max(0, Math.min(points.length - 1, idx))
        setHover(points[clamped])
    }

    const displayValue = hover ? hover.v : currentValue
    const displayChange = hover && firstVal > 0 ? ((hover.v - firstVal) / firstVal) * 100 : change

    const formatDate = (t:number)=>{
        const d = new Date(t)
        if(range === "1D") return d.toLocaleTimeString("en-US", {
            hour: "2-digit", minute: "2-digit"
        })
        return d.toLocaleDateString("en-US", {
            month: "short",
            day:"numeric"
        })
    }

    return (
    <div className="px-4 pb-2">
      {/* Hover value or default */}
      <div className="flex items-center justify-between mb-2">
        <div>
          {hover && (
            <p className="text-white/40 text-[10px] font-mono">{formatDate(hover.t)}</p>
          )}
          <p className={`text-sm font-bold font-mono ${displayChange >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {displayChange >= 0 ? "+" : ""}{displayChange.toFixed(2)}%
            <span className="text-white/30 text-[10px] ml-1.5">
              {displayChange >= 0 ? "+" : "-"}${Math.abs(displayValue - firstVal).toFixed(2)}
            </span>
          </p>
        </div>
 
        {/* Range tabs */}
        <div className="flex gap-0.5 bg-white/[0.04] p-0.5 rounded-lg">
          {RANGE_LABELS.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                range === r ? "bg-white/15 text-white" : "text-white/30 hover:text-white/60"
              }`}>
              {r}
            </button>
          ))}
        </div>
      </div>
 
      {/* SVG chart */}
      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          style={{ height: 80 }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHover(null)}>
          <defs>
            <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.25" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
 
          {points.length > 1 && (
            <>
              <path d={areaPath} fill="url(#pg)" />
              <path d={linePath} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </>
          )}
 
          {/* Hover indicator */}
          {hover && points.length > 0 && (() => {
            const idx = points.indexOf(hover)
            if (idx === -1) return null
            const x = toX(idx)
            const y = toY(hover.v)
            return (
              <>
                <line x1={x} y1={0} x2={x} y2={H} stroke="white" strokeOpacity="0.1" strokeWidth="1" strokeDasharray="2 2" />
                <circle cx={x} cy={y} r="3.5" fill={color} />
                <circle cx={x} cy={y} r="6" fill={color} fillOpacity="0.2" />
              </>
            )
          })()}
        </svg>
 
        {/* Not enough data message */}
        {points.length < 3 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-white/15 text-[10px]">
              {snapshots.length === 0
                ? "Chart builds as you use Zeno"
                : "Not enough data for this range"}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}