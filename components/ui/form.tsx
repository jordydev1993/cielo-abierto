import * as React from 'react'
import * as LabelPrimitive from '@radix-ui/react-label'
import { cn } from '@/lib/utils'

interface FormFieldProps {
  label: string
  error?: string
  required?: boolean
  className?: string
  children: React.ReactNode
}

function FormField({ label, error, required, className, children }: FormFieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <LabelPrimitive.Root className={cn(
        'text-sm font-medium text-on-surface-variant',
        error && 'text-error'
      )}>
        {label}
        {required && <span className="text-error ml-0.5">*</span>}
      </LabelPrimitive.Root>
      {children}
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  )
}

interface FormSectionProps {
  title?: string
  className?: string
  children: React.ReactNode
}

function FormSection({ title, className, children }: FormSectionProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {title && <h3 className="text-sm font-semibold text-on-surface border-b border-outline-variant pb-2">{title}</h3>}
      {children}
    </div>
  )
}

function FormGrid({ cols = 2, children }: { cols?: 1 | 2 | 3; children: React.ReactNode }) {
  return (
    <div className={cn(
      'grid gap-4',
      cols === 1 && 'grid-cols-1',
      cols === 2 && 'grid-cols-1 sm:grid-cols-2',
      cols === 3 && 'grid-cols-1 sm:grid-cols-3',
    )}>
      {children}
    </div>
  )
}

export { FormField, FormSection, FormGrid }
