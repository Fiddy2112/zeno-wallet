import React, { useEffect, useState } from "react"

import { notify } from "~features/notifications"
import { vaultSecurity } from "~features/security"
import type { Screen } from "~types"

interface Props {
  setScreen: (s: Screen) => void
  setIsUnlocked?: (v: boolean) => void
}

const MAX_ATTEMPTS = 5
const COOLDOWN_SECONDS = 30
const STORAGE_KEY_ATTEMPTS = "zeno_unlock_attempts"
const STORAGE_KEY_LOCKED_UNTIL = "zeno_locked_until"

export const UnlockScreen: React.FC<Props> = ({ setScreen, setIsUnlocked }) => {
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [cooldownLeft, setCooldownLeft] = useState(0)

  // Load persisted attempt state on mount
  useEffect(() => {
    chrome.storage.local.get(
      [STORAGE_KEY_ATTEMPTS, STORAGE_KEY_LOCKED_UNTIL],
      (res) => {
        const savedAttempts = res[STORAGE_KEY_ATTEMPTS] || 0
        setAttempts(savedAttempts)

        const lockedUntil = res[STORAGE_KEY_LOCKED_UNTIL]
        if (lockedUntil) {
          const secsLeft = Math.ceil((lockedUntil - Date.now()) / 1000)
          if (secsLeft > 0) setCooldownLeft(secsLeft)
        }
      }
    )
  }, [])

  // Countdown timer
  useEffect(() => {
    if (cooldownLeft <= 0) return
    const timer = setInterval(() => {
      setCooldownLeft((v) => {
        if (v <= 1) {
          clearInterval(timer)
          return 0
        }
        return v - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldownLeft])

  const isLocked = cooldownLeft > 0

  const handleUnlock = async () => {
    if (isLocked || loading || !password) return
    setLoading(true)

    try {
      const res = await chrome.storage.local.get(["zeno_vault", "zeno_salt"])
      chrome.storage.local.set({ zeno_timestamp: new Date().toISOString() })

      if (!res.zeno_vault || !res.zeno_salt) {
        notify.error("Vault empty! Please reset wallet.")
        setScreen("welcome")
        return
      }

      const decrypted = vaultSecurity.decryptMnemonic(
        res.zeno_vault,
        password,
        res.zeno_salt
      )

      if (decrypted && decrypted.split(" ").length >= 12) {
        // Success — clear attempt counter
        await chrome.storage.local.remove([
          STORAGE_KEY_ATTEMPTS,
          STORAGE_KEY_LOCKED_UNTIL
        ])
        setAttempts(0)
        notify.success("Access Granted. Welcome back, Commander.")
        if (setIsUnlocked) setIsUnlocked(true)
        setScreen("dashboard")
      } else {
        // Wrong password
        const newAttempts = attempts + 1
        setAttempts(newAttempts)
        await chrome.storage.local.set({ [STORAGE_KEY_ATTEMPTS]: newAttempts })

        const remaining = MAX_ATTEMPTS - newAttempts
        if (newAttempts >= MAX_ATTEMPTS) {
          // Start cooldown
          const lockedUntil = Date.now() + COOLDOWN_SECONDS * 1000
          await chrome.storage.local.set({
            [STORAGE_KEY_LOCKED_UNTIL]: lockedUntil
          })
          setCooldownLeft(COOLDOWN_SECONDS)
          notify.error(`Too many attempts. Locked for ${COOLDOWN_SECONDS}s.`)
        } else {
          notify.error(
            `Wrong password. ${remaining} attempt${remaining !== 1 ? "s" : ""} left.`
          )
        }
        setPassword("")
      }
    } catch {
      notify.error("Decryption failed. Try again.")
    } finally {
      setLoading(false)
    }
  }

  const attemptsLeft = MAX_ATTEMPTS - attempts

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 animate-fade-in bg-[#080808]">
      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center font-black text-black italic text-3xl mb-8 shadow-[0_0_30px_rgba(255,255,255,0.1)]">
        Z
      </div>

      <h2 className="text-xl font-bold text-white mb-2">Welcome back</h2>
      <p className="text-white/40 text-xs mb-8">
        Enter password to unlock your vault
      </p>

      {isLocked ? (
        /* Cooldown state */
        <div className="w-full text-center mb-6">
          <div className="w-16 h-16 rounded-full border-2 border-red-500/30 bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-red-400 text-xl font-black font-mono">
              {cooldownLeft}
            </span>
          </div>
          <p className="text-red-400 text-sm font-bold mb-1">Vault locked</p>
          <p className="text-white/30 text-xs">
            Too many failed attempts. Wait {cooldownLeft}s before trying again.
          </p>
        </div>
      ) : (
        <>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
            placeholder="Type your password..."
            className="w-full bg-white/[0.04] border border-white/10 focus:border-white/30 text-white px-4 py-3.5 rounded-xl outline-none text-center transition-all mb-4"
            autoFocus
            disabled={loading}
          />

          {/* Attempt warning */}
          {attempts > 0 && attempts < MAX_ATTEMPTS && (
            <div className="w-full mb-4">
              <div className="flex gap-1 mb-1.5">
                {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 h-0.5 rounded-full transition-all ${
                      i < attempts ? "bg-red-500" : "bg-white/10"
                    }`}
                  />
                ))}
              </div>
              <p className="text-red-400/80 text-[10px] text-center">
                {attemptsLeft} attempt{attemptsLeft !== 1 ? "s" : ""} remaining
                before lockout
              </p>
            </div>
          )}
        </>
      )}

      <button
        onClick={handleUnlock}
        disabled={loading || isLocked || !password}
        className="w-full py-3.5 hover:bg-white hover:text-black border border-white/40 text-white font-bold rounded-xl text-sm tracking-widest transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed">
        {loading
          ? "DECRYPTING..."
          : isLocked
            ? `LOCKED (${cooldownLeft}s)`
            : "UNLOCK"}
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
