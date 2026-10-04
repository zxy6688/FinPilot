import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import ContextAI from '../components/ContextAI';
import type { AIContext } from '../components/ContextAI';
import { api } from '../services/api';
interface Term {id:number;title:string;summary:string;english:string}
let glossaryRequest: Promise<Term[]> | null = null;
export function Glossary({ children }: {children: string}) {
  const [terms,setTerms] = useState<Term[]>([]);
  useEffect(()=>{ let active=true; glossaryRequest ??= api<Term[]>('/topics').catch(()=>{glossaryRequest=null;return []}); glossaryRequest.then(t=>{if(active)setTerms(t)});return()=>{active=false} },[]);
  const [open,setOpen] = useState<number|null>(null);
  const host=useRef<HTMLSpanElement>(null);
  useEffect(()=> { const close=(e:KeyboardEvent)=>{if(e.key==='Escape')setOpen(null)}; const outside=(e:PointerEvent)=>{if(!host.current?.contains(e.target as Node))setOpen(null)}; document.addEventListener('keydown',close);document.addEventListener('pointerdown',outside);return()=>{document.removeEventListener('keydown',close);document.removeEventListener('pointerdown',outside)}},[]);
  const list=terms.filter(t=>t.title.length>1).sort((a,b)=>b.title.length-a.title.length);
  const chunks: ReactNode[]=[]; let rest=children, key=0;
  while(rest) {
    let earliest=-1, term:Term|undefined;
    for(const t of list){const at=rest.indexOf(t.title);if(at>=0 && (earliest<0||at<earliest)){earliest=at;term=t;}}
    if(!term){chunks.push(rest);break;}
    if(earliest)chunks.push(rest.slice(0,earliest));
    const t=term;
    chunks.push(<span className="inline-term" key={key++}><button className="term-trigger" aria-expanded={open===t.id} onClick={()=>setOpen(open===t.id?null:t.id)}>{t.title}</button>{open===t.id&&<span className="term-popover" role="region" aria-label={t.title+'释义'}><strong>{t.title}</strong><small>{t.english}</small><span>{t.summary}</span><Link to={'/topics/'+t.id}>继续理解 →</Link><ContextAI compact context={{source_type:'topic',source_id:t.id}} title={t.title} actions={['explain']}/><button className="text-link" onClick={()=>setOpen(null)}>关闭释义</button></span>}</span>);
    rest=rest.slice(earliest+t.title.length);
  }
  return <span ref={host}>{chunks}</span>;
}
export function SelectionTools({container,context}: {container:React.RefObject<HTMLElement|null>;context:AIContext}) {
 const [text,setText]=useState('');
 useEffect(()=> { const update=()=>{const s=window.getSelection();if(s&&!s.isCollapsed&&s.anchorNode&&s.focusNode&&container.current?.contains(s.anchorNode)&&container.current?.contains(s.focusNode))setText(s.toString().trim().slice(0,1200));};const key=(e:KeyboardEvent)=>{if(e.key==='Escape')setText('');};document.addEventListener('mouseup',update);document.addEventListener('keyup',update);document.addEventListener('keydown',key);return()=>{document.removeEventListener('mouseup',update);document.removeEventListener('keyup',update);document.removeEventListener('keydown',key)}},[context.source_id]);
 return text?<div className="selection-tools" aria-label="选中文字的学习工具"><small>已选：{text.slice(0,45)}{text.length>45?'…':''}</small><ContextAI compact context={{...context,selected_text:text}} title="这段文字" actions={['explain','example','connect']}/><Link to={'/compare'}>Compare</Link><button className="icon-button" aria-label="关闭选区工具" onClick={()=>setText('')}>×</button></div>:null;
}
