import React, { useState } from "react"

import type { Screen } from "~popup"

interface Props {
  setScreen: (s: Screen) => void
  nextScreen?: Screen // "seed-phrase" | "dashboard"
}

export const SetupPasswordScreen: React.FC<Props> = ({
  setScreen,
  nextScreen = "seed-phrase"
}) => {
  const [pass, setPass] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState("")

  const strength =
    pass.length === 0 ? 0 : pass.length < 8 ? 1 : pass.length < 12 ? 2 : 3
  const strengthLabel = ["", "Weak", "Good", "Strong"]
  const strengthColor = ["", "bg-red-500", "bg-yellow-400", "bg-emerald-400"]
  const strengthText = [
    "",
    "text-red-400",
    "text-yellow-400",
    "text-emerald-400"
  ]

  const handleSubmit = () => {
    if (pass.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }
    if (pass !== confirm) {
      setError("Passwords do not match.")
      return
    }
    localStorage.setItem("zeno_pass_set", "true")
    setScreen(nextScreen)
  }

  return (
    <div className="flex-1 flex flex-col p-6 animate-fade-up">
      {/* Back */}
      <button
        onClick={() => setScreen("welcome")}
        className="text-white/40 text-sm mb-6 flex items-center gap-1 hover:text-white/80 transition-colors w-fit">
        ← Back
      </button>

      <h2 className="text-2xl font-extrabold text-white mb-1">Set Password</h2>
      <p className="text-white/40 text-sm mb-8 leading-relaxed">
        This unlocks Zeno on this device only. We cannot recover it for you.
      </p>

      {/* Password */}
      <div className="space-y-3 mb-4">
        <div className="relative">
          <input
            type="password"
            placeholder="New password"
            value={pass}
            onChange={(e) => {
              setPass(e.target.value)
              setError("")
            }}
            className="w-full bg-white/[0.04] border border-white/10 focus:border-white/30 text-white placeholder-white/25 px-4 py-3.5 rounded-xl outline-none text-sm transition-all"
          />
        </div>

        {/* Strength bar */}
        {pass.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex gap-1 flex-1">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength ? strengthColor[strength] : "bg-white/10"}`}
                />
              ))}
            </div>
            <span
              className={`text-[10px] font-semibold ${strengthText[strength]}`}>
              {strengthLabel[strength]}
            </span>
          </div>
        )}

        <input
          type="password"
          placeholder="Confirm password"
          value={confirm}
          onChange={(e) => {
            setConfirm(e.target.value)
            setError("")
          }}
          className="w-full bg-white/[0.04] border border-white/10 focus:border-white/30 text-white placeholder-white/25 px-4 py-3.5 rounded-xl outline-none text-sm transition-all"
        />
      </div>

      {error && <p className="text-red-400 text-xs mb-4">{error}</p>}

      <div className="mt-auto pt-4">
        <div className="glass rounded-xl p-3 mb-4 flex gap-2.5">
          <span className="text-white/50 text-base mt-0.5">🔒</span>
          <p className="text-white/40 text-xs leading-relaxed">
            Your password is stored locally and never sent to any server.
          </p>
        </div>
        <button
          onClick={handleSubmit}
          className="w-full py-3.5 bg-white text-black font-bold rounded-xl text-sm tracking-wide hover:bg-white/90 transition-all active:scale-[0.98]">
          CONTINUE
        </button>
      </div>
    </div>
  )
}
