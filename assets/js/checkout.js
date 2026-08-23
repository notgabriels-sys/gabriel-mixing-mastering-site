/* ============================================================================
 * assets/js/checkout.js — PAYMENT PROVIDER ADAPTER
 * ============================================================================
 *
 * The rest of the site never talks to a payment provider directly. It calls:
 *
 *     Checkout.status(service)  -> { enabled, label, provider, reason }
 *     Checkout.start(service)   -> sends the client to the hosted checkout
 *
 * ---------------------------------------------------------------------------
 * HOW A SERVICE'S CHECKOUT IS CHOSEN
 * ---------------------------------------------------------------------------
 * Per service, not site-wide. Each service carries a `checkout` object with a
 * slot per provider:
 *
 *     checkout: {
 *       stripeLink:      'https://buy.stripe.com/...',   // or null
 *       gumroadUrl:      'https://gum.co/...',           // or null
 *       lemonSqueezyUrl: null,
 *       stripePriceId:   null,
 *     }
 *
 * Whichever slot has a URL wins. Fill in one and that service is booked through
 * that provider; fill in several and `SITE_CONFIG.checkout.prefer` decides
 * which is used, with the others as automatic fallbacks. So one service can
 * use Stripe and the next Gumroad, with no site-wide setting
 * to keep in sync — and a service with no URL at all simply reads
 * "Coming soon" instead of rendering a dead button.
 *
 * ---------------------------------------------------------------------------
 * ADDING A PROVIDER
 * ---------------------------------------------------------------------------
 * Add one entry to PROVIDERS below and one slot to each service's `checkout`
 * object. Nothing else in the codebase needs to change.
 *
 * ---------------------------------------------------------------------------
 * DESIGN RULE
 * ---------------------------------------------------------------------------
 * No payment processing happens in this file, and no card data is ever touched
 * by this site. Every provider here is a *hosted* checkout — the client leaves
 * for stripe.com / gumroad.com / lemonsqueezy.com, pays there, and comes back.
 * That keeps card data, tax handling and PCI compliance with the provider.
 * ==========================================================================*/

(function () {
  'use strict';

  /* ------------------------------------------------------------------
   * Provider registry.
   *
   *   key      what you write in SITE_CONFIG.checkout.prefer
   *   field    the slot read from a service's `checkout` object
   *   label    shown to the client as "Checkout via …", so they know
   *            which site they're about to land on
   *   looksValid  required launch guard, also used by scripts/check.js.
   *            A URL that does not match its named provider fails closed;
   *            payment misdirection is riskier than temporary unavailability.
   * ---------------------------------------------------------------- */
  const PROVIDERS = {
    stripe: {
      field: 'stripeLink',
      label: 'Stripe',
      looksValid: function (url) {
        return /^https:\/\/(buy\.stripe\.com|[a-z0-9-]+\.stripe\.com)\//i.test(url);
      },
    },
    gumroad: {
      field: 'gumroadUrl',
      label: 'Gumroad',
      looksValid: function (url) {
        // Gumroad hands out several shapes: gum.co/x, user.gumroad.com/l/x,
        // and gumroad.com/l/x. Accept all of them.
        return /^https:\/\/([a-z0-9-]+\.)?gumroad\.com\//i.test(url) ||
               /^https:\/\/gum\.co\//i.test(url);
      },
    },
    paypal: {
      field: 'paypalUrl',
      label: 'PayPal',
      looksValid: function (url) {
        // PayPal "No-Code Checkout" payment links, created in the business
        // account under Zahlungslinks und -buttons. Shape:
        //   https://www.paypal.com/ncp/payment/<HOSTED_ID>
        return /^https:\/\/www\.paypal\.com\/ncp\/payment\/[A-Z0-9]+$/i.test(url);
      },
    },
    lemonsqueezy: {
      field: 'lemonSqueezyUrl',
      label: 'Lemon Squeezy',
      looksValid: function (url) {
        return /^https:\/\/([a-z0-9-]+\.)?lemonsqueezy\.com\//i.test(url);
      },
    },
  };

  const PROVIDER_KEYS = Object.keys(PROVIDERS);

  /* ------------------------------------------------------------------
   * Config helpers — every one tolerates a missing/partial config so a
   * typo in config.js degrades to "Coming soon" rather than a crash.
   * ---------------------------------------------------------------- */

  function cfg() {
    const c = (window.SITE_CONFIG && window.SITE_CONFIG.checkout) || {};
    return {
      enabled: c.enabled !== false, // default on
      prefer: PROVIDERS[c.prefer] ? c.prefer : 'stripe',
      serverSideStripe: c.serverSideStripe === true,
    };
  }

  /** Providers to try, preferred first, then the rest in registry order. */
  function order() {
    const preferred = cfg().prefer;
    return [preferred].concat(PROVIDER_KEYS.filter(function (k) { return k !== preferred; }));
  }

  function urlFor(service, key) {
    const slot = PROVIDERS[key].field;
    const value = service && service.checkout && service.checkout[slot];
    return typeof value === 'string' && value.trim() ? value.trim() : null;
  }

  /**
   * First provider with a URL on this service, honouring the preference.
   * @returns {{key: string, url: string}|null}
   */
  function resolve(service) {
    const keys = order();
    for (let i = 0; i < keys.length; i++) {
      const url = urlFor(service, keys[i]);
      if (url) return { key: keys[i], url: url };
    }
    return null;
  }

  /* ------------------------------------------------------------------
   * Public API
   * ---------------------------------------------------------------- */

  const Checkout = {
    /** Every provider key the site understands. Used by scripts/check.js. */
    providers: PROVIDERS,

    /**
     * Can this service be booked right now, and what should the button say?
     * @returns {{enabled: boolean, label: string, provider: string|null,
     *            providerLabel: string|null, reason: string|null}}
     */
    status: function (service) {
      const off = function (reason) {
        return { enabled: false, label: 'Coming soon', provider: null, providerLabel: null, reason: reason };
      };

      if (!cfg().enabled) {
        return off('Checkout is switched off site-wide (SITE_CONFIG.checkout.enabled is false).');
      }
      if (!service || service.available === false) {
        return off('Service is marked available: false.');
      }

      /* Optional server-side Stripe route — only when explicitly enabled. */
      if (cfg().serverSideStripe && service.checkout && service.checkout.stripePriceId) {
        return { enabled: true, label: 'Book', provider: 'stripe', providerLabel: 'Stripe', reason: null };
      }

      const hit = resolve(service);
      if (!hit) {
        return off(
          'No checkout URL set for this service. Add one of: ' +
          PROVIDER_KEYS.map(function (k) { return 'checkout.' + PROVIDERS[k].field; }).join(', ') + '.'
        );
      }

      const provider = PROVIDERS[hit.key];
      if (provider.looksValid && !provider.looksValid(hit.url)) {
        return off(
          (service.id || 'service') + ': ' + provider.field +
          ' is not a valid ' + provider.label + ' checkout URL.'
        );
      }

      /* Label stays provider-neutral. The client is told where they're going
       * via providerLabel, rendered next to the button by store.js. */
      return {
        enabled: true,
        label: 'Book',
        provider: hit.key,
        providerLabel: provider.label,
        reason: null,
      };
    },

    /**
     * Send the client to the hosted checkout page for this service.
     */
    start: function (service) {
      const state = this.status(service);
      if (!state.enabled) {
        console.warn('[checkout] ' + (state.reason || 'not bookable'));
        return;
      }

      if (cfg().serverSideStripe && service.checkout && service.checkout.stripePriceId) {
        return startServerSideStripe(service);
      }

      const hit = resolve(service);
      if (!hit) return; // unreachable via status(), belt and braces

      // Hosted checkout lives on another origin — same tab keeps a normal
      // back-button path for the client.
      window.location.assign(hit.url);
    },
  };

  /* ------------------------------------------------------------------
   * Optional: server-side Stripe Checkout Session.
   * Only runs when SITE_CONFIG.checkout.serverSideStripe is true AND the
   * api/ function is deployed with a STRIPE_SECRET_KEY in its environment.
   * ---------------------------------------------------------------- */
  function startServerSideStripe(service) {
    const endpoint =
      (window.SITE_CONFIG && window.SITE_CONFIG.stripe && window.SITE_CONFIG.stripe.checkoutEndpoint) ||
      '/api/create-checkout-session';

    return fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId: service.checkout.stripePriceId, serviceId: service.id }),
    })
      .then(function (res) {
        if (!res.ok) throw new Error('Checkout endpoint returned ' + res.status);
        return res.json();
      })
      .then(function (data) {
        if (!data || !data.url) throw new Error('Checkout endpoint returned no url');
        if (!/^https:\/\/checkout\.stripe\.com\//i.test(data.url)) {
          throw new Error('Checkout endpoint returned a non-Stripe URL');
        }
        window.location.assign(data.url);
      })
      .catch(function (err) {
        console.error('[checkout] server-side Stripe failed:', err);
      });
  }

  window.Checkout = Checkout;
})();
