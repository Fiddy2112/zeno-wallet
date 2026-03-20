import { Cpu, ShieldCheck } from "lucide-react"
import { useRef, useState } from "react"

interface TxData {
  amount: string
  to: string
  gas: string
  token?: string
}

interface AiAnalysis {
  riskScore: number
  warning: string
}

interface Props {
  txData: TxData
  aiAnalysis: AiAnalysis
  onConfirm: () => void
  onCancel: () => void
}

const TRACK_WIDTH = 296 // px — container minus padding
const THUMB_SIZE = 56 // px

export const ConfirmTxScreen: React.FC<Props> = ({
  txData,
  aiAnalysis,
  onConfirm,
  onCancel
}) => {
  const [progress, setProgress] = useState(0) // 0..1
  const [confirmed, setConfirmed] = useState(false)
  const isDragging = useRef(false)
  const startX = useRef(0)
  const trackRef = useRef<HTMLDivElement>(null)

  const maxSlide = TRACK_WIDTH - THUMB_SIZE - 8 // 8 = padding

  // Mouse events
  const onMouseDown = (e: React.MouseEvent) => {
    if (confirmed) return
    isDragging.current = true
    startX.current = e.clientX - progress * maxSlide
    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("mouseup", onMouseUp)
  }

  const onMouseMove = (e: MouseEvent) => {
    if (!isDragging.current) return
    const rawX = e.clientX - startX.current
    const clamped = Math.max(0, Math.min(rawX, maxSlide))
    setProgress(clamped / maxSlide)
    if (clamped / maxSlide >= 0.95) handleConfirm()
  }

  const onMouseUp = () => {
    if (!isDragging.current) return
    isDragging.current = false
    window.removeEventListener("mousemove", onMouseMove)
    window.removeEventListener("mouseup", onMouseUp)
    // Snap back if not confirmed
    if (!confirmed) setProgress(0)
  }

  // Touch events
  const onTouchStart = (e: React.TouchEvent) => {
    if (confirmed) return
    isDragging.current = true
    startX.current = e.touches[0].clientX - progress * maxSlide
  }

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return
    const rawX = e.touches[0].clientX - startX.current
    const clamped = Math.max(0, Math.min(rawX, maxSlide))
    setProgress(clamped / maxSlide)
    if (clamped / maxSlide >= 0.95) handleConfirm()
  }

  const onTouchEnd = () => {
    isDragging.current = false
    if (!confirmed) setProgress(0)
  }

  const handleConfirm = () => {
    if (confirmed) return
    isDragging.current = false
    window.removeEventListener("mousemove", onMouseMove)
    window.removeEventListener("mouseup", onMouseUp)
    setProgress(1)
    setConfirmed(true)
    setTimeout(onConfirm, 400)
  }

  const thumbLeft = progress * maxSlide + 4

  return (
    <div className="flex-1 flex flex-col p-6 bg-[#080808] animate-fade-in">
      <h2 className="text-white font-black italic text-xl mb-6 tracking-tighter uppercase">
        Confirm Transaction
      </h2>

      {/* AI analysis */}
      <div
        className={`p-4 rounded-2xl border mb-6 transition-all ${
          aiAnalysis.riskScore > 0.5
            ? "bg-red-500/10 border-red-500/20"
            : "bg-emerald-500/10 border-emerald-500/20"
        }`}>
        <div className="flex items-center gap-2 mb-2">
          <Cpu
            className={
              aiAnalysis.riskScore > 0.5 ? "text-red-400" : "text-emerald-400"
            }
            size={16}
          />
          <span className="text-[10px] font-black uppercase tracking-widest text-white/60">
            Zeno AI Analysis
          </span>
          <span
            className={`ml-auto text-[10px] font-black px-2 py-0.5 rounded-full ${
              aiAnalysis.riskScore > 0.5
                ? "bg-red-500/20 text-red-400"
                : "bg-emerald-500/20 text-emerald-400"
            }`}>
            Risk: {Math.round(aiAnalysis.riskScore * 100)}%
          </span>
        </div>
        <p className="text-white text-xs leading-relaxed font-medium">
          {aiAnalysis.warning}
        </p>
      </div>

      {/* Tx details */}
      <div className="glass rounded-2xl p-4 space-y-4 mb-auto">
        <div className="flex justify-between">
          <span className="text-white/30 text-[10px] uppercase">Sending</span>
          <span className="text-white font-mono font-bold text-sm">
            {txData.amount} {txData.token || "ETH"}
          </span>
        </div>
        <div className="flex justify-between items-start">
          <span className="text-white/30 text-[10px] uppercase">To</span>
          <span className="text-white font-mono text-[10px] text-right break-all w-2/3">
            {txData.to}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/30 text-[10px] uppercase">
            Network Fee
          </span>
          <span className="text-white/60 font-mono text-[10px]">
            {txData.gas} ETH
          </span>
        </div>
        <div className="flex justify-between border-t border-white/5 pt-3">
          <span className="text-white/30 text-[10px] uppercase">Security</span>
          <span className="text-emerald-400 text-[10px] font-bold flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Zeno Cleared
          </span>
        </div>
      </div>

      {/* Slide to confirm */}
      <div className="mt-6">
        <div
          ref={trackRef}
          className={`relative h-16 border rounded-2xl flex items-center overflow-hidden select-none transition-colors ${
            confirmed
              ? "bg-emerald-400/20 border-emerald-400/40"
              : "bg-white/5 border-white/10"
          }`}
          style={{ width: TRACK_WIDTH }}>
          {/* Fill track */}
          <div
            className="absolute inset-y-0 left-0 transition-none rounded-2xl"
            style={{
              width: `${4 + thumbLeft}px`,
              background: confirmed
                ? "rgba(52,211,153,0.25)"
                : `rgba(255,255,255,${progress * 0.08})`
            }}
          />

          {/* Label */}
          <span
            className="absolute inset-0 flex items-center justify-center text-[10px] font-black tracking-[0.2em] transition-opacity pointer-events-none"
            style={{
              opacity: confirmed ? 0 : Math.max(0, 1 - progress * 2.5),
              color: "rgba(255,255,255,0.3)"
            }}>
            {confirmed ? "" : "SLIDE TO EXECUTE"}
          </span>

          {confirmed && (
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black tracking-[0.2em] text-emerald-400 pointer-events-none">
              AUTHORIZED
            </span>
          )}

          {/* Thumb */}
          <div
            className={`absolute flex items-center justify-center rounded-xl transition-colors cursor-grab active:cursor-grabbing z-10 select-none ${
              confirmed ? "bg-emerald-400" : "bg-white"
            }`}
            style={{
              width: THUMB_SIZE,
              height: THUMB_SIZE,
              left: thumbLeft,
              transition: isDragging.current ? "none" : "left 0.3s ease"
            }}
            onMouseDown={onMouseDown}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}>
            <span
              className={`text-lg font-black ${confirmed ? "text-black" : "text-black"}`}>
              {confirmed ? "✓" : "→"}
            </span>
          </div>
        </div>
      </div>

      <button
        onClick={onCancel}
        disabled={confirmed}
        className="mt-4 text-white/20 text-[10px] uppercase font-bold tracking-widest hover:text-red-400 transition-colors disabled:pointer-events-none">
        Cancel Transaction
      </button>
    </div>
  )
}
