import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { PatchSocket } from './HardwarePatchPanel';
import { GearSilhouette } from '../GearSilhouette';
import { BENCH_TESTS, SOCKET_LABEL, benchVerdict, wrongSocketMessage, withArticle, type GearKind } from '../gearKind';
import './test-bench.css';

/**
 * Bench test after unboxing: the gear's own cable ends in the plug it really has
 * (XLR for a mic, 1/4" for a synth...). Drag the plug onto the socket it fits, or tap
 * a socket. The wrong socket refuses it; the right one seats with a click and the
 * meter shows how healthy the unit is, read straight from its visible condition.
 */
interface TestBenchProps {
  kind: GearKind;
  condition: number;
  isPatched: boolean;
  onPatch: (socket: PatchSocket) => void;
  onUnpatch: () => void;
  onWrongSocket: (socket: PatchSocket) => void;
  reducedMotion?: boolean;
}

const PLUG_W = 64;
const PLUG_H = 24;
/** How close (px) the plug tip must get to a socket centre to snap in. Generous for thumbs. */
export const SNAP_RADIUS_PX = 52;
const TAP_SLOP_PX = 6;

type Pt = { x: number; y: number };
const SOCKETS: PatchSocket[] = ['xlr', 'trs'];

export const TestBench: React.FC<TestBenchProps> = ({
  kind,
  condition,
  isPatched,
  onPatch,
  onUnpatch,
  onWrongSocket,
  reducedMotion = false,
}) => {
  const test = BENCH_TESTS[kind];
  const plug = test.plug;
  const rootRef = useRef<HTMLDivElement>(null);
  const portRef = useRef<HTMLSpanElement>(null);
  const socketRefs = useRef<Partial<Record<PatchSocket, HTMLButtonElement | null>>>({});
  const [geo, setGeo] = useState<{ port: Pt; sockets: Record<PatchSocket, Pt>; rest: Pt } | null>(null);
  const [drag, setDrag] = useState<{ start: Pt; grab: Pt; pos: Pt; moved: boolean } | null>(null);
  const [refused, setRefused] = useState<PatchSocket | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [near, setNear] = useState<PatchSocket | null>(null);

  // Layout offsets, not getBoundingClientRect: the card mounts mid scale/flip animation,
  // and transformed rects would put the snap targets in the wrong place.
  const measure = useCallback(() => {
    const root = rootRef.current;
    if (!root || !portRef.current) return;
    const within = (el: HTMLElement | null | undefined): Pt => {
      let x = 0;
      let y = 0;
      let node: HTMLElement | null = el ?? null;
      while (node && node !== root) {
        x += node.offsetLeft;
        y += node.offsetTop;
        node = node.offsetParent as HTMLElement | null;
      }
      return { x, y };
    };
    const centre = (el: HTMLElement | null | undefined): Pt => {
      const o = within(el);
      return { x: o.x + (el?.offsetWidth ?? 0) / 2, y: o.y + (el?.offsetHeight ?? 0) / 2 };
    };
    const face = (s: PatchSocket) => socketRefs.current[s]?.querySelector<HTMLElement>('.bench-socket__face');
    const portPt = centre(portRef.current);
    setGeo({
      port: portPt,
      sockets: { xlr: centre(face('xlr')), trs: centre(face('trs')) },
      rest: { x: Math.max(4, portPt.x - 8), y: root.offsetHeight - PLUG_H - 6 },
    });
  }, []);

  useLayoutEffect(() => {
    measure();
    if (typeof ResizeObserver === 'undefined' || !rootRef.current) return;
    const ro = new ResizeObserver(measure);
    ro.observe(rootRef.current);
    return () => ro.disconnect();
  }, [measure]);

  useEffect(() => {
    if (!refused) return;
    const t = window.setTimeout(() => setRefused(null), 420);
    return () => window.clearTimeout(t);
  }, [refused]);

  const seatedAt = (socket: PatchSocket): Pt | null =>
    geo ? { x: geo.sockets[socket].x - PLUG_W + 10, y: geo.sockets[socket].y - PLUG_H / 2 } : null;

  const tryPlug = (socket: PatchSocket) => {
    if (!plug) return;
    if (socket === plug) {
      setMessage(null);
      onPatch(socket);
    } else {
      setRefused(socket);
      setMessage(wrongSocketMessage(plug, socket));
      onWrongSocket(socket);
    }
  };

  const nearestSocket = (tip: Pt): PatchSocket | null => {
    if (!geo) return null;
    let best: PatchSocket | null = null;
    let bestD = SNAP_RADIUS_PX;
    for (const s of SOCKETS) {
      const d = Math.hypot(geo.sockets[s].x - tip.x, geo.sockets[s].y - tip.y);
      if (d <= bestD) { best = s; bestD = d; }
    }
    return best;
  };

  const toLocal = (e: React.PointerEvent): Pt => {
    const root = rootRef.current!;
    const r = root.getBoundingClientRect();
    // Undo any transform scale still running on the card.
    const sx = r.width / (root.offsetWidth || r.width || 1);
    const sy = r.height / (root.offsetHeight || r.height || 1);
    return { x: (e.clientX - r.left) / sx, y: (e.clientY - r.top) / sy };
  };

  const plugPos: Pt | null = drag?.pos ?? (isPatched && plug ? seatedAt(plug) : geo?.rest ?? null);

  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!plugPos || !plug) return;
    measure();
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = toLocal(e);
    if (isPatched) onUnpatch();
    setDrag({ start: p, grab: { x: p.x - plugPos.x, y: p.y - plugPos.y }, pos: plugPos, moved: false });
  };

  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!drag) return;
    const p = toLocal(e);
    const moved = drag.moved || Math.hypot(p.x - drag.start.x, p.y - drag.start.y) > TAP_SLOP_PX;
    const pos = { x: p.x - drag.grab.x, y: p.y - drag.grab.y };
    setDrag({ ...drag, pos, moved });
    setNear(nearestSocket({ x: pos.x + PLUG_W - 10, y: pos.y + PLUG_H / 2 }));
  };

  const onPointerUp = () => {
    if (!drag) return;
    const { pos, moved } = drag;
    setDrag(null);
    setNear(null);
    if (!moved) {
      // A plain tap on a loose plug explains the move; a tap on a seated plug already unplugged it.
      if (!isPatched) setMessage(`Drag the ${SOCKET_LABEL[plug!]} plug into the socket it fits, or tap that socket.`);
      return;
    }
    const target = nearestSocket({ x: pos.x + PLUG_W - 10, y: pos.y + PLUG_H / 2 });
    if (target) tryPlug(target);
  };

  if (!plug) {
    return (
      <div className="test-bench test-bench--none" data-testid="test-bench">
        <GearSilhouette kind={kind} variant="solid" className="test-bench__gear-art" />
        <p className="test-bench__note">{test.noTestReason}</p>
      </div>
    );
  }

  const verdict = benchVerdict(condition);
  const tail = plugPos ? { x: plugPos.x + 2, y: plugPos.y + PLUG_H / 2 } : null;
  const cablePath = geo && tail
    ? `M ${geo.port.x} ${geo.port.y} C ${geo.port.x + 14} ${geo.port.y + 34}, ${tail.x - 34} ${tail.y + 4}, ${tail.x} ${tail.y}`
    : '';

  return (
    <div className="test-bench" data-testid="test-bench" data-patched={isPatched ? 'true' : 'false'}>
      <div className="test-bench__head">
        <span>Bench test</span>
        <span className="test-bench__hint">Plug it in to check it works</span>
      </div>
      <div ref={rootRef} className="test-bench__stage">
        <div className="test-bench__gear">
          <GearSilhouette kind={kind} variant="solid" className="test-bench__gear-art" />
          <span className="test-bench__port-label">
            {test.outputLabel}
            <span ref={portRef} className="test-bench__port" aria-hidden="true" />
          </span>
        </div>

        <div className="test-bench__panel" role="group" aria-label="Bench inputs">
          <span className="test-bench__panel-title">Inputs</span>
          {SOCKETS.map((s) => (
            <button
              key={s}
              ref={(el) => { socketRefs.current[s] = el; }}
              type="button"
              data-testid={`bench-socket-${s}`}
              aria-label={`${SOCKET_LABEL[s]} input${isPatched && plug === s ? ', plugged in' : ''}`}
              className={`bench-socket bench-socket--${s}${isPatched && plug === s ? ' is-seated' : ''}${refused === s ? ' is-refused' : ''}${near === s ? (s === plug ? ' is-near' : ' is-near-wrong') : ''}`}
              onClick={() => (isPatched && plug === s ? onUnpatch() : tryPlug(s))}
            >
              <span className="bench-socket__face" aria-hidden="true">
                {s === 'xlr' ? (<><i /><i /><i /></>) : <i />}
              </span>
              <span className="bench-socket__label">{SOCKET_LABEL[s]}</span>
            </button>
          ))}
        </div>

        <svg className="test-bench__cable" aria-hidden="true">
          <path d={cablePath} className="test-bench__cable-shadow" />
          <path d={cablePath} className="test-bench__cable-core" />
        </svg>

        {plugPos && (
          <button
            type="button"
            data-testid="bench-plug"
            className={`bench-plug bench-plug--${plug}${drag ? ' is-dragging' : ''}${isPatched ? ' is-seated' : ''}${reducedMotion ? ' no-motion' : ''}`}
            style={{ transform: `translate(${plugPos.x}px, ${plugPos.y}px)` }}
            aria-label={isPatched ? `${SOCKET_LABEL[plug]} plug, plugged in. Activate to unplug.` : `${SOCKET_LABEL[plug]} plug. Drag it to the matching input.`}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onClick={(e) => {
              // Keyboard activation only; pointer taps are resolved in onPointerUp.
              if (e.detail !== 0) return;
              if (isPatched) onUnpatch();
              else tryPlug(plug);
            }}
          >
            <span className="bench-plug__boot" />
            <span className="bench-plug__body">{SOCKET_LABEL[plug]}</span>
            <span className="bench-plug__tip" />
          </button>
        )}
      </div>

      <div className={`test-bench__meter is-${isPatched ? verdict.tone : 'idle'}`} aria-live="polite">
        <span className="test-bench__leds" aria-hidden="true">
          {Array.from({ length: 10 }, (_, i) => (
            <i key={i} className={isPatched && i < verdict.level ? (i >= 8 ? 'is-hot' : 'is-on') : ''} />
          ))}
        </span>
        <span className="test-bench__verdict" data-testid="bench-verdict">
          {message ?? (isPatched ? verdict.text : `Its cable ends in ${withArticle(plug)} plug.`)}
        </span>
      </div>
    </div>
  );
};

export default TestBench;
