import React, { useEffect, useState } from "react"

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
import { UnlockScreen } from "~screens/UnlockScreen"
import { WelcomeScreen } from "~screens/WelcomeScreen"
import type { Screen, Tab } from "~types"

import "./src/style.css"

import { ToastContainer } from "react-toastify"

const MAIN_SCREENS: Screen[] = [
  "dashboard",
  "send",
  "receive",
  "swap",
  "ai",
  "settings",
  "unlock"
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
  const [password, setPassword] = useState("")
  const [flow, setFlow] = useState<"create" | "import">("create")
  const [importedPhrase, setImportedPhrase] = useState("")
  // unlock screen
  const [isUnlocked, setIsUnlocked] = useState(false)

  useEffect(() => {
    // Check if onboarding is complete
    const checkOnboarding = async () => {
      if (
        typeof chrome !== "undefined" &&
        chrome.storage &&
        chrome.storage.local
      ) {
        const res = await chrome.storage.local.get(["zeno_onboarded"])
        if (res.zeno_onboarded) {
          setScreen("unlock")
        } else {
          setScreen("welcome")
        }
      } else {
        const onboarded = localStorage.getItem("zeno_onboarded")
        if (onboarded === "true") {
          setScreen("unlock")
        } else {
          setScreen("welcome")
        }
      }
    }
    checkOnboarding()
  }, [])

  const isMainApp = MAIN_SCREENS.includes(screen)
  const showNav = (BOTTOM_NAV_SCREENS as string[]).includes(screen as string)

  const activeTab = (
    BOTTOM_NAV_SCREENS.includes(screen) ? screen : "dashboard"
  ) as Tab

  const renderScreen = () => {
    switch (screen) {
      case "welcome":
        return <WelcomeScreen setScreen={setScreen} />
      case "setup-pass":
        return (
          <SetupPasswordScreen
            setScreen={setScreen}
            setPassword={setPassword}
            importedPhrase={importedPhrase}
            nextScreen={flow === "import" ? "dashboard" : "seed-phrase"}
          />
        )
      case "seed-phrase":
        return (
          <SeedPhraseScreen
            setScreen={setScreen}
            userPassword={password}
            setPassword={setPassword}
          />
        )
      case "import":
        return (
          <ImportWalletScreen
            setScreen={setScreen}
            setFlow={setFlow}
            setImportedPhrase={setImportedPhrase}
          />
        )
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
      case "unlock":
        return <UnlockScreen setScreen={setScreen} />
      default:
        return <WelcomeScreen setScreen={setScreen} />
    }
  }

  return (
    <div
      style={{
        fontFamily: '"Inter", system-ui, sans-serif',
        width: "360px",
        height: "580px",
        backgroundColor: "#080808",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden"
      }}
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
      <ToastContainer />
    </div>
  )
}

export default IndexPopup
