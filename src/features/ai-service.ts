const PROXY_URL = "https://zeno-ai-proxy.vercel.app/api/chat"

export const askZeno = async (userInput: string, context: any) => {
  const SYSTEM_PROMPT = `
    You are Zeno Core, an AI inside a crypto wallet.

    Your job:
    - Understand user intent
    - Convert it into STRICT JSON

    STRICT RULES:
    - Output ONLY valid JSON
    - No explanation, no text, no markdown
    - JSON must be parsable with JSON.parse()
    - Always include ALL fields

    INTENTS:
    - SEND
    - SWAP
    - BALANCE_CHECK
    - UNKNOWN

    VALIDATION:
    - Ethereum address must start with "0x" and be 42 characters
    - If invalid → set params.to = null

    RISK:
    - score from 0 to 1
    - 0 = safe
    - 1 = very dangerous

    OUTPUT FORMAT:

    {
      "intent": "SEND" | "SWAP" | "BALANCE_CHECK" | "UNKNOWN",
      "params": {
        "amount": string | null,
        "to": string | null,
        "token": string | null
      },
      "risk_analysis": {
        "score": number,
        "reason": string
      },
      "ai_response": string
    }

    CONTEXT:
    - Network: Ethereum Sepolia
    - User address: ${context.user_address}
    - Balance: ${context.user_balance} ETH
  `

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            { parts: [{ text: `${SYSTEM_PROMPT}\n\nUser: ${userInput}` }] }
          ]
        })
      }
    )

    const data = await response.json()

    const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text || ""

    const parsed = safeParse(aiText)

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
