// The Liquid upcoming/past split is computed at build time (site.time),
// so a show silently stays "upcoming" until the next deploy rebuilds the
// page. Reclassify against the visitor's actual current date instead.
(function () {
  var upcoming = document.getElementById('shows-upcoming');
  var past = document.getElementById('shows-past');
  if (!upcoming || !past) return;

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  var now = new Date();
  var today = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());

  var shows = [].slice.call(document.querySelectorAll('.show[data-date]'));

  shows.forEach(function (el) {
    var isPast = el.dataset.date < today;
    el.classList.toggle('show--past', isPast);
    var target = isPast ? past : upcoming;
    if (el.parentNode !== target) target.appendChild(el);
  });

  function sortContainer(container, descending) {
    var items = [].slice.call(container.querySelectorAll('.show'));
    items.sort(function (a, b) {
      if (a.dataset.date === b.dataset.date) return 0;
      var cmp = a.dataset.date < b.dataset.date ? -1 : 1;
      return descending ? -cmp : cmp;
    });
    items.forEach(function (el) { container.appendChild(el); });
  }

  sortContainer(upcoming, false);
  sortContainer(past, true);
})();
