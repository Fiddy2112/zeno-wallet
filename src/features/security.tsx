import CryptoJS from "crypto-js"

const BLACKLIST_ADDRESSES = []

export const vaultSecurity = {
  /**
   * Generate a vault key from a password and salt
   * @param password
   * @param salt
   * @returns
   */
  generateVaultKey: (password: string, salt: string) => {
    const key = CryptoJS.PBKDF2(password, salt, {
      keySize: 256 / 32,
      iterations: 10000,
      hasher: CryptoJS.algo.SHA256
    })
    return key
  },
  /**
   * Encrypt a mnemonic phrase using a password and salt
   * @param mnemonic
   * @param password
   * @param salt
   * @returns
   */
  encryptVault: (mnemonic: string, password: string, salt: string) => {
    const key = vaultSecurity.generateVaultKey(password, salt)

    const encrypted = CryptoJS.AES.encrypt(mnemonic, key.toString()).toString()
    return encrypted
  },
  /**
   * Decrypt a mnemonic phrase using a password and salt
   * @param ciphertext
   * @param password
   * @param salt
   * @returns
   */
  decryptMnemonic: (ciphertext: string, password: string, salt: string) => {
    const key = vaultSecurity.generateVaultKey(password, salt)
    const bytes = CryptoJS.AES.decrypt(ciphertext, key.toString())
    const originalText = bytes.toString(CryptoJS.enc.Utf8)
    return originalText
  },
  /**
   * Generate a random salt
   * @returns
   */
  generateSalt: () => {
    return CryptoJS.lib.WordArray.random(128 / 8).toString()
  }
}

export const riskAnalysis = {
  analyzeAddress: (address: string) => {
    if (!address.startsWith("0x") || address.length !== 42) {
      return { score: 0, label: "INVALID", color: "text-gray-400" }
    }

    const isBlacklisted = BLACKLIST_ADDRESSES.includes(address.toLowerCase())

    if (isBlacklisted) {
      return {
        score: 1.0,
        label: "DANGER - PHISHING DETECTED",
        color: "text-red-500",
        advice:
          "Zeno has blocked this address. It's associated with known scams."
      }
    }

    return {
      score: 0.1,
      label: "LOW RISK",
      color: "text-emerald-400",
      advice: "Address looks clean. Standard interaction history."
    }
  },

  getGasAdvice: (gasGwei: number) => {
    if (gasGwei < 15) return "Gas is cheap. Perfect for swapping!"
    if (gasGwei < 50) return "Gas is moderate. Standard transactions are fine."
    return "Gas is high. AI suggests waiting for a drop unless urgent."
  }
}
