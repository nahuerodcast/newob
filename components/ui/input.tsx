import * as React from "react"
import { cn } from "@/lib/utils"
import { colors } from "@/lib/theme"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  disabled?: boolean
  error?: boolean
  isFocused?: boolean
  hasIcon?: boolean
  iconPosition?: 'left' | 'right'
  bold?: boolean
  icon?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    type, 
    disabled = false,
    error = false,
    isFocused = false,
    hasIcon = false,
    iconPosition = 'left',
    bold = false,
    icon,
    ...props 
  }, ref) => {
    const [focused, setFocused] = React.useState(false)

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setFocused(true)
      props.onFocus?.(e)
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setFocused(false)
      props.onBlur?.(e)
    }

    const isInputFocused = isFocused || focused

    return (
      <div className={cn(
        "flex flex-row items-center w-full rounded-xl border border-[#e3e3e3]",
        disabled ? "bg-[#F8F8F8]" : "bg-white",
        className
      )}>
        {icon && iconPosition === 'left' && (
          <div className="flex items-center justify-center pl-3">
            {icon}
          </div>
        )}
        
        <input
          type={type}
          className={cn(
            "flex-1 h-12 px-4 text-sm bg-transparent border-0 outline-none",
            "placeholder:text-gray-400 disabled:cursor-not-allowed",
            bold ? "font-bold" : "font-normal",
            error && !isInputFocused ? "text-[#FF6961]" : "text-black",
            "tracking-[0.4px]"
          )}
          style={{
            backgroundColor: disabled ? colors.alabaster : colors.white,
            borderRadius: '12px',
            fontSize: '12px',
            letterSpacing: '0.4px',
            height: '48px',
          }}
          ref={ref}
          disabled={disabled}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
        
        {icon && iconPosition === 'right' && (
          <div className="flex items-center justify-center pr-3">
            {icon}
          </div>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
