import { HDNodeWallet, Mnemonic } from "ethers"

/**
 * Zeno Wallet Engine
 * Converts 12-word mnemonic phrase to Ethereum wallet address.
 */
export const deriveWalletFromMnemonic = (
  mnemonic: string,
  accountIndex: number = 0
) => {
  try {
    // Mnemonic.fromPhrase will automatically validate BIP-39 mnemonic phrase
    const mnemonicObj = Mnemonic.fromPhrase(mnemonic)
    // Define Derivation Path (Derivation Path) following BIP-44 standard
    // m / purpose' / coin_type' / account' / change / address_index
    // With Ethereum, coin_type is 60'
    const path = `m/44'/60'/0'/0/${accountIndex}`
    // Create HDNodeWallet (Family tree wallet)
    const hdNode = HDNodeWallet.fromMnemonic(mnemonicObj, path)

    return {
      address: hdNode.address,
      privateKey: hdNode.privateKey,
      publicKey: hdNode.publicKey,
      index: accountIndex,
      path: path
    }
  } catch (error) {
    console.error(
      "Critical Error: Failed to derive wallet from mnemonic",
      error
    )
    throw new Error("Invalid mnemonic phrase or derivation path.")
  }
}
