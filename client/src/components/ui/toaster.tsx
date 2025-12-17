import * as React from "react"
import { Toast, ToastProvider, ToastViewport } from "./toast"
import { useToast } from "../../hooks/use-toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const isSuccess = variant === "success";
        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="grid gap-1">
              {title && (
                <div 
                  className="text-sm font-semibold"
                  style={isSuccess ? { textShadow: "0 0 8px rgba(122, 255, 254, 0.6), 0 0 12px rgba(122, 255, 254, 0.4)" } : undefined}
                >
                  {title}
                </div>
              )}
              {description && (
                <div 
                  className="text-sm opacity-90"
                  style={isSuccess ? { textShadow: "0 0 6px rgba(122, 255, 254, 0.5), 0 0 10px rgba(122, 255, 254, 0.3)" } : undefined}
                >
                  {description}
                </div>
              )}
            </div>
            {action}
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}