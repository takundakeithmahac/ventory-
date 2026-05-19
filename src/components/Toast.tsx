import { useState, useEffect } from 'react';
import { toast } from '../lib/toast';

interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function ToastContainer() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    toast._register((message, type = 'success') => {
      const id = Math.random().toString(36).slice(2);
      setItems((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setItems((prev) => prev.filter((t) => t.id !== id));
      }, 2400);
    });
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center pointer-events-none w-full max-w-xs px-4">
      {items.map((item) => (
        <div
          key={item.id}
          className="toast-enter flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-sm font-semibold shadow-xl"
          style={{
            background:
              item.type === 'success'
                ? 'linear-gradient(135deg, #0f4c2a, #0d3b22)'
                : item.type === 'error'
                ? 'linear-gradient(135deg, #4c0f0f, #3b0d0d)'
                : 'linear-gradient(135deg, #0f2a4c, #0d223b)',
            border:
              item.type === 'success'
                ? '1px solid rgba(16,185,129,0.3)'
                : item.type === 'error'
                ? '1px solid rgba(239,68,68,0.3)'
                : '1px solid rgba(59,130,246,0.3)',
            color:
              item.type === 'success' ? '#34d399' : item.type === 'error' ? '#f87171' : '#60a5fa',
            backdropFilter: 'blur(12px)',
          }}
        >
          <span>
            {item.type === 'success' ? '✓' : item.type === 'error' ? '✕' : 'ℹ'}
          </span>
          <span>{item.message}</span>
        </div>
      ))}
    </div>
  );
}
