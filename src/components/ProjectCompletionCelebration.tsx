import { useCallback, useEffect, useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Disc3, ArrowRight } from 'lucide-react';
import { triggerProjectCompleteJuice } from '@/utils/confettiJuice';
import { MotionPanel, MotionButton } from '@/components/motion/primitives';
import { useMotionCapabilities } from '@/lib/motion/capabilities';
import './release.css';

interface ProjectCompletionCelebrationProps {
  isVisible: boolean;
  projectTitle: string;
  genre: string;
  onComplete: () => void;
}

/** A brief full-viewport release moment before the authoritative review, reserved for milestones. */
export function ProjectCompletionCelebration({ isVisible, projectTitle, genre, onComplete }: ProjectCompletionCelebrationProps) {
  const complete = useRef(onComplete);
  const finished = useRef(false);
  const { reducedMotion } = useMotionCapabilities();

  useEffect(() => { complete.current = onComplete; }, [onComplete]);
  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    complete.current();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    finished.current = false;
    if (!reducedMotion) {
      triggerProjectCompleteJuice();
    }
    const timer = window.setTimeout(finish, 2600);
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape' || event.key === 'Enter') finish(); };
    window.addEventListener('keydown', onKey);
    return () => { window.clearTimeout(timer); window.removeEventListener('keydown', onKey); };
  }, [finish, isVisible, reducedMotion]);

  if (!isVisible) return null;

  return (
    <Dialog.Root open onOpenChange={open => { if (!open) finish(); }}>
      <Dialog.Portal>
        <Dialog.Content className="release-overlay" aria-describedby={undefined}>
          <div className="release-glow" aria-hidden="true" />
          <MotionPanel direction="scale" className="flex flex-col items-center justify-center">
            <div className="release-disc" aria-hidden="true"><Disc3 size={76} strokeWidth={1} /></div>
            <div className="release-copy">
              <Dialog.Title asChild>
                <h2>{projectTitle}</h2>
              </Dialog.Title>
            </div>
            <MotionButton className="release-continue flex items-center gap-2" onClick={finish}>
              <span>View session review</span>
              <ArrowRight size={18} />
            </MotionButton>
          </MotionPanel>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default ProjectCompletionCelebration;
