import React, { useEffect, useRef, useState } from "react";
import MindSparkLogo from "../assets/images/MSLogoWhiteSVG.svg";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";

/**
 * The interior-page loader (/ca, /about, /legal) - the grid that becomes the page.
 *
 * Two rounds died here. The first wiped the whole panel upward over 1.8s
 * ("the up motion makes it look bad"); the second was an emblem inside a
 * circular progress ring ("too basic") - which is fair, that is the single most
 * bought-in loader on the internet, and no amount of palette rescues it.
 *
 * So this one is derived from what these pages actually ARE. Every interior page
 * renders PixelBlast behind it: a field of squares that ripples. The loader is
 * that field before it settles. The emblem does not sit on the frame waiting for
 * a meter to fill - the emblem IS the meter: the mark is sampled into the grid
 * and its cells land one by one as the document loads, each arriving pixel
 * flashing signal cyan before it cools to white.
 *
 * There is no percentage, no ring, no bar, no spinner - nothing but the subject.
 * How much of the mark exists IS the progress, which is the whole reason this
 * form works: the one element on screen is doing the reporting, so a readout
 * beside it would only be saying the same thing twice.
 *
 * The handover keeps the family gesture from the homepage's CollapseLoader - one
 * radial front, no direction, no edge - but speaks it in this page's material: a
 * ragged wave of pixels crosses the frame and erases the void behind it, landing
 * on a background made of the same squares. The loader dissolves INTO the page
 * rather than sliding off it.
 *
 * Hard rules carried over: the wait is the load itself, never the choreography.
 * Progress tracks document.readyState, a ceiling force-completes anything that
 * hangs, and the page beneath is live from the wave's first frame. It plays on
 * every mount, so each of the three pages gets its own entrance. The React tree
 * renders once - the loop owns the canvas outright.
 */

const VOID = "#070614";
const TAU = Math.PI * 2;

/* Three colour roles, one job each: the grid is the page's own accent purple
   (--accent-primary), a resolved mark cell is a violet-cool near-white, and
   anything in motion - a pixel landing, a ripple passing, the wavefront - is
   the signal violet these pages already glow with (#a855f7, the lit-state
   colour in index.css). Chosen over the brighter #c084fc because its green
   channel is low, and that is what keeps the hue alive when it is added as
   light rather than washing out to white. */
const GRID_RGB = "154, 140, 255";
const MARK_RGB = "245, 241, 255";
const SIGNAL_RGB = "168, 85, 247";

/* The mark, sampled at MARK_COLS cells across.
   What makes this read as a grid is the one-pixel gutter between cells, not the
   cell being large - so the real constraint is the floor below, not the column
   count. Keep cells above ~5px: under that the gutter stops resolving and the
   mark turns from pixels into dithered texture. */
const MARK_COLS = 40;
const MARK_ASPECT = 249.769 / 297.43; // the emblem's own viewBox
const MARK_H_FRAC = 0.42;
const MARK_W_FRAC = 0.5;
const MARK_H_MAX = 430;
const CELL_MIN = 5;
const CELL_MAX = 10;
/** A cell below this coverage is not part of the silhouette. */
const COV_FLOOR = 0.14;

/* The ambient field. Density is the fraction of cells kept at frame centre,
   falling off toward the edges - the frame has body without becoming scenery,
   and the grid is densest exactly where the mark is about to appear.
   Density is per CELL, so it has to come down as cells get smaller or the same
   figure buys a much busier frame and a lot more fills per frame. */
const GRID_DENSITY = 0.12;
const GRID_FALLOFF = 1.9;

/**
 * One cell's landing: a small square popping to full, cyan cooling to white.
 *
 * This must stay well SHORTER than the progress climb or the cooling never
 * reads: at 0.3s against a 0.22s progress time-constant, a third of the mark
 * was mid-arrival at any moment and the whole emblem just sat there cyan. Short
 * arrival + gentler climb is what produces the thing worth looking at - a hot
 * leading edge of pixels landing, with cooled white behind it.
 */
const ARRIVE_S = 0.17;
/** How far into a cell's arrival the near-white starts covering the violet. */
const COOL_START = 0.4;
/** Arrival order: mostly dithered, partly centre-out. Pure noise reads as
    static; pure radius reads as a wipe. */
const ORDER_DITHER = 0.62;
/** Cells finish landing a little before progress does, so completion is the mark
    complete rather than the mark's last pixel still moving. */
const ORDER_CEIL = 0.94;

/* Ripples while loading - PixelBlast's own gesture, quoted quietly. */
const RIPPLE_EVERY_S = 2.2;
const RIPPLE_SPEED = 620;
const RIPPLE_BAND = 46;
const RIPPLE_GAIN = 0.55;

/** Progress completes: the whole mark flashes to white for a beat. */
const LOCK_S = 0.18;
/** The front crosses to the farthest corner. Ease-out - born fast, arriving gentle. */
const WAVE_S = 0.72;
const WAVE_BAND = 56;
/** The void dissolves this far behind the front rather than being cut. */
const WAVE_FEATHER = 96;
/** The front dissolves over the last of its travel so it leaves as light. */
const WAVE_FADE_TAIL = 0.24;

/** How fast the shown number chases the real one, as an exponential rate. */
const PROGRESS_RATE = 3.4;
/**
 * On a warm cache readyState is already "complete" at mount, so without a floor
 * the whole assembly would play out in three frames. Long enough for the mark to
 * actually assemble; short enough that nobody is being held.
 */
const DWELL_S = 0.9;
/** If a font CDN or a stalled chunk hangs, complete anyway and get out of the way. */
const CEILING_S = 4;

const DPR_CAP = 2;

/**
 * `?loader=slow` plays the film at quarter speed for review. One divisor on the
 * frame delta slows every phase uniformly, so what you review is the real
 * timeline.
 *
 * There is deliberately no once-per-tab latch and no `?loader=replay` to bypass
 * one: this plays on EVERY mount, which means every route change. Tried the
 * other way first - it was latched to sessionStorage so the three interior
 * pages only told the story once - and the interior pages then felt like they
 * were loading nothing at all on the second and third visit. The transition IS
 * the loader's job here, so it runs every time.
 */
function isSlow() {
  try {
    return new URLSearchParams(window.location.search).get("loader") === "slow";
  } catch {
    return false;
  }
}

/** Stable per-cell randomness - the field must not reshuffle on every resize. */
function hash2(x, y) {
  let h = (x | 0) * 374761393 + (y | 0) * 668265263;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const easeOutQuad = (t) => t * (2 - t);

/* The emblem is sampled once at this fixed resolution and box-averaged down to
   whatever the grid turns out to be, so a resize re-buckets the same pixels
   instead of invalidating the sample. Comfortably more than MARK_COLS: each cell
   needs several mask pixels to average, or the coverage that gives the
   silhouette its soft edge degenerates toward nearest-neighbour. */
const MASK_W = 224;
const MASK_H = Math.round(MASK_W / MARK_ASPECT);

/**
 * Sample the emblem's alpha channel into a fixed-resolution coverage map.
 *
 * The SVG carries a viewBox but no width/height, which is not a reliable
 * drawImage source in every engine, so it is re-served as a data URI with
 * explicit dimensions.
 */
async function sampleMark() {
  const res = await fetch(MindSparkLogo);
  let svg = await res.text();
  if (!/<svg[^>]*\swidth=/.test(svg)) {
    svg = svg.replace("<svg", '<svg width="249.769" height="297.43"');
  }
  const img = new Image();
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
  const off = document.createElement("canvas");
  off.width = MASK_W;
  off.height = MASK_H;
  const octx = off.getContext("2d", { willReadFrequently: true });
  octx.drawImage(img, 0, 0, MASK_W, MASK_H);
  return octx.getImageData(0, 0, MASK_W, MASK_H).data;
}

/**
 * One cell's coverage: the mean alpha of the mask pixels it spans. Area
 * averaging is what makes the silhouette's edge cells land dimmer than its
 * body, which is the whole reason the pixel mark reads as the emblem and not
 * as a blocky approximation of it.
 */
function cellCoverage(mask, cols, rows, c, r) {
  const x0 = Math.floor((c / cols) * MASK_W);
  const x1 = Math.max(x0 + 1, Math.floor(((c + 1) / cols) * MASK_W));
  const y0 = Math.floor((r / rows) * MASK_H);
  const y1 = Math.max(y0 + 1, Math.floor(((r + 1) / rows) * MASK_H));
  let sum = 0;
  let n = 0;
  for (let y = y0; y < y1 && y < MASK_H; y++) {
    for (let x = x0; x < x1 && x < MASK_W; x++) {
      sum += mask[(y * MASK_W + x) * 4 + 3];
      n++;
    }
  }
  return n ? sum / n / 255 : 0;
}

export default function Preloader({ onComplete }) {
  const [done, setDone] = useState(false);
  const rootRef = useRef(null);
  const canvasRef = useRef(null);
  const fallbackRef = useRef(null);

  /* The pages pass an inline arrow, so depending on it directly would restart
     the whole sequence on every parent re-render. */
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let disposed = false;
    let raf = 0;
    const timers = [];

    // ── Frame state. Nothing below sets React state until the very end. ──────
    let w = 0;
    let h = 0;
    let cell = 12;
    let cols = MARK_COLS;
    let rows = Math.round(MARK_COLS / MARK_ASPECT);
    let markX = 0;
    let markY = 0;
    let gridOx = 0;
    let gridOy = 0;
    let gridNx = 0;
    let gridNy = 0;
    let coverR = 1;

    /** Coverage map for the current grid, or null until the emblem is sampled. */
    let mask = null;
    let markCells = [];
    let ambient = [];
    let ripples = [];

    let clock = 0;
    let phase = "assemble"; // assemble → lock → wave → done
    let phaseT = 0;
    /* Springs toward target and drives the assembly. Not displayed anywhere  - 
       the mark's completeness IS the readout. */
    let shown = 0;
    let target = 0; // honest readyState progress
    let rippleAcc = RIPPLE_EVERY_S * 0.55;
    let last = performance.now();
    const startedAt = last;
    const slow = isSlow() ? 4 : 1;

    // ── Geometry ────────────────────────────────────────────────────────────
    const measure = () => {
      w = Math.max(1, window.innerWidth);
      h = Math.max(1, window.innerHeight);
      const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      coverR = Math.hypot(w / 2, h / 2);

      const markH = Math.min(h * MARK_H_FRAC, w * MARK_W_FRAC, MARK_H_MAX);
      const markW = markH * MARK_ASPECT;
      cell = Math.max(CELL_MIN, Math.min(CELL_MAX, Math.round(markW / MARK_COLS)));
      cols = Math.max(4, Math.round(markW / cell));
      rows = Math.max(4, Math.round(markH / cell));
      markX = Math.round((w - cols * cell) / 2);
      markY = Math.round((h - rows * cell) / 2);

      /* The whole-screen grid is phase-locked to the mark's cells, so the
         ambient field and the silhouette sit on one lattice. */
      gridOx = markX - Math.ceil(markX / cell) * cell;
      gridOy = markY - Math.ceil(markY / cell) * cell;
      gridNx = Math.ceil((w - gridOx) / cell);
      gridNy = Math.ceil((h - gridOy) / cell);

      buildAmbient();
      buildMarkCells();
    };

    const buildAmbient = () => {
      ambient = [];
      const cx = w / 2;
      const cy = h / 2;
      const maxD = coverR;
      for (let i = 0; i < gridNx; i++) {
        for (let j = 0; j < gridNy; j++) {
          const x = gridOx + i * cell;
          const y = gridOy + j * cell;
          const d = Math.hypot(x + cell / 2 - cx, y + cell / 2 - cy) / maxD;
          const keep = GRID_DENSITY * Math.pow(1 - Math.min(1, d), GRID_FALLOFF);
          if (hash2(i + 11, j + 7) < keep) {
            ambient.push({
              x,
              y,
              d: d * maxD,
              a: 0.03 + hash2(i, j) * 0.055,
              sp: 0.35 + hash2(j, i) * 0.85,
              ph: hash2(i * 3 + 1, j * 5 + 2) * TAU,
            });
          }
        }
      }
    };

    /** Rebuilt on resize; already-landed cells stay landed so a window drag
        does not replay the assembly. */
    const buildMarkCells = () => {
      markCells = [];
      if (!mask) return;
      const p = shown / 100;
      const cx = cols / 2;
      const cy = rows / 2;
      const maxR = Math.hypot(cx, cy);
      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          const cov = cellCoverage(mask, cols, rows, c, r);
          if (!(cov >= COV_FLOOR)) continue;
          const radial = Math.hypot(c + 0.5 - cx, r + 0.5 - cy) / maxR;
          const order =
            (ORDER_DITHER * hash2(c * 7 + 3, r * 13 + 5) + (1 - ORDER_DITHER) * radial) *
            ORDER_CEIL;
          markCells.push({
            x: markX + c * cell,
            y: markY + r * cell,
            d: Math.hypot(markX + c * cell + cell / 2 - w / 2, markY + r * cell + cell / 2 - h / 2),
            cov,
            order,
            /* Anything already due at the current progress is landed, not
               replayed - a window drag must not restart the assembly. */
            born: order <= p ? clock - ARRIVE_S : -1,
          });
        }
      }
    };

    // ── Draw ────────────────────────────────────────────────────────────────
    const rippleGain = (d) => {
      let gain = 0;
      for (let i = 0; i < ripples.length; i++) {
        const rp = ripples[i];
        const off = Math.abs(d - rp.r);
        if (off > RIPPLE_BAND) continue;
        gain += (1 - off / RIPPLE_BAND) * rp.a * RIPPLE_GAIN;
      }
      return gain;
    };

    const draw = () => {
      const size = Math.max(2, cell - 1);
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      ctx.fillStyle = VOID;
      ctx.fillRect(0, 0, w, h);

      const waving = phase === "wave";
      /* The front travels a feather past the farthest corner. Stopping AT the
         corner leaves that last band only partially erased, so the corners keep
         a faint patch of void that pops out of existence when the overlay
         unmounts - the one visible seam in the whole handover. */
      const waveR = waving ? easeOutCubic(clamp01(phaseT / WAVE_S)) * (coverR + WAVE_FEATHER) : 0;
      /* Behind the front there is nothing left to draw. */
      const cutoff = waving ? waveR - WAVE_FEATHER * 0.35 : -1;

      // The grid, breathing.
      ctx.fillStyle = `rgb(${GRID_RGB})`;
      for (let i = 0; i < ambient.length; i++) {
        const a = ambient[i];
        if (a.d < cutoff) continue;
        const twinkle = 0.55 + 0.45 * Math.sin(clock * a.sp + a.ph);
        const alpha = a.a * twinkle + rippleGain(a.d) * 0.5;
        if (alpha <= 0.004) continue;
        ctx.globalAlpha = Math.min(1, alpha);
        ctx.fillRect(a.x, a.y, size, size);
      }

      const lockFlash = phase === "lock" ? easeOutQuad(clamp01(phaseT / LOCK_S)) : phase === "wave" ? 1 : 0;

      /* Landing cells grow from a point at the cell's centre. Both mark passes
         need the identical rect or the white would sit proud of the violet. */
      const cellRect = (m, t) => {
        if (t >= 1) return [m.x, m.y, size];
        const s = size * (0.25 + 0.75 * easeOutCubic(t));
        const off = (size - s) / 2;
        return [m.x + off, m.y + off, s];
      };

      // The mark, base layer: every landed cell in the signal violet.
      ctx.fillStyle = `rgb(${SIGNAL_RGB})`;
      for (let i = 0; i < markCells.length; i++) {
        const m = markCells[i];
        if (m.born < 0 || m.d < cutoff) continue;
        const t = clamp01((clock - m.born) / ARRIVE_S);
        ctx.globalAlpha = Math.min(1, m.cov * (0.25 + 0.75 * easeOutCubic(t)));
        const [x, y, s] = cellRect(m, t);
        ctx.fillRect(x, y, s, s);
      }

      /* ...and the cooling, laid OVER it in source-over rather than added as
         light. Adding a violet on top of an already-lit white cell clips every
         channel and the hue disappears - the old cyan survived that only
         because its red channel was zero. Painting white over violet instead
         keeps a settled body white while the silhouette's low-coverage edge
         cells stay tinted, and that tint is where the mark reads as MindSpark
         purple rather than as a white logo with a purple flicker. */
      ctx.fillStyle = `rgb(${MARK_RGB})`;
      for (let i = 0; i < markCells.length; i++) {
        const m = markCells[i];
        if (m.born < 0 || m.d < cutoff) continue;
        const t = clamp01((clock - m.born) / ARRIVE_S);
        if (t <= COOL_START) continue;
        const cool = easeOutQuad((t - COOL_START) / (1 - COOL_START));
        ctx.globalAlpha = Math.min(1, m.cov * cool);
        const [x, y, s] = cellRect(m, t);
        ctx.fillRect(x, y, s, s);
      }

      // Everything in motion, added as light.
      ctx.globalCompositeOperation = "lighter";

      // The completion flash: the mark going incandescent, not changing hue.
      if (lockFlash > 0) {
        ctx.fillStyle = `rgb(${MARK_RGB})`;
        for (let i = 0; i < markCells.length; i++) {
          const m = markCells[i];
          if (m.born < 0 || m.d < cutoff) continue;
          ctx.globalAlpha = Math.min(1, m.cov * lockFlash * 0.5);
          ctx.fillRect(m.x, m.y, size, size);
        }
      }

      // Ripples crossing the mark. Skipped outright between ripples rather than
      // walking every cell to compute a gain of zero.
      if (ripples.length) {
        ctx.fillStyle = `rgb(${SIGNAL_RGB})`;
        for (let i = 0; i < markCells.length; i++) {
          const m = markCells[i];
          if (m.born < 0 || m.d < cutoff) continue;
          const alpha = m.cov * rippleGain(m.d) * 0.7;
          if (alpha <= 0.004) continue;
          ctx.globalAlpha = Math.min(1, alpha);
          ctx.fillRect(m.x, m.y, size, size);
        }
      }

      if (waving) {
        // The void dissolves radially - the page underneath has been live since
        // this phase began.
        ctx.globalCompositeOperation = "destination-out";
        ctx.globalAlpha = 1;
        const inner = Math.max(0, waveR - WAVE_FEATHER);
        const g = ctx.createRadialGradient(w / 2, h / 2, inner, w / 2, h / 2, Math.max(inner + 1, waveR));
        g.addColorStop(0, "rgba(0,0,0,1)");
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);

        // The front itself: a ragged band of pixels riding over the revealed
        // page. A hash-chosen fraction of the cells, so it reads as grid rather
        // than as a drawn ring - and the fraction is what keeps this affordable,
        // since a smaller cell puts quadratically more of them in the band.
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = `rgb(${SIGNAL_RGB})`;
        const travel = clamp01(phaseT / WAVE_S);
        const fade = travel > 1 - WAVE_FADE_TAIL ? 1 - (travel - (1 - WAVE_FADE_TAIL)) / WAVE_FADE_TAIL : 1;
        const cx = w / 2;
        const cy = h / 2;
        const rOut = waveR + WAVE_BAND * 0.5;
        const i0 = Math.max(0, Math.floor((cx - rOut - gridOx) / cell));
        const i1 = Math.min(gridNx - 1, Math.ceil((cx + rOut - gridOx) / cell));
        const j0 = Math.max(0, Math.floor((cy - rOut - gridOy) / cell));
        const j1 = Math.min(gridNy - 1, Math.ceil((cy + rOut - gridOy) / cell));
        for (let i = i0; i <= i1; i++) {
          const x = gridOx + i * cell;
          const dx = x + cell / 2 - cx;
          for (let j = j0; j <= j1; j++) {
            const y = gridOy + j * cell;
            const off = Math.abs(Math.hypot(dx, y + cell / 2 - cy) - waveR);
            if (off > WAVE_BAND * 0.5) continue;
            if (hash2(i * 5 + 2, j * 9 + 4) > 0.42) continue;
            const alpha = (1 - off / (WAVE_BAND * 0.5)) * 0.9 * fade;
            if (alpha <= 0.01) continue;
            ctx.globalAlpha = alpha;
            ctx.fillRect(x, y, size, size);
          }
        }
      }

      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
    };

    /** Reduced motion: the resolved mark on the void, no assembly, no wave. */
    const drawStatic = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      ctx.fillStyle = VOID;
      ctx.fillRect(0, 0, w, h);
      const size = Math.max(2, cell - 1);
      ctx.fillStyle = `rgb(${GRID_RGB})`;
      for (let i = 0; i < ambient.length; i++) {
        ctx.globalAlpha = ambient[i].a;
        ctx.fillRect(ambient[i].x, ambient[i].y, size, size);
      }
      /* Same two layers as the live draw, so the resolved mark carries the same
         violet edge rather than reading as a flat white stencil. */
      ctx.fillStyle = `rgb(${SIGNAL_RGB})`;
      for (let i = 0; i < markCells.length; i++) {
        ctx.globalAlpha = markCells[i].cov;
        ctx.fillRect(markCells[i].x, markCells[i].y, size, size);
      }
      ctx.fillStyle = `rgb(${MARK_RGB})`;
      for (let i = 0; i < markCells.length; i++) {
        ctx.globalAlpha = markCells[i].cov;
        ctx.fillRect(markCells[i].x, markCells[i].y, size, size);
      }
      ctx.globalAlpha = 1;
    };

    // ── Progress: honest, with a ceiling ────────────────────────────────────
    const readyTarget = () => {
      if (document.readyState === "complete") return 100;
      if (document.readyState === "interactive") return 70;
      return 30;
    };
    target = readyTarget();
    const onLoad = () => {
      target = 100;
    };
    if (target < 100) window.addEventListener("load", onLoad);
    timers.push(
      setTimeout(() => {
        target = 100;
      }, CEILING_S * 1000)
    );

    const finish = () => {
      if (disposed) return;
      setDone(true);
      onCompleteRef.current?.();
    };

    // ── Loop ────────────────────────────────────────────────────────────────
    const frame = (now) => {
      if (disposed) return;
      /* Clamped so a backgrounded tab pauses the film rather than skipping it. */
      const dt = Math.min((now - last) / 1000, 1 / 15) / slow;
      last = now;
      clock += dt;
      phaseT += dt;

      shown += (target - shown) * (1 - Math.exp(-PROGRESS_RATE * dt));
      /* An exponential approach never lands, and its tail is dead time - with
         the value driving cell arrival, a crawl from 96 to 99 drags the mark's
         last few pixels out over half a second. Completion is an event, so it
         is taken in one step; the homepage loader caps its creep for the same
         reason. */
      if (target >= 100 && shown > 96.5) shown = 100;

      if (phase === "assemble") {
        const p = shown / 100;
        for (let i = 0; i < markCells.length; i++) {
          const m = markCells[i];
          if (m.born < 0 && m.order <= p) m.born = clock;
        }

        rippleAcc += dt;
        if (rippleAcc >= RIPPLE_EVERY_S) {
          rippleAcc = 0;
          ripples.push({ r: 0, a: 1 });
        }

        if (shown >= 100 && now - startedAt >= DWELL_S * 1000 * slow) {
          phase = "lock";
          phaseT = 0;
        }
      } else if (phase === "lock") {
        if (phaseT >= LOCK_S) {
          phase = "wave";
          phaseT = 0;
          /* The root stops painting the void so the canvas erase reveals the
             live page; until now it was there to cover the first frame. The rgba
             form rather than the `transparent` keyword - same pixel, and some
             tooling logs a parse error on the keyword off style mutations. */
          root.style.background = "rgba(7, 6, 20, 0)";
        }
      }

      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i];
        rp.r += RIPPLE_SPEED * dt;
        rp.a = clamp01(1 - rp.r / (coverR * 0.9));
        if (rp.a <= 0) ripples.splice(i, 1);
      }

      draw();

      if (phase === "wave" && phaseT >= WAVE_S) {
        finish();
        return;
      }
      raf = requestAnimationFrame(frame);
    };

    // ── Start ───────────────────────────────────────────────────────────────
    measure();
    const onResize = () => {
      measure();
      if (reducedMotion) drawStatic();
    };
    window.addEventListener("resize", onResize);

    sampleMark()
      .then((data) => {
        if (disposed) return;
        mask = data;
        buildMarkCells();
        if (reducedMotion) drawStatic();
      })
      .catch(() => {
        /* The emblem could not be sampled - show it as flat artwork rather than
           an empty frame. The load, and the exit, are unaffected. */
        if (disposed || !fallbackRef.current) return;
        const img = fallbackRef.current;
        img.style.height = `${rows * cell}px`;
        img.style.opacity = "1";
      });

    if (reducedMotion) {
      drawStatic();
      timers.push(
        setTimeout(() => {
          if (disposed) return;
          root.style.transition = "opacity 200ms linear";
          root.style.opacity = "0";
          timers.push(setTimeout(finish, 210));
        }, DWELL_S * 1000)
      );
    } else {
      raf = requestAnimationFrame(frame);
    }

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("load", onLoad);
      timers.forEach(clearTimeout);
    };
  }, [reducedMotion]);

  if (done) return null;

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="fixed inset-0 z-[9999] overflow-hidden select-none pointer-events-none"
      style={{ background: VOID }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      {/* Only ever shown if the emblem cannot be sampled into the grid. */}
      <img
        ref={fallbackRef}
        src={MindSparkLogo}
        alt=""
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 object-contain opacity-0"
      />
    </div>
  );
}
