import { createPublicClient, defineChain, http } from "viem"
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

export const ALCHEMY_KEY =
  process.env.PLASMO_PUBLIC_ALCHEMY_API_KEY || process.env.ALCHEMY_API_KEY

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

export const SUPPORTED_CHAINS = [
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
    logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png"
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
    logo: "https://cryptologos.cc/logos/arbitrum-arb-logo.png"
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
    logo: "https://assets.coingecko.com/coins/images/69370/standard/base.png"
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
    logo: "https://cryptologos.cc/logos/optimism-ethereum-op-logo.png"
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
    logo: "https://cryptologos.cc/logos/polygon-matic-logo.png"
  },
  {
    id: "zksync",
    coingeckoId: "ethereum",
    name: "zkSync",
    chain: zksync,
    rpc: "https://zksync-era.api.pocket.network",
    nativeSymbol: "ETH",
    logo: "https://images.seeklogo.com/logo-png/51/1/zksync-logo-png_seeklogo-511868.png"
  },
  {
    id: "sepolia",
    coingeckoId: "ethereum",
    name: "Sepolia (Testnet)",
    chain: sepolia,
    rpc: "https://rpc.ankr.com/eth_sepolia",
    nativeSymbol: "SEP",
    logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png"
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
    logo: "https://images.seeklogo.com/logo-png/39/1/uniswap-logo-png_seeklogo-398214.png"
  }
]

export const getClient = (networkId: string) => {
  const config =
    SUPPORTED_CHAINS.find((c) => c.id === networkId) || SUPPORTED_CHAINS[0]

  return createPublicClient({
    chain: config.chain,
    transport: http(config.rpc)
  })
}

export const ethClient = getClient("ethereum")
