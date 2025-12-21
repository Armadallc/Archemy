import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "../../lib/utils"

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, style, checked, ...props }, ref) => {
  const switchRef = React.useRef<HTMLButtonElement>(null);
  const combinedRef = React.useCallback(
    (node: HTMLButtonElement) => {
      switchRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    },
    [ref]
  );

  // Update background color based on checked state and theme
  React.useEffect(() => {
    if (switchRef.current) {
      // Always charcoal background
      switchRef.current.style.backgroundColor = 'var(--color-charcoal, #1a1a1a)';
      // Aqua border
      switchRef.current.style.borderColor = 'var(--color-aqua, #3bfec9)';
    }
  }, [checked]);

  return (
    <SwitchPrimitives.Root
      className={cn(
        "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      style={{
        backgroundColor: checked ? 'var(--color-charcoal, #1a1a1a)' : 'var(--color-charcoal, #1a1a1a)', // Charcoal background always
        borderColor: 'var(--color-aqua, #3bfec9)', // Aqua border
        ...style,
      }}
      checked={checked}
      {...props}
      ref={combinedRef}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          "pointer-events-none block h-4 w-4 rounded-full shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0"
        )}
        style={{
          backgroundColor: 'var(--border)',
        }}
      />
    </SwitchPrimitives.Root>
  );
})
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
