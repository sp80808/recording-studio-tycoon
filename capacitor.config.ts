// Optional native wrapper (iOS/Android). Not wired into the build; see docs/mobile.md.
// To enable: pnpm add @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android @capacitor/haptics
//            pnpm exec cap add ios && pnpm exec cap add android
const config = {
  appId: 'com.recordingstudiotycoon.app',
  appName: 'Recording Studio Tycoon',
  webDir: 'dist',
  backgroundColor: '#0e0c0a',
  ios: { contentInset: 'never', allowsLinkPreview: false },
  android: { allowMixedContent: false },
};

export default config;
