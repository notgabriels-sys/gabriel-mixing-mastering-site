/* Public site configuration. Do not put secret API keys in this file. */
const SITE_CONFIG = {
  name: 'Gabriel Garcia Alonso',
  location: 'Berlin',
  email: 'notgabriels@gmail.com',
  // Public profiles/pages that identify this service. `build-seo.js` uses
  // these for schema.org `sameAs`; keep checkout destinations in `social`.
  sameAs: [
    'https://www.airgigs.com/user/notgabriels',
    'https://www.airgigs.com/mastering-engineers-for-hire/109633/I-will-master-your-electronic-music-for-release',
  ],
  // Shown as buttons in the Contact section. Delete any you don't want,
  // add more freely. `url: null` hides the entry.
  social: [
    {
      label: 'Hear samples & book on AirGigs',
      url: 'https://www.airgigs.com/mastering-engineers-for-hire/109633/I-will-master-your-electronic-music-for-release',
    },
  ],

  currency: 'EUR',
  currencySymbol: '€',
  checkout: {
    enabled: true,
    enquiryFallback: true,
    prefer: 'paypal',
    serverSideStripe: false,
  },
  stripe: {
    publishableKey: '',
    checkoutEndpoint: '/api/create-checkout-session',
  },
  urls: {
    success: '/success.html',
    cancel: '/cancel.html',
  },
};

window.SITE_CONFIG = SITE_CONFIG;
