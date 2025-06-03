import * as React from 'react'
import * as LabelPrimitive from '@radix-ui/react-label'

export interface LabelProps extends React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> {
  className?: string
  children?: React.ReactNode
}

export const Label: React.ForwardRefExoticComponent<LabelProps & React.RefAttributes<HTMLLabelElement>>