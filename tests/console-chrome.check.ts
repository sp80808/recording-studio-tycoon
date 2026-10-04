import assert from 'node:assert/strict';
import { useUiChromeStore } from '../src/stores/uiChromeStore';

const dataset: Record<string, string> = {};
Object.defineProperty(globalThis, 'document', { value: { documentElement: { dataset } }, configurable: true });
const chrome = useUiChromeStore.getState();
chrome.setConsoleFocused(true);
chrome.setTakeCalibrationFocused(true);
chrome.setTakeCalibrationFocused(false);
assert.equal(dataset.chromeBusy, 'world-console', 'locking a take must not release the open console host');
assert.equal(useUiChromeStore.getState().consoleFocused, true);
chrome.setTakeCalibrationFocused(true);
chrome.setConsoleFocused(false);
assert.equal(dataset.chromeBusy, 'take-calibration', 'closing a console must preserve another calibration owner');
chrome.setTakeCalibrationFocused(false);
assert.equal(dataset.chromeBusy, undefined, 'the final owner returns coach and notifications to normal');
assert.equal(useUiChromeStore.getState().consoleFocused, false);
console.log('console chrome ownership passed');
