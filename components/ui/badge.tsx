import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-on-primary',
        secondary: 'border-transparent bg-secondary-container text-on-secondary-container',
        destructive: 'border-transparent bg-error-container text-on-error-container',
        outline: 'border-outline-variant text-on-surface-variant',
        success: 'border-transparent bg-primary-fixed text-on-primary-container',
        warning: 'border-transparent bg-tertiary-fixed text-tertiary',
        info: 'border-transparent bg-secondary-container text-on-secondary-container',
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
