export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

// Re-export do contexto para manter compatibilidade
export { useToastContext as useToast } from '@/contexts/ToastContext';