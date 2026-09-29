import { create } from 'zustand';

/**
 * Lightweight shared UI chrome flags for coach / toast hosts.
 * Toast-spam work can extend this; layout agents only need take-calibration focus
 * so First Session never covers PocketMeter or Session Progress.
 */
type UiChromeState = {
  takeCalibrationFocused: boolean;
  setTakeCalibrationFocused: (focused: boolean) => void;
};

export const useUiChromeStore = create<UiChromeState>((set) => ({
  takeCalibrationFocused: false,
  setTakeCalibrationFocused: (focused) => {
    if (typeof document !== 'undefined') {
      if (focused) document.documentElement.dataset.chromeBusy = 'take-calibration';
      else if (document.documentElement.dataset.chromeBusy === 'take-calibration') {
        delete document.documentElement.dataset.chromeBusy;
      }
    }
    set({ takeCalibrationFocused: focused });
  },
}));

export const selectTakeCalibrationFocused = (s: UiChromeState) => s.takeCalibrationFocused;
