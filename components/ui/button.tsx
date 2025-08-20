import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { colors, tenantColors } from "@/lib/theme"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50",
        primary: "bg-tenant-primary border border-tenant-primary text-white hover:bg-tenant-primary/90",
        secondary: "bg-gray-100 border border-gray-300 text-gray-700 hover:bg-gray-200",
        tertiary: "bg-gray-50 border border-gray-200 text-blue-600 hover:bg-gray-100 shadow-lg",
        outline: "bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-50",
        destructive: "bg-red-600 border border-red-600 text-white hover:bg-red-700",
        ghost: "bg-transparent border border-transparent text-gray-700 hover:bg-gray-100",
        link: "bg-transparent border border-transparent text-blue-600 underline hover:text-blue-700",
      },
      size: {
        default: "h-14 px-4 py-2",
        sm: "h-12 px-3 py-2",
        lg: "h-16 px-6 py-3",
        icon: "h-14 w-14",
      },
      disabled: {
        true: "bg-gray-200 border-gray-200 text-gray-400 cursor-not-allowed",
        false: "",
      },
      selected: {
        true: "",
        false: "bg-gray-100 border-gray-200 text-gray-400",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      disabled: false,
      selected: true,
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  primary?: boolean
  disabled?: boolean
  background?: string
  height?: number
  selected?: boolean
  tertiary?: boolean
  hasIcon?: boolean
  fontSize?: number
  color?: string
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    asChild = false, 
    primary = false,
    disabled = false,
    background,
    height,
    selected = true,
    tertiary = false,
    hasIcon = false,
    fontSize = 16,
    color,
    children,
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    let finalVariant = variant
    if (primary) finalVariant = "primary"
    if (tertiary) finalVariant = "tertiary"
    if (background) finalVariant = "outline"
    
    const customStyles: React.CSSProperties = {
      borderRadius: '16px',
      borderWidth: '1px',
      width: '100%',
      height: height ? `${height}px` : '56px',
      fontSize: `${fontSize}px`,
      letterSpacing: '-0.15px',
      fontWeight: 600,
      ...(hasIcon && { marginLeft: '5px' }),
      ...(background && { backgroundColor: background, borderColor: background }),
      ...(disabled && { 
        backgroundColor: colors.silver, 
        borderColor: colors.silver,
        color: tenantColors.disabled 
      }),
      ...(primary && !disabled && { 
        backgroundColor: tenantColors.primary, 
        borderColor: tenantColors.primary,
        color: colors.white 
      }),
      ...(tertiary && !disabled && { 
        backgroundColor: tenantColors.primaryBackground, 
        borderColor: tenantColors.primaryBackground,
        color: tenantColors.primary,
        boxShadow: '0 8px 12px rgba(0, 0, 0, 0.15)'
      }),
      ...(selected === false && !disabled && { 
        backgroundColor: colors.mercury, 
        borderColor: colors.silver,
        color: tenantColors.disabled 
      }),
      ...(color && { color }),
    }

    return (
      <Comp
        className={cn(buttonVariants({ 
          variant: finalVariant, 
          size, 
          disabled, 
          selected,
          className 
        }))}
        style={customStyles}
        ref={ref}
        disabled={disabled}
        {...props}
      >
        {children}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
