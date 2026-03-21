import {
  Circle,
  Clipboard,
  Copy,
  Eye,
  EyeOff,
  File,
  Flashlight,
  FlaskConical,
  Hexagon,
  Key,
  List,
  Plus,
  Shield,
  Timer,
  Trash,
  X
} from "lucide-react"
import React, { useEffect, useState } from "react"

import { CustomSelect } from "~components/CustomSelect"
import {
  AddNetworkModal,
  ManageNetworksModal,
  type CustomNetwork
} from "~components/AddNetworkModal"
import { SUPPORTED_CHAINS } from "~core/networks"
import { deriveWalletFromMnemonic } from "~core/wallet-engine"
import { notify } from "~features/notifications"
import { vaultSecurity } from "~features/security"
import type { Screen } from "~types"

interface Props {
  setScreen: (s: Screen) => void
  proMode: boolean
  setProMode: (v: boolean) => void
}

const TESTNETS = ["sepolia", "goerli"]

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-6">
    <p className="text-white/20 text-[10px] uppercase tracking-[0.2em] px-2 mb-2 font-bold">{title}</p>
    <div className="bg-white/[0.02] border border-white/5 rounded-2xl divide-y divide-white/[0.05]">
      {children}
    </div>
  </div>
)

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
    className={`w-full flex items-center gap-3 px-4 py-3.5 transition-all ${onClick ? "cursor-pointer hover:bg-white/[0.04] active:bg-white/[0.06]" : ""} ${danger ? "text-red-400" : ""}`}>
    <span className="text-base flex-shrink-0">{icon}</span>
    <span className={`flex-1 text-sm font-medium ${danger ? "text-red-400" : "text-white/80"}`}>{label}</span>
    {value && <span className="text-white/30 text-xs font-mono mr-2">{value}</span>}
    {right && <div onClick={(e) => e.stopPropagation()}>{right}</div>}
    {!right && !value && onClick && <span className="text-white/20 text-sm">›</span>}
  </div>
)

const Toggle: React.FC<{ on: boolean; onToggle: () => void }> = ({ on, onToggle }) => (
  <button
    onClick={(e) => { e.stopPropagation(); onToggle() }}
    className={`w-9 h-5 rounded-full relative transition-all duration-300 flex-shrink-0 ${on ? "bg-white" : "bg-white/10"}`}>
    <div className={`absolute top-1 w-3 h-3 rounded-full transition-all duration-300 ${on ? "bg-black right-1 shadow-sm" : "bg-white/40 left-1"}`} />
  </button>
)

const SecretModal: React.FC<{
  title: string
  onClose: () => void
  onReveal: (password: string) => Promise<{ secret: string; error?: string }>
}> = ({ title, onClose, onReveal }) => {
  const [password, setPassword] = useState("")
  const [secret, setSecret] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showSecret, setShowSecret] = useState(false)

  const handleReveal = async () => {
    if (!password) return
    setLoading(true)
    setError("")
    const { secret: s, error: e } = await onReveal(password)
    setLoading(false)
    if (e) { setError(e); return }
    setSecret(s)
    setRevealed(true)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(secret)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    notify.warning("Never share this with anyone!", "dark", 3000)
  }

  return (
    <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex items-end z-50">
      <div className="w-full bg-[#111] border-t border-white/10 p-6 rounded-t-3xl animate-fade-up max-h-[90%] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="w-8 h-1 bg-white/20 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-3" />
          <h3 className="text-white font-black text-sm uppercase tracking-widest">{title}</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all">
            <X className="w-3.5 h-3.5 text-white/60" />
          </button>
        </div>
        {!revealed ? (
          <>
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4 flex gap-2">
              <Shield className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-400/80 text-xs leading-relaxed">Never share this with anyone. Anyone with this can steal your funds permanently.</p>
            </div>
            <p className="text-white/40 text-xs mb-4 leading-relaxed">Enter your wallet password to decrypt and view your secret.</p>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError("") }}
              onKeyDown={(e) => e.key === "Enter" && handleReveal()}
              placeholder="Wallet password"
              autoFocus
              className="w-full bg-white/[0.05] border border-white/10 focus:border-white/30 text-white placeholder-white/20 px-4 py-3.5 rounded-xl outline-none text-sm mb-2 transition-all"
            />
            {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
            <div className="flex gap-3 mt-3">
              <button onClick={onClose} className="flex-1 py-3 border border-white/10 text-white/50 rounded-xl text-xs font-bold hover:border-white/25 transition-all">CANCEL</button>
              <button onClick={handleReveal} disabled={!password || loading} className="flex-1 py-3 bg-red-500/80 text-white rounded-xl text-xs font-black disabled:opacity-30 hover:bg-red-500 active:scale-[0.98] transition-all">
                {loading ? "DECRYPTING..." : "REVEAL"}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 mb-4 flex gap-2">
              <Shield className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
              <p className="text-yellow-400/80 text-xs leading-relaxed">Make sure no one is watching your screen.</p>
            </div>
            <div className="relative bg-black/60 border border-white/10 rounded-xl p-4 mb-4">
              <button onClick={() => setShowSecret((v) => !v)} className="absolute top-3 right-3 w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all">
                {showSecret ? <EyeOff className="w-3.5 h-3.5 text-white/60" /> : <Eye className="w-3.5 h-3.5 text-white/60" />}
              </button>
              <p className={`text-sm font-mono break-all leading-relaxed pr-8 transition-all ${showSecret ? "text-white select-all" : "blur-sm select-none text-white/50"}`}>{secret}</p>
              {!showSecret && <button onClick={() => setShowSecret(true)} className="absolute inset-0 flex items-center justify-center text-white/40 text-xs font-bold">Click to reveal</button>}
            </div>
            <div className="flex gap-3">
              <button onClick={handleCopy} className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${copied ? "bg-emerald-400 text-black" : "bg-white/10 text-white hover:bg-white/15"}`}>
                {copied ? "COPIED!" : "COPY"}
              </button>
              <button onClick={onClose} className="flex-1 py-3 border border-white/10 text-white/50 rounded-xl text-xs font-bold hover:border-white/25 transition-all">CLOSE</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// Build network options from built-in + custom networks
const buildNetworkOptions = (showTestnet: boolean, customNetworks: CustomNetwork[]) => {
  const builtin = SUPPORTED_CHAINS.filter(
    (c) =>
      c.vmType === "EVM" &&
      c.id !== "solana" &&
      c.id !== "bitcoin" &&
      (showTestnet ? true : !TESTNETS.includes(c.id))
  ).map((c) => ({
    value: c.id,
    label: c.name,
    icon: c.logo,
    sublabel: TESTNETS.includes(c.id) ? "testnet" : c.nativeSymbol
  }))

  const custom = customNetworks.map((n) => ({
    value: n.id,
    label: n.name,
    icon: n.logo,
    sublabel: `${n.symbol} · Chain ${n.chainId}`
  }))

  return [...builtin, ...custom]
}

const LOCK_OPTIONS = [
  { value: "15",    label: "15 minutes", sublabel: "Recommended" },
  { value: "30",    label: "30 minutes" },
  { value: "60",    label: "1 hour" },
  { value: "240",   label: "4 hours" },
  { value: "never", label: "Never",      sublabel: "Not recommended" }
]

export const SettingsScreen: React.FC<Props> = ({ setScreen, proMode, setProMode }) => {
  const [address, setAddress] = useState("")
  const [aiGuardian, setAiGuardian] = useState(true)
  const [autoLock, setAutoLock] = useState("15")
  const [network, setNetwork] = useState("ethereum")
  const [showTestnet, setShowTestnet] = useState(false)
  const [customNetworks, setCustomNetworks] = useState<CustomNetwork[]>([])
  const [modal, setModal] = useState<"privateKey" | "seedPhrase" | "addNetwork" | "manageNetworks" | null>(null)

  useEffect(() => {
    chrome.storage.local.get(
      ["zeno_address", "zeno_lock_limit", "zeno_chain_filter", "zeno_show_testnet", "zeno_custom_networks"],
      (res) => {
        if (res.zeno_address) setAddress(res.zeno_address)
        if (res.zeno_lock_limit) setAutoLock(res.zeno_lock_limit)
        if (res.zeno_chain_filter && res.zeno_chain_filter !== "all") setNetwork(res.zeno_chain_filter)
        if (res.zeno_show_testnet !== undefined) setShowTestnet(res.zeno_show_testnet)
        if (res.zeno_custom_networks) setCustomNetworks(res.zeno_custom_networks)
      }
    )
  }, [])

  const shortAddr = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Loading..."

  const handleRevealPrivateKey = async (password: string) => {
    try {
      const res = await chrome.storage.local.get(["zeno_vault", "zeno_salt"])
      if (!res.zeno_vault || !res.zeno_salt) return { secret: "", error: "Vault not found." }
      const mnemonic = vaultSecurity.decryptMnemonic(res.zeno_vault, password, res.zeno_salt)
      if (!mnemonic || mnemonic.split(" ").length < 12) return { secret: "", error: "Incorrect password." }
      const wallet = deriveWalletFromMnemonic(mnemonic)
      return { secret: wallet.privateKey }
    } catch { return { secret: "", error: "Incorrect password." } }
  }

  const handleRevealSeedPhrase = async (password: string) => {
    try {
      const res = await chrome.storage.local.get(["zeno_vault", "zeno_salt"])
      if (!res.zeno_vault || !res.zeno_salt) return { secret: "", error: "Vault not found." }
      const mnemonic = vaultSecurity.decryptMnemonic(res.zeno_vault, password, res.zeno_salt)
      if (!mnemonic || mnemonic.split(" ").length < 12) return { secret: "", error: "Incorrect password." }
      return { secret: mnemonic }
    } catch { return { secret: "", error: "Incorrect password." } }
  }

  const handleNetworkChange = (v: string) => {
    setNetwork(v)
    chrome.storage.local.set({ zeno_chain_filter: v })
  }

  const handleAutoLockChange = (v: string) => {
    setAutoLock(v)
    chrome.storage.local.set({ zeno_lock_limit: v })
    const label = LOCK_OPTIONS.find((o) => o.value === v)?.label || v
    notify.success(`Auto-lock set to ${label}`)
  }

  const handleTestnetToggle = () => {
    const next = !showTestnet
    setShowTestnet(next)
    chrome.storage.local.set({ zeno_show_testnet: next })
    if (!next && TESTNETS.includes(network)) {
      setNetwork("ethereum")
      chrome.storage.local.set({ zeno_chain_filter: "ethereum" })
    }
    notify.success(next ? "Test networks enabled" : "Test networks hidden", "dark", 2000)
  }

  const handleNetworkSaved = (net: CustomNetwork) => {
    setCustomNetworks((prev) => [...prev, net])
  }

  const handleNetworkDeleted = (id: string) => {
    setCustomNetworks((prev) => prev.filter((n) => n.id !== id))
    if (network === id) {
      setNetwork("ethereum")
      chrome.storage.local.set({ zeno_chain_filter: "ethereum" })
    }
  }

  const handleReset = async () => {
    if (confirm("Reset wallet? This will delete all data and cannot be undone!")) {
      await chrome.storage.local.clear()
      localStorage.clear()
      window.location.reload()
    }
  }

  const networkOptions = buildNetworkOptions(showTestnet, customNetworks)

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-4 custom-scrollbar animate-fade-up relative">

      {modal === "privateKey" && <SecretModal title="Private Key" onClose={() => setModal(null)} onReveal={handleRevealPrivateKey} />}
      {modal === "seedPhrase" && <SecretModal title="Secret Recovery Phrase" onClose={() => setModal(null)} onReveal={handleRevealSeedPhrase} />}
      {modal === "addNetwork" && <AddNetworkModal onClose={() => setModal(null)} onSave={handleNetworkSaved} />}
      {modal === "manageNetworks" && (
        <ManageNetworksModal
          onClose={() => setModal(null)}
          onDelete={handleNetworkDeleted}
          networks={customNetworks}
        />
      )}

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-2xl font-black text-white">Z</div>
        <div>
          <h2 className="text-white font-black text-lg leading-none mb-1">Zeno Identity 01</h2>
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest">Active</span>
            <span className="text-white/20 text-[10px]">•</span>
            <span className="text-white/40 text-[10px] font-mono">{shortAddr}</span>
          </div>
        </div>
      </div>

      <Section title="Intelligence & Security">
        <Row icon={<Circle className="text-white/20 h-3 w-3" />} label="Pro Mode (Degen)" right={<Toggle on={proMode} onToggle={() => setProMode(!proMode)} />} />
        <Row icon={<Shield className="text-white/20 h-3 w-3" />} label="AI Guardian Active" right={<Toggle on={aiGuardian} onToggle={() => setAiGuardian(!aiGuardian)} />} />
        <Row icon={<Flashlight className="text-white/20 h-3 w-3" />} label="MEV Protection" right={<Toggle on={true} onToggle={() => {}} />} />
      </Section>

      <Section title="Account Management">
        <Row icon={<Copy className="text-white/20 h-3 w-3" />} label="Copy Address" onClick={() => { navigator.clipboard.writeText(address); notify.success("Address copied!", "dark", 3000) }} />
        <Row icon={<Key className="text-white/20 h-3 w-3" />} label="View Private Key" onClick={() => setModal("privateKey")} />
        <Row icon={<Clipboard className="text-white/20 h-3 w-3" />} label="Secret Recovery Phrase" onClick={() => setModal("seedPhrase")} />
      </Section>

      <Section title="Network Configuration">
        <Row
          icon={<Hexagon className="text-white/20 h-3 w-3" />}
          label="Current Network"
          right={<CustomSelect value={network} onChange={handleNetworkChange} options={networkOptions} />}
        />
        <Row
          icon={<FlaskConical className="text-white/20 h-3 w-3" />}
          label="Show test networks"
          right={<Toggle on={showTestnet} onToggle={handleTestnetToggle} />}
        />
        {showTestnet && (
          <div className="px-4 py-2.5 flex items-center gap-2 bg-yellow-500/[0.04]">
            <FlaskConical className="w-3 h-3 text-yellow-400/50 flex-shrink-0" />
            <span className="text-yellow-400/50 text-[10px]">Testnet assets have no real value</span>
          </div>
        )}
        <Row
          icon={<Plus className="text-white/20 h-3 w-3" />}
          label="Add Custom Network"
          onClick={() => setModal("addNetwork")}
        />
        {customNetworks.length > 0 && (
          <Row
            icon={<List className="text-white/20 h-3 w-3" />}
            label="Manage Custom Networks"
            value={`${customNetworks.length} network${customNetworks.length > 1 ? "s" : ""}`}
            onClick={() => setModal("manageNetworks")}
          />
        )}
      </Section>

      <Section title="Security System">
        <Row icon={<Timer className="text-white/20 h-3 w-3" />} label="Auto-lock Timer" right={<CustomSelect value={autoLock} onChange={handleAutoLockChange} options={LOCK_OPTIONS} />} />
        <Row icon={<Shield className="text-white/20 h-3 w-3" />} label="Confirm Transactions" right={<Toggle on={true} onToggle={() => {}} />} />
      </Section>

      <Section title="System">
        <Row icon={<File className="text-white/20 h-3 w-3" />} label="Version" value="v1.0.4-beta" />
        <Row icon={<Trash className="text-white/20 h-3 w-3" />} label="Logout Wallet" danger onClick={handleReset} />
      </Section>

      <div className="mt-auto py-6 text-center">
        <p className="text-white/10 text-[9px] uppercase tracking-[0.3em]">Zeno Protocol — Autonomous Web3 Commander</p>
      </div>
    </div>
  )
}