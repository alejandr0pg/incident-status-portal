import { useMutation } from '@tanstack/react-query'
import { login } from '@/services/auth.service'

export function useLogin() {
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      login(email, password),
  })
}
