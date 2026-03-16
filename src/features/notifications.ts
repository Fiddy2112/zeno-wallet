import { toast } from "react-toastify"

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
