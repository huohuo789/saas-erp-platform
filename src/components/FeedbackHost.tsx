import { useEffect, useState } from 'react';

type Feedback = { id: number; type: 'success' | 'error' | 'info'; message: string };
let nextId = 1;
export function notify(message: string, type: Feedback['type'] = 'info') {
  window.dispatchEvent(new CustomEvent('saas-erp:feedback', { detail: { message, type } }));
}

export default function FeedbackHost() {
  const [items, setItems] = useState<Feedback[]>([]);
  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent).detail || {};
      const item: Feedback = { id: nextId++, type: detail.type || 'info', message: String(detail.message || '操作完成') };
      setItems(current => [...current, item]);
      window.setTimeout(() => setItems(current => current.filter(x => x.id !== item.id)), 4200);
    };
    window.addEventListener('saas-erp:feedback', handler);
    return () => window.removeEventListener('saas-erp:feedback', handler);
  }, []);
  if (!items.length) return null;
  return <div className="feedback-stack" role="status" aria-live="polite">{items.map(item => <div key={item.id} className={`feedback-toast feedback-${item.type}`}><span>{item.type === 'success' ? '✓' : item.type === 'error' ? '!' : 'i'}</span>{item.message}<button aria-label="关闭提示" onClick={() => setItems(current => current.filter(x => x.id !== item.id))}>×</button></div>)}</div>;
}
