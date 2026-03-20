import {
  createPublicClient,
  createWalletClient,
  defineChain,
  formatEther,
  http,
  parseEther
} from "viem"
import { privateKeyToAccount } from "viem/accounts"
import {
  arbitrum,
  base,
  bsc,
  mainnet,
  optimism,
  polygon,
  sepolia,
  zksync
} from "viem/chains"

import type { VMAdapter } from "~types"

import { deriveWalletFromMnemonic } from "./wallet-engine"

// Config
export const ALCHEMY_KEY =
  process.env.PLASMO_PUBLIC_ALCHEMY_API_KEY || process.env.ALCHEMY_API_KEY

export type VMType = "EVM" | "SVM" | "BVM"

export type ChainConfig = {
  id: string
  coingeckoId: string
  name: string
  chain: any
  rpc: string
  alchemyUrl?: string
  nativeSymbol: string
  logo: string
  vmType: VMType
  derivationPath?: string
}

// Chains
export const unichain = defineChain({
  id: 130,
  name: "Unichain",
  network: "unichain",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH"
  },
  rpcUrls: {
    default: {
      http: ALCHEMY_KEY
        ? [`https://unichain-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`]
        : ["https://mainnet.unichain.org"]
    },
    public: {
      http: ["https://mainnet.unichain.org"]
    }
  }
})

export const SUPPORTED_CHAINS: ChainConfig[] = [
  {
    id: "ethereum",
    coingeckoId: "ethereum",
    name: "Ethereum",
    chain: mainnet,
    rpc: ALCHEMY_KEY
      ? `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`
      : "https://eth.llamarpc.com",
    alchemyUrl: ALCHEMY_KEY
      ? `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`
      : undefined,
    nativeSymbol: "ETH",
    logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
    vmType: "EVM",
    derivationPath: "m/44'/60'/0'/0/0"
  },
  {
    id: "arbitrum",
    coingeckoId: "ethereum",
    name: "Arbitrum",
    chain: arbitrum,
    rpc: ALCHEMY_KEY
      ? `https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`
      : "https://arbitrum.llamarpc.com",
    alchemyUrl: ALCHEMY_KEY
      ? `https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`
      : undefined,
    nativeSymbol: "ETH",
    logo: "https://cryptologos.cc/logos/arbitrum-arb-logo.png",
    vmType: "EVM",
    derivationPath: "m/44'/60'/0'/0/0"
  },
  {
    id: "base",
    coingeckoId: "ethereum",
    name: "Base",
    chain: base,
    rpc: ALCHEMY_KEY
      ? `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`
      : "https://base.api.pocket.network",
    alchemyUrl: ALCHEMY_KEY
      ? `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`
      : undefined,
    nativeSymbol: "ETH",
    logo: "https://assets.coingecko.com/coins/images/69370/standard/base.png",
    vmType: "EVM",
    derivationPath: "m/44'/60'/0'/0/0"
  },
  {
    id: "optimism",
    coingeckoId: "ethereum",
    name: "Optimism",
    chain: optimism,
    rpc: ALCHEMY_KEY
      ? `https://opt-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`
      : "https://public-op-mainnet.fastnode.io",
    alchemyUrl: ALCHEMY_KEY
      ? `https://opt-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`
      : undefined,
    nativeSymbol: "ETH",
    logo: "https://cryptologos.cc/logos/optimism-ethereum-op-logo.png",
    vmType: "EVM",
    derivationPath: "m/44'/60'/0'/0/0"
  },
  {
    id: "polygon",
    coingeckoId: "matic-network",
    name: "Polygon",
    chain: polygon,
    rpc: ALCHEMY_KEY
      ? `https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`
      : "https://polygon.drpc.org",
    alchemyUrl: ALCHEMY_KEY
      ? `https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`
      : undefined,
    nativeSymbol: "MATIC",
    logo: "https://cryptologos.cc/logos/polygon-matic-logo.png",
    vmType: "EVM",
    derivationPath: "m/44'/60'/0'/0/0"
  },
  {
    id: "zksync",
    coingeckoId: "ethereum",
    name: "zkSync",
    chain: zksync,
    rpc: "https://zksync-era.api.pocket.network",
    nativeSymbol: "ETH",
    logo: "https://images.seeklogo.com/logo-png/51/1/zksync-logo-png_seeklogo-511868.png",
    vmType: "EVM",
    derivationPath: "m/44'/60'/0'/0/0"
  },
  {
    id: "sepolia",
    coingeckoId: "ethereum",
    name: "Sepolia (Testnet)",
    chain: sepolia,
    rpc: "https://rpc.ankr.com/eth_sepolia",
    nativeSymbol: "SEP",
    logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
    vmType: "EVM",
    derivationPath: "m/44'/60'/0'/0/0"
  },
  {
    id: "unichain",
    coingeckoId: "ethereum",
    name: "Unichain",
    chain: unichain,
    rpc: ALCHEMY_KEY
      ? `https://unichain-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`
      : "https://mainnet.unichain.org",
    alchemyUrl: ALCHEMY_KEY
      ? `https://unichain-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`
      : undefined,
    nativeSymbol: "ETH",
    logo: "https://images.seeklogo.com/logo-png/39/1/uniswap-logo-png_seeklogo-398214.png",
    vmType: "EVM",
    derivationPath: "m/44'/60'/0'/0/0"
  },
  {
    id: "solana",
    coingeckoId: "solana",
    name: "Solana",
    chain: null,
    rpc: "https://api.mainnet-beta.solana.com",
    nativeSymbol: "SOL",
    logo: "https://cryptologos.cc/logos/solana-sol-logo.png",
    vmType: "SVM",
    derivationPath: "m/44'/501'/0'/0'"
  },
  {
    id: "bitcoin",
    coingeckoId: "bitcoin",
    name: "Bitcoin",
    chain: null,
    rpc: "https://mempool.space/api",
    nativeSymbol: "BTC",
    logo: "https://cryptologos.cc/logos/bitcoin-btc-logo.png",
    vmType: "BVM",
    derivationPath: "m/44'/0'/0'/0/0"
  }
]

export const getChainConfig = (networkId: string): ChainConfig => {
  return SUPPORTED_CHAINS.find((c) => c.id === networkId) || SUPPORTED_CHAINS[0]
}

export const getClient = (networkId: string) => {
  const config = getChainConfig(networkId)
  return createPublicClient({
    chain: config.chain,
    transport: http(config.rpc)
  })
}

// SendTx params type
export type SendTxParams = {
  privateKey: string
  to: string
  value: string
  chainId: string
  gasPrice?: bigint
}

export class EVMAdapter implements VMAdapter {
  type: VMType = "EVM"

  deriveAddress(seed: string, index: number = 0): string {
    const wallet = deriveWalletFromMnemonic(seed, index)
    return wallet.address
  }

  async getBalance(address: string, chainConfig: any): Promise<string> {
    const config = chainConfig as ChainConfig
    const client = getClient(config.id)
    const balance = await client.getBalance({
      address: address as `0x${string}`
    })
    return formatEther(balance)
  }

  async sendTx(params: SendTxParams): Promise<string> {
    const config = getChainConfig(params.chainId)

    if (!config.chain) {
      throw new Error(`Chain ${params.chainId} not supported for sending yet`)
    }

    // Build account from private key
    const account = privateKeyToAccount(params.privateKey as `0x${string}`)

    // WalletClient for signing + broadcasting
    const walletClient = createWalletClient({
      account,
      chain: config.chain,
      transport: http(config.rpc)
    })

    // PublicClient for gas estimation fallback
    const publicClient = getClient(params.chainId)
    const gasPrice = params.gasPrice ?? (await publicClient.getGasPrice())

    const hash = await walletClient.sendTransaction({
      to: params.to as `0x${string}`,
      value: parseEther(params.value),
      gasPrice,
      type: "legacy"
    } as any)

    return hash
  }
}

export const VM_REGISTRY: Record<string, VMAdapter | null> = {
  EVM: new EVMAdapter(),
  SVM: null,
  BVM: null
}

export const getAdapter = (networkId: string) => {
  const config = getChainConfig(networkId)
  const adapter = VM_REGISTRY[config.vmType]

  if (!adapter) {
    throw new Error(`VM ${config.vmType} not supported yet`)
  }

  return { adapter, config }
}
