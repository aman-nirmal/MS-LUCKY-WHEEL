import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Helmet } from "react-helmet-async";
import confetti from "canvas-confetti";
import {
  Gift,
  Check,
  ChevronDown,
  ExternalLink,
  Volume2,
  VolumeX,
  Search,
  X
} from "lucide-react";
import PixelBlast from "./components/PixelBlast";

/* ─────────────────────────────────────────────────────────────
   Secret Predetermined Event Discount Logic (Strictly internal)
   ───────────────────────────────────────────────────────────── */
const EVENT_DATA = [
  { name: "FLASH", discount: 50, module: "AMUZIA", regLink: "https://www.crwdctrl.in/competitions-view-details/flash" },
  { name: "TAKE OFF", discount: 50, module: "AVIONICA", regLink: "https://www.crwdctrl.in/competitions-view-details/take-off" },
  { name: "TORQUEST", discount: 50, module: "AVIONICA", regLink: "https://www.crwdctrl.in/competitions-view-details/torquest" },
  { name: "CODE JUNKIE", discount: 40, module: "CODIFICA", regLink: "https://www.crwdctrl.in/competitions-view-details/code-junkie" },
  { name: "WEBSCAPE", discount: 40, module: "CODIFICA", regLink: "https://www.crwdctrl.in/competitions-view-details/webscape" },
  { name: "NEURAL NEXUS", discount: 40, module: "CODIFICA", regLink: "https://www.crwdctrl.in/competitions-view-details/neural-nexus" },
  { name: "HACKATHON", discount: 20, module: "FLAGSHIP", regLink: "https://www.crwdctrl.in/competitions-view-details/hackathon" },
  { name: "QUANTQUEST", discount: 50, module: "QUANTUMANIA", regLink: "https://www.crwdctrl.in/competitions-view-details/quantquest" },
  { name: "WORLD-WIZE", discount: 50, module: "ILLUMINATI", regLink: "https://www.crwdctrl.in/competitions-view-details/worldwize" },
  { name: "MATHLETICS", discount: 50, module: "LOGICA", regLink: "https://www.crwdctrl.in/competitions-view-details/mathletics" },
  { name: "FUSION ID", discount: 40, module: "DESIGNOVA", regLink: "https://www.crwdctrl.in/competitions-view-details/fusion-id" },
  { name: "REVIT RUSH", discount: 40, module: "DESIGNOVA", regLink: "https://www.crwdctrl.in/competitions-view-details/revit-rush" },
  { name: "ASSEMBLIX", discount: 40, module: "POTENTIA", regLink: "https://www.crwdctrl.in/competitions-view-details/assemblix" },
  { name: "FANDOM", discount: 50, module: "FAN-FRENZY", regLink: "https://www.crwdctrl.in/competitions-view-details/fandom" },
  { name: "BEYOND SUITS", discount: 50, module: "FAN-FRENZY", regLink: "https://www.crwdctrl.in/competitions-view-details/beyond-suits" },
  { name: "SHERLOCKED", discount: 50, module: "PRODIGIUM", regLink: "https://www.crwdctrl.in/competitions-view-details/sherlocked" },
  { name: "GOOGLER", discount: 50, module: "PRODIGIUM", regLink: "https://www.crwdctrl.in/competitions-view-details/googler" },
  { name: "UTOPIA", discount: 40, module: "STRUKTURA", regLink: "https://www.crwdctrl.in/competitions-view-details/utopia" },
  { name: "EDIFEX", discount: 40, module: "STRUKTURA", regLink: "https://www.crwdctrl.in/competitions-view-details/edifex" },
  { name: "ON THE ETCH", discount: 40, module: "SUBSTANTIA", regLink: "https://www.crwdctrl.in/competitions-view-details/on-the-etch" },
  { name: "MICROAPPS", discount: 40, module: "VOLTUS", regLink: "https://www.crwdctrl.in/competitions-view-details/microapps" },
  { name: "CIRCUIT FIXER", discount: 40, module: "VOLTUS", regLink: "https://www.crwdctrl.in/competitions-view-details/circuit-fixer" },
  { name: "IDEATHON", discount: 40, module: "INNOVATION", regLink: "https://www.crwdctrl.in/competitions-view-details/ideathon" }
];

/* Minimal sleek aesthetic slices */
const WHEEL_SLICES = [
  { label: "50%", sub: "OFF", discount: 50, bg: "#09090b", bg2: "#18181b", text: "#ffffff", border: "rgba(168,85,247,0.4)", accent: "#a855f7" },
  { label: "10%", sub: "OFF", discount: 10, bg: "#050507", bg2: "#121214", text: "#a1a1aa", border: "rgba(255,255,255,0.06)", accent: "#71717a" },
  { label: "40%", sub: "OFF", discount: 40, bg: "#0c0a14", bg2: "#1a1626", text: "#f4f4f5", border: "rgba(168,85,247,0.3)", accent: "#c084fc" },
  { label: "15%", sub: "OFF", discount: 15, bg: "#050507", bg2: "#121214", text: "#a1a1aa", border: "rgba(255,255,255,0.06)", accent: "#71717a" },
  { label: "50%", sub: "OFF", discount: 50, bg: "#09090b", bg2: "#18181b", text: "#ffffff", border: "rgba(168,85,247,0.4)", accent: "#a855f7" },
  { label: "20%", sub: "OFF", discount: 20, bg: "#060b14", bg2: "#0f172a", text: "#e4e4e7", border: "rgba(56,189,248,0.3)", accent: "#38bdf8" },
  { label: "40%", sub: "OFF", discount: 40, bg: "#0c0a14", bg2: "#1a1626", text: "#f4f4f5", border: "rgba(168,85,247,0.3)", accent: "#c084fc" },
  { label: "25%", sub: "OFF", discount: 25, bg: "#050507", bg2: "#121214", text: "#a1a1aa", border: "rgba(255,255,255,0.06)", accent: "#71717a" },
  { label: "50%", sub: "OFF", discount: 50, bg: "#09090b", bg2: "#18181b", text: "#ffffff", border: "rgba(168,85,247,0.4)", accent: "#a855f7" },
  { label: "30%", sub: "OFF", discount: 30, bg: "#050507", bg2: "#121214", text: "#a1a1aa", border: "rgba(255,255,255,0.06)", accent: "#71717a" },
  { label: "40%", sub: "OFF", discount: 40, bg: "#0c0a14", bg2: "#1a1626", text: "#f4f4f5", border: "rgba(168,85,247,0.3)", accent: "#c084fc" },
  { label: "20%", sub: "OFF", discount: 20, bg: "#060b14", bg2: "#0f172a", text: "#e4e4e7", border: "rgba(56,189,248,0.3)", accent: "#38bdf8" }
];

export default function App() {
  const [selectedEvent, setSelectedEvent] = useState(EVENT_DATA[0]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [pointerAngle, setPointerAngle] = useState(0);

  // Searchable dropdown state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  const canvasRef = useRef(null);
  const currentRotationRef = useRef(0);
  const lastSliceIdxRef = useRef(-1);
  const animFrameIdRef = useRef(null);
  const audioCtxRef = useRef(null);

  // Close dropdown on click outside & Escape key
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsDropdownOpen(false);
        setShowModal(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Lock body scroll when modal is open to prevent background scrolling on mobile
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showModal]);

  // Filter events by search term
  const filteredEvents = EVENT_DATA.filter((evt) =>
    evt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (evt.module && evt.module.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Initialize Web Audio API on demand
  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  // Mechanical ratchet tick sound synthesized via Web Audio API
  const playTickSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(160, now + 0.035);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch {
      // Audio context may be restricted
    }
  }, [soundEnabled, getAudioContext]);

  // Fanfare / Celebration chime synthesized on win
  const playWinSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 arpeggio
      const now = ctx.currentTime;

      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + i * 0.1);

        gain.gain.setValueAtTime(0, now + i * 0.1);
        gain.gain.linearRampToValueAtTime(0.18, now + i * 0.1 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.6);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.65);
      });
    } catch {}
  }, [soundEnabled, getAudioContext]);

  /* Precise wheel drawing */
  const drawWheel = (rotation) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const center = width / 2;
    const radius = center - 24;
    const numSlices = WHEEL_SLICES.length;
    const sliceAngle = (2 * Math.PI) / numSlices;

    ctx.clearRect(0, 0, width, height);

    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(rotation);

    for (let i = 0; i < numSlices; i++) {
      const slice = WHEEL_SLICES[i];
      const startAngle = i * sliceAngle;
      const endAngle = startAngle + sliceAngle;
      const midAngle = startAngle + sliceAngle / 2;

      // Radial lighting
      const grad = ctx.createRadialGradient(0, 0, radius * 0.1, 0, 0, radius);
      grad.addColorStop(0, slice.bg2);
      grad.addColorStop(1, slice.bg);

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Hairline divider
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.stroke();

      // Subtle outer wedge accent stroke
      ctx.beginPath();
      ctx.arc(0, 0, radius - 2, startAngle, endAngle);
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = slice.border;
      ctx.stroke();

      // Typography
      ctx.save();
      ctx.rotate(midAngle);
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";

      // Discount Percentage
      ctx.font = "bold 38px 'Space Grotesk', -apple-system, sans-serif";
      ctx.fillStyle = slice.text;
      ctx.fillText(slice.label, radius - 44, -1);

      // Subtitle OFF
      ctx.font = "500 13px 'JetBrains Mono', monospace";
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.fillText(slice.sub, radius - 14, 0);

      ctx.restore();
    }

    // Outer Bezel Rings
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, 2 * Math.PI);
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, radius + 8, 0, 2 * Math.PI);
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(168, 85, 247, 0.25)";
    ctx.stroke();

    // Subtle perimeter ticks
    const totalTicks = 48;
    for (let t = 0; t < totalTicks; t++) {
      const tickAngle = (t * 2 * Math.PI) / totalTicks;
      const isMajor = t % 4 === 0;
      const innerR = isMajor ? radius + 11 : radius + 13;
      const outerR = radius + 16;

      const x1 = Math.cos(tickAngle) * innerR;
      const y1 = Math.sin(tickAngle) * innerR;
      const x2 = Math.cos(tickAngle) * outerR;
      const y2 = Math.sin(tickAngle) * outerR;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.lineWidth = isMajor ? 1.5 : 1;
      ctx.strokeStyle = isMajor ? "rgba(168, 85, 247, 0.6)" : "rgba(255, 255, 255, 0.15)";
      ctx.stroke();
    }

    ctx.restore();
  };

  useEffect(() => {
    drawWheel(currentRotationRef.current);
    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, []);

  // Rigged spin calculation: always lands on selectedEvent.discount
  const handleSpin = () => {
    if (isSpinning) return;
    setIsDropdownOpen(false); // Close dropdown immediately if open
    setIsSpinning(true);
    getAudioContext(); // Unlock audio on user click

    const targetDiscount = selectedEvent.discount;
    const numSlices = WHEEL_SLICES.length;
    const sliceAngle = (2 * Math.PI) / numSlices;

    const matchingIndices = [];
    WHEEL_SLICES.forEach((s, idx) => {
      if (s.discount === targetDiscount) matchingIndices.push(idx);
    });

    const chosenSliceIndex =
      matchingIndices[Math.floor(Math.random() * matchingIndices.length)];

    const jitter = (Math.random() - 0.5) * (sliceAngle * 0.35);
    const targetSliceCenter = (chosenSliceIndex + 0.5) * sliceAngle + jitter;
    const pointerAngle = (3 * Math.PI) / 2; // needle at top

    let neededNorm = (pointerAngle - targetSliceCenter) % (2 * Math.PI);
    if (neededNorm < 0) neededNorm += 2 * Math.PI;

    const currentNorm = currentRotationRef.current % (2 * Math.PI);
    let diff = neededNorm - currentNorm;
    if (diff < 0) diff += 2 * Math.PI;

    const fullRevolutions = (5 + Math.floor(Math.random() * 3)) * 2 * Math.PI;
    const totalDelta = fullRevolutions + diff;

    const startRotation = currentRotationRef.current;
    const finalRotation = startRotation + totalDelta;
    const duration = 3800; // Snappy, exciting 3.8s spin
    const startTime = performance.now();

    const easeOutQuint = (t) => 1 - Math.pow(1 - t, 5);

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutQuint(progress);

      const rot = startRotation + totalDelta * eased;
      currentRotationRef.current = rot;
      drawWheel(rot);

      // Track pointer slice pass to trigger authentic ticking sound and flapper deflection
      const currentWheelAngle = ((3 * Math.PI) / 2 - (rot % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      const activeSliceIdx = Math.floor(currentWheelAngle / sliceAngle);
      const sliceOffset = (currentWheelAngle % sliceAngle) / sliceAngle;

      if (activeSliceIdx !== lastSliceIdxRef.current) {
        lastSliceIdxRef.current = activeSliceIdx;
        playTickSound();
      }

      // Deflect the needle flicking up to -18 degrees then springing back
      const speedFactor = 1 - progress;
      const deflection = Math.sin(sliceOffset * Math.PI) * (18 * speedFactor);
      setPointerAngle(-deflection);

      if (progress < 1) {
        animFrameIdRef.current = requestAnimationFrame(animate);
      } else {
        currentRotationRef.current = finalRotation;
        drawWheel(finalRotation);
        setIsSpinning(false);
        setPointerAngle(0);
        playWinSound(); // Sound on landing!

        // Instantly unveil DISCOUNT UNLOCKED modal and celebration in lockstep
        setTimeout(() => {
          setShowModal(true);

          try {
            const colors = ["#ffffff", "#a855f7", "#c084fc", "#38bdf8", "#f472b6", "#ffd166"];
            const end = Date.now() + 3000;

            // Center burst for all devices
            confetti({
              particleCount: typeof window !== "undefined" && window.innerWidth < 640 ? 90 : 140,
              spread: typeof window !== "undefined" && window.innerWidth < 640 ? 80 : 120,
              origin: { x: 0.5, y: 0.45 },
              colors,
              zIndex: 99999,
            });

            // Left and Right edge cannons shooting inward ONLY on desktop/tablet, not on mobile
            if (typeof window !== "undefined" && window.innerWidth >= 640) {
              const frame = () => {
                confetti({
                  particleCount: 4,
                  angle: 60,
                  spread: 60,
                  origin: { x: 0, y: 0.65 },
                  colors,
                  zIndex: 99999,
                });
                confetti({
                  particleCount: 4,
                  angle: 120,
                  spread: 60,
                  origin: { x: 1, y: 0.65 },
                  colors,
                  zIndex: 99999,
                });

                if (Date.now() < end) {
                  requestAnimationFrame(frame);
                }
              };
              frame();
            }
          } catch {}
        }, 120);
      }
    };

    animFrameIdRef.current = requestAnimationFrame(animate);
  };

  return (
    <div className="relative min-h-[100dvh] bg-black text-white font-body overflow-x-hidden flex flex-col justify-center selection:bg-purple-600 selection:text-white">
      <Helmet>
        <title>Lucky Wheel | MindSpark '26 - COEP Technological University</title>
        <meta
          name="description"
          content="Pick your event, spin the wheel of fortune, and unlock instant registration discounts for MindSpark '26."
        />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Lucky Wheel | MindSpark '26 - COEP Technological University" />
        <meta property="og:description" content="Pick your event, spin the wheel of fortune, and unlock instant registration discounts for MindSpark '26." />
        <meta property="og:image" content="/opengraph.jpeg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Lucky Wheel | MindSpark '26 - COEP Technological University" />
        <meta name="twitter:description" content="Pick your event, spin the wheel of fortune, and unlock instant registration discounts for MindSpark '26." />
        <meta name="twitter:image" content="/opengraph.jpeg" />
      </Helmet>

      {/* Background - PixelBlast */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
        <PixelBlast
          variant="square"
          pixelSize={5}
          color="#a855f7"
          patternScale={2.5}
          patternDensity={1.1}
          pixelSizeJitter={0.3}
          enableRipples={true}
          rippleSpeed={0.5}
          rippleThickness={0.15}
          rippleIntensityScale={2.0}
          liquid={false}
          liquidStrength={0.08}
          liquidRadius={1.0}
          liquidWobbleSpeed={4}
          speed={0.5}
          edgeFade={0.3}
          transparent={false}
        />
      </div>

      {/* Main Page Container - Vertically Centered with my-auto */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-grow flex flex-col items-center justify-center my-auto py-6 sm:py-10">
        
        {/* Hero Section Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-3 sm:mb-5 md:mb-7 relative w-full"
        >
          {/* Centered Pill Badge & Floating Sound Toggle */}
          <div className="relative flex items-center justify-center w-full max-w-5xl mx-auto mb-2.5 px-1">
            <div className="inline-flex items-center px-3.5 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-[11px] sm:text-xs font-mono text-purple-300">
              <span>MINDSPARK '26 REWARDS</span>
            </div>

            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="absolute right-0 inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-[11px] sm:text-xs font-mono text-white/70 hover:text-white transition-all cursor-pointer active:scale-95 touch-manipulation"
              title={soundEnabled ? "Mute sound effects" : "Enable sound effects"}
              aria-label={soundEnabled ? "Mute sound effects" : "Enable sound effects"}
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span className="hidden sm:inline">SOUND ON</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-white/40 shrink-0" />
                  <span className="hidden sm:inline">MUTED</span>
                </>
              )}
            </button>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-display font-black tracking-tighter mb-2 text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 drop-shadow-md uppercase leading-none">
            LUCKY WHEEL
          </h1>
          <p className="text-white/90 max-w-xl mx-auto text-xs sm:text-base font-normal leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] px-2">
            Pick your event, spin the wheel of fortune, and unlock your instant registration discount.
          </p>
        </motion.div>

        {/* 2-Column Grid Layout: Event Selector on Left (Top-Aligned) & Wheel on Right */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-12 items-start max-w-5xl">
          
          {/* Left Column: Event Selector positioned higher up */}
          <div className={`w-full max-w-[390px] sm:max-w-[440px] lg:max-w-none mx-auto lg:col-span-5 flex flex-col space-y-3 relative ${isDropdownOpen ? "z-40" : "z-30"}`}>
            
            {/* Premium Searchable SELECT EVENT Container */}
            <div
              ref={dropdownRef}
              className="p-4 sm:p-5 lg:p-6 rounded-2xl bg-zinc-950/90 border border-white/[0.08] hover:border-white/20 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.9)] transition-all relative"
            >
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[11px] sm:text-xs font-mono text-white/50 uppercase tracking-wider">
                  SELECT EVENT
                </label>
                <span className="text-[10px] font-mono text-white/40 tracking-wider">
                  {EVENT_DATA.length} COMPETITIONS
                </span>
              </div>

              {/* Custom Trigger Button & Popup Anchor */}
              <div className="relative w-full">
                <button
                  type="button"
                  disabled={isSpinning}
                  onClick={() => !isSpinning && setIsDropdownOpen(!isDropdownOpen)}
                  className={`w-full bg-black/80 border text-left rounded-xl px-3.5 sm:px-4 py-3 flex items-center justify-between transition-all touch-manipulation ${
                    isSpinning
                      ? "opacity-50 cursor-not-allowed border-white/5 pointer-events-none"
                      : isDropdownOpen
                      ? "border-purple-400/60 ring-1 ring-purple-400/30 shadow-[0_0_20px_rgba(168,85,247,0.15)] cursor-pointer"
                      : "border-white/10 hover:border-white/30 cursor-pointer"
                  }`}
                  aria-disabled={isSpinning}
                >
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className="text-white text-sm sm:text-base font-semibold font-display tracking-wide truncate">
                      {selectedEvent.name}
                    </span>
                    {selectedEvent.module && (
                      <span className="text-[9px] sm:text-[10px] font-mono text-white/40 uppercase tracking-widest mt-0.5">
                        MODULE &bull; {selectedEvent.module}
                      </span>
                    )}
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-white/50 transition-transform duration-200 shrink-0 ${
                      isDropdownOpen ? "rotate-180 text-purple-400" : "group-hover:text-white"
                    }`}
                  />
                </button>

                {/* Searchable Dropdown Menu Popup - Directly anchored below the button */}
                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 4, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.98 }}
                      transition={{ duration: 0.16 }}
                      className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl bg-zinc-950/95 border border-white/20 shadow-[0_25px_60px_rgba(0,0,0,0.98),0_0_30px_rgba(168,85,247,0.2)] backdrop-blur-2xl overflow-hidden"
                    >
                      {/* Search Input Bar - 16px font on mobile to prevent iOS Safari auto-zoom */}
                      <div className="p-2.5 sm:p-3 border-b border-white/[0.08] relative">
                        <Search className="w-3.5 h-3.5 text-white/40 absolute left-5 sm:left-6 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder="Type to search events..."
                          className="w-full bg-white/[0.06] border border-white/10 hover:border-white/20 focus:border-purple-400/50 rounded-lg pl-8 sm:pl-9 pr-8 py-2 text-[16px] sm:text-xs font-mono text-white placeholder-white/30 outline-none transition-all"
                        />
                        {searchTerm && (
                          <button
                            type="button"
                            onClick={() => setSearchTerm("")}
                            className="absolute right-5 sm:right-6 top-1/2 -translate-y-1/2 text-white/40 hover:text-white p-1"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {/* Scrollable Event List */}
                      <div className="max-h-60 sm:max-h-64 overflow-y-auto p-1.5 space-y-0.5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                        {filteredEvents.length > 0 ? (
                          filteredEvents.map((evt) => {
                            const isSelected = evt.name === selectedEvent.name;
                            return (
                              <button
                                key={evt.name}
                                type="button"
                                disabled={isSpinning}
                                onClick={() => {
                                  if (isSpinning) return;
                                  setSelectedEvent(evt);
                                  setIsDropdownOpen(false);
                                  setSearchTerm("");
                                }}
                                className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between text-xs transition-all touch-manipulation ${
                                  isSpinning
                                    ? "opacity-40 cursor-not-allowed"
                                    : isSelected
                                    ? "bg-purple-500/20 border border-purple-500/30 text-white font-semibold cursor-pointer"
                                    : "text-white/80 hover:bg-white/5 active:bg-white/10 hover:text-white cursor-pointer"
                                }`}
                              >
                                <div className="flex flex-col truncate pr-2">
                                  <span className="font-display tracking-wide text-xs sm:text-sm text-white">
                                    {evt.name}
                                  </span>
                                  {evt.module && (
                                    <span className="text-[9px] font-mono text-white/40 uppercase tracking-wider">
                                      {evt.module}
                                    </span>
                                  )}
                                </div>
                                {isSelected && (
                                  <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                                )}
                              </button>
                            );
                          })
                        ) : (
                          <div className="py-6 text-center text-xs font-mono text-white/40">
                            No competitions found for "{searchTerm}"
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>

          </div>

          {/* Right Column: Wheel Canvas */}
          <div className="w-full max-w-[390px] sm:max-w-[440px] md:max-w-[480px] mx-auto lg:col-span-7 flex flex-col items-center justify-center relative z-10">
            
            <div className="relative w-full aspect-square flex items-center justify-center p-2 sm:p-4 rounded-3xl bg-zinc-950/70 border border-white/[0.08] hover:border-purple-500/30 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.95)]">
              
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.1)_0%,transparent_70%)] pointer-events-none rounded-3xl" />

              {/* Wheel Canvas & Pointer Wrapper */}
              <div className="relative w-full h-full rounded-full p-2 sm:p-2.5 bg-zinc-950 border border-white/[0.12] flex items-center justify-center">
                
                {/* Mechanical Flapper Top Needle Indicator (Precisely centered on wheel circle) */}
                <div className="absolute -top-3.5 sm:-top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none flex items-center justify-center w-8">
                  <div
                    className="w-8 h-11 filter drop-shadow-[0_4px_12px_rgba(168,85,247,0.8)] transition-transform duration-75"
                    style={{
                      transform: `rotate(${pointerAngle}deg)`,
                      transformOrigin: "16px 12px",
                    }}
                  >
                    <svg width="32" height="44" viewBox="0 0 32 44" fill="none" className="block mx-auto">
                      {/* Perfectly symmetric needle pointer targeting exact (16, 42) */}
                      <path
                        d="M16 42L2 12C0 6.5 4.5 1 10.5 1H21.5C27.5 1 32 6.5 30 12L16 42Z"
                        fill="#ffffff"
                        stroke="#a855f7"
                        strokeWidth="2"
                        strokeLinejoin="round"
                      />
                      <circle cx="16" cy="12" r="5" fill="#09090b" stroke="#a855f7" strokeWidth="2" />
                      <circle cx="16" cy="12" r="2.5" fill="#ffffff" />
                    </svg>
                  </div>
                </div>

                <canvas
                  ref={canvasRef}
                  width={900}
                  height={900}
                  onClick={handleSpin}
                  className="w-full h-full rounded-full cursor-pointer transition-transform ease-out touch-manipulation"
                />

                {/* Center Hub: Tap Spin Button */}
                <button
                  onClick={handleSpin}
                  disabled={isSpinning}
                  className="absolute w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-zinc-900 border-2 border-white/20 p-1 shadow-[0_0_30px_rgba(168,85,247,0.3)] z-20 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center disabled:cursor-not-allowed group touch-manipulation"
                  aria-label="Spin the wheel"
                >
                  <div className="w-full h-full rounded-full bg-gradient-to-b from-zinc-900 to-black flex flex-col items-center justify-center border border-purple-500/40 group-hover:border-purple-400 transition-colors">
                    <span className="text-sm sm:text-base font-black text-white font-display tracking-wider leading-none">
                      SPIN
                    </span>
                  </div>
                </button>
              </div>

            </div>

            <div className="mt-4 sm:mt-6 flex items-center justify-center">
              <span className="text-[10px] sm:text-[11px] font-mono text-white/40 tracking-wider uppercase">
                {isSpinning ? "SPINNING THE WHEEL..." : "CLICK SPIN TO START"}
              </span>
            </div>

          </div>

        </div>

      </div>

      {/* Result Voucher Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.25 }}
              className="relative w-full max-w-md p-5 sm:p-7 rounded-2xl bg-zinc-950 border border-white/[0.15] shadow-[0_25px_70px_rgba(0,0,0,0.95),0_0_40px_rgba(168,85,247,0.15)] text-center max-h-[90vh] overflow-y-auto"
            >
              {/* Close button */}
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 text-white/40 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                ✕
              </button>

              {/* Badge Icon */}
              <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-purple-950/60 border border-purple-500/40 flex items-center justify-center text-purple-300">
                <Gift className="w-6 h-6 animate-bounce" />
              </div>

              <div className="text-[10px] font-mono text-purple-400 tracking-widest uppercase mb-1">
                DISCOUNT UNLOCKED
              </div>
              <h2 className="text-2xl sm:text-3xl font-display font-black text-white uppercase tracking-tight">
                {selectedEvent.name}
              </h2>

              {/* Large Discount Figure */}
              <div className="my-5 py-5 px-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                <div className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 font-display">
                  {selectedEvent.discount}% OFF
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-2.5">
                <a
                  href={selectedEvent.regLink || "https://www.crwdctrl.in"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3 px-5 rounded-full bg-white text-black font-semibold text-xs uppercase tracking-wider hover:bg-zinc-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center justify-center gap-1.5 touch-manipulation"
                >
                  <span>Redeem & Register</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setTimeout(handleSpin, 350);
                  }}
                  className="py-3 px-4 rounded-full border border-white/15 hover:bg-white/10 text-white text-xs font-mono uppercase tracking-wider transition-all cursor-pointer touch-manipulation"
                >
                  Spin Again
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
