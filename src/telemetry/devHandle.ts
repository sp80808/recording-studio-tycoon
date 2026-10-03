import { telemetry } from './sink';
import { exportLiveTrace } from './trace';
import { summarizeTrace } from './analyze';

/**
 * Playtest handle: `rstTelemetry.exportTrace()` in the browser console returns the bounded local trace as JSON
 * (nothing is sent anywhere); `rstTelemetry.summary()` prints the first metrics. Associate a human note with
 * `runId` outside the trace.
 */
export const installTelemetryDevHandle = (): void => {
  if (typeof window === 'undefined') return;
  (window as unknown as { rstTelemetry?: unknown }).rstTelemetry = {
    exportTrace: () => exportLiveTrace(telemetry),
    summary: () => summarizeTrace(exportLiveTrace(telemetry)),
    runId: () => telemetry.currentRunId(),
  };
};
