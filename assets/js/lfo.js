// A little LFO for the home page. The output value (0..1) is patched to
// the POSITION of each face animation — like a real LFO on a destination,
// it sets where the faces are along their motion path each frame, so only
// the LFO frequency controls how fast they move. It also drives their
// brightness and a glow around the screen edges. The scope is a scrolling trace of the
// output, drawn as SVG — canvas is deliberately avoided, since browser
// fingerprint protections (Brave's, notably) blank or poison canvas.
(function () {
  var root = document.querySelector('[data-lfo]');
  if (!root) return;

  var readout = root.querySelector('[data-lfo-readout]');
  var rateOut = root.querySelector('[data-lfo-rate]');
  var freqInput = root.querySelector('[data-lfo-freq]');
  var waveButtons = [].slice.call(root.querySelectorAll('[data-lfo-wave]'));
  var traceEl = root.querySelector('[data-lfo-trace]');
  var dotEl = root.querySelector('[data-lfo-dot]');
  var glow = document.querySelector('[data-lfo-glow]');

  var FREQ_MIN = 0.05, FREQ_MAX = 8;   // Hz, slider maps log between these
  var N = 300;                         // scope samples = viewBox width

  var wave = 'sine';
  var freq = toFreq(+freqInput.value);
  var phase = 0;                       // accumulated cycles (float)
  var held = Math.random();            // sample-and-hold value for RND
  var heldCycle = -1;
  var trace = [];
  var last = performance.now();
  var targets = [];
  var faceEls = [], faceBaseFilters = [];

  function toFreq(v) { return FREQ_MIN * Math.pow(FREQ_MAX / FREQ_MIN, v); }

  function collectTargets() {
    targets = [];
    faceEls = [].slice.call(document.querySelectorAll('.site__bg-fx'));
    faceBaseFilters = faceEls.map(function (el) {
      return getComputedStyle(el).filter.replace('none', '');
    });
    faceEls.forEach(function (el) {
      el.getAnimations().forEach(function (a) {
        a.pause();                     // the LFO owns the timeline now
        targets.push({ anim: a, dur: a.effect.getTiming().duration });
      });
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

  // viewBox is 300x100 with a 6-unit pad top and bottom
  function y(v) { return (6 + (1 - v) * 88).toFixed(1); }

  function draw() {
    var offset = N - trace.length;
    var pts = '';
    for (var i = 0; i < trace.length; i++) {
      pts += (offset + i) + ',' + y(trace[i]) + ' ';
    }
    traceEl.setAttribute('points', pts);
    var cy = y(trace[trace.length - 1]);
    dotEl.setAttribute('y1', cy);
    dotEl.setAttribute('y2', cy);
  }

  function tick(now) {
    var dt = Math.min((now - last) / 1000, 0.1);
    last = now;

    phase += freq * dt;
    var cycle = Math.floor(phase);
    if (cycle !== heldCycle) { heldCycle = cycle; held = Math.random(); }
    var v = sample(phase - cycle);

    // the output sets each face's position along its motion path —
    // the wave's shape is the movement, its frequency is the speed
    if (!targets.length) collectTargets();
    targets.forEach(function (t) { t.anim.currentTime = v * t.dur; });
    rateOut.textContent = Math.round(v * 100) + '%';

    // the faces throb with the wave: their brightness rides the output
    // on top of each layer's own base filter
    var glowAmt = ' brightness(' + (0.7 + v * 0.8).toFixed(3) + ')';
    faceEls.forEach(function (el, i) {
      el.style.filter = faceBaseFilters[i] + glowAmt;
    });

    // and the screen edges glow with it
    if (glow) glow.style.opacity = (v * 0.4).toFixed(3);

    trace.push(v);
    if (trace.length > N) trace.splice(0, trace.length - N);
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

  updateReadout();
  requestAnimationFrame(function (t) { last = t; tick(t); });
})();
