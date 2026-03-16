import { createPublicClient, http } from "viem"
import { arbitrum, base, mainnet, sepolia, zksync } from "viem/chains"

export const SUPPORTED_CHAINS = {
  ethereum: {
    chain: mainnet,
    rpc: "https://eth.llamarpc.com"
  },
  arbitrum: {
    chain: arbitrum,
    rpc: "https://arbitrum.llamarpc.com"
  },
  base: { chain: base, rpc: "https://base.llamarpc.com" },
  sepolia: {
    chain: sepolia,
    rpc: "https://rpc.ankr.com/eth_sepolia"
  },
  zksync: {
    chain: zksync,
    rpc: "https://mainnet.era.zksync.io"
  }
}

export const getClient = (chainId: keyof typeof SUPPORTED_CHAINS) => {
  const config = SUPPORTED_CHAINS[chainId]
  return createPublicClient({
    chain: config.chain,
    transport: http(config.rpc)
  })
}
