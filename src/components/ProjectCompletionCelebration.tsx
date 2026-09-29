import { useCallback, useEffect, useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
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
  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    complete.current();
  }, []);
  useEffect(() => {
    if (!isVisible) return;
    finished.current = false;
    triggerProjectCompleteJuice();
    const timer = window.setTimeout(finish, 2800);
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape' || event.key === 'Enter') finish(); };
    window.addEventListener('keydown', onKey);
    return () => { window.clearTimeout(timer); window.removeEventListener('keydown', onKey); };
  }, [finish, isVisible]);
  if (!isVisible) return null;
  return (
    <Dialog.Root open onOpenChange={open => { if (!open) finish(); }}>
      <Dialog.Portal>
        <Dialog.Content className="release-overlay" aria-describedby={undefined}>
          <div className="release-glow" aria-hidden="true" />
          <div className="release-disc" aria-hidden="true"><Disc3 size={76} strokeWidth={1} /></div>
          <div className="release-copy">
            <Dialog.Title asChild>
              <h2>{projectTitle}</h2>
            </Dialog.Title>
          </div>
          <button className="release-continue" onClick={finish}>View session review <ArrowRight size={18} /></button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
