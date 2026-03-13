import cssText from "data-text:~style.css"
import type { PlasmoCSConfig } from "plasmo"

import { CountButton } from "~features/count-button"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"]
}

export const getStyle = (): HTMLStyleElement => {
  const baseFontSize = 16
  let updatedCssText = cssText.replaceAll(":root", ":host(plasmo-csui)")
  const remRegex = /([\d.]+)rem/g
  updatedCssText = updatedCssText.replace(remRegex, (_, remValue) => {
    return `${parseFloat(remValue) * baseFontSize}px`
  })
  const styleElement = document.createElement("style")
  styleElement.textContent = updatedCssText
  return styleElement
}

const PlasmoOverlay = () => {
  return (
    <div
      style={{
        position: "fixed",
        top: "128px",
        right: "32px",
        zIndex: 50,
        display: "flex"
      }}>
      <CountButton />
    </div>
  )
}

export default PlasmoOverlay
