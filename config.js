/* Public site configuration. Do not put secret API keys in this file. */
const SITE_CONFIG = {
  name: 'Gabriel Garcia Alonso',
  location: 'Berlin',
  email: 'notgabriels@gmail.com',
  social: [],
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
