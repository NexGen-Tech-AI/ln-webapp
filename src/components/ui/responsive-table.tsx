'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface ResponsiveTableProps {
  children: React.ReactNode
  className?: string
}

export function ResponsiveTable({ children, className }: ResponsiveTableProps) {
  return (
    <div className={cn(
      "w-full overflow-x-auto overflow-y-hidden",
      "-webkit-overflow-scrolling: touch",
      "-ms-overflow-style: -ms-autohiding-scrollbar",
      "border rounded-md",
      className
    )}>
      {children}
    </div>
  )
}

interface MobileCardViewProps {
  data: any[]
  renderCard: (item: any, index: number) => React.ReactNode
  className?: string
}

export function MobileCardView({ data, renderCard, className }: MobileCardViewProps) {
  return (
    <div className={cn("space-y-4 md:hidden", className)}>
      {data.map((item, index) => (
        <div key={index} className="p-4 border rounded-lg bg-card">
          {renderCard(item, index)}
        </div>
      ))}
    </div>
  )
}

interface ResponsiveDataDisplayProps {
  children: React.ReactNode
  mobileView?: React.ReactNode
  breakpoint?: 'sm' | 'md' | 'lg'
}

export function ResponsiveDataDisplay({ 
  children, 
  mobileView, 
  breakpoint = 'md' 
}: ResponsiveDataDisplayProps) {
  const hideClass = breakpoint === 'sm' ? 'hidden sm:block' : 
                    breakpoint === 'lg' ? 'hidden lg:block' : 'hidden md:block'
  const showClass = breakpoint === 'sm' ? 'block sm:hidden' : 
                    breakpoint === 'lg' ? 'block lg:hidden' : 'block md:hidden'
  
  return (
    <>
      {mobileView && <div className={showClass}>{mobileView}</div>}
      <div className={hideClass}>{children}</div>
    </>
  )
}