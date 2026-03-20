// API Proxy AI
const PROXY_URL = "https://zeno-ai-proxy.vercel.app/api/chat"

export const askZeno = async (userInput: string, context: any) => {
  try {
    const response = await fetch(PROXY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: userInput,
        context: {
          user_address: context.user_address,
          user_balance: context.user_balance,
          conversation_history: context.conversation_history || ""
        }
      })
    })

    const parsed = await response.json()
    if (!parsed) return fallback("Parse failed")
    return normalizeAI(parsed)
  } catch {
    return fallback("System error")
  }
}

function fallback(reason: string) {
  return {
    intent: "UNKNOWN",
    params: { amount: null, to: null, token: null },
    risk_analysis: { score: 0.5, reason },
    ai_response: "⚠️ AI error, try again"
  }
}

function safeParse(text: string) {
  try {
    const start = text.indexOf("{")
    const end = text.lastIndexOf("}") + 1
    return JSON.parse(text.slice(start, end))
  } catch {
    return null
  }
}

function normalizeAI(data: any) {
  return {
    intent: data.intent || "UNKNOWN",
    params: {
      amount: data?.params?.amount || null,
      to: data?.params?.to || null,
      token: data?.params?.token || null
    },
    risk_analysis: {
      score: data?.risk_analysis?.score ?? 0.5,
      reason: data?.risk_analysis?.reason || "Unknown"
    },
    ai_response: data.ai_response || "No response"
  }
}
