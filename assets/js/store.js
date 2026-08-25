/* ============================================================================
 * assets/js/store.js — RENDERS THE PAGE
 * ============================================================================
 *
 * Reads window.SITE_CONFIG (config.js) and window.SERVICES (data/services.js)
 * and builds the service list, contact links and footer.
 *
 * There is no framework and no build step. Everything is plain DOM.
 * ==========================================================================*/

(function () {
  'use strict';

  document.documentElement.classList.remove('no-js');

  const cfg = window.SITE_CONFIG || {
    email: '',
    social: [],
    pricing: { public: false, quoteLabel: 'Written quote after listening' },
    checkout: { enabled: false, enquiryFallback: true },
    currencySymbol: '€'
  };
  const services = window.SERVICES || [];

  /* ---------------------------------------------------------------------
   * Helpers
   * ------------------------------------------------------------------- */

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function formatPrice(value) {
    const symbol = cfg.currencySymbol || '';
    // Whole-euro service prices read better without trailing zeros; anything
    // with cents still shows them.
    const n = Number(value);
    return symbol + (n % 1 === 0 ? String(n) : n.toFixed(2));
  }

  function publicPricingEnabled() {
    return !!(cfg.pricing && cfg.pricing.public === true);
  }

  function quoteLabel() {
    return (cfg.pricing && cfg.pricing.quoteLabel) || 'Written quote after listening';
  }

  function displayPrice(service) {
    if (
      !publicPricingEnabled() ||
      service.needsQuote === true ||
      !Number.isFinite(service.price) ||
      service.price <= 0
    ) return quoteLabel();
    return formatPrice(service.price) + (service.priceNote ? ' ' + service.priceNote : '');
  }

  const CATEGORY_LABEL = { mastering: 'Mastering', mixing: 'Mixing' };

  /* The short rate index answers the first practical question without making
   * visitors navigate the full service catalogue. Keep this list deliberately
   * small; the detailed menu remains the source of truth for scope. */
  const QUICK_RATE_IDS = [
    'mastering-single',
    'mixing-single',
    'mixing-mastering-bundle',
    'mastering-stem',
  ];

  function rateText(service) {
    if (
      !publicPricingEnabled() ||
      service.needsQuote === true ||
      !Number.isFinite(service.price) ||
      service.price <= 0
    ) return quoteLabel();
    return formatPrice(service.price) + (service.priceNote ? ' ' + service.priceNote : '');
  }

  function buildRateItem(service, linkPrefix) {
    const item = el('li', 'rate-quickview__item');
    const link = el('a');
    link.href = (linkPrefix ? linkPrefix + '#' : '#') + service.id;
    const price = rateText(service);

    const copy = el('span', 'rate-quickview__copy');
    copy.appendChild(el('span', 'rate-quickview__category', CATEGORY_LABEL[service.category] || service.category));
    copy.appendChild(el('strong', null, service.title));
    link.appendChild(copy);
    link.appendChild(el('span', 'rate-quickview__price', price));
    link.appendChild(el('span', 'rate-quickview__subtitle', service.subtitle || service.priceNote || ''));
    item.appendChild(link);
    return item;
  }

  function renderRateIndex() {
    const list = document.getElementById('rate-quickview');
    if (!list) return;
    const linkPrefix = list.dataset.linkPrefix || '';
    list.innerHTML = '';
    QUICK_RATE_IDS.forEach(function (id) {
      const service = services.find(function (item) { return item.id === id; });
      if (service && service.available !== false) list.appendChild(buildRateItem(service, linkPrefix));
    });
  }

  function renderRateFrom() {
    const service = services.find(function (item) { return item.id === 'mastering-single'; });
    const text = service && publicPricingEnabled() && Number.isFinite(service.price) && service.price > 0
      ? formatPrice(service.price)
      : quoteLabel();
    document.querySelectorAll('[data-rate-from]').forEach(function (node) {
      node.textContent = text;
      const parent = node.closest('a');
      if (parent) parent.setAttribute('aria-label', 'Rates from ' + text + ' per track — view rates');
    });
  }

  renderRateIndex();
  renderRateFrom();

  function mailtoHref(subject, body) {
    const address = cfg.email || '';
    if (!address || address.indexOf('REPLACE_ME') === 0) return null;
    const query = ['subject=' + encodeURIComponent(subject)];
    if (body) query.push('body=' + encodeURIComponent(body));
    return 'mailto:' + address + '?' + query.join('&');
  }

  function enquiryBody(service) {
    return [
      'Hi Gabriel,',
      '',
      'I am interested in: ' + service.title,
      'I understand this is a non-binding enquiry.',
      '',
      'Private listening link:',
      'What still feels unresolved:',
      'Release deadline:',
      'Reference tracks:',
      '',
      'Optional context',
      'Artist / project name:',
      'Number of tracks / stems:',
      'Release format and required delivery versions:',
      '',
      'Thanks,'
    ].join('\n');
  }

  function safeExternalUrl(value) {
    if (typeof value !== 'string' || !value.trim()) return null;
    try {
      const parsed = new URL(value.trim());
      return parsed.protocol === 'https:' ? parsed.href : null;
    } catch (_) {
      return null;
    }
  }

  /* ---------------------------------------------------------------------
   * Three featured routes — same source data as the full catalogue
   * ------------------------------------------------------------------- */

  const FEATURED_SERVICE_IDS = [
    'mastering-single',
    'mixing-single',
    'mixing-mastering-bundle'
  ];

  function buildFeaturedCard(service, index) {
    const article = el('article', 'featured-service');
    article.appendChild(el('p', 'featured-service__number', String(index + 1).padStart(2, '0')));
    article.appendChild(el('h3', null, service.title));
    article.appendChild(el('p', 'featured-service__desc', service.description));

    const meta = el('div', 'featured-service__meta');
    meta.setAttribute(
      'aria-label',
      'Typical timing: ' + service.turnaround + '. Revision scope: ' + service.revisions
    );
    meta.appendChild(el('span', null, service.turnaround));
    meta.appendChild(el('span', null, service.revisions));
    article.appendChild(meta);

    /* Keep the practical decision visible at the point where a visitor is
     * choosing a route. The rate index remains the source of truth, but the
     * featured cards should never make someone scroll back to compare price. */
    const featuredPriceText = displayPrice(service);
    const featuredPrice = el('p', 'featured-service__price', featuredPriceText);
    featuredPrice.setAttribute('aria-label', 'Starting rate ' + featuredPriceText);
    article.appendChild(featuredPrice);

    const footer = el('div', 'featured-service__footer featured-service__actions');

    const enquiry = el('a', 'featured-service__enquiry', 'Let me hear this');
    enquiry.href = mailtoHref(
      'Non-binding project enquiry — ' + service.title,
      enquiryBody(service)
    ) || 'brief.html';
    enquiry.setAttribute('aria-label', 'Let me hear this — start a non-binding enquiry about ' + service.title);
    footer.appendChild(enquiry);

    const detail = el('a', 'featured-service__link', 'Full scope');
    detail.href = '#' + service.id;
    detail.setAttribute('aria-label', 'Full scope — view detailed scope for ' + service.title);
    footer.appendChild(detail);
    article.appendChild(footer);
    return article;
  }

  const featuredGrid = document.getElementById('featured-service-grid');
  if (featuredGrid) {
    FEATURED_SERVICE_IDS.forEach(function (id, index) {
      const service = services.find(function (item) { return item.id === id; });
      if (service) featuredGrid.appendChild(buildFeaturedCard(service, index));
    });
  }

  /* ---------------------------------------------------------------------
   * Service card
   * ------------------------------------------------------------------- */

  function buildCard(service) {
    const quoteOnly = service.needsQuote === true;
    const status = quoteOnly
      ? { enabled: false, label: '', provider: null, providerLabel: null, reason: null }
      : window.Checkout.status(service);

    const card = el('article', 'card' + (service.available === false ? ' card--unavailable' : ''));
    card.dataset.category = service.category;
    card.dataset.id = service.id;
    card.tabIndex = -1;

    const body = el('div', 'card__body');

    /* --- Heading ----------------------------------------------------- */
    const head = el('div', 'card__head');
    head.appendChild(el('span', 'card__badge', CATEGORY_LABEL[service.category] || service.category));
    const title = el('h3', 'card__title', service.title);
    title.id = service.id + '-title';
    head.appendChild(title);
    card.setAttribute('aria-labelledby', title.id);
    if (service.subtitle) head.appendChild(el('p', 'card__subtitle', service.subtitle));
    body.appendChild(head);

    body.appendChild(el('p', 'card__desc', service.description));

    /* --- Terms: the three things a client actually decides on -------- */
    const terms = el('dl', 'card__terms');

    function term(label, value) {
      if (!value) return;
      terms.appendChild(el('dt', null, label));
      terms.appendChild(el('dd', null, value));
    }
    term('Turnaround', service.turnaround);
    term('Revisions', service.revisions);
    if (terms.children.length) body.appendChild(terms);

    /* --- Deliverables ------------------------------------------------ */
    if (Array.isArray(service.includes) && service.includes.length) {
      const ul = el('ul', 'card__details');
      service.includes.forEach(function (d) { ul.appendChild(el('li', null, d)); });
      body.appendChild(ul);
    }

    /* --- Price + action ---------------------------------------------- */
    const foot = el('div', 'card__foot');

    const priceWrap = el('div', 'card__pricing');
    if (!publicPricingEnabled() || quoteOnly) {
      priceWrap.appendChild(el('span', 'card__price card__price--quote', quoteLabel()));
      priceWrap.setAttribute('aria-label', quoteLabel());
    } else {
      priceWrap.appendChild(el('span', 'card__price', formatPrice(service.price)));
      if (service.priceNote) priceWrap.appendChild(el('span', 'card__price-note', service.priceNote));
      priceWrap.setAttribute(
        'aria-label',
        'Price ' + formatPrice(service.price) + (service.priceNote ? ' ' + service.priceNote : '')
      );
    }
    foot.appendChild(priceWrap);

    if (service.available === false) {
      /* Books closed. Say so rather than taking money for a slot that
       * doesn't exist. */
      const closed = el('span', 'card__closed', 'Currently full');
      foot.appendChild(closed);
    } else if (quoteOnly) {
      /* Individually scoped work starts with a non-binding email enquiry. */
      const href = mailtoHref('Non-binding quote request — ' + service.title, enquiryBody(service));
      const a = el('a', 'btn btn--buy', 'Request quote');
      if (href) {
        a.href = href;
      } else {
        a.href = '#contact';
        a.title = 'Set SITE_CONFIG.email in config.js to open email directly.';
      }
      a.setAttribute('aria-label', 'Request a quote for ' + service.title);
      foot.appendChild(a);
    } else if (!status.enabled && cfg.checkout && cfg.checkout.enquiryFallback === true) {
      /* Keep the route useful while public pricing and payment stay disabled. */
      const href = mailtoHref('Non-binding service enquiry — ' + service.title, enquiryBody(service));
      const a = el('a', 'btn btn--buy', 'Request quote');
      a.href = href || '#contact';
      a.setAttribute('aria-label', 'Request a quote for ' + service.title);
      if (!href) a.title = 'Set SITE_CONFIG.email in config.js to open email directly.';
      foot.appendChild(a);
    } else {
      const btn = el('button', 'btn btn--buy', status.enabled ? 'Book' : 'Coming soon');
      btn.type = 'button';
      if (status.enabled) {
        btn.setAttribute(
          'aria-label',
          'Book ' + service.title +
          (status.providerLabel ? ' — checkout via ' + status.providerLabel : '')
        );
        btn.addEventListener('click', function () { window.Checkout.start(service); });
      } else {
        btn.disabled = true;
        // Useful while setting the site up, invisible to clients.
        btn.title = status.reason || '';
      }
      foot.appendChild(btn);
    }

    body.appendChild(foot);

    /* Tell the client which site they're about to land on. Being bounced to
     * an unfamiliar domain unannounced is where people abandon a checkout. */
    if (!quoteOnly && service.available !== false && status.enabled && status.providerLabel) {
      body.appendChild(el('p', 'card__provider', 'Secure checkout via ' + status.providerLabel));
    }

    card.appendChild(body);
    return card;
  }

  /* ---------------------------------------------------------------------
   * List + filtering
   * ------------------------------------------------------------------- */

  const grid = document.getElementById('service-grid');
  const emptyMsg = document.getElementById('grid-empty');
  const statusMsg = document.getElementById('filter-status');

  const FILTER_LABEL = { all: 'All services', mastering: 'Mastering', mixing: 'Mixing' };

  let currentFilter = null;

  function render(filter) {
    if (!grid) return 0;
    grid.innerHTML = '';
    const visible = services.filter(function (s) {
      return filter === 'all' || s.category === filter;
    });
    visible.forEach(function (s) { grid.appendChild(buildCard(s)); });
    if (emptyMsg) emptyMsg.hidden = visible.length > 0;
    return visible.length;
  }

  const filterButtons = Array.prototype.slice.call(document.querySelectorAll('.filter'));

  function setFilter(value) {
    // Re-rendering on every nav click would throw away scroll position and
    // re-announce for no reason, so skip when nothing actually changes.
    if (value === currentFilter) return;
    currentFilter = value;

    filterButtons.forEach(function (b) {
      const on = b.dataset.filter === value;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', String(on));
    });

    const count = render(value);
    grid.setAttribute('aria-label', FILTER_LABEL[value] || 'Services');

    if (statusMsg) {
      statusMsg.textContent =
        (FILTER_LABEL[value] || 'Services') + ': ' +
        count + (count === 1 ? ' service' : ' services');
    }
  }

  filterButtons.forEach(function (b) {
    b.addEventListener('click', function () { setFilter(b.dataset.filter); });
  });

  if (grid) setFilter('all');

  /* ---------------------------------------------------------------------
   * Shareable service links
   * ---------------------------------------------------------------------
   * yourdomain.com/#mastering-single opens the page with that service
   * scrolled into view and briefly outlined — so a single service can be
   * linked from an email or a DM without per-service pages.
   * ------------------------------------------------------------------- */

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function cssEscape(value) {
    return window.CSS && window.CSS.escape ? window.CSS.escape(value) : value.replace(/"/g, '\\"');
  }

  function focusService(id) {
    if (!id) return false;
    if (!grid) return false;
    const service = services.filter(function (s) { return s.id === id; })[0];
    if (!service) return false;

    if (currentFilter !== 'all' && currentFilter !== service.category) setFilter('all');

    const disclosure = grid.closest('details');
    if (disclosure && !disclosure.open) disclosure.open = true;

    const card = grid.querySelector('[data-id="' + cssEscape(id) + '"]');
    if (!card) return false;

    card.scrollIntoView({ block: 'center', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    card.classList.add('card--focused');
    card.focus({ preventScroll: true });
    if (statusMsg) statusMsg.textContent = service.title + ' — linked service';
    window.setTimeout(function () { card.classList.remove('card--focused'); }, 2400);
    return true;
  }

  function handleHash() {
    try {
      focusService(decodeURIComponent(String(window.location.hash).replace(/^#/, '')));
    } catch (_) {
      // Malformed percent escapes are not a service id. Ignore them without
      // interrupting contact, navigation or the rest of page initialization.
    }
  }

  window.addEventListener('hashchange', handleHash);
  handleHash();

  /* ---------------------------------------------------------------------
   * Contact + footer, driven by config.js
   * ------------------------------------------------------------------- */

  const emailBtn = document.getElementById('contact-email');
  if (emailBtn) {
    const address = cfg.email || '';
    const unset = !address || address.indexOf('REPLACE_ME') === 0;
    emailBtn.href = unset ? '#' : mailtoHref('Non-binding project enquiry — mixing / mastering');
    emailBtn.textContent = unset ? 'Email — set address in config.js' : address;
    if (unset) emailBtn.classList.add('is-placeholder');
  }

  const linkList = document.getElementById('contact-links');
  if (linkList && Array.isArray(cfg.social)) {
    cfg.social.forEach(function (item) {
      // Unconfigured links are setup state, not visitor-facing content.
      if (!item.url) return;
      const safeUrl = safeExternalUrl(item.url);
      if (!safeUrl) {
        console.warn('[contact] Ignoring non-HTTPS social URL for ' + (item.label || 'link'));
        return;
      }
      const li = el('li');
      const a = el('a', null, item.label);
      a.href = safeUrl;
      a.rel = 'noopener';
      a.target = '_blank';
      a.setAttribute('aria-label', item.label + ' (opens in a new tab)');
      li.appendChild(a);
      linkList.appendChild(li);
    });
  }

  const footerName = document.getElementById('footer-name');
  if (footerName && cfg.name) footerName.textContent = cfg.name;

  /* ---------------------------------------------------------------------
   * Mobile nav toggle
   * ------------------------------------------------------------------- */

  const toggle = document.getElementById('nav-toggle');
  const nav = document.getElementById('main-nav');
  if (toggle && nav) {
    const mobileNav = window.matchMedia('(max-width: 1080px)');

    function setNavOpen(open, returnFocus) {
      const mobile = mobileNav.matches;
      const nextOpen = mobile && open;
      document.body.classList.toggle('nav-open', nextOpen);
      toggle.setAttribute('aria-expanded', String(nextOpen));
      toggle.setAttribute('aria-label', nextOpen ? 'Close navigation' : 'Open navigation');
      nav.setAttribute('aria-hidden', String(mobile && !nextOpen));
      // `inert` prevents the collapsed links entering keyboard focus order;
      // CSS visibility below is the fallback for older browsers.
      nav.toggleAttribute('inert', mobile && !nextOpen);
      if (nextOpen) {
        const firstLink = nav.querySelector('a');
        if (firstLink) firstLink.focus();
      } else if (returnFocus) {
        toggle.focus();
      }
    }

    toggle.addEventListener('click', function () {
      setNavOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        const hash = a.hash;
        const samePage = hash && a.origin === window.location.origin && a.pathname === window.location.pathname;
        setNavOpen(false);
        if (samePage && mobileNav.matches) {
          window.setTimeout(function () {
            const target = document.querySelector(hash);
            if (!target) return;
            if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
            target.focus({ preventScroll: true });
          }, 0);
        } else if (mobileNav.matches) {
          toggle.focus();
        }
      });
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setNavOpen(false, true);
      }
    });

    if (typeof mobileNav.addEventListener === 'function') {
      mobileNav.addEventListener('change', function () { setNavOpen(false); });
    }

    const header = toggle.closest('.site-header');
    if (header) {
      header.addEventListener('focusout', function () {
        window.setTimeout(function () {
          if (
            mobileNav.matches &&
            toggle.getAttribute('aria-expanded') === 'true' &&
            !header.contains(document.activeElement)
          ) setNavOpen(false);
        }, 0);
      });
    }
    setNavOpen(false);
  }

  /* ---------------------------------------------------------------------
   * Setup warnings — console only, so they help whoever is configuring the
   * site without ever reaching a client.
   * ------------------------------------------------------------------- */

  if (cfg.checkout && cfg.checkout.enabled === false) {
    console.info('[site] Payment is disabled; service enquiry links remain available.');
  }
  if (!cfg.email || cfg.email.indexOf('REPLACE_ME') === 0) {
    console.info('[site] SITE_CONFIG.email is still the placeholder — Enquire buttons cannot open email.');
  }
  const reachable = services.filter(function (s) {
    return s.available !== false && (
      s.needsQuote === true ||
      (cfg.checkout && cfg.checkout.enquiryFallback === true) ||
      (window.Checkout && window.Checkout.status(s).enabled)
    );
  });
  if (services.length && !reachable.length) {
    console.info(
      '[site] No service enquiry route is available. Enable the enquiry ' +
      'fallback or add a deliberate service route before publishing.'
    );
  }
})();
