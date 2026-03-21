import { toast } from "react-toastify"

export type ZenoNotifType =
  | "received"    // received token
  | "sent"        // sent token confirmed
  | "price_alert" // price alert
  | "security"    // security alert
  | "system"      // system notification

export interface ZenoNotif {
  id:string
  type:ZenoNotifType
  title: string
  message: string
  timestamp: number
  read: boolean
  chainId?: string
  txHash?: string
  amount?: string
  symbol?: string
}

const STORAGE_KEY = "zeno_notifications"
const LAST_BALANCE_KEY = "zeno_last_balances"
const NOTIF_ENABLED_KEY = "zeno_notif_enabled"
const MAX_NOTIFS = 50

// notify with toastify
export const notify = {
  success: (info: string, mode?: "dark" | "light", duration?: number) => {
    toast.success(info, {
      position: "top-right",
      autoClose: duration || 5000,
      hideProgressBar: false,
      closeOnClick: false,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: mode || "light"
    })
  },
  error: (info: string, mode?: "dark" | "light", duration?: number) => {
    toast.error(info, {
      position: "top-right",
      autoClose: duration || 5000,
      hideProgressBar: false,
      closeOnClick: false,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: mode || "light"
    })
  },
  warning: (info: string, mode?: "dark" | "light", duration?: number) => {
    toast.warn(info, {
      position: "top-right",
      autoClose: duration || 5000,
      hideProgressBar: false,
      closeOnClick: false,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: mode || "light"
    })
  },
  info: (info: string, mode?: "dark" | "light", duration?: number) => {
    toast.info(info, {
      position: "top-right",
      autoClose: duration || 5000,
      hideProgressBar: false,
      closeOnClick: false,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: mode || "light"
    })
  }
}

export const notifyStorage = {
  getAll : async():Promise<ZenoNotif[]> =>{
    const res = await chrome.storage.local.get(STORAGE_KEY)
    return res[STORAGE_KEY] || []
  },
  add: async (notif: Omit<ZenoNotif, "id" | "timestamp" | "read">) =>{
    const all = await notifyStorage.getAll()
    const newNotif: ZenoNotif ={
      ...notif,
      id:`notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
      read:false
    }

    const updated = [newNotif, ...all].slice(0, MAX_NOTIFS)
    await chrome.storage.local.set({
      [STORAGE_KEY]: updated
    })
    return newNotif
  },
  markRead: async(id:string)=>{
    const all = await notifyStorage.getAll()
    await chrome.storage.local.set({
      [STORAGE_KEY]: all.map((n) => n.id === id ? {...n, read: true}: n)
    })
  },
  markAllRead: async ()=>{
    const all = await notifyStorage.getAll()
    await chrome.storage.local.set({
      [STORAGE_KEY]:all.map((n)=>({...n, read:true}))
    })
  },
  clearAll : async ()=>{
    await chrome.storage.local.set({[STORAGE_KEY]:[]})
  },
  unreadCount: async ():Promise<number> =>{
    const all = await notifyStorage.getAll()
    return all.filter((n)=> !n.read).length
  }
}

// balance checker

export const checkBalanceChanges = async(address:string, currentBalances: Record<string, number>)=>{
  const enabled = await chrome.storage.local.get(NOTIF_ENABLED_KEY)
  if(enabled[NOTIF_ENABLED_KEY] === false) return // notify disabled

  const res = await chrome.storage.local.get(LAST_BALANCE_KEY)
  const lastBalances: Record<string,number> = res[LAST_BALANCE_KEY] || {}

  for(const [chainId, currentUsd] of Object.entries(currentBalances)){
    const lastUsd = lastBalances[chainId]
    if(lastUsd === undefined) continue

    const diff = currentUsd - lastUsd
    const absDiff = Math.abs(diff)

    // only notify if change > $0.50
    if(absDiff < 0.5) continue

    if(diff> 0){
      await notifyStorage.add({
        type: "received",
        title: "Funds Received",
        message: `Your balance on ${chainId} increased by ~$${absDiff.toFixed(2)}`,
        chainId,
        amount: absDiff.toFixed(2),
        symbol: "USD"
      })
    }else{
      await notifyStorage.add({
        type: "sent",
        title: "Transaction Confirmed",
        message: `Your balance on ${chainId} decreased by ~$${absDiff.toFixed(2)}`,
        chainId,
        amount: absDiff.toFixed(2),
        symbol: "USD"
      })
    }
  }
  // Save current as last
  await chrome.storage.local.set({ [LAST_BALANCE_KEY]: currentBalances })
}

// Add tx notify manualy
export const addTxNotification = async(type: "sent"| "received", amount:string, symbol: string, chainId:string, txHash:string)=>{
  const short = `${txHash.slice(0, 8)}...${txHash.slice(-6)}`
  await notifyStorage.add({
    type,
    title: type === "sent" ? "Transaction Sent" : "Transaction Received",
    message: type === "sent"
      ? `Sent ${amount} ${symbol} · ${short}`
      : `Received ${amount} ${symbol} · ${short}`,
    chainId,
    txHash,
    amount,
    symbol
  })
}
