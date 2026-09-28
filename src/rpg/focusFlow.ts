/** Focus Flow aura — matching the stage focus 3 sessions in a row ignites
 * FLOW x2/x3/x4. Any mismatch breaks it. Pure transition; HUD reads the state.
 */

export interface FlowState {
  streak: number;
  multiplier: number;
}

export const FLOW_MULTIPLIERS = [1, 2, 3, 4];

export const initialFlow = (): FlowState => ({ streak: 0, multiplier: 1 });

/** Advance the aura: matched = this session's focus hit the stage focus areas. */
export const advanceFlow = (prev: FlowState, matched: boolean): FlowState => {
  if (!matched) return initialFlow();
  const streak = prev.streak + 1;
  // streak 1-2: warm-up (x1). 3: FLOW x2, 4: x3, 5+: x4 cap.
  const multiplier =
    streak < 3 ? 1 : streak === 3 ? 2 : streak === 4 ? 3 : 4;
  return { streak, multiplier };
};

export const isFlowing = (flow: FlowState): boolean => flow.multiplier > 1;
