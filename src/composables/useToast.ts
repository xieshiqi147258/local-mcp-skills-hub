import { ref, readonly } from 'vue';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration: number;
}

// Global toast state
const toasts = ref<Toast[]>([]);
let toastId = 0;

export function useToast() {
  /**
   * Show a toast notification
   * @param message - The message to display
   * @param type - The type of toast (success, error, info, warning)
   * @param duration - Duration in ms before auto-dismiss (default: 3000)
   */
  function showToast(
    message: string,
    type: Toast['type'] = 'success',
    duration: number = 3000
  ): string {
    const id = `toast_${++toastId}`;
    
    const toast: Toast = {
      id,
      message,
      type,
      duration,
    };
    
    toasts.value.push(toast);
    
    // Auto-dismiss after duration
    if (duration > 0) {
      setTimeout(() => {
        dismissToast(id);
      }, duration);
    }
    
    return id;
  }

  /**
   * Dismiss a specific toast by ID
   */
  function dismissToast(id: string): void {
    const index = toasts.value.findIndex(t => t.id === id);
    if (index !== -1) {
      toasts.value.splice(index, 1);
    }
  }

  /**
   * Dismiss all toasts
   */
  function dismissAll(): void {
    toasts.value = [];
  }

  /**
   * Convenience method for success toast
   */
  function success(message: string, duration?: number): string {
    return showToast(message, 'success', duration);
  }

  /**
   * Convenience method for error toast
   */
  function error(message: string, duration?: number): string {
    return showToast(message, 'error', duration);
  }

  /**
   * Convenience method for info toast
   */
  function info(message: string, duration?: number): string {
    return showToast(message, 'info', duration);
  }

  /**
   * Convenience method for warning toast
   */
  function warning(message: string, duration?: number): string {
    return showToast(message, 'warning', duration);
  }

  return {
    toasts: readonly(toasts),
    showToast,
    dismissToast,
    dismissAll,
    success,
    error,
    info,
    warning,
  };
}
