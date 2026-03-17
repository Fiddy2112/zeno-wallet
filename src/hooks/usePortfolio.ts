import { ethers } from "ethers"
import { useEffect, useState } from "react"

const COINGECKO_PLATFORM: Record<string, string> = {
  ethereum: "ethereum",
  polygon: "polygon-pos",
  arbitrum: "arbitrum-one",
  optimism: "optimistic-ethereum",
  base: "base"
}

const ALCHEMY_KEY =
  process.env.PLASMO_PUBLIC_ALCHEMY_API_KEY || process.env.ALCHEMY_API_KEY

const SUPPORTED_CHAINS = [
  {
    id: "ethereum",
    coingeckoId: "ethereum",
    name: "Ethereum",
    rpc: `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
    alchemyUrl: `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
    nativeSymbol: "ETH",
    logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png"
  },
  {
    id: "bsc",
    coingeckoId: "binancecoin",
    name: "BNB Chain",
    rpc: "https://rpc.ankr.com/bsc",
    nativeSymbol: "BNB",
    logo: "https://cryptologos.cc/logos/binance-coin-bnb-logo.png"
  },
  {
    id: "arbitrum",
    coingeckoId: "ethereum",
    name: "Arbitrum",
    rpc: `https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
    alchemyUrl: `https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
    nativeSymbol: "ETH",
    logo: "https://cryptologos.cc/logos/arbitrum-arb-logo.png"
  },
  {
    id: "optimism",
    coingeckoId: "ethereum",
    name: "Optimism",
    rpc: `https://opt-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
    alchemyUrl: `https://opt-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
    nativeSymbol: "ETH",
    logo: "https://cryptologos.cc/logos/optimism-ethereum-op-logo.png"
  },
  {
    id: "polygon",
    coingeckoId: "matic-network",
    name: "Polygon",
    rpc: `https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
    alchemyUrl: `https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
    nativeSymbol: "MATIC",
    logo: "https://cryptologos.cc/logos/polygon-matic-logo.png"
  },
  {
    id: "base",
    coingeckoId: "ethereum",
    name: "Base",
    rpc: `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
    alchemyUrl: `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
    nativeSymbol: "ETH",
    logo: "https://assets.coingecko.com/coins/images/69370/standard/base.png"
  }
]

export type TokenInfo = {
  symbol: string
  address: string
  balance: number
  price: number
  usdValue: number
  logo?: string
}

export type NetworkGroup = {
  chainId: string
  chainName: string
  chainLogo: string
  totalUsd: number
  tokens: TokenInfo[]
}

export const useNetworkPortfolio = (walletAddress?: string) => {
  const [networkGroups, setNetworkGroups] = useState<NetworkGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!walletAddress || !ethers.isAddress(walletAddress)) {
      setIsLoading(false)
      return
    }

    let cancelled = false

    async function fetchPortfolio() {
      setIsLoading(true)

      try {
        // Fetch native prices
        const coingeckoIds = Array.from(
          new Set(SUPPORTED_CHAINS.map((c) => c.coingeckoId))
        ).join(",")

        const prices = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoIds}&vs_currencies=usd`
        ).then((r) => r.json())

        const results = await Promise.all<NetworkGroup | null>(
          SUPPORTED_CHAINS.map(async (chain) => {
            try {
              const provider = new ethers.JsonRpcProvider(chain.rpc)

              let chainTokens: TokenInfo[] = []
              let chainTotalUsd = 0

              // ===== Native =====
              const nativeBal = await provider.getBalance(walletAddress)
              const native = Number(ethers.formatEther(nativeBal))
              const nativePrice = prices[chain.coingeckoId]?.usd || 0

              if (native > 0) {
                const usd = native * nativePrice
                chainTotalUsd += usd

                chainTokens.push({
                  symbol: chain.nativeSymbol,
                  address: "native",
                  balance: native,
                  price: nativePrice,
                  usdValue: usd,
                  logo: chain.logo
                })
              }

              // ===== ERC20 =====
              if (chain.alchemyUrl && ALCHEMY_KEY) {
                const res = await fetch(chain.alchemyUrl, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    jsonrpc: "2.0",
                    method: "alchemy_getTokenBalances",
                    params: [walletAddress],
                    id: 1
                  })
                }).then((r) => r.json())

                const tokens = res?.result?.tokenBalances || []

                const filtered = tokens
                  .filter((t: any) => t.tokenBalance !== "0x0")
                  .slice(0, 20)

                // metadata parallel
                const metaTokens = await Promise.all(
                  filtered.map(async (t: any) => {
                    try {
                      const meta = await fetch(chain.alchemyUrl!, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          jsonrpc: "2.0",
                          method: "alchemy_getTokenMetadata",
                          params: [t.contractAddress],
                          id: 1
                        })
                      })
                        .then((r) => r.json())
                        .then((d) => d.result)

                      if (!meta?.decimals) return null

                      const balance = Number(
                        ethers.formatUnits(t.tokenBalance, meta.decimals)
                      )

                      if (balance <= 0) return null

                      return {
                        address: t.contractAddress.toLowerCase(),
                        symbol: meta.symbol,
                        balance,
                        price: 0,
                        usdValue: 0,
                        logo: meta.logo
                      }
                    } catch {
                      return null
                    }
                  })
                )

                const cleanTokens = metaTokens.filter(Boolean) as TokenInfo[]

                // ===== Prices =====
                if (cleanTokens.length > 0) {
                  const platform = COINGECKO_PLATFORM[chain.id]

                  if (platform) {
                    const addresses = cleanTokens
                      .map((t) => t.address)
                      .join(",")

                    const priceData = await fetch(
                      `https://api.coingecko.com/api/v3/simple/token_price/${platform}?contract_addresses=${addresses}&vs_currencies=usd`
                    )
                      .then((r) => r.json())
                      .catch(() => ({}))

                    const priceObj =
                      priceData && typeof priceData === "object"
                        ? priceData
                        : {}

                    cleanTokens.forEach((t) => {
                      const p = priceObj[t.address]?.usd || 0
                      t.price = p
                      t.usdValue = t.balance * p
                    })

                    // filter rác
                    const valuable = cleanTokens.filter(
                      (t) => t.usdValue > 0.01
                    )

                    valuable.forEach((t) => {
                      chainTotalUsd += t.usdValue
                    })

                    chainTokens.push(...valuable)
                  }
                }
              }

              if (chainTokens.length === 0) return null

              return {
                chainId: chain.id,
                chainName: chain.name,
                chainLogo: chain.logo,
                totalUsd: chainTotalUsd,
                tokens: chainTokens.sort((a, b) => b.usdValue - a.usdValue)
              }
            } catch {
              return null
            }
          })
        )

        if (!cancelled) {
          setNetworkGroups(
            results
              .filter(Boolean)
              .sort((a, b) => b!.totalUsd - a!.totalUsd) as NetworkGroup[]
          )
        }
      } catch (err) {
        console.error("Portfolio error:", err)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    fetchPortfolio()

    return () => {
      cancelled = true
    }
  }, [walletAddress])

  return { networkGroups, isLoading }
}
