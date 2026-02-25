'use client'

import { HTMLAttributes } from 'react'
import { clsx } from 'clsx'

export type BadgeColor =
  | 'gray'
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'blue'
  | 'purple'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  color?: BadgeColor
  size?: 'sm' | 'md'
}

const colorClasses: Record<BadgeColor, string> = {
  gray: 'bg-gray-100 text-gray-700 ring-gray-200',
  red: 'bg-red-100 text-red-700 ring-red-200',
  orange: 'bg-orange-100 text-orange-700 ring-orange-200',
  yellow: 'bg-yellow-100 text-yellow-700 ring-yellow-200',
  green: 'bg-green-100 text-green-700 ring-green-200',
  blue: 'bg-blue-100 text-blue-700 ring-blue-200',
  purple: 'bg-purple-100 text-purple-700 ring-purple-200',
}

const sizeClasses = {
  sm: 'px-1.5 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
}

export function Badge({
  color = 'gray',
  size = 'md',
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full font-medium ring-1 ring-inset',
        colorClasses[color],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
