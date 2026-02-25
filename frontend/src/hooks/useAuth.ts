'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { getMe, logout as logoutService } from '@/services/auth.service'
import type { User } from '@/types'

const ME_QUERY_KEY = ['me']

export function useAuth() {
  const queryClient = useQueryClient()
  const router = useRouter()

  const {
    data,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: getMe,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })

  const user: User | undefined = data?.data

  async function logout() {
    try {
      await logoutService()
    } finally {
      queryClient.clear()
      router.push('/login')
    }
  }

  return {
    user,
    isLoading,
    isError,
    logout,
  }
}
