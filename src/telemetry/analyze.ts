import type { GameplayTrace } from './trace';

export interface TraceSummary {
  runId: string;
  events: number;
  /** 1. Enquiry decisions, with the decline rate by fee band and by service. */
  enquiries: { accepted: number; declined: number; declineRateByFeeBand: Record<string, number>; declineRateByService: Record<string, number> };
  /** 2. First game day an enquiry was seen with no room free (where capacity pressure begins). */
  firstDayNoRoomFree: number | null;
  /** 3. Interventions actually played versus delegated or skipped. */
  interventions: { played: number; delegated: number; skipped: number };
  /** 4. Repeated choices: how often the most common service was booked, and day of first hire. */
  bookings: { total: number; topService: string | null; topServiceShare: number };
  firstHireDay: number | null;
  /** 5. Share of settled sessions per quality band. */
  quality: Record<'poor' | 'good' | 'excellent', number>;
  /** 6. Management panel opens before the first settled session, and by destination. */
  panelsBeforeFirstSettle: number;
  panelsByDestination: Record<string, number>;
}

const rate = (declined: number, total: number) => (total ? Math.round((declined / total) * 100) / 100 : 0);

export const summarizeTrace = (trace: GameplayTrace): TraceSummary => {
  const ev = trace.events;
  const byBand: Record<string, [number, number]> = {};
  const bySvc: Record<string, [number, number]> = {};
  let accepted = 0, declined = 0, firstNoRoom: number | null = null;
  const services: Record<string, number> = {};
  let bookings = 0;
  const quality = { poor: 0, good: 0, excellent: 0 };
  let settled = 0;
  const panels: Record<string, number> = {};
  let panelsBefore = 0, firstSettleSeen = false;
  const iv = { played: 0, delegated: 0, skipped: 0 };
  let firstHire: number | null = null;
  const bump = (m: Record<string, [number, number]>, k: string, isDecline: boolean) => { const c = m[k] ?? [0, 0]; c[1]++; if (isDecline) c[0]++; m[k] = c; };

  for (const e of ev) {
    const p = e.properties;
    if (e.name === 'enquiry_accepted' || e.name === 'enquiry_declined') {
      const dec = e.name === 'enquiry_declined';
      dec ? declined++ : accepted++;
      bump(byBand, String(p.feeBand ?? 'unknown'), dec);
      bump(bySvc, String(p.service ?? 'unknown'), dec);
      if (p.roomsFree === 0 && firstNoRoom === null) firstNoRoom = e.gameDay;
    } else if (e.name === 'session_booked') {
      bookings++;
      const s = String(p.service ?? 'unknown');
      services[s] = (services[s] ?? 0) + 1;
    } else if (e.name === 'session_settled') {
      firstSettleSeen = true;
      settled++;
      const q = String(p.qualityBand) as keyof typeof quality;
      if (q in quality) quality[q]++;
    } else if (e.name === 'management_panel_opened') {
      const d = String(p.destination ?? 'unknown');
      panels[d] = (panels[d] ?? 0) + 1;
      if (!firstSettleSeen) panelsBefore++;
    } else if (e.name === 'intervention_intervened') iv.played++;
    else if (e.name === 'intervention_delegated') iv.delegated++;
    else if (e.name === 'intervention_skipped') iv.skipped++;
    else if (e.name === 'staff_hired' && firstHire === null) firstHire = e.gameDay;
  }
  const top = Object.entries(services).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
  const toRates = (m: Record<string, [number, number]>) => Object.fromEntries(Object.entries(m).map(([k, [d, t]]) => [k, rate(d, t)]));
  return {
    runId: trace.runId,
    events: ev.length,
    enquiries: { accepted, declined, declineRateByFeeBand: toRates(byBand), declineRateByService: toRates(bySvc) },
    firstDayNoRoomFree: firstNoRoom,
    interventions: iv,
    bookings: { total: bookings, topService: top ? top[0] : null, topServiceShare: top && bookings ? Math.round((top[1] / bookings) * 100) / 100 : 0 },
    firstHireDay: firstHire,
    quality: {
      poor: settled ? Math.round((quality.poor / settled) * 100) / 100 : 0,
      good: settled ? Math.round((quality.good / settled) * 100) / 100 : 0,
      excellent: settled ? Math.round((quality.excellent / settled) * 100) / 100 : 0,
    },
    panelsBeforeFirstSettle: panelsBefore,
    panelsByDestination: panels,
  };
};
