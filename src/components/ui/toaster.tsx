import * as React from "react"
import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"
import { CheckCircle2, Info, AlertTriangle, XCircle, Loader2 } from "lucide-react"

type ToasterProps = React.ComponentProps<typeof Sonner>

export const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()
  // On desktop the activity drawer and session console live on the right edge; right-aligned
  // toasts sat on top of their primary buttons (ARM TAKE, Book Session). Keep toasts left there.
  const [desktop, setDesktop] = React.useState(
    () => typeof window !== "undefined" && window.matchMedia?.("(min-width: 768px)").matches
  )
  React.useEffect(() => {
    const mq = window.matchMedia?.("(min-width: 768px)")
    if (!mq) return
    const onChange = () => setDesktop(mq.matches)
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [])

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position={desktop ? "bottom-left" : "bottom-right"}
      visibleToasts={2}
      duration={3200}
      closeButton
      gap={10}
      icons={{
        success: <CheckCircle2 className="mr-2 h-5 w-5 text-[var(--rst-money)]" />,
        info: <Info className="mr-2 h-5 w-5 text-[var(--rst-brass-300)]" />,
        warning: <AlertTriangle className="mr-2 h-5 w-5 text-[var(--rst-warn)]" />,
        error: <XCircle className="mr-2 h-5 w-5 text-[var(--rst-danger)]" />,
        loading: <Loader2 className="mr-2 h-5 w-5 animate-spin" />,
      }}
      toastOptions={{
        classNames: {
          toast: "rst-toast group toast flex items-center gap-1 px-4 py-3",
          title: "text-[13px] font-bold tracking-wide",
          description: "text-xs leading-snug",
          actionButton: "rst-btn rst-btn-primary !min-h-8 !px-3 !text-xs",
          cancelButton: "rst-btn !min-h-8 !px-3 !text-xs",
          closeButton: "!border-[var(--rst-line-strong)] !bg-[var(--rst-ink-800)] !text-stone-300",
          success: "rst-toast-success",
          error: "rst-toast-error",
          info: "rst-toast-info",
          warning: "rst-toast-warning",
        },
      }}
      {...props}
    />
  )
}