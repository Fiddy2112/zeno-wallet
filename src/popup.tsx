import React, { useEffect, useState } from "react"

import "./style.css"

import { BottomNav } from "~components/BottomNav"
import { AIGuardianScreen } from "~screens/AIGuardianScreen"
import { DashboardScreen } from "~screens/DashboardScreen"
import { ImportWalletScreen } from "~screens/ImportWalletScreen"
import { ReceiveScreen } from "~screens/ReceiveScreen"
import { SeedPhraseScreen } from "~screens/SeedPhraseScreen"
import { SendScreen } from "~screens/SendScreen"
import { SettingsScreen } from "~screens/SettingsScreen"
import { SetupPasswordScreen } from "~screens/SetupPasswordScreen"
import { SwapScreen } from "~screens/SwapScreen"
import { WelcomeScreen } from "~screens/WelcomeScreen"

export type Screen =
  | "welcome"
  | "setup-pass"
  | "seed-phrase"
  | "import"
  | "dashboard"
  | "send"
  | "receive"
  | "swap"
  | "ai"
  | "settings"

const MAIN_SCREENS: Screen[] = [
  "dashboard",
  "send",
  "receive",
  "swap",
  "ai",
  "settings"
]
const BOTTOM_NAV_SCREENS: Screen[] = [
  "dashboard",
  "send",
  "receive",
  "ai",
  "settings"
]

function IndexPopup() {
  const [screen, setScreen] = useState<Screen>("welcome")
  const [proMode, setProMode] = useState(false)

  // Check onboarding state on mount
  useEffect(() => {
    const onboarded = localStorage.getItem("zeno_onboarded")
    if (onboarded === "true") {
      setScreen("dashboard")
    }
  }, [])

  const isMainApp = MAIN_SCREENS.includes(screen) || screen === "swap"
  const showNav = (BOTTOM_NAV_SCREENS as string[]).includes(screen as string)

  const activeTab = (
    ["dashboard", "send", "receive", "ai", "settings"].includes(screen)
      ? screen
      : "dashboard"
  ) as "dashboard" | "send" | "receive" | "ai" | "settings"

  const renderScreen = () => {
    switch (screen) {
      case "welcome":
        return <WelcomeScreen setScreen={setScreen} />
      case "setup-pass":
        return (
          <SetupPasswordScreen setScreen={setScreen} nextScreen="seed-phrase" />
        )
      case "seed-phrase":
        return <SeedPhraseScreen setScreen={setScreen} />
      case "import":
        return <ImportWalletScreen setScreen={setScreen} />
      case "dashboard":
        return (
          <DashboardScreen
            setScreen={setScreen}
            proMode={proMode}
            setProMode={setProMode}
          />
        )
      case "send":
        return <SendScreen setScreen={setScreen} />
      case "receive":
        return <ReceiveScreen setScreen={setScreen} />
      case "swap":
        return <SwapScreen setScreen={setScreen} />
      case "ai":
        return <AIGuardianScreen setScreen={setScreen} />
      case "settings":
        return (
          <SettingsScreen
            setScreen={setScreen}
            proMode={proMode}
            setProMode={setProMode}
          />
        )
      default:
        return <WelcomeScreen setScreen={setScreen} />
    }
  }

  return (
    <div
      style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
      className="w-[360px] h-[580px] bg-[#080808] text-white flex flex-col overflow-hidden relative">
      {/* Ambient background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -left-20 w-48 h-48 bg-white/[0.015] blur-[80px] rounded-full" />
        <div className="absolute bottom-20 right-0 w-40 h-40 bg-white/[0.01] blur-[60px] rounded-full" />
      </div>

      {/* Screen content */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10 min-h-0">
        {renderScreen()}
      </div>

      {/* Bottom navigation */}
      {showNav && (
        <div className="flex-shrink-0 z-20 relative">
          <BottomNav active={activeTab} setScreen={setScreen} />
        </div>
      )}
    </div>
  )
}

export default IndexPopup
