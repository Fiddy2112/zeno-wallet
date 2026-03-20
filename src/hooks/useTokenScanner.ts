import { useEffect, useState } from "react"

export const useTokenScanner = (address: string) => {
  const [tokens, setTokens] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const apiKey = process.env.PLASMO_PUBLIC_ALCHEMY_API_KEY

  const scanTokens = async () => {
    if (!address) return
    setLoading(true)
    try {
      const response = await fetch(
        `https://eth-mainnet.g.alchemy.com/v2/${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            jsonrpc: "2.0",
            method: "alchemy_getTokenBalances",
            params: [address],
            id: 42
          })
        }
      )
      const data = await response.json()
      setTokens(data.result?.tokenBalances || [])
    } catch (error) {
      console.error("Scan failed", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    scanTokens()
  }, [address])

  return {
    tokens,
    scanTokens,
    loading
  }
}
