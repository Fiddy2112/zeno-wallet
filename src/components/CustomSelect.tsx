import { Check, ChevronDown } from "lucide-react"
import { useEffect, useRef, useState } from "react"

export type SelectOption = {
  value: string
  label: string
  icon?: string
  sublabel?: string
}

interface Props {
  value: string
  onChange: (v: string) => void
  options: SelectOption[]
  placeholder?: string
}

export const CustomSelect: React.FC<Props> = ({
  value,
  onChange,
  options,
  placeholder = "Select..."
}) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const current = options.find((o) => o.value === value)

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-white/40 text-xs font-bold hover:text-white/70 transition-colors">
        {current?.icon && (
          <img
            src={current.icon}
            alt={current.label}
            className="w-3.5 h-3.5 rounded-full"
          />
        )}
        <span>{current?.label || placeholder}</span>
        <ChevronDown
          className={`w-3 h-3 text-white/25 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-[30]" onClick={() => setOpen(false)} />

          <div className="absolute top-full right-0 mt-2 min-w-[160px] bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.7)] z-[9999] custom-scrollbar overflow-hidden py-1 animate-fade-in">
            {options.map((opt) => {
              const isSelected = opt.value === value
              return (
                <button
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value)
                    setOpen(false)
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs transition-colors text-left ${
                    isSelected
                      ? "bg-white/[0.07] text-white"
                      : "text-white/50 hover:bg-white/[0.05] hover:text-white/80"
                  }`}>
                  {opt.icon && (
                    <img
                      src={opt.icon}
                      alt={opt.label}
                      className="w-5 h-5 rounded-full bg-black/50 flex-shrink-0"
                    />
                  )}
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-medium">{opt.label}</span>
                    {opt.sublabel && (
                      <span className="text-[9px] text-white/25 font-normal mt-0.5">
                        {opt.sublabel}
                      </span>
                    )}
                  </div>
                  {isSelected && (
                    <Check className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                  )}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
