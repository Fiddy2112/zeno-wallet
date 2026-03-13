import React, { useState } from "react"

import type { Screen } from "~types"

interface Props {
  setScreen: (s: Screen) => void
  proMode: boolean
  setProMode: (v: boolean) => void
}

const ADDR = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F"

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children
}) => (
  <div className="mb-4">
    <p className="text-white/25 text-[10px] uppercase tracking-[0.2em] px-1 mb-2">
      {title}
    </p>
    <div className="glass rounded-xl overflow-hidden divide-y divide-white/[0.05]">
      {children}
    </div>
  </div>
)

const Row: React.FC<{
  icon: string
  label: string
  value?: string
  danger?: boolean
  onClick?: () => void
  right?: React.ReactNode
}> = ({ icon, label, value, danger, onClick, right }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-all text-left ${danger ? "text-red-400" : ""}`}>
    <span className="text-base">{icon}</span>
    <span
      className={`flex-1 text-sm font-medium ${danger ? "text-red-400" : "text-white/80"}`}>
      {label}
    </span>
    {value && <span className="text-white/30 text-xs font-mono">{value}</span>}
    {right}
    {!right && !value && <span className="text-white/20 text-sm">›</span>}
  </button>
)

const Toggle: React.FC<{ on: boolean; onToggle: () => void }> = ({
  on,
  onToggle
}) => (
  <button
    onClick={onToggle}
    className={`w-10 h-5 rounded-full relative transition-all flex-shrink-0 ${on ? "bg-white" : "bg-white/10"}`}>
    <div
      className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${on ? "bg-black right-0.5" : "bg-white/40 left-0.5"}`}
    />
  </button>
)

export const SettingsScreen: React.FC<Props> = ({
  setScreen,
  proMode,
  setProMode
}) => {
  const [mev, setMev] = useState(true)
  const [biometric, setBiometric] = useState(false)
  const [network, setNetwork] = useState("Ethereum Mainnet")

  const short = ADDR.slice(0, 6) + "..." + ADDR.slice(-4)

  const reset = () => {
    if (confirm("Reset wallet? This cannot be undone.")) {
      localStorage.clear()
      setScreen("welcome")
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 animate-fade-up">
      {/* Profile */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-2xl font-black text-white">
          Z
        </div>
        <div>
          <p className="text-white font-bold">Zeno Account 1</p>
          <p className="text-white/30 text-xs font-mono">{short}</p>
        </div>
      </div>

      {/* Account */}
      <Section title="Account">
        <Row
          icon="⎘"
          label="Copy Address"
          value={short}
          onClick={() => navigator.clipboard?.writeText(ADDR)}
        />
        <Row icon="↗" label="View on Etherscan" />
        <Row icon="🔑" label="Export Private Key" />
        <Row icon="📋" label="Show Seed Phrase" />
      </Section>

      {/* Network */}
      <Section title="Network">
        <Row
          icon="⬡"
          label={network}
          right={
            <select
              value={network}
              onChange={(e) => setNetwork(e.target.value)}
              className="bg-transparent text-white/30 text-xs outline-none cursor-pointer"
              onClick={(e) => e.stopPropagation()}>
              {[
                "Ethereum Mainnet",
                "Arbitrum One",
                "Base",
                "Polygon",
                "Goerli Testnet"
              ].map((n) => (
                <option key={n} value={n} className="bg-black text-white">
                  {n}
                </option>
              ))}
            </select>
          }
        />
      </Section>

      {/* Mode */}
      <Section title="Wallet Mode">
        <Row
          icon="◈"
          label={proMode ? "Pro Mode (Degen)" : "Lite Mode (Simple)"}
          right={<Toggle on={proMode} onToggle={() => setProMode(!proMode)} />}
        />
      </Section>

      {/* Security */}
      <Section title="Security">
        <Row
          icon="⚡"
          label="MEV Protection"
          right={<Toggle on={mev} onToggle={() => setMev(!mev)} />}
        />
        <Row
          icon="👤"
          label="Biometric Unlock"
          right={
            <Toggle on={biometric} onToggle={() => setBiometric(!biometric)} />
          }
        />
        <Row icon="🔒" label="Change Password" />
        <Row icon="🔔" label="Alert Notifications" />
      </Section>

      {/* About */}
      <Section title="About">
        <Row icon="Z" label="Version" value="v0.0.1 Beta" />
        <Row icon="📄" label="Privacy Policy" />
        <Row icon="❓" label="Help & Support" />
      </Section>

      {/* Danger zone */}
      <Section title="Danger Zone">
        <Row icon="🗑" label="Reset Wallet" danger onClick={reset} />
      </Section>

      <p className="text-center text-white/15 text-[10px] uppercase tracking-[0.2em] py-4">
        Zeno Wallet — The Intelligent Nexus
      </p>
    </div>
  )
}
