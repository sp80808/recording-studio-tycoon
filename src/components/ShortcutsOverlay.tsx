import { Keyboard } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import type { HotkeyBinding } from '@/hooks/useStudioHotkeys';

interface ShortcutsOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bindings: readonly Pick<HotkeyBinding, 'key' | 'label' | 'description'>[];
}

const EXTRA = [
  { key: 'Esc', label: 'Close', description: 'Close the current panel or popup' },
  { key: '1 – 4', label: 'Choose', description: 'Pick an option in a story decision' },
  { key: 'Enter', label: 'Confirm', description: 'Commit a decision or continue a cutscene' },
];

const Key = ({ children }: { children: React.ReactNode }) => (
  <kbd className="grid h-7 min-w-7 place-items-center rounded-md border border-[var(--rst-line-strong)] bg-white/[0.04] px-2 font-mono text-xs font-semibold text-[var(--rst-brass-200)]">
    {children}
  </kbd>
);

/** Press ? anywhere in the studio. */
export function ShortcutsOverlay({ open, onOpenChange, bindings }: ShortcutsOverlayProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" data-testid="shortcuts-overlay">
        <div className="flex items-center gap-2 pr-9">
          <Keyboard size={16} className="text-[var(--rst-brass-300)]" aria-hidden="true" />
          <p className="rst-kicker">Keyboard shortcuts</p>
        </div>
        <DialogTitle className="text-2xl">Around the studio</DialogTitle>
        <DialogDescription className="rst-muted">Shortcuts pause while a popup is open or you’re typing.</DialogDescription>
        <ul className="grid gap-2">
          {[...bindings, ...EXTRA].map((b) => (
            <li key={`${b.key}-${b.label}`} className="flex items-center gap-3 rounded-lg border border-[var(--rst-line)] bg-black/20 px-3 py-2">
              <Key>{b.key}</Key>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-[var(--rst-ivory)]">{b.label}</span>
                <span className="rst-muted block text-xs">{b.description}</span>
              </span>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
