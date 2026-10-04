import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

// RST-authored styling for the console fader/slider (issue #254 provenance
// audit: written independently on top of the Radix primitive).
const rootStyle = "relative flex w-full touch-none select-none items-center py-2"
const trackStyle = "relative h-4 w-full grow overflow-hidden rounded-full bg-stone-800"
const rangeStyle = "absolute h-full rounded-full bg-primary transition-all duration-200"
const thumbStyle = [
  "block h-5 w-5 rounded-full border-2 border-primary bg-white shadow-md",
  "ring-offset-stone-950 transition-[transform,box-shadow,border-color] duration-150",
  "hover:bg-stone-50 active:scale-110",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
  "focus-visible:ring-offset-2 focus-visible:scale-125",
  "disabled:pointer-events-none disabled:opacity-50",
].join(" ")

type SliderProps = React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(function Slider({ className, ...rest }, forwardedRef) {
  return (
    <SliderPrimitive.Root
      ref={forwardedRef}
      className={cn(rootStyle, className)}
      {...rest}
    >
      <SliderPrimitive.Track className={trackStyle}>
        <SliderPrimitive.Range className={rangeStyle} />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className={thumbStyle} />
    </SliderPrimitive.Root>
  )
})

export { Slider }
