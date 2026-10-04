import { useEffect, useRef, useState, type RefObject } from 'react';
import { api } from '../services/api';
import { useAuth } from '../services/auth';
export interface ReadingState { progress: number; position: number; last_section: string; completed: boolean }
export function useReading(kind: 'article' | 'lesson', id: number, ref: RefObject<HTMLElement | null>, ready: boolean) {
  const { user } = useAuth();
  const [status, setStatus] = useState('');
  const [restored, setRestored] = useState(false);
  const state = useRef<ReadingState>({ progress: 0, position: 0, last_section: '', completed: false });
  useEffect(() => {
    if (!ready) return;
    let active = true, timer: ReturnType<typeof setTimeout>;
    setRestored(false); state.current = { progress: 0, position: 0, last_section: '', completed: false };
    const path = `/v3/reading/${kind}/${id}`;
    const snapshot = () => {
      const el = ref.current; if (!el) return state.current;
      const top = el.getBoundingClientRect().top + window.scrollY;
      const height = Math.max(1, el.scrollHeight - window.innerHeight + 100);
      const position = Math.max(0, Math.min(1, (window.scrollY - top + 100) / height));
      const headings = Array.from(el.querySelectorAll<HTMLElement>('[data-section]'));
      const section = headings.filter(h => h.getBoundingClientRect().top < 180).at(-1)?.dataset.section || '';
      state.current = { ...state.current, progress: Math.max(position, state.current.progress), position, last_section: section };
      return state.current;
    };
    const save = () => { if (user && active) api(path, 'POST', snapshot()).then(() => { if(active) setStatus('阅读位置已保存'); }).catch(() => { if(active) setStatus('位置暂未保存，请检查连接'); }); };
    const scroll = () => { clearTimeout(timer); timer = setTimeout(save, 800); };
    async function init() {
      if(user) {
        try {
          const saved = await api<ReadingState | null>(path);
          if(!active) return;
          if(saved) {
            state.current = saved;
            if(!saved.completed && saved.position > .03 && ref.current) {
              const el = ref.current;
              window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + saved.position * Math.max(1, el.scrollHeight - window.innerHeight + 100) - 100, behavior: 'instant' });
              setStatus('已回到上次阅读位置');
            }
          }
        } catch { if(active) setStatus('暂时无法载入阅读位置'); }
      }
      if(active) { setRestored(true); window.addEventListener('scroll', scroll, {passive:true}); }
    }
    const frame = requestAnimationFrame(() => { void init(); });
    return () => { active = false; cancelAnimationFrame(frame); clearTimeout(timer); window.removeEventListener('scroll', scroll); };
  }, [kind, id, user?.id, ready]);
  const finish = async () => {
    if(!user) return;
    state.current = {...state.current, progress: 1, completed: true};
    await api(`/v3/reading/${kind}/${id}`, 'POST', state.current);
    setStatus('已记录读完'); window.dispatchEvent(new Event('living-updated'));
  };
  return {status, restored, finish};
}
