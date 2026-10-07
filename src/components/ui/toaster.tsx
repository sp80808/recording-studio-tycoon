import { useUiChromeStore, selectChromeState } from '@/stores/uiChromeStore';
import * as React from "react"
import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"
import { CheckCircle2, Info, AlertTriangle, XCircle, Loader2 } from "lucide-react"
import { useAppDisplayMode } from "@/hooks/useAppDisplayMode"
import { resolveNotificationPlacement, type NotificationLane } from "@/lib/notificationPlacement"

type ToasterProps = React.ComponentProps<typeof Sonner>

/** Phone cards sit in a centred rail clear of the notch/rounded-corner insets (tokens: styles/mobile-shell.css). */
const RAIL_SIDE = "max(12px, var(--rst-safe-left))"
const RAIL_SIDE_RIGHT = "max(12px, var(--rst-safe-right))"

/**
 * Single Sonner host. Placement comes from the shared notification policy (lib/notificationPlacement):
 * phones get one card in a safe lane chosen from the current UI chrome state; wide screens keep the
 * left-aligned stack (right-aligned cards sat on the drawer's ARM TAKE / Book Session buttons).
 * Lane geometry is CSS (`.rst-toaster--<lane>` in styles/mobile-shell.css), not pixel values here.
 */
export const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()
  const { compact, shortLandscape } = useAppDisplayMode()
  const chromeState = useUiChromeStore(selectChromeState)
  const placement = resolveNotificationPlacement(chromeState, compact, shortLandscape)
  // 'hold' never renders (cards wait in the toast bridge); keep the last visible lane's geometry for exits.
  const lane: NotificationLane = placement.lane === "hold" ? placement.criticalLane : placement.lane

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className={`toaster group rst-toaster rst-toaster--${lane}${shortLandscape ? " rst-toaster--landscape" : ""}`}
      position={compact ? "top-center" : "bottom-left"}
      offset={compact ? { top: "var(--rst-notify-top)", left: RAIL_SIDE, right: RAIL_SIDE_RIGHT } : undefined}
      mobileOffset={{ top: "var(--rst-notify-top)", left: RAIL_SIDE, right: RAIL_SIDE_RIGHT, bottom: 16 }}
      visibleToasts={placement.capacity}
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