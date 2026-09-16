// Fade-and-rise reveal as elements scroll into view.
// The hidden state is applied only once this script runs (via the
// js-reveal class), so without JS the content is simply visible.
(function () {
  if (!('IntersectionObserver' in window)) return;

  var targets = [];
  // an element to reveal on its own
  [].push.apply(targets, document.querySelectorAll('[data-reveal]'));
  // a container whose children are revealed one after another
  [].forEach.call(document.querySelectorAll('[data-reveal-group]'), function (group) {
    [].push.apply(targets, group.children);
  });
  if (!targets.length) return;

  document.documentElement.classList.add('js-reveal');

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

  targets.forEach(function (el, i) {
    el.classList.add('reveal');
    el.style.transitionDelay = (i % 6) * 90 + 'ms';
    observer.observe(el);
  });

  // Safety net: IntersectionObserver callbacks are deferred while a tab is
  // in the background, so anything already on screen is revealed directly
  // once the page is actually being looked at. Without this a page opened
  // in a background tab could stay blank.
  function revealOnScreen() {
    targets.forEach(function (el) {
      if (el.classList.contains('is-visible')) return;
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) {
        el.classList.add('is-visible');
        observer.unobserve(el);
      }
    });
  }
  addEventListener('load', revealOnScreen);
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) revealOnScreen();
  });
})();
