import React from "react"

export interface Message {
  role: "user" | "ai"
  text: string
}

export const AIMessage: React.FC<{ msg: Message }> = ({ msg }) => {
  const isAI = msg.role === "ai"
  return (
    <div
      className={`flex gap-2 ${isAI ? "justify-start" : "justify-end"} animate-fade-up`}>
      {isAI && (
        <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
          ◈
        </div>
      )}
      <div
        className={`max-w-[78%] px-3 py-2.5 rounded-2xl text-sm leading-relaxed ${
          isAI
            ? "bg-white/[0.06] text-white/90 rounded-tl-sm"
            : "bg-white text-black font-medium rounded-tr-sm"
        }`}>
        {msg.text}
      </div>
    </div>
  )
}
