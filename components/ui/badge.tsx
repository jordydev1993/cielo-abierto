import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  // Pastilla neutra con un punto de color por estado (prompts/052): el texto dice el
  // estado y el punto lo refuerza; el color nunca es el único canal.
  'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-outline-variant bg-surface-container-lowest px-2 py-0.5 text-caption font-medium text-on-surface transition-colors before:h-1.5 before:w-1.5 before:shrink-0 before:rounded-full before:content-[""]',
  {
    variants: {
      variant: {
        default: 'before:bg-ink',
        secondary: 'before:bg-serie-contexto',
        destructive: 'before:bg-error',
        outline: 'text-on-surface-variant before:hidden',
        success: 'before:bg-exito',
        warning: 'before:bg-tertiary',
        info: 'before:bg-serie-1',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
