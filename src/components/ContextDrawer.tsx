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
      ? 'w-full md:max-w-4xl lg:max-w-5xl'
      : width === 'wide'
        ? 'w-full md:max-w-2xl'
        : 'w-full md:max-w-md lg:max-w-lg';

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 overflow-hidden"
          role="presentation"
        >
          {/* Subtle backdrop overlay (does not destroy or unmount background Pixi canvas) */}
          <div
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] transition-opacity"
            onClick={handleClose}
            aria-hidden="true"
          />

          {/* Contextual slide-over drawer panel */}
          <div className="absolute inset-y-0 right-0 flex max-w-full pl-6 pointer-events-none">
            <MotionPanel
              ref={drawerRef}
              direction={activeTab === 'session' ? 'scale' : 'right'}
              role="dialog"
              aria-modal="true"
              aria-labelledby="context-drawer-title"
              className={`pointer-events-auto flex flex-col h-full bg-[#111a2a]/95 border-l border-slate-700/80 shadow-2xl text-slate-100 ${widthStyle} ${className}`}
            >
              {/* Header */}
              <div className="flex flex-col border-b border-slate-800 bg-[#162032] px-4 py-3 shrink-0">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-mono tracking-[0.2em] uppercase text-amber-400/90">
                      {subtitle || 'STUDIO CONTEXT'}
                    </p>
                    <h2
                      id="context-drawer-title"
                      ref={headingRef}
                      tabIndex={-1}
                      className="text-base sm:text-lg font-bold text-white outline-none tracking-wide"
                    >
                      {resolvedTitle}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2">
                    {headerActions}
                    <MotionButton
                      onClick={handleClose}
                      aria-label="Close drawer"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                    >
                      <X size={18} aria-hidden="true" />
                    </MotionButton>
                  </div>
                </div>

                {/* Quick-Switch Tab Bar: Artist / Session / Gear / Staff / Room */}
                {onTabChange && (
                  <div
                    role="tablist"
                    aria-label="Studio contextual views"
                    className="flex items-center gap-1 mt-3 p-1 rounded-lg bg-slate-950/60 border border-slate-800/80 overflow-x-auto text-xs"
                  >
                    {TAB_CONFIGS.map((tab) => {
                      const isActive = activeTab === tab.id;
                      const Icon = tab.icon;
                      const badgeCount =
                        tab.id === 'artist' ? unreadEnquiries : tab.badge;

                      return (
                        <MotionButton
                          key={tab.id}
                          role="tab"
                          aria-selected={isActive}
                          onClick={() => handleTabClick(tab.id)}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-medium text-xs whitespace-nowrap transition-colors relative ${
                            isActive
                              ? 'bg-amber-500/20 text-amber-200 border border-amber-400/40 shadow-sm'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                          }`}
                        >
                          <Icon size={14} aria-hidden="true" />
                          <span className="hidden sm:inline">{tab.shortLabel}</span>
                          {badgeCount !== undefined && badgeCount > 0 && (
                            <span className="ml-0.5 px-1 py-0.2 text-[9px] font-black rounded-full bg-amber-500 text-slate-950">
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
                <div className="border-t border-slate-800 bg-[#162032]/80 px-4 py-2.5 shrink-0 text-xs text-slate-400">
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
