import { User } from "@supabase/supabase-js"

export interface AuthState {
  isLoading: boolean
  error: string | null
  user: User | null
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthResponse {
  success: boolean
  error?: string
  user?: User
}
