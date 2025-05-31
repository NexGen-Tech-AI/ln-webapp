import { AuthContextType } from '@/types/auth'

export function useAuth(): AuthContextType
export function AuthProvider({ children }: { children: React.ReactNode }): JSX.Element