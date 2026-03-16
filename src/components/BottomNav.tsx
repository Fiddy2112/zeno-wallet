import { ArrowDown, ArrowUp, Bot, LayoutGrid, Settings2 } from "lucide-react"
import React from "react"

import type { Screen, Tab } from "~types"

interface Props {
  active: Tab
  setScreen: (s: Screen) => void
}

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "dashboard", label: "Home", icon: <LayoutGrid className="w-4 h-4" /> },
  { id: "send", label: "Send", icon: <ArrowUp className="w-4 h-4" /> },
  { id: "receive", label: "Receive", icon: <ArrowDown className="w-4 h-4" /> },
  { id: "ai", label: "AI", icon: <Bot className="w-4 h-4" /> },
  { id: "settings", label: "More", icon: <Settings2 className="w-4 h-4" /> }
]

export const BottomNav: React.FC<Props> = ({ active, setScreen }) => (
  <nav className="flex items-center justify-around border-t border-white/[0.06] bg-black/80 backdrop-blur-xl pt-2 pb-1">
    {tabs.map((t) => {
      const isActive = active === t.id
      return (
        <button
          key={t.id}
          id={
            t.id === "ai"
              ? "tour-nav-ai"
              : t.id === "settings"
                ? "tour-nav-settings"
                : undefined
          }
          onClick={() => setScreen(t.id)}
          className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-all duration-200 group">
          <span
            className={`text-lg leading-none transition-all duration-200 ${
              isActive
                ? "text-white"
                : "text-white/30 group-hover:text-white/60"
            }`}>
            {t.icon}
          </span>
          <span
            className={`text-[9px] font-medium tracking-widest uppercase transition-all duration-200 ${
              isActive
                ? "text-white"
                : "text-white/30 group-hover:text-white/60"
            }`}>
            {t.label}
          </span>
          {isActive && (
            <span className="w-4 h-px bg-white rounded-full mt-0.5" />
          )}
        </button>
      )
    })}
  </nav>
)
