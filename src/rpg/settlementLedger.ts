import type { ProjectReport } from '@/types/game';
import { settlementAfterDeposit } from '@/rpg/serviceQuote';

/**
 * One honest itemised settlement line set (#336/#343). Every figure is derived
 * from the same numbers applyReportToState books, so the lines always sum to
 * the real balance change.
 */
export interface SettlementLedger {
  /** Fee quoted when the session was booked. */
  bookedFee: number;
  /** Quality, market and client-match effect on the quoted fee (signed). */
  performanceAdjustment: number;
  /** Polish cost or early-delivery penalty (signed, usually negative). */
  deliveryAdjustment: number;
  deliveryLabel: string;
  /** Final payout the review reports (booked + performance + delivery). */
  payout: number;
  /** Deposit already banked at booking, capped at the payout. */
  depositPaid: number;
  /** Label-contract on-time bonus or late/short-delivery cut, booked separately at settlement (signed, #369). */
  labelAdjustment: number;
  labelLabel: string;
  /** Cash credited to the wallet at settlement (includes the label adjustment). */
  netCredit: number;
}

export function buildSettlementLedger(
  report: ProjectReport,
  bookedFee: number,
  depositPaid?: number,
  label?: { amount: number; bonus: boolean; labelName: string },
): SettlementLedger {
  const payout = Math.max(0, Math.round(report.moneyGained));
  const delivery = Math.round(report.deliveryAdjustment?.amount ?? 0);
  const booked = Math.round(bookedFee);
  const deposit = Math.min(Math.max(0, Math.round(depositPaid ?? 0)), payout);
  return {
    bookedFee: booked,
    performanceAdjustment: payout - delivery - booked,
    deliveryAdjustment: delivery,
    deliveryLabel: report.deliveryAdjustment?.kind === 'polish' ? 'Polish before delivery' : 'Early delivery adjustment',
    payout,
    depositPaid: deposit,
    labelAdjustment: label?.amount ?? 0,
    labelLabel: label ? (label.bonus ? `${label.labelName} on-time bonus` : `${label.labelName} late or short delivery`) : '',
    netCredit: settlementAfterDeposit(payout, depositPaid) + (label?.amount ?? 0),
  };
}
