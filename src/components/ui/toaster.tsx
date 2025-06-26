import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"
import { CheckCircle2, Info, AlertTriangle, XCircle, Loader2 } from "lucide-react"

type ToasterProps = React.ComponentProps<typeof Sonner>

export const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CheckCircle2 className="mr-2 h-5 w-5" />,
        info: <Info className="mr-2 h-5 w-5" />,
        warning: <AlertTriangle className="mr-2 h-5 w-5" />,
        error: <XCircle className="mr-2 h-5 w-5" />,
        loading: <Loader2 className="mr-2 h-5 w-5 animate-spin" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg flex items-center",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success: "!bg-green-600 !border-green-700 !text-white",
          error: "!bg-red-600 !border-red-700 !text-white",
          info: "!bg-blue-600 !border-blue-700 !text-white",
          warning: "!bg-yellow-500 !border-yellow-600 !text-black",
        },
      }}
      {...props}
    />
  )
}