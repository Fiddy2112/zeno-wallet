import { ChevronDown, FlaskConical, Globe } from "lucide-react"
import { useEffect, useState } from "react"

import { SUPPORTED_CHAINS } from "~core/networks"
import type { CustomNetwork } from "~components/AddNetworkModal"
import { NetworkSheet, type ChainFilter } from "~components/NetworkSheet"

export type { ChainFilter }

interface Props {
  selected: ChainFilter
  onChange: (v: ChainFilter) => void
}

const TESTNETS = ["sepolia", "goerli"]

export const ALL_EVM_CHAINS = SUPPORTED_CHAINS.filter(
  (c) => c.vmType === "EVM" && c.id !== "solana" && c.id !== "bitcoin"
)

export const EVM_CHAINS = ALL_EVM_CHAINS.filter((c) => !TESTNETS.includes(c.id))

// Full ChainSelector

export const ChainSelector: React.FC<Props> = ({ selected, onChange }) => {
  const [open, setOpen] = useState(false)
  const [showTestnet, setShowTestnet] = useState(false)
  const [customNetworks, setCustomNetworks] = useState<CustomNetwork[]>([])

  useEffect(() => {
    chrome.storage.local.get(["zeno_show_testnet", "zeno_custom_networks"], (res) => {
      setShowTestnet(res.zeno_show_testnet || false)
      setCustomNetworks(res.zeno_custom_networks || [])
    })
    const listener = (changes: any) => {
      if (changes.zeno_show_testnet !== undefined) setShowTestnet(changes.zeno_show_testnet.newValue || false)
      if (changes.zeno_custom_networks !== undefined) setCustomNetworks(changes.zeno_custom_networks.newValue || [])
    }
    chrome.storage.onChanged.addListener(listener)
    return () => chrome.storage.onChanged.removeListener(listener)
  }, [])

  const builtinChain = ALL_EVM_CHAINS.find((c) => c.id === selected)
  const customChain = customNetworks.find((n) => n.id === selected)
  const isTestnet = builtinChain ? TESTNETS.includes(builtinChain.id) : false
  const label = selected === "all" ? "All networks" : builtinChain?.name || customChain?.name || "All networks"
  const logo = selected === "all" ? null : builtinChain?.logo || customChain?.logo || null

  return (
    <>
      <button
        id="tour-network"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 glass px-2.5 py-1 rounded-full hover:bg-white/[0.08] transition-all">
        {logo ? (
          <img src={logo} alt={label} className="w-3.5 h-3.5 rounded-full" />
        ) : (
          <Globe className="w-3 h-3 text-white/40" />
        )}
        <span className="text-white/60 text-[10px] font-mono leading-6 max-w-[72px] truncate">
          {label}
        </span>
        {isTestnet && <FlaskConical className="w-2.5 h-2.5 text-yellow-400/70" />}
        <ChevronDown className="w-3 h-3 text-white/30" />
      </button>
      {open && (
        <NetworkSheet
          selected={selected}
          onChange={onChange}
          onClose={() => setOpen(false)}
          customNetworks={customNetworks}
          showTestnet={showTestnet}
        />
      )}
    </>
  )
}

// Compact variant for Dashboard top bar

export const ChainSelectorCompact: React.FC<Props> = ({ selected, onChange }) => {
  const [open, setOpen] = useState(false)
  const [showTestnet, setShowTestnet] = useState(false)
  const [customNetworks, setCustomNetworks] = useState<CustomNetwork[]>([])

  useEffect(() => {
    chrome.storage.local.get(["zeno_show_testnet", "zeno_custom_networks"], (res) => {
      setShowTestnet(res.zeno_show_testnet || false)
      setCustomNetworks(res.zeno_custom_networks || [])
    })
    const listener = (changes: any) => {
      if (changes.zeno_show_testnet !== undefined) setShowTestnet(changes.zeno_show_testnet.newValue || false)
      if (changes.zeno_custom_networks !== undefined) setCustomNetworks(changes.zeno_custom_networks.newValue || [])
    }
    chrome.storage.onChanged.addListener(listener)
    return () => chrome.storage.onChanged.removeListener(listener)
  }, [])

  const builtinChain = ALL_EVM_CHAINS.find((c) => c.id === selected)
  const customChain = customNetworks.find((n) => n.id === selected)
  const isTestnet = builtinChain ? TESTNETS.includes(builtinChain.id) : false
  const fullName = builtinChain?.name || customChain?.name || ""
  const logo = selected === "all" ? null : builtinChain?.logo || customChain?.logo || null

  // Short label: "All" or chain name truncated to ~8 chars
  const shortLabel = selected === "all" ? "All" : fullName.split(" ")[0] // "Ethereum", "Arbitrum", "Base"...

  return (
    <>
      <button
        id="tour-network"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 glass px-2 py-1 rounded-full hover:bg-white/[0.08] transition-all max-w-[88px]">
        {logo ? (
          <img src={logo} alt={fullName} className="w-3.5 h-3.5 rounded-full flex-shrink-0" />
        ) : (
          <Globe className="w-3 h-3 text-white/40 flex-shrink-0" />
        )}
        <span className="text-white/60 text-[10px] font-mono leading-6 truncate">
          {shortLabel}
        </span>
        {isTestnet && <FlaskConical className="w-2.5 h-2.5 text-yellow-400/70 flex-shrink-0" />}
        <ChevronDown className="w-2.5 h-2.5 text-white/30 flex-shrink-0" />
      </button>

      {open && (
        <NetworkSheet
          selected={selected}
          onChange={onChange}
          onClose={() => setOpen(false)}
          customNetworks={customNetworks}
          showTestnet={showTestnet}
        />
      )}
    </>
  )
}