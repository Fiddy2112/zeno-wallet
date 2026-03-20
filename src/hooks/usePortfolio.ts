import { useEffect, useState } from "react"
import { formatUnits, isAddress } from "viem"

import { getAdapter, SUPPORTED_CHAINS } from "~core/networks"

const COINGECKO_PLATFORM: Record<string, string> = {
  ethereum: "ethereum",
  polygon: "polygon-pos",
  arbitrum: "arbitrum-one",
  optimism: "optimistic-ethereum",
  base: "base"
}

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

// Multi VM
export const useNetworkPortfolio = (walletAddress?: string) => {
  const [networkGroups, setNetworkGroups] = useState<NetworkGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!walletAddress || !isAddress(walletAddress)) {
      setIsLoading(false)
      setNetworkGroups([])
      return
    }

    let cancelled = false

    const controller = new AbortController()

    async function fetchPortfolio() {
      setIsLoading(true)

      try {
        // Fetch native prices (Coingecko)
        const coingeckoIds = Array.from(
          new Set(SUPPORTED_CHAINS.map((c) => c.coingeckoId))
        ).join(",")
        const prices: Record<string, { usd: number }> = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoIds}&vs_currencies=usd`,
          { signal: controller.signal }
        ).then((r) => r.json())

        // Loop each chain
        const results = await Promise.all<NetworkGroup | null>(
          SUPPORTED_CHAINS.map(async (chain) => {
            try {
              const { adapter, config } = getAdapter(chain.id)
              let tokens: TokenInfo[] = []
              let totalUsd = 0

              // Native token
              const nativeBalanceStr = await adapter.getBalance(
                walletAddress,
                config
              )
              const nativeBalanceNum = parseFloat(nativeBalanceStr)
              if (nativeBalanceNum > 0.000001) {
                const nativePrice = prices[chain.coingeckoId]?.usd || 0
                const usdValue = nativeBalanceNum * nativePrice
                totalUsd += usdValue

                tokens.push({
                  symbol: chain.nativeSymbol,
                  address: "native",
                  balance: nativeBalanceNum,
                  price: nativePrice,
                  usdValue,
                  logo: chain.logo
                })
              }

              // ERC20 tokens only for EVM
              if (config.vmType === "EVM" && chain.alchemyUrl) {
                // Alchemy batch fetch
                const tokenRes = await fetch(chain.alchemyUrl, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    jsonrpc: "2.0",
                    method: "alchemy_getTokenBalances",
                    params: [walletAddress],
                    id: 1
                  })
                })
                  .then((r) => r.json())
                  .catch(() => null)

                const tokenBalances = tokenRes?.result?.tokenBalances || []
                const filtered = tokenBalances
                  .filter((t: any) => t.tokenBalance !== "0x0")
                  .slice(0, 20)

                // batch metadata fetch
                const metaPromises = filtered.map(async (t: any) => {
                  try {
                    const metaRes = await fetch(chain.alchemyUrl!, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        jsonrpc: "2.0",
                        method: "alchemy_getTokenMetadata",
                        params: [t.contractAddress],
                        id: 1
                      })
                    }).then((r) => r.json())

                    const meta = metaRes?.result
                    if (!meta?.decimals) return null
                    const balance = parseFloat(
                      formatUnits(BigInt(t.tokenBalance), meta.decimals)
                    )
                    if (balance <= 0) return null

                    return {
                      address: t.contractAddress.toLowerCase(),
                      symbol: meta.symbol,
                      balance,
                      price: 0,
                      usdValue: 0,
                      logo: meta.logo
                    } as TokenInfo
                  } catch {
                    return null
                  }
                })

                const erc20Tokens = (await Promise.all(metaPromises)).filter(
                  Boolean
                ) as TokenInfo[]

                // fetch ERC20 prices
                const platform = COINGECKO_PLATFORM[chain.id]
                if (platform && erc20Tokens.length) {
                  const addresses = erc20Tokens.map((t) => t.address).join(",")
                  const priceData = await fetch(
                    `https://api.coingecko.com/api/v3/simple/token_price/${platform}?contract_addresses=${addresses}&vs_currencies=usd`
                  )
                    .then((r) => r.json())
                    .catch(() => ({}))

                  erc20Tokens.forEach((t) => {
                    const p = priceData[t.address]?.usd || 0
                    t.price = p
                    t.usdValue = t.balance * p
                  })

                  const valuable = erc20Tokens.filter((t) => t.usdValue > 0.01)
                  valuable.forEach((t) => {
                    totalUsd += t.usdValue
                  })
                  tokens.push(...valuable)
                }
              }

              if (!tokens.length) return null
              return {
                chainId: chain.id,
                chainName: chain.name,
                chainLogo: chain.logo,
                totalUsd,
                tokens: tokens.sort((a, b) => b.usdValue - a.usdValue)
              }
            } catch {
              return null
            }
          })
        )
        if (!controller.signal.aborted) {
          setNetworkGroups(
            results
              .filter(Boolean)
              .sort((a, b) => b!.totalUsd - a!.totalUsd) as NetworkGroup[]
          )
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return
        console.error("Portfolio error:", err)
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    fetchPortfolio()
    return () => controller.abort()
  }, [walletAddress])

  return { networkGroups, isLoading }
}
