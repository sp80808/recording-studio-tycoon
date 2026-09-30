import React from 'react';
import { Check, ChevronDown, CircleDollarSign, Headphones, Phone, SlidersHorizontal, Users, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useSettings } from '@/contexts/SettingsContext';
import type { GameState } from '@/types/game';
import { FirstSessionGuideStep, getFirstSessionGuideStep } from '@/utils/firstSessionGuide';
import { selectTakeCalibrationFocused, useUiChromeStore } from '@/stores/uiChromeStore';
import './first-session-guide.css';

interface TutorialModalProps {
  isOpen: boolean;
  onComplete: () => void;
  gameState: GameState;
}

const STEPS: Array<{
  id: Exclude<FirstSessionGuideStep, 'complete'>;
  title: string;
  body: string;
  action: string;
  Icon: typeof Phone;
}> = [
  {
    id: 'book', title: 'Answer an enquiry',
    body: 'Open Bookings and choose a session that fits your studio. The fee, time and fit are shown before you commit.',
    action: 'Bookings → Book Session', Icon: Phone,
  },
  {
    id: 'work', title: 'Get behind the console',
    body: 'Open Session and work the current stage. Your daily sessions are limited, so use them where they matter.',
    action: 'Session → Work on Project', Icon: Headphones,
  },
  {
    id: 'deliver', title: 'Keep the room moving',
    body: 'Use Session to work directly, or Gear → Advance Day to restore daily sessions and progress booked work. When ready, Collect release settles the payout.',
    action: 'Gear → Advance Day · Session → Collect release', Icon: CircleDollarSign,
  },
  {
    id: 'reinvest', title: 'Make the next session easier',
    body: 'Put the first payout back into the studio. Gear improves the room; Crew adds staff you can assign to active sessions.',
    action: 'Gear or Crew → Buy / Hire', Icon: SlidersHorizontal,
  },
];

export const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onComplete, gameState }) => {
  const [collapsed, setCollapsed] = React.useState(() => window.matchMedia('(max-width: 1100px)').matches);
  const { updateSettings } = useSettings();
  const takeCalibrationFocused = useUiChromeStore(selectTakeCalibrationFocused);
  const current = getFirstSessionGuideStep(gameState);
  const currentIndex = current === 'complete' ? STEPS.length : STEPS.findIndex(step => step.id === current);

  React.useEffect(() => {
    const query = window.matchMedia('(max-width: 1100px)');
    const onResize = (event: MediaQueryListEvent) => setCollapsed(event.matches);
    query.addEventListener('change', onResize);
    return () => query.removeEventListener('change', onResize);
  }, []);

  React.useEffect(() => {
    if (isOpen && current === 'complete') {
      updateSettings({ tutorialCompleted: true });
      onComplete();
    }
  }, [current, isOpen, onComplete, updateSettings]);

  // Take Calibration needs the full Session Progress / PocketMeter band — park the coach.
  if (!isOpen || current === 'complete' || takeCalibrationFocused) return null;

  const step = STEPS[currentIndex];
  const finish = () => {
    updateSettings({ tutorialCompleted: true });
    onComplete();
  };

  return (
    <aside className="first-session-guide" aria-label="First session guide" data-toast-host="coach">
      <Card className="rst-surface overflow-hidden !border-[var(--rst-brass-line)] text-white backdrop-blur animate-rst-rise">
        <div className="flex items-center gap-2.5 border-b border-[var(--rst-line)] px-3 py-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-amber-400/15 text-amber-300">
            <step.Icon size={19} aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="rst-kicker whitespace-nowrap !text-[10px]">First session</p>
            <p className="line-clamp-2 text-sm font-semibold leading-snug">{step.title}</p>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-stone-400 hover:text-white" onClick={() => setCollapsed(value => !value)} aria-label={collapsed ? 'Expand guide' : 'Collapse guide'}>
            <ChevronDown size={18} className={`transition-transform ${collapsed ? '' : 'rotate-180'}`} />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-stone-400 hover:text-white" onClick={finish} aria-label="Dismiss first session guide">
            <X size={18} />
          </Button>
        </div>

        {!collapsed && (
          <div className="space-y-2 px-4 pb-3 pt-2">
            <p className="text-sm leading-relaxed text-stone-300">{step.body}</p>
            <div className="flex items-center gap-2 rounded-lg border border-[var(--rst-brass-line)] bg-[rgba(230,184,102,0.08)] px-3 py-2 text-sm font-medium text-[var(--rst-brass-200)]">
              {step.id === 'reinvest' && <Users size={16} aria-hidden="true" />}
              {step.action}
            </div>
            <ol className="flex gap-2" aria-label={`Guide progress: step ${currentIndex + 1} of ${STEPS.length}`}>
              {STEPS.map((item, index) => (
                <li key={item.id} className={`h-1.5 flex-1 rounded-full ${index < currentIndex ? 'bg-emerald-400' : index === currentIndex ? 'bg-amber-300' : 'bg-stone-700'}`}>
                  <span className="sr-only">{index < currentIndex ? 'Complete' : index === currentIndex ? 'Current' : 'Upcoming'}: {item.title}</span>
                </li>
              ))}
            </ol>
            <p className="flex items-center gap-1.5 text-xs text-stone-500"><Check size={13} />Progress updates from what you do in the studio.</p>
          </div>
        )}
      </Card>
    </aside>
  );
};
