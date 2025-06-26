import * as React from "react"

import { cn } from "@/lib/utils"
import { badgeVariants } from "@/lib/badge"
import { BadgeProps } from "@/types/badge"

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge }