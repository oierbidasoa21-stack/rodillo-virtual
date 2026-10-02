import { useEffect } from 'react';
import { useUiStore } from '../store/uiStore';

const VISIBLE_MS = 2200;

export default function Toast() {
  const toast = useUiStore((s) => s.toast);
  const hideToast = useUiStore((s) => s.hideToast);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(hideToast, VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [toast, hideToast]);

  if (!toast) return null;
  return (
    <div className="toast" role="status">
      {toast.text}
    </div>
  );
}
