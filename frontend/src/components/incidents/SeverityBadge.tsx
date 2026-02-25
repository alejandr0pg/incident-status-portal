'use client'

import { Badge } from '@/components/ui/Badge'
import { SEVERITY_COLOR_MAP, SEVERITY_LABEL_MAP } from '@/domain/constants'
import type { Severity } from '@/domain/types'

interface SeverityBadgeProps {
  severity: Severity
  size?: 'sm' | 'md'
}

export function SeverityBadge({ severity, size = 'md' }: SeverityBadgeProps) {
  return (
    <Badge color={SEVERITY_COLOR_MAP[severity]} size={size}>
      {SEVERITY_LABEL_MAP[severity]}
    </Badge>
  )
}
