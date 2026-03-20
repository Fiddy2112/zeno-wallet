import { erc20Abi, formatUnits } from "viem"

import { getClient } from "~core/networks"

export const fetchAllBalances = async (
  walletAddress: `0x${string}`,
  chainId: string,
  tokenList: { address: string; decimals: number; symbol: string }[]
) => {
  const client = getClient(chainId)

  const contracts = tokenList.map((token) => ({
    address: token.address as `0x${string}`,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [walletAddress]
  }))

  const results = await client.multicall({
    contracts,
    allowFailure: true
  } as any)

  return tokenList.map((token, i) => {
    const rawBalance =
      results[i].status === "success" ? (results[i].result as bigint) || 0n : 0n
    return {
      ...token,
      balance: formatUnits(rawBalance, token.decimals),
      rawBalance
    }
  })
}
