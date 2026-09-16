// A little LFO for the home page. The output value (0..1) drives the
// playbackRate of the background face animations, so the ghosts speed up
// and slow down with the wave. The scope is a scrolling trace of the
// output, drawn in the site accent colour.
(function () {
  var root = document.querySelector('[data-lfo]');
  if (!root) return;

  var scope = root.querySelector('[data-lfo-scope]');
  var readout = root.querySelector('[data-lfo-readout]');
  var freqInput = root.querySelector('[data-lfo-freq]');
  var waveButtons = [].slice.call(root.querySelectorAll('[data-lfo-wave]'));
  var ctx = scope.getContext('2d');

  var FREQ_MIN = 0.05, FREQ_MAX = 8;   // Hz, slider maps log between these
  var RATE_MIN = 0,    RATE_MAX = 7;   // playbackRate: full freeze to a whip

  var wave = 'sine';
  var freq = toFreq(+freqInput.value);
  var phase = 0;                       // accumulated cycles (float)
  var held = Math.random();            // sample-and-hold value for RND
  var heldCycle = -1;
  var trace = [];
  var accent = '#ed3424';
  var accentFaded = 'rgba(237, 52, 36, 0.35)';
  var last = performance.now();
  var targets = [];
  var glow = document.querySelector('[data-lfo-glow]');
  var rateOut = root.querySelector('[data-lfo-rate]');
  var faceEls = [], faceBaseFilters = [];

  function toFreq(v) { return FREQ_MIN * Math.pow(FREQ_MAX / FREQ_MIN, v); }

  function collectTargets() {
    targets = [];
    faceEls = [].slice.call(document.querySelectorAll('.site__bg-fx'));
    faceBaseFilters = faceEls.map(function (el) {
      return getComputedStyle(el).filter.replace('none', '');
    });
    faceEls.forEach(function (el) {
      [].push.apply(targets, el.getAnimations());
    });
  }

  function sample(p) {
    switch (wave) {
      case 'sine':     return 0.5 + 0.5 * Math.sin(2 * Math.PI * p);
      case 'triangle': return p < 0.5 ? 2 * p : 2 - 2 * p;
      case 'square':   return p < 0.5 ? 1 : 0;
      case 'sawtooth': return p;
      case 'random':   return held;
    }
  }

  function setupCanvas() {
    var dpr = window.devicePixelRatio || 1;
    var w = scope.clientWidth, h = scope.clientHeight;
    scope.width = Math.round(w * dpr);
    scope.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var styles = getComputedStyle(document.documentElement);
    accent = (styles.getPropertyValue('--color-accent') || accent).trim();
    accentFaded = (styles.getPropertyValue('--color-accent-faded') || accentFaded).trim();
    if (trace.length > w) trace.splice(0, trace.length - w);
  }

  function draw() {
    var w = scope.clientWidth, h = scope.clientHeight;
    var pad = 6;
    ctx.clearRect(0, 0, w, h);

    // centre line
    ctx.strokeStyle = accentFaded;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();

    if (!trace.length) return;
    var y = function (v) { return pad + (1 - v) * (h - 2 * pad); };
    var offset = w - trace.length;

    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(offset, y(trace[0]));
    for (var i = 1; i < trace.length; i++) ctx.lineTo(offset + i, y(trace[i]));
    ctx.stroke();

    // the "now" point
    var vNow = trace[trace.length - 1];
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(w - 1, y(vNow), 3, 0, 2 * Math.PI);
    ctx.fill();
  }

  function tick(now) {
    var dt = Math.min((now - last) / 1000, 0.1);
    last = now;

    phase += freq * dt;
    var cycle = Math.floor(phase);
    if (cycle !== heldCycle) { heldCycle = cycle; held = Math.random(); }
    var v = sample(phase - cycle);

    // modulate the background animation speed
    if (!targets.length) collectTargets();
    var rate = RATE_MIN + v * (RATE_MAX - RATE_MIN);
    targets.forEach(function (a) { a.playbackRate = rate; });
    rateOut.textContent = '\u00d7' + rate.toFixed(1);

    // the faces throb with the wave: their brightness rides the output
    // on top of each layer's own base filter
    var glowAmt = ' brightness(' + (0.7 + v * 0.8).toFixed(3) + ')';
    faceEls.forEach(function (el, i) {
      el.style.filter = faceBaseFilters[i] + glowAmt;
    });

    // and the screen edges glow with it
    if (glow) glow.style.opacity = (v * 0.85).toFixed(3);

    trace.push(v);
    if (trace.length > scope.clientWidth) trace.splice(0, trace.length - scope.clientWidth);
    draw();
    requestAnimationFrame(tick);
  }

  waveButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      wave = btn.getAttribute('data-lfo-wave');
      waveButtons.forEach(function (b) {
        var on = b === btn;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', on);
      });
    });
  });

  function updateReadout() {
    readout.textContent = (freq < 1 ? freq.toFixed(2) : freq.toFixed(1)) + ' Hz';
  }
  freqInput.addEventListener('input', function () {
    freq = toFreq(+freqInput.value);
    updateReadout();
  });

  addEventListener('resize', setupCanvas);
  // the panel can resize after init (late CSS or font load) — keep the
  // canvas bitmap matched to its on-screen size or the trace corrupts
  if ('ResizeObserver' in window) new ResizeObserver(setupCanvas).observe(scope);
  setupCanvas();
  updateReadout();
  requestAnimationFrame(function (t) { last = t; tick(t); });
})();
