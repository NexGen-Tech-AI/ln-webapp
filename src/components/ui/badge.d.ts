import { VariantProps } from "class-variance-authority"
import * as React from "react"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge(props: BadgeProps): JSX.Element

export const badgeVariants: (props?: {
    variant?: "default" | "secondary" | "destructive" | "outline" | null | undefined
} | undefined) => string