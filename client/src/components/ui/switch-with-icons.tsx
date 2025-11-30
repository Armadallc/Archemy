import * as React from "react"
import { Switch } from './motion-switch'

interface SwitchWithIconsProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
  'aria-label'?: string
}

export function SwitchWithIcons({ 
  checked, 
  onCheckedChange, 
  disabled,
  className,
  size = 'md',
  'aria-label': ariaLabel
}: SwitchWithIconsProps) {
  return (
    <Switch
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      size={size}
      className={`!h-[17px] !w-[32px] !max-h-[17px] !min-h-[17px] flex-shrink-0 [&_span]:!data-[state=checked]:translate-x-[16px] ${className || ''}`}
      aria-label={ariaLabel}
    />
  )
}
