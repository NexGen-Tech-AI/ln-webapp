export interface User {
  id: string
  email: string
  name?: string
  profession?: string
  company?: string
  interests?: string[]
  tierPreference?: string
  referralCode?: string
  position?: number
  referral_count?: number
  email_verified?: boolean
  created_at?: string
}

export interface AuthResponse {
  success: boolean
  error?: string
  user?: User
}

export interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<AuthResponse>
  signup: (formData: SignupFormData) => Promise<AuthResponse>
  logout: () => Promise<void>
  isAuthenticated: boolean
}

export interface SignupFormData {
  email: string
  password: string
  name: string
  profession?: string
  company?: string
  interests?: string[]
  tierPreference?: string
  referralCode?: string
}

export interface ApiResponse<T = any> {
  success: boolean
  error?: string
  data?: T
}