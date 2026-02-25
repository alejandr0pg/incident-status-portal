import type { User } from '@/domain/types'

export function canDeleteIncident(user: User | undefined): boolean {
  return user?.role === 'ADMIN'
}
