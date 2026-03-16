import * as bip39 from "bip39"

/**
 * Function to generate 12 random security words
 *
 * 128 bits of entropy corresponds to 12 words.
 * @returns mnemonic phrase
 */
export const generateMnemonic = () => {
  const mnemonic = bip39.generateMnemonic().split(" ")
  return mnemonic
}
