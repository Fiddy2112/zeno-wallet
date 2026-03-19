import { List } from "react-window"

import { TokenCard } from "~components/TokenCard"
import { mapToToken } from "~types"

const VirtualizedTokenList = ({ tokens, chainId }) => {
  const ITEM_HEIGHT = 48

  return (
    <List
      height={Math.min(300, tokens.length * ITEM_HEIGHT)}
      itemCount={tokens.length}
      itemSize={ITEM_HEIGHT}
      width="100%">
      {({ index, style }: { index: any; style: any }) => {
        const token = tokens[index]
        return (
          <div style={style}>
            <TokenCard
              key={token.address || `${chainId}-${token.symbol}-${index}`}
              token={mapToToken(token)}
            />
          </div>
        )
      }}
    </List>
  )
}

export default VirtualizedTokenList
