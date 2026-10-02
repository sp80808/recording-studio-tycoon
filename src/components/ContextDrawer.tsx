import React, { useEffect, useRef, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import {
  MotionPanel,
  MotionButton,
} from '@/components/motion/primitives';
import { gameAudio } from '@/utils/audioSystem';

/** Destination id for motion/title fallbacks — mirrors former drawer tabs. */
export type ContextDrawerTab = 'artist' | 'room' | 'staff' | 'gear' | 'session' | 'career';

export interface ContextDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  /** Which activity this popup represents (drives enter motion + default title). */
  activeTab?: ContextDrawerTab;
  /** Stable id for remount/open motion when switching floor destinations. */
  destinationKey?: string;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  headerActions?: React.ReactNode;
  footerContent?: React.ReactNode;
  width?: 'default' | 'wide' | 'session';
  className?: string;
  returnFocusRef?: React.RefObject<HTMLElement | null> | HTMLElement | null;
}

const TITLE_FALLBACK_KEYS: Record<ContextDrawerTab, string> = {
  artist: 'nav_artist_enquiries',
  session: 'nav_session_console',
  gear: 'nav_gear_locker',
  staff: 'nav_studio_crew',
  room: 'nav_studio_room',
  career: 'nav_producer_story',
};

/**
 * Studio OS V2 Context Drawer (#75)
 *
 * Single-purpose slide-over shell (no in-drawer tab strip).
 * Destinations open from the floor dock / hotspots as focused popups.
 * Keeps PixiJS studio canvas mounted in the background.
 */
export const ContextDrawer: React.FC<ContextDrawerProps> = ({
  isOpen,
  onClose,
  activeTab = 'artist',
  destinationKey,
  title,
  subtitle,
  children,
  headerActions,
  footerContent,
  width = 'default',
  className = '',
  returnFocusRef,
}) => {
  const { t } = useTranslation();
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

  const handleClose = () => {
    void gameAudio.playUISound('menuClose');
    onClose();
  };

  const resolvedTitle =
    title ||
    (TITLE_FALLBACK_KEYS[activeTab] ? t(TITLE_FALLBACK_KEYS[activeTab]) : undefined) ||
    t('context_drawer_default_title');

  const widthStyle =
    width === 'session'
      ? 'w-full max-w-none md:w-[min(100%,760px)] lg:w-[min(46vw,640px)] xl:w-[min(40vw,680px)]'
      : width === 'wide'
        ? 'w-full md:max-w-2xl'
        : 'w-full md:max-w-md lg:max-w-lg';

  // Remount the panel when the destination changes so each dock/hotspot open gets enter motion.
  const panelKey = destinationKey ?? `${activeTab}:${width}`;

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 overflow-hidden"
          role="presentation"
          data-studio-drawer={width}
        >
          {/* Soft scrim: the studio stays legible behind the panel and the Pixi canvas is never unmounted. The session console docks to the side on desktop and leaves the room undimmed, so the artist keeps performing in view. */}
          <div
            className={`absolute inset-0 transition-opacity animate-rst-fade ${
              width === 'session'
                ? 'bg-black/40 backdrop-blur-[2px] lg:bg-transparent lg:backdrop-blur-none'
                : 'bg-black/40 backdrop-blur-[2px]'
            }`}
            onClick={handleClose}
            aria-hidden="true"
          />

          {/* Floating panel: starts below the HUD (desktop) and goes edge-to-edge on phones. */}
          <div
            className="studio-drawer-shell absolute right-3 bottom-3 flex max-w-full pointer-events-none"
            style={{ top: 'var(--studio-drawer-top, 72px)' }}
          >
            <AnimatePresence mode="wait">
              <MotionPanel
                key={panelKey}
                ref={drawerRef}
                direction={activeTab === 'session' ? 'scale' : 'right'}
                role="dialog"
                aria-modal="true"
                aria-labelledby="context-drawer-title"
                className={`rst-modal pointer-events-auto flex flex-col h-full ${widthStyle} ${className}`}
              >
                {/* Header — title only, no tab strip */}
                <div className="studio-drawer-head shrink-0 px-5 pt-4 pb-3 border-b border-[var(--rst-line)]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="studio-drawer-titleblock min-w-0">
                      <p className="rst-kicker">{subtitle || t('context_drawer_kicker')}</p>
                      <h2
                        id="context-drawer-title"
                        ref={headingRef}
                        tabIndex={-1}
                        className="rst-title mt-1 truncate text-xl outline-none sm:text-2xl"
                      >
                        {resolvedTitle}
                      </h2>
                    </div>

                    <div className="studio-drawer-actions flex shrink-0 items-center gap-2">
                      {headerActions}
                      <MotionButton
                        onClick={handleClose}
                        aria-label={t('context_drawer_close_aria')}
                        className="grid h-9 w-9 place-items-center rounded-full border border-[var(--rst-line-strong)] bg-white/[0.03] text-stone-300 transition-colors hover:border-[var(--rst-brass-line)] hover:bg-white/[0.07] hover:text-[var(--rst-brass-200)]"
                      >
                        <X size={16} aria-hidden="true" />
                      </MotionButton>
                    </div>
                  </div>
                </div>

                {/* Drawer Content Body */}
                <div
                  className={`studio-drawer-body feel-stagger flex-1 min-h-0 ${
                    width === 'session'
                      ? // Session console: body is a bounded flex column so the work area scrolls on its own
                        // and the transport dock (Take / Overdrive) stays pinned inside the viewport.
                        'flex flex-col overflow-hidden p-2 sm:p-4 gap-3'
                      : 'overflow-y-auto p-4 space-y-4'
                  }`}
                >
                  {children}
                </div>

                {/* Optional Footer */}
                {footerContent && (
                  <div className="shrink-0 border-t border-[var(--rst-line)] bg-black/25 px-4 py-2.5 text-xs text-stone-400">
                    {footerContent}
                  </div>
                )}
              </MotionPanel>
            </AnimatePresence>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ContextDrawer;
