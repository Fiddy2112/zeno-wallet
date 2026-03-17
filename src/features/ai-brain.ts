export const zenoBrain = {
  parseIntent: (input: string) => {
    const text = input.toLowerCase()

    if (
      text.includes("send") ||
      text.includes("transfer") ||
      text.includes("chuyển") ||
      text.includes("gửi")
    ) {
      const amount = text.match(/\d+(\.\d+)?/)?.[0] || null
      const address = text.match(/0x[a-fA-F0-9]{40}/)?.[0] || null
      const token = text.includes("usdt")
        ? "USDT"
        : text.includes("eth")
          ? "ETH"
          : null

      return {
        intent: "SEND",
        params: { amount, to: address, token },
        risk_analysis: {
          score: address ? 0.1 : 0.8,
          reason: address ? "Valid input" : "Missing address"
        },
        confidence: amount && address ? 1 : 0.5
      }
    }

    if (text.includes("balance") || text.includes("số dư")) {
      return {
        intent: "BALANCE_CHECK",
        params: { amount: null, to: null, token: null },
        risk_analysis: { score: 0, reason: "Safe query" },
        confidence: 0.9
      }
    }

    return {
      intent: "UNKNOWN",
      params: { amount: null, to: null, token: null },
      risk_analysis: { score: 0.5, reason: "Unknown intent" },
      confidence: 0
    }
  }
}
