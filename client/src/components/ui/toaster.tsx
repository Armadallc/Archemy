import * as React from "react"
import { Toast, ToastProvider, ToastViewport } from "./toast"
import { useToast } from "../../hooks/use-toast"

export function Toaster() {
  const { toasts } = useToast()
  const [showBackdrop, setShowBackdrop] = React.useState(false)

  // Show backdrop when there are active toasts
  React.useEffect(() => {
    const hasOpenToasts = toasts.length > 0 && toasts.some(t => t.open)
    setShowBackdrop(hasOpenToasts)
  }, [toasts])

  return (
    <ToastProvider>
      {/* Backdrop Blur Overlay - animates with toast */}
      <div
        className="fixed inset-0 z-[99] backdrop-blur-sm transition-opacity duration-200 pointer-events-none"
        style={{
          opacity: showBackdrop ? 1 : 0,
        }}
      />
      
      {toasts.map(function ({ id, title, description, action, variant, open, ...props }) {
        // Determine what text to show - prefer title, fallback to description
        const displayText = title || description;
        
        return (
          <Toast key={id} variant={variant} open={open} duration={2000} {...props}>
            <div className="text-center whitespace-nowrap">
              {displayText && (
                <div style={{ fontSize: "26px", fontWeight: "600", lineHeight: "1.2" }}>
                  {displayText}
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