import { create } from 'zustand'

type FeatureFlags = {
  flags: Record<string, boolean>
  setFlag: (key: string, value: boolean) => void
}

export const useFeatureFlagStore = create<FeatureFlags>((set) => ({
  flags: {
    // default: features are off; enable via dev tools or config
    'advanced-production-queue': false,
    'quick-assign-presets': false,
    // Flight Case Monetisation (bead 89o): store + premium reveals, default off.
    'monetisation-dealer': false,
    'premium-cases': false,
    // Compact Studio Strip (zel.6): master switch — still requires Tauri shell at runtime.
    // Browser always keeps the full playable UI; enable only for desktop shell experiments.
    'desktop-studio-strip': true,
  },
  setFlag: (key, value) => set((s) => ({ flags: { ...s.flags, [key]: value } })),
}))

export const useFeatureFlag = (key: string) => {
  const flags = useFeatureFlagStore((s) => s.flags)
  return !!flags[key]
}
