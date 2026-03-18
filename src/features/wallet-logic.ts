import * as bip39 from "bip39"
import { privateKeyToAccount } from "viem/accounts"

import { deriveWalletFromMnemonic } from "~core/wallet-engine"
import { vaultSecurity } from "~features/security"

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

/**
 * Function to add a new account to the wallet
 * @param password
 * @returns updated accounts list
 */
export const addNextAccount = async (password: string) => {
  const res = await chrome.storage.local.get([
    "zeno_vault",
    "zeno_salt",
    "zeno_accounts"
  ])
  const accounts = res.zeno_accounts || []

  const mnemonic = vaultSecurity.decryptMnemonic(
    res.zeno_vault,
    password,
    res.zeno_salt
  )
  if (!mnemonic) throw new Error("Invalid password")

  const nextIndex = accounts.length // account 1 is index 0, account 2 is index 1, etc
  const wallet = deriveWalletFromMnemonic(mnemonic, nextIndex)

  const newAccounts = {
    name: `Zeno Account ${nextIndex + 1}`,
    address: wallet.address,
    index: nextIndex
  }

  const updated = [...accounts, newAccounts]
  await chrome.storage.local.set({
    zeno_accounts: updated,
    zeno_address: wallet.address
  })

  return updated
}

/**
 * Function to import an external account to the wallet
 * @param type
 * @param value
 * @param name
 * @returns updated accounts list
 */
export const importExternalAccount = async (
  type: "key" | "mnemonic",
  value: string,
  name: string
) => {
  const res = await chrome.storage.local.get(["zeno_accounts"])
  const accounts = res.zeno_accounts || []
  let address = ""
  let secretToStore = value

  if (type === "key") {
    const account = privateKeyToAccount(value as `0x${string}`)
    address = account.address
  } else {
    const wallet = deriveWalletFromMnemonic(value, 0)
    address = wallet.address
  }

  const newAccounts = {
    name: name || `Imported Account ${accounts.length + 1}`,
    address,
    type: "imported"
  }

  const updated = [...accounts, newAccounts]
  await chrome.storage.local.set({
    zeno_accounts: updated,
    zeno_address: address
  })
  return updated
}

/**
 * Function to remove an account from the wallet
 * @param addressToRemove
 * @returns updated accounts list
 */
export const removeAccount = async (addressToRemove: string) => {
  const res = await chrome.storage.local.get(["zeno_accounts", "zeno_address"])
  const accounts = res.zeno_accounts || []
  // Block deletion if the wallet only has one account remaining.
  if (accounts.length === 1) throw new Error("Cannot remove last account")

  // Filter accounts to remove the one to be deleted
  const updatedAccounts = accounts.filter(
    (a: any) => a.address.toLowerCase() !== addressToRemove.toLowerCase()
  )

  // If the deleted account was the active account, set the first account as active
  let newActiveAddress = res.zeno_address
  if (newActiveAddress.toLowerCase() === addressToRemove.toLowerCase()) {
    newActiveAddress = updatedAccounts[0].address
  }

  // save in storage
  await chrome.storage.local.set({
    zeno_accounts: updatedAccounts,
    zeno_address: newActiveAddress
  })

  return { updatedAccounts, newActiveAddress }
}
