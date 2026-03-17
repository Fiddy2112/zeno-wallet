import {
  Circle,
  Clipboard,
  Copy,
  File,
  Flashlight,
  Hexagon,
  Key,
  Shield,
  Timer,
  Trash
} from "lucide-react"
import React, { useEffect, useState } from "react"

import { notify } from "~features/notifications"
import { vaultSecurity } from "~features/security"
import type { Screen } from "~types"

interface Props {
  setScreen: (s: Screen) => void
  proMode: boolean
  setProMode: (v: boolean) => void
}

// COMPONENT CON: Section
const Section: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children
}) => (
  <div className="mb-6">
    <p className="text-white/20 text-[10px] uppercase tracking-[0.2em] px-2 mb-2 font-bold">
      {title}
    </p>
    <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden divide-y divide-white/[0.05]">
      {children}
    </div>
  </div>
)

// COMPONENT CON: Row
const Row: React.FC<{
  icon: React.ReactNode
  label: string
  value?: string
  danger?: boolean
  onClick?: () => void
  right?: React.ReactNode
}> = ({ icon, label, value, danger, onClick, right }) => (
  <div
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3.5 transition-all ${
      onClick
        ? "cursor-pointer hover:bg-white/[0.04] active:bg-white/[0.06]"
        : ""
    } ${danger ? "text-red-400" : ""}`}>
    <span className="text-base flex-shrink-0">{icon}</span>
    <span
      className={`flex-1 text-sm font-medium ${danger ? "text-red-400" : "text-white/80"}`}>
      {label}
    </span>
    {value && (
      <span className="text-white/30 text-xs font-mono mr-2">{value}</span>
    )}
    {right && <div onClick={(e) => e.stopPropagation()}>{right}</div>}
    {!right && !value && onClick && (
      <span className="text-white/20 text-sm">›</span>
    )}
  </div>
)

// COMPONENT CON: Toggle
const Toggle: React.FC<{ on: boolean; onToggle: () => void }> = ({
  on,
  onToggle
}) => (
  <button
    onClick={(e) => {
      e.stopPropagation()
      onToggle()
    }}
    className={`w-9 h-5 rounded-full relative transition-all duration-300 flex-shrink-0 ${
      on ? "bg-white" : "bg-white/10"
    }`}>
    <div
      className={`absolute top-1 w-3 h-3 rounded-full transition-all duration-300 ${
        on ? "bg-black right-1 shadow-sm" : "bg-white/40 left-1"
      }`}
    />
  </button>
)

export const SettingsScreen: React.FC<Props> = ({
  setScreen,
  proMode,
  setProMode
}) => {
  const [address, setAddress] = useState("")
  const [network, setNetwork] = useState("Ethereum Mainnet")
  const [aiGuardian, setAiGuardian] = useState(true)

  // lock time
  const [autoLock, setAutoLock] = useState("15")

  useEffect(() => {
    chrome.storage.local.get(["zeno_address", "zeno_lock_limit"], (res) => {
      if (res.zeno_address) setAddress(res.zeno_address)
      if (res.zeno_lock_limit) setAutoLock(res.zeno_lock_limit)
    })
  }, [])

  const shortAddr = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "Loading..."

  const handleReset = async () => {
    if (
      confirm(
        "Reset wallet? Hành động này sẽ xóa toàn bộ dữ liệu và không thể hoàn tác!"
      )
    ) {
      await chrome.storage.local.clear()
      localStorage.clear()
      window.location.reload()
    }
  }

  const handleAutoLockChange = (value: string) => {
    setAutoLock(value)
    chrome.storage.local.set({ zeno_lock_limit: value })
    notify.success(`Auto-lock set to ${value} minutes`)
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-4 custom-scrollbar animate-fade-up">
      {/* Header / Profile */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-2xl font-black text-white">
          Z
        </div>
        <div>
          <h2 className="text-white font-black text-lg leading-none mb-1">
            Zeno Identity 01
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest">
              Active
            </span>
            <span className="text-white/20 text-[10px]">•</span>
            <span className="text-white/40 text-[10px] font-mono">
              {shortAddr}
            </span>
          </div>
        </div>
      </div>

      {/* Identity & Security */}
      <Section title="Intelligence & Security">
        <Row
          icon={<Circle className="text-white/20 h-3 w-3" />}
          label="Pro Mode (Degen)"
          right={<Toggle on={proMode} onToggle={() => setProMode(!proMode)} />}
        />
        <Row
          icon={<Shield className="text-white/20 h-3 w-3" />}
          label="AI Guardian Active"
          right={
            <Toggle
              on={aiGuardian}
              onToggle={() => setAiGuardian(!aiGuardian)}
            />
          }
        />
        <Row
          icon={<Flashlight className="text-white/20 h-3 w-3" />}
          label="MEV Protection"
          right={<Toggle on={true} onToggle={() => {}} />}
        />
      </Section>

      {/* Wallet Management */}
      <Section title="Account Management">
        <Row
          icon={<Copy className="text-white/20 h-3 w-3" />}
          label="Copy Address"
          onClick={() => {
            navigator.clipboard.writeText(address)
            notify.success("Address copied!", "dark", 3000)
          }}
        />
        <Row
          icon={<Key className="text-white/20 h-3 w-3" />}
          label="View Private Key"
          onClick={() => setScreen("unlock")}
        />
        <Row
          icon={<Clipboard className="text-white/20 h-3 w-3" />}
          label="Secret Recovery Phrase"
          onClick={() => setScreen("unlock")}
        />
      </Section>

      {/* Network */}
      <Section title="Network Configuration">
        <Row
          icon={<Hexagon className="text-white/20 h-3 w-3" />}
          label="Current Network"
          right={
            <select
              value={network}
              onChange={(e) => setNetwork(e.target.value)}
              className="bg-transparent text-white/40 text-xs font-bold outline-none cursor-pointer">
              <option value="Ethereum Mainnet">Ethereum</option>
              <option value="Arbitrum One">Arbitrum</option>
              <option value="Base">Base</option>
              <option value="Sepolia">Sepolia Testnet</option>
            </select>
          }
        />
      </Section>

      {/* Lock time */}
      <Section title="Security System">
        <Row
          icon={<Timer className="text-white/20 h-3 w-3" />}
          label="Auto-lock Timer"
          right={
            <select
              value={autoLock}
              onChange={(e) => handleAutoLockChange(e.target.value)}
              className="bg-transparent text-white/40 text-xs font-bold outline-none cursor-pointer">
              <option value="15">15 Minutes</option>
              <option value="30">30 Minutes</option>
              <option value="60">1 Hour</option>
              <option value="240">4 Hours</option>
              <option value="never">Never</option>
            </select>
          }
        />
        <Row
          icon={<Shield className="text-white/20 h-3 w-3" />}
          label="Confirm Transactions"
          right={<Toggle on={true} onToggle={() => {}} />}
        />
      </Section>

      {/* System */}
      <Section title="System">
        <Row
          icon={<File className="text-white/20 h-3 w-3" />}
          label="Version"
          value="v1.0.4-beta"
        />
        <Row
          icon={<Trash className="text-white/20 h-3 w-3" />}
          label="Logout Wallet"
          danger
          onClick={handleReset}
        />
      </Section>

      <div className="mt-auto py-6 text-center">
        <p className="text-white/10 text-[9px] uppercase tracking-[0.3em]">
          Zeno Protocol — Autonomous Web3 Commander
        </p>
      </div>
    </div>
  )
}
