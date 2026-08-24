/* ============================================================================
 * config.js — SITE + PAYMENT CONFIGURATION
 * ============================================================================
 *
 * THIS IS THE MAIN FILE GABRIEL EDITS. Everything site-wide lives here.
 *
 * SAFE TO PUT IN THIS FILE: your email, social links, and *publishable* /
 * public payment identifiers (Stripe Payment Link URLs, PayPal payment URLs,
 * Gumroad product URLs, Lemon Squeezy checkout URLs).
 * These are designed to be visible in a browser.
 *
 * NEVER PUT IN THIS FILE: a Stripe SECRET key (`sk_live_...` / `sk_test_...`),
 * a restricted key (`rk_...`), or any webhook signing secret. This file is
 * downloaded by every visitor. Secret keys belong in the server-side
 * environment only — see `.env.example` and `api/create-checkout-session.js`.
 *
 * ==========================================================================*/

const SITE_CONFIG = {
  /* ------------------------------------------------------------------
   * 1. IDENTITY  — used in the footer and contact section
   * ---------------------------------------------------------------- */
  name: 'Gabriel Garcia Alonso',
  location: 'Berlin',

  // Confirmed by Gabriel. This address is printed on the live site and in the
  // Impressum, and will be scraped by bots — that is the accepted trade-off of
  // publishing a contact address. Swap for a dedicated one (e.g.
  // studio@yourdomain.com) any time; it is read from here in every place.
  email: 'notgabriels@gmail.com',

  // Shown as buttons in the Contact section. Delete any you don't want,
  // add more freely. `url: null` hides the entry.
  social: [
    {
      label: 'Book mastering via AirGigs',
      url: 'https://www.airgigs.com/mastering-engineers-for-hire/109633/I-will-master-your-electronic-music-for-release',
    },
  ],

  /* ------------------------------------------------------------------
   * 2. CURRENCY  — display only. The real charged currency is whatever
   *    you configure inside Stripe / Gumroad / Lemon Squeezy.
   *    Keep these two in sync with your provider.
   * ---------------------------------------------------------------- */
  currency: 'EUR',
  currencySymbol: '€',

  /* ------------------------------------------------------------------
   * 3. CHECKOUT  —  HOSTED PROVIDERS, PER SERVICE
   * ------------------------------------------------------------------
   * There is no site-wide "which provider" setting, because the choice is
   * made per service. Each service in data/services.js carries a slot for
   * each provider:
   *
   *     checkout: {
   *       paypalUrl: 'https://www.paypal.com/ncp/payment/...',
   *       stripeLink: 'https://buy.stripe.com/...',   // Stripe Payment Link
   *       gumroadUrl: 'https://gum.co/...',           // Gumroad product URL
   *       lemonSqueezyUrl: null,
   *       stripePriceId: null,
   *     }
   *
   * Fill in whichever you used for that service. One service can sell
   * through PayPal, the next through Stripe and another through Gumroad —
   * mixing is fine and needs no configuration. A service with no URL shows
   * "Coming soon" when available, or "Currently full" when unavailable.
   *
   * Both kinds of URL are PUBLIC by design — they're meant to be put on a
   * website, and committing them here is fine. Neither setup involves an
   * API key. If anything ever asks you to paste an `sk_...` secret key into
   * this file, something has gone wrong: that key belongs only in a server
   * environment variable, never in a file the browser downloads.
   *
   * CURRENT STATE: checkout is enabled for services that have verified hosted
   * PayPal URLs in data/services.js. Services without a checkout URL remain
   * actionable through email enquiry because enquiryFallback is true.
   * ---------------------------------------------------------------- */
  checkout: {
    /* Master switch. false = every Book button reads "Coming soon", with all
     * URLs left intact. Useful for closing the books for a while. */
    /* Limited checkout state. Keep only verified service-specific hosted
     * payment URLs configured. Legal/privacy/search-indexing launch gates still
     * need completion before this should be treated as a full public launch. */
    enabled: true,

    /* Keep every listed service actionable while hosted payment is disabled
     * or a service-specific checkout URL is still missing. */
    enquiryFallback: true,

    /* Tiebreak only: used when a single service has BOTH a Stripe link and a
     * Gumroad URL. The other becomes an automatic fallback, so a service with
     * only the non-preferred one still sells. Accepts 'paypal', 'stripe',
     * 'gumroad' or 'lemonsqueezy'. */
    prefer: 'paypal',

    /* Advanced, off by default: route Stripe through the serverless function
     * in api/ instead of using Payment Links. Needs a deployed endpoint and a
     * STRIPE_SECRET_KEY environment variable. Only worth it for a real
     * multi-item cart. See api/create-checkout-session.js. */
    serverSideStripe: false,
  },

  /* Provider-specific settings. Only the block for the active provider
   * is read; the others are ignored and can be left as-is. */
  stripe: {
    // BOTH FIELDS BELOW ARE IGNORED IN 'stripe-link' MODE. Leave them alone.
    // They exist only for the optional 'stripe-session' setup.

    // The PUBLISHABLE key (starts with pk_) — safe to expose, but not needed
    // for Payment Links. Leave empty.
    publishableKey: '',

    // Path to the deployed serverless function that creates the session.
    checkoutEndpoint: '/api/create-checkout-session',
  },

  /* Where Stripe sends the client after paying / cancelling.
   * Used by the serverless function. Must be absolute URLs in production. */
  urls: {
    success: '/success.html',
    cancel: '/cancel.html',
  },
};

/* Make available to the other scripts. */
window.SITE_CONFIG = SITE_CONFIG;
