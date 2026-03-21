import {
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  CheckCheck,
  Info,
  Shield,
  Trash2,
  TrendingUp,
  X
} from "lucide-react"
import React, { useEffect, useState } from "react"
import { notifyStorage, type ZenoNotif, type ZenoNotifType } from "~features/notifications";


// Icon per type

const TypeIcon: React.FC<{ type: ZenoNotifType; read: boolean }> = ({ type, read }) => {
  const base = `w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0`
  const dim = read ? "opacity-40" : ""
  switch (type) {
    case "received":
      return <div className={`${base} bg-emerald-400/15 ${dim}`}><ArrowDownLeft className="w-4 h-4 text-emerald-400" /></div>
    case "sent":
      return <div className={`${base} bg-blue-400/15 ${dim}`}><ArrowUpRight className="w-4 h-4 text-blue-400" /></div>
    case "price_alert":
      return <div className={`${base} bg-yellow-400/15 ${dim}`}><TrendingUp className="w-4 h-4 text-yellow-400" /></div>
    case "security":
      return <div className={`${base} bg-red-400/15 ${dim}`}><Shield className="w-4 h-4 text-red-400" /></div>
    default:
      return <div className={`${base} bg-white/10 ${dim}`}><Info className="w-4 h-4 text-white/40" /></div>
  }
}

const formatTime = (ts: number) => {
  const diff = Date.now() - ts
  if (diff < 60_000) return "Just now"
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return new Date(ts).toLocaleDateString()
}

// Modal

interface ModalProps {
  onClose: () => void
  onUnreadChange: (count: number) => void
}

const NotificationModal: React.FC<ModalProps> = ({ onClose, onUnreadChange }) => {
  const [notifs, setNotifs] = useState<ZenoNotif[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    notifyStorage.getAll().then((all) => {
      setNotifs(all)
      setLoading(false)
    })
  }, [])

  const handleMarkRead = async (id: string) => {
    await notifyStorage.markRead(id)
    setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n))
    const unread = notifs.filter((n) => !n.read && n.id !== id).length
    onUnreadChange(unread)
  }

  const handleMarkAllRead = async () => {
    await notifyStorage.markAllRead()
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })))
    onUnreadChange(0)
  }

  const handleClearAll = async () => {
    await notifyStorage.clearAll()
    setNotifs([])
    onUnreadChange(0)
  }

  const unreadCount = notifs.filter((n) => !n.read).length

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div className="relative bg-[#111] border-t border-white/10 rounded-t-3xl animate-fade-up flex flex-col" style={{ maxHeight: "80%" }}>

        {/* Handle */}
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mt-3 flex-shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <h3 className="text-white font-black text-sm uppercase tracking-widest">Notifications</h3>
            {unreadCount > 0 && (
              <span className="bg-emerald-400 text-black text-[10px] font-black px-1.5 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-[10px] text-white/40 hover:text-white/70 transition-colors font-bold">
                <CheckCheck className="w-3.5 h-3.5" />
                Read all
              </button>
            )}
            {notifs.length > 0 && (
              <button
                onClick={handleClearAll}
                className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center hover:bg-red-500/20 hover:text-red-400 text-white/30 transition-all">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all">
              <X className="w-3.5 h-3.5 text-white/60" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-4 pb-5 custom-scrollbar">
          {loading ? (
            <div className="space-y-3 pt-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-white/[0.02] rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : notifs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                <Bell className="w-5 h-5 text-white/15" />
              </div>
              <p className="text-white/20 text-xs">No notifications yet</p>
              <p className="text-white/10 text-[10px] text-center leading-relaxed">
                You'll see balance changes and transaction updates here
              </p>
            </div>
          ) : (
            <div className="space-y-1 pt-1">
              {notifs.map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => !notif.read && handleMarkRead(notif.id)}
                  className={`w-full flex items-start gap-3 p-3 rounded-2xl transition-all text-left ${
                    notif.read
                      ? "opacity-50 cursor-default"
                      : "hover:bg-white/[0.04] cursor-pointer"
                  }`}>
                  <TypeIcon type={notif.type} read={notif.read} />
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className={`text-xs font-bold truncate ${notif.read ? "text-white/40" : "text-white"}`}>
                        {notif.title}
                      </p>
                      {!notif.read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-white/30 text-[10px] leading-relaxed line-clamp-2">
                      {notif.message}
                    </p>
                    <p className="text-white/15 text-[10px] mt-1">{formatTime(notif.timestamp)}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Bell button (used in top bar)

interface BellProps {
  className?: string
}

export const NotificationBell: React.FC<BellProps> = ({ className }) => {
  const [unread, setUnread] = useState(0)
  const [open, setOpen] = useState(false)

  // Load unread count on mount + listen for changes
  useEffect(() => {
    const load = async () => {
      const count = await notifyStorage.unreadCount()
      setUnread(count)
    }
    load()

    const listener = () => load()
    chrome.storage.onChanged.addListener(listener)
    return () => chrome.storage.onChanged.removeListener(listener)
  }, [])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`relative w-7 h-7 flex items-center justify-center text-white/30 hover:text-white/70 transition-colors rounded-full hover:bg-white/10 ${className}`}>
        <Bell className="w-3.5 h-3.5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 text-black text-[8px] font-black rounded-full flex items-center justify-center leading-none">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <NotificationModal
          onClose={() => setOpen(false)}
          onUnreadChange={setUnread}
        />
      )}
    </>
  )
}