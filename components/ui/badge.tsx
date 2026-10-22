import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  // Un tratamiento por estado (prompts/051): rótulo recto en mayúsculas, como una chapa.
  'inline-flex items-center rounded-sm border px-2 py-0.5 font-heading text-[11px] font-bold uppercase leading-4 tracking-[0.06em] whitespace-nowrap transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-on-primary',
        secondary: 'border-transparent bg-secondary-container text-on-secondary-container',
        destructive: 'border-transparent bg-error-container text-on-error-container',
        outline: 'border-outline-variant text-on-surface-variant',
        success: 'border-transparent bg-exito-container text-on-exito-container',
        warning: 'border-transparent bg-tertiary-fixed text-on-tertiary-fixed',
        info: 'border-transparent bg-primary-container text-on-primary-container',
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
