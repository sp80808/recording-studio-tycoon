import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Disc3, ArrowRight } from 'lucide-react';
import { triggerProjectCompleteJuice } from '@/utils/confettiJuice';
import './release.css';

interface ProjectCompletionCelebrationProps {
  isVisible: boolean;
  projectTitle: string;
  genre: string;
  onComplete: () => void;
}

/** A brief full-viewport release moment before the authoritative review. */
export function ProjectCompletionCelebration({ isVisible, projectTitle, genre, onComplete }: ProjectCompletionCelebrationProps) {
  const complete = useRef(onComplete);
  const finished = useRef(false);
  useEffect(() => { complete.current = onComplete; }, [onComplete]);
  useEffect(() => {
    if (!isVisible) return;
    finished.current = false;
    triggerProjectCompleteJuice();
    const finish = () => {
      if (finished.current) return;
      finished.current = true;
      complete.current();
    };
    const timer = window.setTimeout(finish, 2800);
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape' || event.key === 'Enter') finish(); };
    window.addEventListener('keydown', onKey);
    return () => { window.clearTimeout(timer); window.removeEventListener('keydown', onKey); };
  }, [isVisible]);
  if (!isVisible) return null;
  return createPortal(
    <div className="release-overlay" role="dialog" aria-modal="true" aria-label={`${projectTitle} complete`}>
      <div className="release-glow" aria-hidden="true" />
      <div className="release-disc" aria-hidden="true"><Disc3 size={76} strokeWidth={1} /></div>
      <div className="release-copy">
        <p>MASTER PRESSED · RELEASE READY</p>
        <h2>{projectTitle}</h2>
        <span>{genre} · Made in your studio</span>
      </div>
      <button className="release-continue" onClick={() => {
        if (finished.current) return;
        finished.current = true;
        complete.current();
      }}>View session review <ArrowRight size={18} /></button>
    </div>,
    document.body
  );
}
