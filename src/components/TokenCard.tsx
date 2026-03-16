import React from "react"

import type { Token } from "~types"

interface Props {
  token: Token
}

export const TokenCard: React.FC<Props> = ({ token }) => {
  const positive = token.change >= 0
  return (
    <div className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/[0.03] transition-all duration-200 group cursor-pointer">
      {/* Icon */}
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0 font-bold"
        style={{ background: token.color + "22", color: token.color }}>
        <img
          src={token.img}
          alt={token.name}
          className="w-full h-full object-contain rounded-full"
        />
      </div>

      {/* Name + balance */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-white">{token.name}</span>
          <span className="text-sm font-semibold text-white">{token.usd}</span>
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <span className="text-xs text-white/40">
            {token.balance} {token.symbol}
          </span>
          <span
            className={`text-xs font-medium ${positive ? "text-emerald-400" : "text-red-400"}`}>
            {positive ? "+" : ""}
            {token.change.toFixed(2)}%
          </span>
        </div>
      </div>
    </div>
  )
}
