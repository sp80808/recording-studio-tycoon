import { create } from 'zustand';

/**
 * Lightweight shared UI chrome flags for coach / toast hosts.
 * Toast-spam work can extend this; layout agents only need take-calibration focus
 * so First Session never covers PocketMeter or Session Progress.
 */
type UiChromeState = {
  consoleFocused: boolean;
  setConsoleFocused: (focused: boolean) => void;
  takeCalibrationFocused: boolean;
  setTakeCalibrationFocused: (focused: boolean) => void;
};

export const useUiChromeStore = create<UiChromeState>((set, get) => ({
  consoleFocused: false,
  setConsoleFocused: (focused) => {
    if (typeof document !== 'undefined') {
      if (focused) document.documentElement.dataset.chromeBusy = 'world-console';
      else if (get().takeCalibrationFocused) document.documentElement.dataset.chromeBusy = 'take-calibration';
      else delete document.documentElement.dataset.chromeBusy;
    }
    set({ consoleFocused: focused });
  },
  takeCalibrationFocused: false,
  setTakeCalibrationFocused: (focused) => {
    if (typeof document !== 'undefined') {
      if (focused) document.documentElement.dataset.chromeBusy = 'take-calibration';
      else if (get().consoleFocused) document.documentElement.dataset.chromeBusy = 'world-console';
      else if (document.documentElement.dataset.chromeBusy === 'take-calibration') {
        delete document.documentElement.dataset.chromeBusy;
      }
    }
    set({ takeCalibrationFocused: focused });
  },
}));

export const selectTakeCalibrationFocused = (s: UiChromeState) => s.takeCalibrationFocused;

export const selectConsoleFocused = (s: UiChromeState) => s.consoleFocused;
