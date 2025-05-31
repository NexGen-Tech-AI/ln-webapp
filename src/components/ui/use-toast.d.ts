export interface ToastProps {
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
  action?: React.ReactNode
}

export function useToast(): {
  toast: (props: ToastProps) => void
  toasts: ToastProps[]
  dismiss: (toastId?: string) => void
}