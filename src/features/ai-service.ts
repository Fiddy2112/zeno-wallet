export const askZeno = async (userInput: string, context: any) => {
  const SYSTEM_PROMPT = `You are a helpful assistant that can answer questions about the crypto world.
    Bạn là Zeno Core, trí tuệ nhân tạo tối cao của ví Zeno Web3. Nhiệm vụ của bạn là phân tích ý định của người dùng và chuyển đổi thành lệnh thực thi (JSON).
    You are Zeno Core, the supreme artificial intelligence of the Zeno Web3 wallet. Your task is to analyze user intent and convert it into executable commands (JSON).

    Current Context:

    Network: Ethereum Sepolia

    User Address: ${context.user_address}

    Current Balance: ${context.user_balance} ETH

    Strict Rules:

    Only return data in JSON format. Do not explain anything.

    If it is a send command, must extract amount (amount) and recipient (wallet address).

    If the wallet address is invalid (does not start with 0x or has the wrong length), report the error in JSON.

    Always evaluate the risk (Risk Score) from 0 to 1 for each request.

    Output Format:
    {
    "intent": "SEND" | "SWAP" | "BALANCE_CHECK" | "UNKNOWN",
    "params": { "amount": string, "to": string, "token": string },
    "risk_analysis": { "score": number, "reason": string },
    "ai_response": "Short and sweet response for the user"
    }"
    `

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        body: JSON.stringify({
          contents: [
            { parts: [{ text: `${SYSTEM_PROMPT}\n\nUser: ${userInput}` }] }
          ]
        })
      }
    )
    const data = await response.json()
    const aiText = data.candidates[0].content.parts[0].text

    return JSON.parse(aiText)
  } catch (error) {
    return {
      intent: "UNKNOWN",
      ai_response: "System is overloaded, please try again later!"
    }
  }
}
