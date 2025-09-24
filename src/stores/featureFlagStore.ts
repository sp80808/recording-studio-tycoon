import create from 'zustand'

type FeatureFlags = {
  flags: Record<string, boolean>
  setFlag: (key: string, value: boolean) => void
}

export const useFeatureFlagStore = create<FeatureFlags>((set) => ({
  flags: {
    // default: features are off; enable via dev tools or config
    'advanced-production-queue': false,
    'quick-assign-presets': false,
  },
  setFlag: (key, value) => set((s) => ({ flags: { ...s.flags, [key]: value } })),
}))

export const useFeatureFlag = (key: string) => {
  const flags = useFeatureFlagStore((s) => s.flags)
  return !!flags[key]
}
