export const zenoBrain = {
  parseIntent: (input: string) => {
    const text = input.toLowerCase()

    // example : "Send 0.01 eth to 0x123...."
    if (
      text.includes("send") ||
      text.includes("transfer") ||
      text.includes("chuyển") ||
      text.includes("gửi") ||
      text.includes("chuyển khoản")
    ) {
      const amount = text.match(/\d+(\.\d+)?/)?.[0]
      const address = text.match(/0x[a-fA-F0-0]{40}/)?.[0]

      return {
        action: "SEND",
        params: { amount, to: address },
        confidence: amount && address ? 1.0 : 0.5
      }
    }

    if (text.includes("balance") || text.includes("số dư")) {
      return {
        action: "VIEW_BALANCE",
        confidence: 0.9
      }
    }

    return { action: "UNKNOWN", confidence: 0 }
  }
}
