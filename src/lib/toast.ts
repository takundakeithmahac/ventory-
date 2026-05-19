type ToastType = 'success' | 'error' | 'info';
type ToastFn = (message: string, type?: ToastType) => void;

let _show: ToastFn | null = null;

export const toast = {
  show(message: string, type: ToastType = 'success') {
    _show?.(message, type);
  },
  _register(fn: ToastFn) {
    _show = fn;
  },
};
