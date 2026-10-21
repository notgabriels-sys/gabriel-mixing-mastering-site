/* Guided service comparison. Recommendations never start checkout. */
(function () {
  'use strict';

  var DEFAULT_HINT = 'Answer the three questions to compare possible services. I can confirm the scope before you book.';
  var SOURCES = ['stereo', 'stems', 'unsure'];
  var GOALS = ['release', 'mix', 'feedback', 'vinyl'];
  var SIZES = ['single', 'ep', 'album'];

  function resolve(catalog, answers) {
    answers = answers || {};
    if (!SOURCES.includes(answers.source) || !GOALS.includes(answers.goal) || !SIZES.includes(answers.size)) {
      return { ids: [], reason: 'Choose an answer to each question, or ask about your project if none of the options fits.' };
    }
    if (answers.source === 'unsure') {
      return { ids: [], reason: 'Start with a project enquiry. Describe the files you have and what you want to change so I can confirm the right service.' };
    }

    var requested = [];
    var reason = '';
    if (answers.goal === 'feedback') {
      requested = ['mix-consult'];
      reason = 'A feedback session can help you decide what to change. Confirm how many tracks you want to discuss within the session.';
    } else if (answers.goal === 'vinyl') {
      if (answers.source !== 'stereo') {
        return { ids: [], reason: 'For a vinyl pre-master, contact me first to confirm the mix format, side lengths and cutting requirements.' };
      }
      requested = ['mastering-vinyl'];
      reason = 'A vinyl pre-master starts from a finished stereo mix. Confirm side lengths, sequencing and the cutting engineer’s requirements first.';
    } else if (answers.goal === 'mix') {
      if (answers.source !== 'stems') {
        return { ids: [], reason: 'If the mix still needs work, contact me before booking so we can confirm which separate files are needed.' };
      }
      requested = ['mixing-single', 'mixing-mastering-bundle'];
      reason = 'Compare mixing alone with mixing plus mastering. These are per-track services; confirm file preparation and multi-track project scope first.';
    } else if (answers.source === 'stems') {
      requested = ['mastering-stem'];
      reason = 'Stem mastering may fit grouped stems from a finished mix. Raw session tracks or a mix that still needs balancing need a scope check first.';
    } else {
      requested = [answers.size === 'album' ? 'mastering-album' : answers.size === 'ep' ? 'mastering-ep' : 'mastering-single'];
      reason = answers.size === 'single'
        ? 'Single-track mastering starts from a finished stereo mix. Check the preparation notes and service terms before booking.'
        : answers.size === 'ep'
          ? 'Compare the EP service with your release size. It covers up to four tracks; ask about a larger release or a different scope.'
          : 'Album mastering is quoted per project. Send the track count, running time and intended release format to confirm the scope.';
    }

    var items = Array.isArray(catalog) ? catalog : [];
    var ids = requested.filter(function (id) {
      var matches = items.filter(function (service) { return service && service.id === id; });
      return matches.length === 1 && matches[0].available === true;
    }).slice(0, 2);
    if (!ids.length) {
      return { ids: [], reason: 'I cannot confirm an available match from the current catalogue. Please contact me about your project.' };
    }
    if (ids.length < requested.length) reason += ' Only currently available options are shown.';
    return { ids: ids, reason: reason };
  }

  window.ServiceFinder = Object.freeze({ resolve: resolve });

  function init() {
    var form = document.getElementById('service-finder-form');
    var result = document.getElementById('finder-result');
    if (!form || !result || form.getAttribute('data-service-finder-bound') === 'true') return;

    function node(tag, className, text) {
      var element = document.createElement(tag);
      if (className) element.className = className;
      if (text !== undefined) element.textContent = text;
      return element;
    }

    function clear() {
      while (result.firstChild) result.removeChild(result.firstChild);
    }

    function hint() {
      clear();
      result.appendChild(node('p', 'finder__hint', DEFAULT_HINT));
    }

    function price(service) {
      if (service.needsQuote === true) return 'Price on request';
      if (typeof service.price !== 'number' || !Number.isFinite(service.price) || service.price <= 0) return 'Ask about pricing';
      var currency = (window.SITE_CONFIG && window.SITE_CONFIG.currency) || 'EUR';
      var formatted;
      try {
        formatted = new Intl.NumberFormat('en-GB', {
          style: 'currency', currency: currency, minimumFractionDigits: 0, maximumFractionDigits: 2
        }).format(service.price);
      } catch (_) {
        formatted = new Intl.NumberFormat('en-GB', {
          style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 2
        }).format(service.price);
      }
      return formatted + (service.priceNote ? ' ' + service.priceNote : '');
    }

    function render(comparison, catalog) {
      clear();
      result.appendChild(node('p', 'finder__reason', comparison.reason));
      if (comparison.ids.length) {
        var candidates = node('div', 'finder__comparisons');
        comparison.ids.forEach(function (id) {
          var service = catalog.find(function (item) { return item && item.id === id; });
          var card = node('article', 'finder__card');
          card.appendChild(node('h3', 'finder__title', service.title));
          card.appendChild(node('p', 'finder__price', price(service)));
          if (service.description) card.appendChild(node('p', 'finder__description', service.description));
          var terms = node('dl', 'finder__terms');
          [['Turnaround', service.turnaround], ['Revisions', service.revisions]].forEach(function (term) {
            if (!term[1]) return;
            terms.appendChild(node('dt', '', term[0]));
            terms.appendChild(node('dd', '', term[1]));
          });
          card.appendChild(terms);
          var link = node('a', 'finder__link', 'View ' + service.title);
          link.href = '#' + encodeURIComponent(id);
          card.appendChild(link);
          candidates.appendChild(card);
        });
        result.appendChild(candidates);
      }
      var contact = node('a', 'finder__contact', 'Ask about your project');
      contact.href = '#contact';
      result.appendChild(contact);
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var answers = {};
      ['source', 'goal', 'size'].forEach(function (name) {
        var checked = form.querySelector('input[name="' + name + '"]:checked');
        answers[name] = checked ? checked.value : '';
      });
      var catalog = Array.isArray(window.SERVICES) ? window.SERVICES : [];
      render(resolve(catalog, answers), catalog);
    });
    form.addEventListener('reset', hint);
    form.setAttribute('data-service-finder-bound', 'true');
    hint();
    form.hidden = false;
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
    else init();
  }
})();
