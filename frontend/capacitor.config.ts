import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'world.kindofabigdill.blindsidedynasty',
  appName: 'Blindside Dynasty',
  webDir: 'out',
  server: {
    url: 'https://ffdashboard.kindofabigdill.world',
    cleartext: true
  },
  android: {
    backgroundColor: '#09090b',
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true
  },
  ios: {
    backgroundColor: '#09090b',
    contentInset: 'always',
    preferredContentMode: 'mobile',
    scheme: 'BlindsideDynasty',
    limitsNavigationsToAppBoundDomains: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 600,
      launchAutoHide: true,
      backgroundColor: '#09090b',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#09090b'
    }
  }
};

export default config;
