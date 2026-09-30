import React, { useEffect, useRef, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  X,
  Phone,
  Headphones,
  SlidersHorizontal,
  Users,
  Building2,
  Sparkles,
} from 'lucide-react';
import {
  MotionPanel,
  MotionButton,
  MotionNumber,
} from '@/components/motion/primitives';
import { useMotionCapabilities } from '@/lib/motion/capabilities';
import { gameAudio } from '@/utils/audioSystem';

export type ContextDrawerTab = 'artist' | 'room' | 'staff' | 'gear' | 'session' | 'career';

export interface DrawerTabItem {
  id: ContextDrawerTab;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ size?: number; className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>;
  badge?: number;
}

export interface ContextDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab?: ContextDrawerTab;
  onTabChange?: (tab: ContextDrawerTab) => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  headerActions?: React.ReactNode;
  footerContent?: React.ReactNode;
  width?: 'default' | 'wide' | 'session';
  className?: string;
  returnFocusRef?: React.RefObject<HTMLElement | null> | HTMLElement | null;
  unreadEnquiries?: number;
}

const TAB_CONFIGS: DrawerTabItem[] = [
  { id: 'artist', label: 'Artist Enquiries', shortLabel: 'Artist', icon: Phone },
  { id: 'session', label: 'Session Console', shortLabel: 'Session', icon: Headphones },
  { id: 'gear', label: 'Gear Locker', shortLabel: 'Gear', icon: SlidersHorizontal },
  { id: 'staff', label: 'Studio Crew', shortLabel: 'Crew', icon: Users },
  { id: 'room', label: 'Studio Room', shortLabel: 'Room', icon: Building2 },
  { id: 'career', label: 'Producer Story', shortLabel: 'Career', icon: Sparkles },
];

/**
 * Studio OS V2 Context Drawer (#75)
 *
 * Choreographed contextual slide-over panel powered by MotionPanel.
 * Features:
 * - Direct quick-switching tabs (Artist, Room, Staff, Gear, Session) without exit/re-enter thrash.
 * - Crucial: Keeps PixiJS studio canvas mounted & undisturbed in background.
 * - Hardware tactile feedback for tab changes and dismissals.
 * - Accessibility & focus restoration on close.
 * - Zero spatial displacement in reduced-motion mode.
 */
export const ContextDrawer: React.FC<ContextDrawerProps> = ({
  isOpen,
  onClose,
  activeTab = 'artist',
  onTabChange,
  title,
  subtitle,
  children,
  headerActions,
  footerContent,
  width = 'default',
  className = '',
  returnFocusRef,
  unreadEnquiries = 0,
}) => {
  const { reducedMotion } = useMotionCapabilities();
  const drawerRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const prevFocusedElem = useRef<HTMLElement | null>(null);

  // Capture triggering focus before open
  useEffect(() => {
    if (isOpen) {
      prevFocusedElem.current = (document.activeElement as HTMLElement) || null;
      // Focus drawer heading on open
      const timer = window.setTimeout(() => {
        headingRef.current?.focus();
      }, 50);
      return () => window.clearTimeout(timer);
    } else if (prevFocusedElem.current) {
      // Restore focus on close
      const returnTarget = returnFocusRef
        ? 'current' in returnFocusRef
          ? returnFocusRef.current
          : returnFocusRef
        : prevFocusedElem.current;
      if (returnTarget && returnTarget.isConnected) {
        returnTarget.focus();
      }
    }
  }, [isOpen, returnFocusRef]);

  // Escape key handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        void gameAudio.playTactileClick();
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  const handleTabClick = (tabId: ContextDrawerTab) => {
    if (tabId === activeTab) return;
    void gameAudio.playGearSwitch(0.35);
    onTabChange?.(tabId);
  };

  const handleClose = () => {
    void gameAudio.playUISound('menuClose');
    onClose();
  };

  const resolvedTitle =
    title ||
    TAB_CONFIGS.find((t) => t.id === activeTab)?.label ||
    'Context Inspector';

  const widthStyle =
    width === 'session'
      ? 'w-full max-w-none md:w-[min(100%,1100px)] lg:w-[min(100vw-24px,1280px)] xl:w-[min(96vw,1400px)]'
      : width === 'wide'
        ? 'w-full md:max-w-2xl'
        : 'w-full md:max-w-md lg:max-w-lg';

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 overflow-hidden"
          role="presentation"
          data-studio-drawer={width}
        >
          {/* Soft scrim: the studio stays legible behind the panel and the Pixi canvas is never unmounted. */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity animate-rst-fade"
            onClick={handleClose}
            aria-hidden="true"
          />

          {/* Floating panel: starts below the HUD (desktop) and goes edge-to-edge on phones. */}
          <div
            className="studio-drawer-shell absolute right-3 bottom-3 flex max-w-full pointer-events-none"
            style={{ top: 'var(--studio-drawer-top, 72px)' }}
          >
            <MotionPanel
              ref={drawerRef}
              direction={activeTab === 'session' ? 'scale' : 'right'}
              role="dialog"
              aria-modal="true"
              aria-labelledby="context-drawer-title"
              className={`rst-modal pointer-events-auto flex flex-col h-full ${widthStyle} ${className}`}
            >
              {/* Header */}
              <div className="shrink-0 px-5 pt-4 pb-3 border-b border-[var(--rst-line)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="rst-kicker">{subtitle || 'STUDIO CONTEXT'}</p>
                    <h2
                      id="context-drawer-title"
                      ref={headingRef}
                      tabIndex={-1}
                      className="rst-title mt-1 truncate text-xl outline-none sm:text-2xl"
                    >
                      {resolvedTitle}
                    </h2>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {headerActions}
                    <MotionButton
                      onClick={handleClose}
                      aria-label="Close drawer"
                      className="grid h-9 w-9 place-items-center rounded-full border border-[var(--rst-line-strong)] bg-white/[0.03] text-stone-300 transition-colors hover:border-[var(--rst-brass-line)] hover:bg-white/[0.07] hover:text-[var(--rst-brass-200)]"
                    >
                      <X size={16} aria-hidden="true" />
                    </MotionButton>
                  </div>
                </div>

                {/* Quick-switch tabs: equal-width icon-over-label cells so nothing ever clips. */}
                {onTabChange && (
                  <div
                    role="tablist"
                    aria-label="Studio contextual views"
                    className="mt-3 grid gap-1 rounded-xl border border-[var(--rst-line)] bg-black/25 p-1"
                    style={{ gridTemplateColumns: `repeat(${TAB_CONFIGS.length}, minmax(0, 1fr))` }}
                  >
                    {TAB_CONFIGS.map((tab) => {
                      const isActive = activeTab === tab.id;
                      const Icon = tab.icon;
                      const badgeCount = tab.id === 'artist' ? unreadEnquiries : tab.badge;

                      return (
                        <MotionButton
                          key={tab.id}
                          role="tab"
                          aria-selected={isActive}
                          aria-label={tab.label}
                          onClick={() => handleTabClick(tab.id)}
                          className={`relative flex flex-col items-center gap-0.5 rounded-lg px-0.5 pb-1.5 pt-1.5 text-[10px] max-[420px]:text-[9px] font-semibold tracking-wide transition-colors ${
                            isActive
                              ? 'bg-[rgba(230,184,102,0.13)] text-[var(--rst-brass-200)]'
                              : 'text-stone-400 hover:bg-white/[0.05] hover:text-stone-200'
                          }`}
                        >
                          <Icon size={16} aria-hidden="true" />
                          <span className="max-w-full truncate">{tab.shortLabel}</span>
                          {isActive && (
                            <span aria-hidden="true" className="absolute inset-x-3 bottom-0 h-[2px] rounded-full bg-[var(--rst-brass-400)]" />
                          )}
                          {badgeCount !== undefined && badgeCount > 0 && (
                            <span className="absolute right-1 top-0.5 min-w-[15px] rounded-full bg-[var(--rst-brass-400)] px-1 text-center text-[9px] font-black leading-[15px] text-stone-950">
                              <MotionNumber value={badgeCount} />
                            </span>
                          )}
                        </MotionButton>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Drawer Content Body */}
              <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
                {children}
              </div>

              {/* Optional Footer */}
              {footerContent && (
                <div className="shrink-0 border-t border-[var(--rst-line)] bg-black/25 px-4 py-2.5 text-xs text-stone-400">
                  {footerContent}
                </div>
              )}
            </MotionPanel>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ContextDrawer;
