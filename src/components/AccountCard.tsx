import { Copy, CopyCheck, Trash2 } from "lucide-react"
import { useRef, useState } from "react"

interface AccountCardProps {
  acc: {
    address: string
    name: string
    type?: string
    index?: number
  }
  activeAddress: string
  accountsLength: number
  copiedAddr: string | null
  onSelect: (addr: string) => void
  onCopy: (e: React.MouseEvent, addr: string) => void
  onRemove: (addr: string) => Promise<void>
}

const MAX_SWIPE = -96 // Delete button width (px)
const SWIPE_THRESHOLD = -40 // Swipe threshold (px)

export const AccountCard: React.FC<AccountCardProps> = ({
  acc,
  activeAddress,
  accountsLength,
  copiedAddr,
  onSelect,
  onCopy,
  onRemove
}) => {
  const [confirmDelete, setConfirmDelete] = useState(false)
  // tracking animation
  const [isSwiped, setIsSwiped] = useState(false)
  const [offset, setOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const startXRef = useRef<number | null>(null)
  const currentXRef = useRef<number>(0)

  const short = (a: string) => a.slice(0, 6) + "..." + a.slice(-4)

  const handleStart = (clientX: number) => {
    if (accountsLength <= 1) return
    startXRef.current = clientX
    setIsDragging(true)
  }

  const handleMove = (clientX: number) => {
    if (!isDragging || startXRef.current === null) return

    const detaX = clientX - startXRef.current
    const baseOffset = isSwiped ? MAX_SWIPE : 0
    let newOffset = baseOffset + detaX

    if (newOffset > 0) {
      newOffset = newOffset * 0.15
    } else if (newOffset < MAX_SWIPE) {
      newOffset = MAX_SWIPE + (newOffset - MAX_SWIPE) * 0.25
    }

    setOffset(newOffset)
    currentXRef.current = newOffset
  }

  const handleEnd = () => {
    if (!isDragging) return
    setIsDragging(false)
    startXRef.current = null

    if (Math.abs(offset - (isSwiped ? MAX_SWIPE : 0)) < 5) {
      if (isSwiped) {
        setOffset(0)
        setIsSwiped(false)
      } else {
        onSelect(acc.address)
      }
      return
    }

    if (offset < SWIPE_THRESHOLD) {
      setOffset(MAX_SWIPE)
      setIsSwiped(true)
    } else {
      setOffset(0)
      setIsSwiped(false)
    }
  }

  return (
    <div className="relative overflow-hidden rounded-2xl mb-3 group bg-red-600 select-none">
      <div className="absolute inset-y-0 right-0 w-24 flex items-center justify-center rounded-2xl">
        <button
          onClick={() => setConfirmDelete(true)}
          className="w-full h-full flex flex-col items-center justify-center text-white hover:bg-red-700 transition-colors active:scale-95">
          <Trash2 className="w-5 h-5 mb-1" />
          <span className="text-[9px] font-black tracking-widest uppercase">
            Delete
          </span>
        </button>
      </div>

      <div
        className={`relative z-10 p-4 border flex items-center gap-4 rounded-2xl select-none ${
          activeAddress === acc.address
            ? "bg-white border-white"
            : "bg-[#121212] border-white/10"
        }`}
        style={{
          transform: `translateX(${offset}px)`,
          // When not dragging
          transition: isDragging
            ? "none"
            : "transform 0.4s cubic-bezier(0.32, 0.72, 0, 1)"
        }}>
        {/* overlay */}
        <div
          className="absolute inset-0 z-10 cursor-pointer"
          onMouseDown={(e) => handleStart(e.clientX)}
          onMouseMove={(e) => handleMove(e.clientX)}
          onMouseUp={() => handleEnd()}
          onMouseLeave={() => handleEnd()}
          onTouchStart={(e) => handleStart(e.touches[0].clientX)}
          onTouchMove={(e) => handleMove(e.touches[0].clientX)}
          onTouchEnd={() => handleEnd()}
          onDragStart={(e) => e.preventDefault()}
        />
        {/* overplay delete */}
        {confirmDelete && (
          <div className="absolute inset-0 bg-red-500/95 backdrop-blur-md z-30 flex items-center justify-between px-4 animate-fade-in rounded-2xl">
            <span className="text-white font-bold text-xs uppercase tracking-widest">
              remove this account?
            </span>
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setConfirmDelete(false)
                  setOffset(0)
                  setIsSwiped(false)
                }}
                className="px-3 py-2 bg-black/20 hover:bg-black/40 text-white rounded-lg text-[10px] font-bold transition-colors">
                Cancel
              </button>
              <button
                onClick={async (e) => {
                  e.stopPropagation()
                  await onRemove(acc.address)
                  setConfirmDelete(false)
                  setOffset(0)
                  setIsSwiped(false)
                }}
                className="px-3 py-2 bg-white text-red-600 hover:bg-white/90 rounded-lg text-[10px] font-black transition-colors shadow-lg">
                Remove
              </button>
            </div>
          </div>
        )}

        {/* card content */}
        <div
          className={`relative z-0 pointer-events-none w-10 h-10 rounded-xl flex items-center justify-center font-black flex-shrink-0 ${
            activeAddress === acc.address
              ? "bg-black text-white"
              : "bg-white/10 text-white/30"
          }`}>
          {acc.type === "imported"
            ? "IMP"
            : acc.index !== undefined
              ? acc.index + 1
              : "?"}
        </div>

        <div className="relative z-20 flex-1 flex items-center justify-between min-w-0">
          <div className="flex items-start flex-col gap-1.5 flex-1 pointer-events-none truncate pr-2">
            <p
              className={`font-bold text-sm truncate w-full ${activeAddress === acc.address ? "text-black" : "text-white"}`}>
              {acc.name}
            </p>
            <p
              className={`text-[10px] font-mono truncate w-full ${activeAddress === acc.address ? "text-black/60" : "text-white/40"}`}>
              {acc.address ? short(acc.address) : "Loading..."}
            </p>
          </div>

          {/* copy button */}
          <button
            className={`relative z-20 flex items-center justify-center w-8 h-8 rounded-full transition-colors flex-shrink-0 ${
              activeAddress === acc.address
                ? "hover:bg-black/10"
                : "hover:bg-white/10"
            }`}
            onClick={(e) => {
              e.stopPropagation()
              onCopy(e, acc.address)
            }}>
            <span
              className={
                activeAddress === acc.address
                  ? "text-black/40"
                  : "text-white/40"
              }>
              {copiedAddr === acc.address ? (
                <CopyCheck
                  className={
                    activeAddress === acc.address
                      ? "w-4 h-4 text-black"
                      : "w-4 h-4 text-emerald-400"
                  }
                />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
