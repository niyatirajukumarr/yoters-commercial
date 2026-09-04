import type { CapacitorConfig } from '@capacitor/cli'

// The UI is bundled on the device (webDir below) rather than pointed at a
// remote URL. That matters for two reasons: the app opens instantly and works
// with a flaky connection, and a store reviewer sees an app rather than a
// browser pointed at a website — Apple rejects the latter under guideline 4.2.
const config: CapacitorConfig = {
  appId: 'com.yoters.app',
  appName: 'Yoters',
  webDir: 'out',

  android: {
    // Never let an http subresource load inside the webview.
    allowMixedContent: false,
    captureInput: true,
  },

  ios: {
    scheme: 'Yoters',
    contentInset: 'always',
  },

  // The webview only ever loads the bundled origin. Razorpay checkout and
  // Supabase are reached by XHR/native SDK, so no other origin needs to be
  // navigable inside the webview — leaving this empty is what stops a hijacked
  // link from rendering an attacker's page inside the app chrome.
  server: {
    // Serve the bundle over https://localhost rather than the legacy file://
    // origin. Required for the Web Crypto and Geolocation APIs the app uses,
    // which browsers gate behind a secure context.
    androidScheme: 'https',
    iosScheme: 'capacitor',
    // Cleartext is off; every backend this app talks to is https.
    cleartext: false,
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 900,
      launchAutoHide: false, // hidden from JS once the first screen has data
      backgroundColor: '#FFF5F7',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      style: 'LIGHT', // dark glyphs, for the app's light pink/blue palette
      backgroundColor: '#FFF5F7',
    },
    Keyboard: {
      resize: 'native',
      resizeOnFullScreen: true,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
}

export default config
