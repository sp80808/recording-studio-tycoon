import * as React from "react"
import * as TogglePrimitive from "@radix-ui/react-toggle"
import { VariantProps } from "class-variance-authority"

import { toggleVariants } from "@/lib/toggle"

export interface ToggleProps
  extends React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root>,
    VariantProps<typeof toggleVariants> {}