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
      label: 'Hear public examples on AirGigs',
      url: 'https://www.airgigs.com/mastering-engineers-for-hire/109633/I-will-master-your-electronic-music-for-release',
    },
  ],

  currency: 'EUR',
  currencySymbol: '€',
  pricing: {
    // These are public starting rates, not an automatic booking or final quote.
    // The written enquiry confirms scope, timing, versions and any unusual
    // format before work begins.
    public: true,
    quoteLabel: 'Written quote after listening',
  },
  checkout: {
    // Direct projects begin with a non-binding enquiry and a written quote.
    // AirGigs remains a separate external marketplace route.
    enabled: false,
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
