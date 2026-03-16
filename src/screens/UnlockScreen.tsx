import React, { useState } from "react"

import { notify } from "~features/notifications"
import { vaultSecurity } from "~features/security"
import type { Screen } from "~types"

interface Props {
  setScreen: (s: Screen) => void
}

export const UnlockScreen: React.FC<Props> = ({ setScreen }) => {
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  //   const handleUnlock = async () => {
  //     setLoading(true)

  //     try {
  //       let salt = ""
  //       let vault = ""

  //       if (
  //         typeof chrome !== "undefined" &&
  //         chrome.storage &&
  //         chrome.storage.local
  //       ) {
  //         const res = await chrome.storage.local.get(["zeno_salt", "zeno_vault"])
  //         salt = res.zeno_salt
  //         vault = res.zeno_vault
  //       } else {
  //         salt = localStorage.getItem("zeno_salt") || ""
  //         vault = localStorage.getItem("zeno_vault") || ""
  //       }

  //       const decrypted = vaultSecurity.decryptMnemonic(vault, password, salt)
  //       const wordCount = decrypted?.trim().split(/\s+/).length

  //       if (decrypted && (wordCount === 12 || wordCount === 24)) {
  //         notify.success("System Unlocked. Welcome back, Commander.")
  //         setScreen("dashboard")
  //       } else {
  //         notify.error("Invalid credentials. Access denied.")
  //       }
  //     } catch (e) {
  //       console.error("Unlock error:", e)
  //       notify.error("Decryption failed. Try again.")
  //     } finally {
  //       setLoading(false)
  //     }
  //   }

  const handleUnlock = async () => {
    setLoading(true)
    try {
      // Get value from storage
      const res = await chrome.storage.local.get(["zeno_vault", "zeno_salt"])

      if (!res.zeno_vault || !res.zeno_salt) {
        notify.error("Vault empty! Please reset wallet.")
        setScreen("welcome")
        return
      }

      // Try to decrypt
      const decrypted = vaultSecurity.decryptMnemonic(
        res.zeno_vault,
        password,
        res.zeno_salt
      )

      // Check result (if decryption fails, it will return an empty string or garbage)
      if (decrypted && decrypted.split(" ").length >= 12) {
        notify.success("Access Granted. Welcome back, Commander.")
        setScreen("dashboard")
      } else {
        notify.error("Invalid credentials. Access denied.")
      }
    } catch (error) {
      notify.error("Decryption failed. Try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    if (
      window.confirm(
        "Are you sure? This will delete your current wallet from this device!"
      )
    ) {
      chrome.storage.local.clear(() => {
        localStorage.clear()
        window.location.reload()
      })
    }
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 animate-fade-in bg-[#080808]">
      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center font-black text-black italic text-3xl mb-8 shadow-[0_0_30px_rgba(255,255,255,0.1)]">
        Z
      </div>

      <h2 className="text-xl font-bold text-white mb-2">Welcome to Zeno</h2>
      <p className="text-white/40 text-xs mb-8">
        Enter password to unlock your vault
      </p>

      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
        placeholder="Type your password..."
        className="w-full bg-white/[0.04] border border-white/10 focus:border-cyan-500/50 text-white px-4 py-3.5 rounded-xl outline-none text-center transition-all mb-4"
        autoFocus
      />

      <button
        onClick={handleUnlock}
        disabled={loading}
        className="w-full py-3.5 bg-white text-black font-bold rounded-xl text-sm tracking-widest hover:bg-cyan-400 transition-all active:scale-95">
        {loading ? "DECRYPTING..." : "UNLOCK"}
      </button>

      <button
        onClick={() => {
          if (
            confirm(
              "Are you sure? This will delete your current wallet from this device!"
            )
          ) {
            chrome.storage.local.clear()
            window.location.reload()
          }
        }}
        className="mt-6 text-white/30 text-[10px] hover:text-white/60 transition-colors uppercase tracking-widest">
        Forgot password? Reset wallet
      </button>
    </div>
  )
}
