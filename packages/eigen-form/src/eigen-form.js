/* =====================================================================
   eigen-form v0.0.1 — torus-knot family rendering engine.
   File: src/eigen-form.js (formerly trefoil-mark.js in canonical Myrgic DS).
   Function: createTrefoilMark — produces a (p,q) torus-knot canvas
   animation. Future versions add other eigenform families.
   Vision: mathematical design primitives — every visual element a rigorously defined mathematical object.
   ===================================================================== */
//
// The mark is what the substrate remembers of a constant-velocity
// wavefront processing through an (p,q) eigen-orbit. v2 adds:
//
//   - Precession: the entire trefoil slowly rotates around the centroid.
//     Successive revolutions land slightly offset, so the substrate
//     accumulates a spirograph / rosette family from one primitive.
//   - Path thickening: the wavefront's stroke can be set independently
//     of the ball radius, so the trace can look brushy or hairline.
//   - Custom gradients: the rainbow hue-lock can be replaced with a
//     two-tone gradient, sub-spectrum slice, monochrome luminance ramp,
//     or sub-brand hue band. Locked to closure period either way.
//   - Hue parallax: the leading edge of the trail cycles forward, the
//     trailing edge cycles reverse — visual depth without 3D geometry.
//
// USAGE
//   <canvas data-myrgic-mark></canvas>                  // auto-init
//   createTrefoilMark(el, {gradient: 'cogos', ...})     // imperative
//
// OPTIONS
//   emergence:    bool   play full appear→settle→trail sequence
//   period:       ms     orbital closure period (default 3000)
//   scale:        px     trefoil scale (default 215, on logical 480)
//   ballRadius:   px     wavefront point radius (default 18)
//   strokeWidth:  px     stroke width override (default 2*ballRadius)
//   decay:        ms     substrate memory half-life (default 6000)
//   p, q:         int    eigenmode (default 2, 3 = trefoil)
//   precession:   ms     full centroid rotation period
//                        (default 0 = disabled; positive = prograde,
//                        negative = retrograde)
//   gradient:     name|object   color treatment, see GRADIENTS below
//   parallax:     0..1   strength of leading-fwd / trailing-rev hue
//                        offset (default 0; 1 = ±period over trail)
//   bg:           'rgb()' or [r,g,b]   substrate color
//
// GRADIENTS
//   'spectrum'   default — full rainbow, hue locked to closure
//   'cogos'      violet/indigo band   240..280°
//   'mod3'       cyan/teal band       170..210°
//   'research'   amber/gold band       30..60°
//   'constellation'  magenta band     310..340°
//   'duotone'    violet → cyan        custom two-tone
//   'mono'       accent → white       luminance only
//   {hueStart, hueEnd, sat?, light?}  custom span (degrees)
// =================================================================
(function () {
  'use strict';

  const GRADIENTS = {
    spectrum:      { hueStart:   0, hueEnd: 360, sat: 70, light: 60 },
    cogos:         { hueStart: 240, hueEnd: 285, sat: 70, light: 62 },
    mod3:          { hueStart: 165, hueEnd: 210, sat: 65, light: 60 },
    research:      { hueStart:  28, hueEnd:  58, sat: 72, light: 62 },
    constellation: { hueStart: 305, hueEnd: 340, sat: 68, light: 62 },
    duotone:       { hueStart: 260, hueEnd: 190, sat: 70, light: 60 },
    mono:          { hueStart: 260, hueEnd: 260, sat: 60, light: 60, lightEnd: 95 }
  };

  function resolveGradient(g) {
    if (!g) return GRADIENTS.spectrum;
    if (typeof g === 'string') return GRADIENTS[g] || GRADIENTS.spectrum;
    return Object.assign({}, GRADIENTS.spectrum, g);
  }

  function createTrefoilMark(canvas, opts) {
    if (typeof canvas === 'string') canvas = document.getElementById(canvas);
    if (!canvas) return null;
    opts = opts || {};

    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const LOGICAL = 480;
    ctx.scale(W / LOGICAL, H / LOGICAL);

    // ---- Tunable parameters (mutable via returned controller) ----
    const params = {
      p:           opts.p           != null ? opts.p           : 2,
      q:           opts.q           != null ? opts.q           : 3,
      scale:       opts.scale       != null ? opts.scale       : 215,
      period:      opts.period      != null ? opts.period      : 3000,
      ballRadius:  opts.ballRadius  != null ? opts.ballRadius  : 18,
      strokeWidth: opts.strokeWidth != null ? opts.strokeWidth : null,
      decay:       opts.decay       != null ? opts.decay       : 6000,
      precession:  opts.precession  != null ? opts.precession  : 0,
      parallax:    opts.parallax    != null ? opts.parallax    : 0,
      gradient:    resolveGradient(opts.gradient)
    };
    const showEmergence = !!opts.emergence;

    // ---- Background (substrate color, live-tweakable) ----
    function parseBg(input) {
      if (Array.isArray(input)) return input.slice(0, 3).map(Number);
      if (typeof input === 'string') {
        const s = input.trim();
        const hex = s.match(/^#?([0-9a-f]{6})$/i);
        if (hex) {
          const n = parseInt(hex[1], 16);
          return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
        }
        const rgb = s.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
        if (rgb) return [+rgb[1], +rgb[2], +rgb[3]];
      }
      return null;
    }
    let bg = parseBg(opts.bg) || [10, 10, 15];
    let BG_R = bg[0], BG_G = bg[1], BG_B = bg[2];
    let BG_OPAQUE = `rgb(${BG_R},${BG_G},${BG_B})`;
    function setBg(input) {
      const parsed = parseBg(input);
      if (!parsed) return;
      [BG_R, BG_G, BG_B] = parsed;
      BG_OPAQUE = `rgb(${BG_R},${BG_G},${BG_B})`;
    }
    const cx = LOGICAL / 2, cy = LOGICAL / 2;

    // ---- Constants ----
    const DECAY_HALFLIFE_INITIAL = 800;
    const DECAY_LN_HALF = Math.log(0.5);
    // Minimum α to actually paint a fade pulse — anything smaller rounds
    // to zero in 8-bit and would never decay the trail.
    const MIN_FADE_ALPHA = 3 / 255;
    // 8-bit rounding floor of the multiplicative fade c' = c·(1−α) + BG·α.
    // For residue δ = c − BG, the fade rounds to no change when δ·α < 0.5,
    // i.e. δ ≤ ceil(0.5/α). Below this floor, multiplicative fade is
    // mathematically unable to reach substrate; we drain those pixels
    // manually in snapToSubstrate.
    const RESIDUE_FLOOR = Math.ceil(0.5 / MIN_FADE_ALPHA);

    // Phase windows
    function phases() {
      return {
        appear:    [200,  500],
        translate: [500,  1100],
        settle:    [1100, 2000],
        trailGrow: [2000, 2000 + params.period]
      };
    }

    function smoothstep(x, e0, e1) {
      if (x <= e0) return 0;
      if (x >= e1) return 1;
      const t = (x - e0) / (e1 - e0);
      return t * t * (3 - 2 * t);
    }

    // ---- Color sampling ----
    // u in [0,1) — phase along the closure cycle
    function colorFor(u, chromaRamp) {
      const g = params.gradient;
      // wrap u into 0..1
      u = ((u % 1) + 1) % 1;
      // For full spectrum, hueEnd-hueStart = 360 → wraps cleanly.
      // For sub-bands, ping-pong so we don't snap at the seam.
      const span = g.hueEnd - g.hueStart;
      let hueT;
      if (Math.abs(span) >= 360) {
        hueT = u;
      } else {
        // triangle wave: 0..1..0
        hueT = u < 0.5 ? u * 2 : (1 - u) * 2;
      }
      const hue = (g.hueStart + span * hueT + 720) % 360;
      const sat = (g.sat != null ? g.sat : 70) * chromaRamp;
      const lightStart = g.light != null ? g.light : 60;
      const lightEnd = g.lightEnd != null ? g.lightEnd : lightStart;
      const light = 100 - (100 - (lightStart + (lightEnd - lightStart) * hueT)) * chromaRamp;
      return `hsl(${hue.toFixed(1)} ${sat.toFixed(1)}% ${light.toFixed(1)}%)`;
    }

    // ---- State ----
    let virtualTime = 0;
    let lastRealTime = 0;
    let angularPhase = 0;
    let radialPhase = 0;
    let prevX = null, prevY = null;
    let prevHueU = null;
    // Accumulator for substrate fade. Canvas alpha is 8-bit, so very
    // small per-frame fadeAlpha values (< ~1/255) round to zero and the
    // trail never decays. We accumulate dt and only paint the fade
    // when it's large enough to register, which makes long half-lives
    // behave correctly.
    let fadeDtAccum = 0;
    // Substrate residue drain. The multiplicative fade has an 8-bit
    // rounding floor at residue ≈ ceil(0.5/α) ≈ 42 channels — pixels
    // closer to substrate than that are mathematically unable to
    // decay further and leave a visible grey halo around the trail.
    // We periodically drain sub-floor pixels with a precise exponential
    // step plus an at-least-1 nudge that escapes the rounding floor.
    // Above-floor pixels are left alone — the compositing fade handles
    // them efficiently and we don't want to double-fade the visible
    // trail.
    const SNAP_INTERVAL_MS = 500;
    let snapDtAccum = 0;
    function snapToSubstrate(halfLifeMs) {
      let img;
      try { img = ctx.getImageData(0, 0, W, H); }
      catch (e) { return; } // tainted canvas, etc.
      const d = img.data;
      const factor = Math.exp(DECAY_LN_HALF * SNAP_INTERVAL_MS / halfLifeMs);
      for (let i = 0; i < d.length; i += 4) {
        const dr = d[i]   - BG_R;
        const dg = d[i+1] - BG_G;
        const db = d[i+2] - BG_B;
        if (dr === 0 && dg === 0 && db === 0) continue;
        const ar = dr < 0 ? -dr : dr;
        const ag = dg < 0 ? -dg : dg;
        const ab = db < 0 ? -db : db;
        // Skip the visibly-decaying trail — only drain stuck residue.
        if (ar > RESIDUE_FLOOR || ag > RESIDUE_FLOOR || ab > RESIDUE_FLOOR) continue;
        let nr = Math.round(dr * factor);
        let ng = Math.round(dg * factor);
        let nb = Math.round(db * factor);
        if (nr === dr && dr !== 0) nr += dr > 0 ? -1 : 1;
        if (ng === dg && dg !== 0) ng += dg > 0 ? -1 : 1;
        if (nb === db && db !== 0) nb += db > 0 ? -1 : 1;
        d[i]   = BG_R + nr;
        d[i+1] = BG_G + ng;
        d[i+2] = BG_B + nb;
        d[i+3] = 255;
      }
      ctx.putImageData(img, 0, 0);
    }

    function drawFrame(t, dt) {
      const T = phases();
      const HUE_START_MS = T.settle[0];
      const TRAIL_START_MS = T.settle[1];

      const distinctionActive = t >= T.appear[0];
      const ballRadiusFactor  = smoothstep(t, T.appear[0],    T.appear[1]);
      const orbitalFactor     = smoothstep(t, T.translate[0], T.translate[1]);
      const settleFactor      = smoothstep(t, T.settle[0],    T.settle[1]);

      const SCALE = params.scale;
      const R0  = SCALE * 2 / 3;
      const RHO = SCALE * 1 / 3;
      const FINAL_OMEGA = (2 * Math.PI) / params.period;
      const ballRadius = distinctionActive
        ? Math.max(1, params.ballRadius * ballRadiusFactor) : 0;
      const strokeW = (params.strokeWidth != null
        ? params.strokeWidth * ballRadiusFactor
        : ballRadius * 2);
      const orbitalRadius = R0 * orbitalFactor;
      const radialAmp     = RHO * settleFactor;
      const angularOmega  = FINAL_OMEGA * params.p * settleFactor;
      const radialOmega   = FINAL_OMEGA * params.q * settleFactor;

      // Substrate fade
      // We use destination-out to erase the trail toward transparent,
      // then destination-over to fill the substrate beneath. This
      // converges cleanly to substrate color without channel-rounding
      // drift (the source-over fade-by-painting approach asymptotes
      // to a desaturated grey because of asymmetric 8-bit rounding).
      if (t < TRAIL_START_MS) {
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = BG_OPAQUE;
        ctx.fillRect(0, 0, LOGICAL, LOGICAL);
        fadeDtAccum = 0;
        snapDtAccum = 0;
      } else {
        const trailRamp = smoothstep(t, T.trailGrow[0], T.trailGrow[1]);
        const halfLife = DECAY_HALFLIFE_INITIAL
          + (params.decay - DECAY_HALFLIFE_INITIAL) * trailRamp;
        fadeDtAccum += dt;
        const fadeAlpha = 1 - Math.exp(DECAY_LN_HALF * fadeDtAccum / halfLife);
        if (fadeAlpha >= MIN_FADE_ALPHA) {
          // 1) Erase trail toward transparent
          ctx.globalCompositeOperation = 'destination-out';
          ctx.fillStyle = `rgba(0,0,0,${fadeAlpha})`;
          ctx.fillRect(0, 0, LOGICAL, LOGICAL);
          // 2) Fill substrate beneath any transparent pixels
          ctx.globalCompositeOperation = 'destination-over';
          ctx.fillStyle = BG_OPAQUE;
          ctx.fillRect(0, 0, LOGICAL, LOGICAL);
          // 3) Restore default for ball stroke
          ctx.globalCompositeOperation = 'source-over';
          fadeDtAccum = 0;
        }
        snapDtAccum += dt;
        if (snapDtAccum >= SNAP_INTERVAL_MS) {
          snapToSubstrate(halfLife);
          snapDtAccum = 0;
        }
      }

      // Integrate
      angularPhase += angularOmega * dt;
      radialPhase  += radialOmega  * dt;

      // Precession: rotate the entire orbit frame around centroid.
      // params.precession is the period of one full centroid rotation.
      // Sign: + = prograde, - = retrograde.
      let precessionPhase = 0;
      if (params.precession !== 0 && settleFactor > 0) {
        const sign = params.precession > 0 ? 1 : -1;
        const omega = (2 * Math.PI) / Math.abs(params.precession);
        // Tied to virtual time so it's deterministic post-warmup
        precessionPhase = sign * omega * Math.max(0, t - T.settle[0]);
      }

      const r = orbitalRadius + radialAmp * Math.cos(radialPhase);
      const localAngle = angularPhase + precessionPhase;
      const x = cx + r * Math.cos(localAngle);
      const y = cy + r * Math.sin(localAngle);

      // Color
      const chromaRamp = smoothstep(t, HUE_START_MS, TRAIL_START_MS);
      const motionT = Math.max(0, t - HUE_START_MS);
      // The ball has its own hue clock, detuned from the orbit clock by
      // `parallax`. parallax=0 → hue locked to orbit (1 hue cycle per
      // closure, like v1). parallax>0 → hue runs faster, so by the
      // time the ball completes one orbit it has already shifted
      // forward in hue. Successive passes over the same xy paint
      // different colors — visible as redshift/blueshift bands in the
      // accumulated trail. Sign of parallax flips the shift direction.
      // parallax = ±1 → hue runs at 2× the orbit rate (max shift).
      const huePeriod = params.period / (1 + params.parallax);
      const u = motionT / huePeriod;

      if (ballRadius > 0) {
        const jumped = prevX === null
          || Math.hypot(x - prevX, y - prevY) > ballRadius * 8;

        const fillStyle = colorFor(u, chromaRamp);
        ctx.fillStyle = fillStyle;
        ctx.strokeStyle = fillStyle;
        ctx.lineWidth = strokeW;
        ctx.lineCap = 'round';
        if (jumped) {
          ctx.beginPath();
          ctx.arc(x, y, strokeW * 0.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.moveTo(prevX, prevY);
          ctx.lineTo(x, y);
          ctx.stroke();
        }
      }
      prevX = x;
      prevY = y;
      prevHueU = u;
    }

    function reset() {
      ctx.fillStyle = BG_OPAQUE;
      ctx.fillRect(0, 0, LOGICAL, LOGICAL);
      angularPhase = 0;
      radialPhase = 0;
      prevX = null; prevY = null; prevHueU = null;
      virtualTime = 0;
      fadeDtAccum = 0;
      snapDtAccum = 0;
    }

    // Initial paint
    reset();

    // Pre-warm to steady state if not showing emergence
    if (!showEmergence) {
      const FIXED_DT = 16;
      // Warm enough to fill the trail. With precession, a single
      // closure isn't enough — show a bit of accumulated rosette.
      const T = phases();
      const precessionTime = params.precession !== 0
        ? Math.min(Math.abs(params.precession) * 0.35, params.period * 8)
        : 0;
      const warmupTime = T.trailGrow[1] + params.period * 1.5 + precessionTime;
      let t = 0;
      while (t < warmupTime) {
        t += FIXED_DT;
        drawFrame(t, FIXED_DT);
      }
      virtualTime = t;
    }

    let rafHandle = null;
    function frame(now) {
      const realDt = lastRealTime ? Math.min(now - lastRealTime, 100) : 16;
      lastRealTime = now;
      virtualTime += realDt;
      drawFrame(virtualTime, realDt);
      rafHandle = requestAnimationFrame(frame);
    }
    rafHandle = requestAnimationFrame(frame);

    // Controller
    return {
      params,
      setParam(k, v) {
        if (k === 'gradient') params.gradient = resolveGradient(v);
        else if (k === 'bg') setBg(v);
        else params[k] = v;
      },
      reset,
      stop() { if (rafHandle) cancelAnimationFrame(rafHandle); },
      get time() { return virtualTime; }
    };
  }

  // ---- Auto-init from data attrs ----
  function autoInit() {
    document.querySelectorAll('canvas[data-myrgic-mark]').forEach(c => {
      const opts = {};
      const d = c.dataset;
      if (d.emergence === 'true') opts.emergence = true;
      if (d.period)      opts.period      = parseFloat(d.period);
      if (d.scale)       opts.scale       = parseFloat(d.scale);
      if (d.ballRadius)  opts.ballRadius  = parseFloat(d.ballRadius);
      if (d.strokeWidth) opts.strokeWidth = parseFloat(d.strokeWidth);
      if (d.decay)       opts.decay       = parseFloat(d.decay);
      if (d.precession)  opts.precession  = parseFloat(d.precession);
      if (d.parallax)    opts.parallax    = parseFloat(d.parallax);
      if (d.gradient)    opts.gradient    = d.gradient;
      if (d.p)           opts.p           = parseInt(d.p, 10);
      if (d.q)           opts.q           = parseInt(d.q, 10);
      createTrefoilMark(c, opts);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }

  window.createTrefoilMark = createTrefoilMark;
  window.MYRGIC_GRADIENTS = GRADIENTS;
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createTrefoilMark };
}
if (typeof window !== 'undefined') {
  window.createTrefoilMark = createTrefoilMark;
}
