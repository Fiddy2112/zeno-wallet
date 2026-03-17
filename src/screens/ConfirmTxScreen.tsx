import { Cpu } from "lucide-react"
import { useState } from "react"

export const ConfirmTxScreen = ({
  txData,
  aiAnalysis,
  onConfirm,
  onCancel
}) => {
  const [sliding, setSliding] = useState(false)
  return (
    <div className="flex-1 flex flex-col p-6 bg-[#080808] animate-fade-in">
      <h2 className="text-white font-black italic text-xl mb-6 tracking-tighter">
        CONFIRM TRANSACTION
      </h2>

      {/* AI BRAIN SECTION */}
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
        </div>
        <p className="text-white text-xs leading-relaxed font-medium">
          {aiAnalysis.warning}
        </p>
      </div>

      {/* TX DETAILS */}
      <div className="glass rounded-2xl p-4 space-y-4 mb-auto">
        <div className="flex justify-between">
          <span className="text-white/30 text-[10px] uppercase">Sending</span>
          <span className="text-white font-mono font-bold text-sm">
            {txData.amount} ETH
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
      </div>

      {/* SLIDE TO CONFIRM (Hành động cực "phê" cho ví) */}
      <div className="relative h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center p-1 overflow-hidden group">
        <div
          className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-transparent"
          style={{ width: sliding ? "100%" : "0%", transition: "width 0.1s" }}
        />
        <div
          draggable
          onDrag={(e) => {
            // Logic trượt để confirm
          }}
          className="w-14 h-14 bg-white rounded-xl flex items-center justify-center text-black cursor-grab active:cursor-grabbing z-10 transition-transform">
          →
        </div>
        <span className="flex-1 text-center text-[10px] font-black tracking-[0.2em] text-white/30 group-hover:text-white/60">
          SLIDE TO EXECUTE
        </span>
      </div>

      <button
        onClick={onCancel}
        className="mt-4 text-white/20 text-[10px] uppercase font-bold tracking-widest hover:text-red-400 transition-colors">
        Cancel Transaction
      </button>
    </div>
  )
}
