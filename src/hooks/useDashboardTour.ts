import { driver } from "driver.js"

import "driver.js/dist/driver.css"

const TOUR_KEY = "zeno_tour_done"

export function useDashboardTour() {
  const startTour = () => {
    const driverObj = driver({
      showProgress: true,
      animate: true,
      overlayColor: "#000",
      overlayOpacity: 0.75,
      smoothScroll: true,
      allowClose: true,
      popoverClass: "zeno-tour-popover",
      progressText: "{{current}} / {{total}}",
      nextBtnText: "Next →",
      prevBtnText: "← Back",
      doneBtnText: "Got it ✓",
      steps: [
        {
          element: "#tour-logo",
          popover: {
            title: "Welcome to Zeno",
            description:
              "Zeno is your AI-powered Web3 wallet. Let's take a quick tour so you know exactly where everything is.",
            side: "bottom",
            align: "start"
          }
        },
        {
          element: "#tour-address",
          popover: {
            title: "Your Wallet Address",
            description:
              "This is your public address. Click it to copy — share it with anyone who wants to send you crypto.",
            side: "bottom",
            align: "start"
          }
        },
        {
          element: "#tour-network",
          popover: {
            title: "Network Selector",
            description:
              "You're on Ethereum Mainnet. Zeno supports multi-chain — switch networks at any time.",
            side: "bottom",
            align: "end"
          }
        },
        {
          element: "#tour-mode-toggle",
          popover: {
            title: "Lite / Pro Mode",
            description:
              "Switch between <strong>Lite Mode</strong> (simple, intent-based) and <strong>Pro Mode</strong> (advanced — MEV protection, AI risk scores, DeFi alpha).",
            side: "bottom",
            align: "end"
          }
        },
        {
          element: "#tour-balance",
          popover: {
            title: "Total Balance",
            description:
              "Your real-time portfolio value across all assets, with today's performance at a glance.",
            side: "bottom",
            align: "center"
          }
        },
        {
          element: "#tour-actions",
          popover: {
            title: "Quick Actions",
            description:
              "Send, Receive, Swap, or Buy crypto — all in one tap. Zeno's AI Guardian checks every transaction before you sign.",
            side: "top",
            align: "center"
          }
        },
        {
          element: "#tour-assets",
          popover: {
            title: "Your Assets",
            description:
              "All your tokens with live balances and price changes. More chains and tokens are added automatically.",
            side: "top",
            align: "start"
          }
        },
        {
          element: "#tour-nav-ai",
          popover: {
            title: "AI Guardian",
            description:
              "Chat with Zeno AI 24/7 — it monitors your wallet for threats, analyzes transactions, and surfaces DeFi opportunities.",
            side: "top",
            align: "center"
          }
        },
        {
          element: "#tour-nav-settings",
          popover: {
            title: "Settings",
            description:
              "Manage your account, security preferences, networks, and wallet mode from here.",
            side: "top",
            align: "end"
          }
        }
      ],
      onDestroyStarted: () => {
        chrome.storage.local.set({ [TOUR_KEY]: true })
        driverObj.destroy()
      }
    })

    driverObj.drive()
  }

  const shouldAutoStart = async () => {
    const res = await chrome.storage.local.get(TOUR_KEY)
    return !res[TOUR_KEY]
  }

  return { startTour, shouldAutoStart }
}
