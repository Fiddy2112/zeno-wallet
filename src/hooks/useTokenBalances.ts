import { erc20Abi, formatUnits } from "viem"

import { getClient, SUPPORTED_CHAINS } from "~core/networks"

export const fetchAllBalances = async (
  walletAddress: `0x${string}`,
  chainKey: keyof typeof SUPPORTED_CHAINS,
  tokenList: { address: string; decimals: number; symbol: string }[]
) => {
  const client = getClient(chainKey)

  const contracts = tokenList.map((token) => ({
    address: token.address as `0x${string}`,
    abi: erc20Abi as any,
    functionName: "balanceOf",
    args: [walletAddress]
  }))

  const results = await client.multicall({
    contracts,
    allowFailure: true
  } as any)

  return tokenList.map((token, i) => {
    const rawBalance = (results[i].result as bigint) || 0n
    return {
      ...token,
      balance: formatUnits(rawBalance, token.decimals),
      rawBalance
    }
  })
}
