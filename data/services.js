/* ============================================================================
 * data/services.js — THE SERVICE LIST
 * ============================================================================
 *
 * This is the file Gabriel edits most. Every service offered is defined here.
 * Plain JavaScript array so it works with no build step and no server (a .json
 * file would need fetch(), which browsers block on file:// URLs).
 *
 * ############################################################################
 * # PRICES: CONFIRMED BY GABRIEL. TURNAROUNDS AND REVISIONS TOO.             #
 * #                                                                          #
 * # These are the live rates. Two consequences worth keeping in mind:        #
 * #   - Whatever is set here must MATCH the amount on the hosted checkout.   #
 * #     product. The site only displays a number; the provider charges one.  #
 * #   - The turnarounds are a promise to the client. Change them here if the #
 * #     books get full rather than quietly missing them.                     #
 * #                                                                          #
 * # UPDATED 2026-08-23: rates were repositioned for the Berlin specialist   #
 * # market. All old payment links were cleared because their amounts no     #
 * # longer match. Every service remains open through email enquiry.         #
 * ############################################################################
 *
 * ---------------------------------------------------------------------------
 * FIELD REFERENCE — every service object
 * ---------------------------------------------------------------------------
 *  id           string   Unique, lowercase, hyphenated. Stable handle — don't
 *                        change it once a service has been sold or linked to.
 *  category     string   'mastering' or 'mixing'. Drives the filter buttons.
 *  title        string   Service name as displayed.
 *  subtitle     string   One short line under the title. Optional, may be ''.
 *  description  string   1–2 sentences. What the client actually gets.
 *  price        number   Amount in MAJOR units (e.g. 60 means €60.00).
 *                        DISPLAY ONLY — the amount actually charged is the one
 *                        set on the hosted provider. Keep them in sync
 *                        by hand; no script can check it, because only the
 *                        payment provider knows the real price.
 *  priceNote    string   Unit the price is per — 'per track', 'flat', 'from'.
 *                        Shown next to the price. Services are ambiguous
 *                        without it, so this is effectively required.
 *  turnaround   string   Typical delivery time, e.g. '3–5 working days'.
 *                        Be conservative; it sets an expectation you have to
 *                        meet, and a missed one costs more than a slow quote.
 *  revisions    string   What's included, e.g. '2 revision passes included'.
 *  includes     string[] Deliverables and specifics. 3–5 lines reads best.
 *  needsQuote   boolean  true = no fixed price. Renders an "Enquire" button
 *                        that opens email instead of checkout. Use for album
 *                        work, unusual formats, anything you'd want to hear
 *                        before pricing.
 *  available    boolean  false greys the card out and shows "Currently full".
 *                        Use it when the books are closed rather than deleting
 *                        the service — keeps the page honest without losing
 *                        the entry.
 *  checkout     object   Where the Book button sends the client. Fill in the
 *                        slot for whichever provider you used for THIS
 *                        service; they're per service, not site-wide.
 *                          paypalUrl       https://www.paypal.com/ncp/payment/...
 *                          stripeLink       https://buy.stripe.com/...
 *                          gumroadUrl       https://gum.co/... etc.
 *                          lemonSqueezyUrl  Lemon Squeezy checkout URL
 *                          stripePriceId    price_... — optional server-side
 *                                           route only. Leave null.
 *                        All null -> button reads "Coming soon".
 *                        Ignored entirely when needsQuote is true.
 *
 * ---------------------------------------------------------------------------
 * TO ADD OR CHANGE A SERVICE
 * ---------------------------------------------------------------------------
 *  1. Edit or copy an entry below. Give it a unique `id`.
 *  2. Set the real price, turnaround, revisions and includes.
 *  3. Create the matching product with your payment provider:
 *       Stripe   Dashboard -> Product catalogue -> Add product -> set name
 *                and price -> Create payment link -> copy URL ->
 *                `checkout.stripeLink`
 *       Gumroad  Products -> New product -> set name and price -> publish ->
 *                copy share URL -> `checkout.gumroadUrl`
 *       PayPal   Create a no-code checkout/payment link -> verify its public
 *                detail page -> `checkout.paypalUrl`
 *     No API key is involved; these hosted checkout URLs are public by design.
 *  4. Or set `needsQuote: true` and skip the payment provider entirely.
 *  5. Run `node scripts/check.js`.
 *
 * NOTE ON SELLING SERVICES RATHER THAN FILES
 * A payment link takes the money but cannot collect the audio. The client
 * still has to send stems. That handoff is described in the "How it works"
 * section of index.html and repeated on success.html — if you change how you
 * take files in, change it in both places.
 * ==========================================================================*/

// Retired 2026-08-23. One shared Stripe link was wired to every service and
// charged an amount unrelated to the card the client clicked. Each service now
// carries its own verified link, or none at all.

const SERVICES = [

  /* ========================= MASTERING ========================= */

  {
    id: 'mastering-single',
    category: 'mastering',
    title: 'Single Track Mastering',
    subtitle: 'One track, release-ready',
    description:
      'Mastering for one finished mix. Delivered ready for digital release, ' +
      'with a separate louder cut for club and DJ use if you want one.',
    price: 45,
    priceNote: 'per track',
    turnaround: '3–5 working days',
    revisions: '2 revision passes included',
    includes: [
      'WAV 24-bit master (release)',
      'MP3 320 reference',
      'Optional club/DJ cut',
      'ISRC embedding on request',
    ],
    needsQuote: false,
    available: true,
    checkout: {
      stripeLink: null,
      paypalUrl: 'https://www.paypal.com/ncp/payment/3SWZ64EXW9C8W',
      stripePriceId: null,
      gumroadUrl: null,
      lemonSqueezyUrl: null,
    },
  },

  {
    id: 'mastering-ep',
    category: 'mastering',
    title: 'EP Mastering',
    subtitle: 'Up to 4 tracks, levelled as a set',
    description:
      'Mastering for a short release, balanced so the tracks sit together as ' +
      'one record rather than as separate singles.',
    price: 240,
    priceNote: 'up to 4 tracks',
    turnaround: '5–7 working days',
    revisions: '2 revision passes per track',
    includes: [
      'WAV 24-bit masters',
      'MP3 320 references',
      'Level-matched across the release',
      'Track order and spacing on request',
    ],
    needsQuote: false,
    available: true, // open for enquiry; payment waits for its own verified link
    checkout: {
      stripeLink: null,
      paypalUrl: null, // no verified PayPal link yet
      stripePriceId: null,
      gumroadUrl: null,
      lemonSqueezyUrl: null,
    },
  },

  {
    id: 'mastering-stem',
    category: 'mastering',
    title: 'Stem Mastering',
    subtitle: 'From grouped stems, not a stereo mix',
    description:
      'For mixes that need more control than a stereo master allows. Send ' +
      'grouped stems and the balance can still be moved at the master stage.',
    price: 120,
    priceNote: 'per track',
    turnaround: '5–7 working days',
    revisions: '2 revision passes included',
    includes: [
      'Up to 8 stems',
      'WAV 24-bit master',
      'MP3 320 reference',
      'Short note on what was changed',
    ],
    needsQuote: false,
    available: true, // open for enquiry; payment waits for its own verified link
    checkout: {
      stripeLink: null,
      paypalUrl: null, // no verified PayPal link yet
      stripePriceId: null,
      gumroadUrl: null,
      lemonSqueezyUrl: null,
    },
  },

  {
    id: 'mastering-vinyl',
    category: 'mastering',
    title: 'Vinyl Pre-Master',
    subtitle: 'Cut-ready, per side',
    description:
      'A separate master prepared for lacquer cutting — different constraints ' +
      'from a digital master, so it is done as its own pass.',
    price: 90,
    priceNote: 'per side',
    turnaround: '5–7 working days',
    revisions: '1 revision pass included',
    includes: [
      'Cut-ready WAV per side',
      'Side timings and track spacing',
      'Notes for the cutting engineer',
    ],
    needsQuote: false,
    available: true, // open for enquiry; payment waits for its own verified link
    checkout: {
      stripeLink: null,
      paypalUrl: null, // no verified PayPal link yet
      stripePriceId: null,
      gumroadUrl: null,
      lemonSqueezyUrl: null,
    },
  },

  {
    id: 'mastering-album',
    category: 'mastering',
    title: 'Album Mastering',
    subtitle: 'Priced per record',
    description:
      'Full-length releases are quoted individually — track count, formats ' +
      'and deadline all move the number. Send the record and what you need.',
    price: 0,
    priceNote: '',
    turnaround: 'Agreed per project',
    revisions: 'Agreed per project',
    includes: [
      'Digital and vinyl formats',
      'Sequencing and level matching',
      'Deadline agreed up front',
    ],
    needsQuote: true,
    available: true,
    checkout: {
      stripeLink: null,
      paypalUrl: null,
      stripePriceId: null,
      gumroadUrl: null,
      lemonSqueezyUrl: null,
    },
  },

  /* ========================== MIXING =========================== */

  {
    id: 'mixing-single',
    category: 'mixing',
    title: 'Track Mixing',
    subtitle: 'One track, from your session',
    description:
      'Mixing one track from your multitrack session or stems, through to a ' +
      'mix that is ready to be mastered.',
    price: 160,
    priceNote: 'per track',
    turnaround: '7–10 working days',
    revisions: '3 revision passes included',
    includes: [
      'Full multitrack mix',
      'WAV 24-bit mixdown',
      'Instrumental and acapella versions',
      'Recall kept for later changes',
    ],
    needsQuote: false,
    available: true,
    checkout: {
      stripeLink: null,
      paypalUrl: 'https://www.paypal.com/ncp/payment/6Z93DNS76PCGS',
      stripePriceId: null,
      gumroadUrl: null,
      lemonSqueezyUrl: null,
    },
  },

  {
    id: 'mixing-mastering-bundle',
    category: 'mixing',
    title: 'Mix + Master',
    subtitle: 'One track, start to finish',
    description:
      'Mixing and mastering handled together on the same track, which usually ' +
      'lands better than splitting them across two engineers.',
    price: 190,
    priceNote: 'per track',
    turnaround: '7–12 working days',
    revisions: '3 mix passes, 2 master passes',
    includes: [
      'Full multitrack mix',
      'Master for digital release',
      'Instrumental and acapella versions',
      'Optional club/DJ cut',
    ],
    needsQuote: false,
    available: true,
    checkout: {
      stripeLink: null,
      paypalUrl: 'https://www.paypal.com/ncp/payment/QW8V53WWM2P7E',
      stripePriceId: null,
      gumroadUrl: null,
      lemonSqueezyUrl: null,
    },
  },

  {
    id: 'mix-revision',
    category: 'mixing',
    title: 'Mix Revision Pass',
    subtitle: 'Beyond the included passes',
    description:
      'An extra round of changes on a mix already done here, once the ' +
      'included revision passes have been used.',
    price: 75,
    priceNote: 'per pass',
    turnaround: '2–4 working days',
    revisions: 'One pass',
    includes: [
      'One round of changes',
      'Updated mixdown and versions',
    ],
    needsQuote: false,
    available: true, // open for enquiry; payment waits for its own verified link
    checkout: {
      stripeLink: null,
      paypalUrl: null, // no verified PayPal link yet
      stripePriceId: null,
      gumroadUrl: null,
      lemonSqueezyUrl: null,
    },
  },

  {
    id: 'mix-consult',
    category: 'mixing',
    title: 'Mix Feedback Session',
    subtitle: 'One hour, your mix, notes back',
    description:
      'A listening pass on a mix you are doing yourself, with written notes ' +
      'on what to change and why. No files are altered.',
    price: 90,
    priceNote: 'per hour',
    turnaround: '2–4 working days',
    revisions: 'Not applicable',
    includes: [
      'Detailed written notes',
      'Reference comparisons',
      'Follow-up questions by email',
    ],
    needsQuote: false,
    available: true, // open for enquiry; payment waits for its own verified link
    checkout: {
      stripeLink: null,
      paypalUrl: null, // no verified PayPal link yet
      stripePriceId: null,
      gumroadUrl: null,
      lemonSqueezyUrl: null,
    },
  },

];

/* Make available to the other scripts. */
window.SERVICES = SERVICES;
