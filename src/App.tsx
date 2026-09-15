import { useEffect } from "react";
import "./style.css";

type ThreatPie = {
  ar: number;
  exp: number;
  sg: number;
  rot: number;
};

type SoldierPreset = {
  id: string;
  title: string;
  desc: string;
  noiseClass: string;
  datasetTag: string;
  spl: string;
  confidence: string;
  snr: string;
  stoi: string;
  pesq: string;
  attenuation: string;
  noisySrc: string;
  cleanSrc: string;
  threatPie: ThreatPie;
  octaveLoss: number[];
};

type AuditEvent = {
  time: string;
  event: string;
  level: string;
};

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

const SOLDIER_PRESETS: SoldierPreset[] = [
  {
    id: "SOLDIER-01",
    title: "Squad Leader Comms (5.56mm CQB)",
    desc: "Assault rifle gunfire & rapid muzzle blasts",
    noiseClass: "Assault Rifle Fire (5.56mm AR)",
    datasetTag: "Urban Contact • Close-Quarter Carbine",
    spl: "126 dB SPL",
    confidence: "98.7%",
    snr: "+17.8 dB",
    stoi: "0.91",
    pesq: "2.82",
    attenuation: "-36.4 dB Peak",
    noisySrc: "/audio/soldier1_noisy.mp3",
    cleanSrc: "/audio/soldier1_clean.mp3",
    threatPie: { ar: 68, exp: 10, sg: 14, rot: 8 },
    octaveLoss: [22, 28, 38, 44, 40, 32, 26, 20],
  },
  {
    id: "SOLDIER-02",
    title: "Forward Observer Under Fire (7.62mm)",
    desc: "Heavy 7.62mm sniper cracks & squad return fire",
    noiseClass: "Small Guns & Battle Rifle Fire",
    datasetTag: "Perimeter Defense • Sniper Suppression",
    spl: "122 dB SPL",
    confidence: "97.4%",
    snr: "+18.5 dB",
    stoi: "0.90",
    pesq: "2.79",
    attenuation: "-37.8 dB Peak",
    noisySrc: "/audio/soldier2_noisy.mp3",
    cleanSrc: "/audio/soldier2_clean.mp3",
    threatPie: { ar: 22, exp: 8, sg: 62, rot: 8 },
    octaveLoss: [18, 24, 34, 46, 42, 38, 30, 22],
  },
  {
    id: "SOLDIER-03",
    title: "Armored Patrol Crew (Diesel & Shrapnel)",
    desc: "Heavy diesel engine hum + explosive impacts",
    noiseClass: "Combat Vehicle + Small Guns Shrapnel",
    datasetTag: "Mounted Patrol • APC Compartment",
    spl: "119 dB SPL",
    confidence: "95.2%",
    snr: "+16.1 dB",
    stoi: "0.88",
    pesq: "2.66",
    attenuation: "-31.2 dB Peak",
    noisySrc: "/audio/soldier3_noisy.mp3",
    cleanSrc: "/audio/soldier3_clean.mp3",
    threatPie: { ar: 10, exp: 24, sg: 16, rot: 50 },
    octaveLoss: [36, 42, 36, 30, 26, 22, 18, 14],
  },
  {
    id: "SOLDIER-04",
    title: "Pointman Breaching (IED & Grenades)",
    desc: "High-energy blast shockwaves & debris",
    noiseClass: "Explosives & Artillery Blast",
    datasetTag: "Assault Breaching • Detonation Shockwave",
    spl: "136 dB SPL",
    confidence: "99.2%",
    snr: "+21.4 dB",
    stoi: "0.89",
    pesq: "2.75",
    attenuation: "-44.1 dB Peak",
    noisySrc: "/audio/soldier4_noisy.mp3",
    cleanSrc: "/audio/soldier4_clean.mp3",
    threatPie: { ar: 18, exp: 64, sg: 12, rot: 6 },
    octaveLoss: [42, 48, 44, 38, 32, 28, 24, 18],
  },
  {
    id: "SOLDIER-05",
    title: "Joint Tactical Radio (Heavy Artillery / 155mm)",
    desc: "Overpressure shockwave and muzzle report",
    noiseClass: "155mm Heavy Artillery Battery",
    datasetTag: "Indirect Fire Base • Blast Attenuation",
    spl: "140 dB SPL",
    confidence: "99.8%",
    snr: "+22.8 dB",
    stoi: "0.87",
    pesq: "2.64",
    attenuation: "-46.0 dB Peak",
    noisySrc: "/audio/soldier5_noisy.mp3",
    cleanSrc: "/audio/soldier5_clean.mp3",
    threatPie: { ar: 4, exp: 82, sg: 6, rot: 8 },
    octaveLoss: [48, 52, 46, 38, 30, 24, 20, 16],
  },
];

const APP_HTML = String.raw`
<header class="console-header" role="banner">
  <div class="brand-cluster">
    <svg class="radio-icon" viewBox="0 0 24 24">
      <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9m14.2 0C23 8.8 23 15.2 19.1 19.1M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5m8.4 0c2.3 2.3 2.3 6.1 0 8.5M12 14a2 2 0 100-4 2 2 0 000 4z"/>
    </svg>

    <div>
      <h1 class="text-base font-bold" style="letter-spacing: 0.05em;">
        AI-ANC OPERATIONAL CONSOLE
      </h1>

      <p class="text-xs" style="color: var(--text-muted);">
        <span class="mono">v2.4-INT8</span> |
        Target: NVIDIA Jetson AGX Orin |
        Dual-Channel 16kHz PCM
      </p>
    </div>
  </div>

  <div class="header-telemetry">
    <div class="telemetry-cell">
      <span class="label">Pipeline Status</span>
      <span id="pipeline-status-badge" class="badge badge-rose">STANDBY</span>
    </div>

    <div class="telemetry-cell">
      <span class="label">Latency</span>
      <span id="tel-latency" class="mono text-sm font-semibold" style="color: var(--status-emerald);">
        -- ms
      </span>
    </div>

    <div class="telemetry-cell">
      <span class="label">Power</span>
      <span id="tel-power" class="mono text-sm font-semibold">-- W</span>
    </div>

    <button id="btn-pipeline" class="btn btn-engage" aria-label="Toggle Pipeline Processing">
      ENGAGE PIPELINE
    </button>
  </div>
</header>

<nav aria-label="Defense Noise Presets">
  <div class="panel-header" style="margin-bottom: 8px;">
    DEFENSE NOISE PRESETS (MISSION SELECTION)
  </div>
  <div class="presets-strip" id="preset-container"></div>
</nav>

<section class="dashboard-row-1" aria-label="Real-Time Engine Processing">

  <article class="panel">
    <div class="panel-header">
      <span>1. DATA ACQUISITION</span>
      <span class="badge badge-amber">16 KHZ PCM</span>
    </div>

    <div class="data-metric-row">
      <span class="metric-label text-sm">Primary Mic (Voice + Noise)</span>
      <span id="metric-spl" class="metric-val mono text-lg" style="color: var(--status-amber);">
        -- dB SPL
      </span>
    </div>

    <div class="waveform-box">
      <canvas id="canvas-raw"></canvas>
    </div>

    <div style="display: flex; flex-direction: column; gap: 4px; margin-top: 4px;">
      <div class="data-metric-row">
        <span class="metric-label">STFT Window Size</span>
        <span class="metric-val">20 ms (320 samples)</span>
      </div>

      <div class="data-metric-row">
        <span class="metric-label">Hop Length</span>
        <span class="metric-val">10 ms (Causal)</span>
      </div>

      <div class="data-metric-row">
        <span class="metric-label">Estimated Noise Floor</span>
        <span class="metric-val">-46.8 dBFS</span>
      </div>
    </div>
  </article>

  <article class="panel">
    <div class="panel-header">
      <span>2. PARALLEL ENGINES & FUSION</span>
      <span class="badge badge-indigo">COMPLEX DOMAIN</span>
    </div>

    <div>
      <div class="data-metric-row">
        <span class="text-sm font-semibold">Causal Complex Mask (DCRN)</span>
        <span class="badge badge-indigo" id="badge-neural">STANDBY</span>
      </div>

      <p class="text-xs" style="color: var(--text-muted); margin-top: 2px;">
        Phase-preserving non-stationary noise suppression
      </p>

      <div class="meter-track">
        <div id="meter-neural" class="meter-fill"
          style="background: var(--status-indigo); width: 0%;">
        </div>
      </div>
    </div>

    <div style="margin-top: 6px;">
      <div class="data-metric-row">
        <span class="text-sm font-semibold">Sub-band NLMS Adaptive Filter</span>
        <span class="badge badge-sky" id="badge-nlms">STANDBY</span>
      </div>

      <p class="text-xs" style="color: var(--text-muted); margin-top: 2px;">
        Notch cancellation for engine & rotor harmonics
      </p>

      <div class="meter-track">
        <div id="meter-nlms" class="meter-fill"
          style="background: var(--status-sky); width: 0%;">
        </div>
      </div>
    </div>

    <div style="margin-top: 10px;">
      <div class="data-metric-row">
        <span class="metric-label text-xs font-semibold">
          Confidence Fusion Ratio
        </span>

        <span id="fusion-ratio-label"
          class="metric-val mono text-sm"
          style="color: var(--status-indigo);">
          75% Neural / 25% NLMS
        </span>
      </div>

      <input type="range"
        id="slider-fusion"
        min="20"
        max="90"
        value="75"
        style="margin-top: 6px;" />
    </div>
  </article>

  <article class="panel">
    <div class="panel-header">
      <span>3. THREAT & QUALITY ANALYSIS</span>
      <span class="badge badge-emerald">AWAITING INPUT</span>
    </div>

    <div style="display: flex; flex-direction: column; gap: 8px;">
      <div class="data-metric-row">
        <span class="metric-label">Identified Noise Class</span>
        <span id="threat-noise-class" class="metric-val font-semibold">
          None Selected
        </span>
      </div>

      <div class="data-metric-row">
        <span class="metric-label">Classification Confidence</span>
        <span id="threat-confidence"
          class="metric-val mono text-sm"
          style="color: var(--status-emerald);">
          --%
        </span>
      </div>

      <div class="data-metric-row">
        <span class="metric-label">Impulsive Attenuation</span>
        <span id="threat-attenuation" class="metric-val mono">
          -- dB Peak
        </span>
      </div>

      <div class="data-metric-row">
        <span class="metric-label">Adaptive State Monitoring</span>
        <span class="badge badge-emerald" id="badge-adapt">READY</span>
      </div>

      <div style="margin-top: 6px;">
        <div class="data-metric-row">
          <span class="metric-label">Adaptive Step Size (&mu;)</span>
          <span id="step-size-label" class="metric-val mono">0.012</span>
        </div>

        <input type="range"
          id="slider-step-size"
          min="0.005"
          max="0.040"
          step="0.001"
          value="0.012"
          style="margin-top: 6px;" />
      </div>
    </div>
  </article>
</section>

<section class="dashboard-row-2" aria-label="Metrics and Event Verification">

  <article class="panel">
    <div class="panel-header">
      <span>4. SPEECH QUALITY & INTELLIGIBILITY</span>
      <span class="text-xs mono" style="color: var(--text-muted);">
        Target: SNR &gt;15 | PESQ &gt;2.5 | STOI &gt;0.85
      </span>
    </div>

    <div class="metric-gauges-grid">

      <div style="background: #090e17; padding: 10px; border: 1px solid var(--border-panel); border-radius: 2px;">
        <div class="text-xs" style="color: var(--text-muted);">
          SNR IMPROVEMENT
        </div>

        <div id="metric-snr"
          class="mono font-bold text-lg"
          style="color: var(--status-emerald); margin-top: 4px;">
          -- dB
        </div>

        <div class="text-xs" style="color: var(--text-muted); margin-top: 2px;">
          Baseline Idle
        </div>
      </div>

      <div style="background: #090e17; padding: 10px; border: 1px solid var(--border-panel); border-radius: 2px;">
        <div class="text-xs" style="color: var(--text-muted);">
          INTELLIGIBILITY (STOI)
        </div>

        <div id="metric-stoi"
          class="mono font-bold text-lg"
          style="color: var(--text-main); margin-top: 4px;">
          --
        </div>

        <div class="text-xs" style="color: var(--text-muted); margin-top: 2px;">
          Target (&gt;0.85)
        </div>
      </div>

      <div style="background: #090e17; padding: 10px; border: 1px solid var(--border-panel); border-radius: 2px;">
        <div class="text-xs" style="color: var(--text-muted);">
          QUALITY SCORE (PESQ)
        </div>

        <div id="metric-pesq"
          class="mono font-bold text-lg"
          style="color: var(--text-main); margin-top: 4px;">
          --
        </div>

        <div class="text-xs" style="color: var(--text-muted); margin-top: 2px;">
          Target (&gt;2.5)
        </div>
      </div>

      <div style="background: #090e17; padding: 10px; border: 1px solid var(--border-panel); border-radius: 2px;">
        <div class="text-xs" style="color: var(--text-muted);">
          EDGE INFERENCE
        </div>

        <div id="metric-inference"
          class="mono font-bold text-lg"
          style="color: var(--status-emerald); margin-top: 4px;">
          -- ms
        </div>

        <div class="text-xs" style="color: var(--text-muted); margin-top: 2px;">
          Target (&lt;10 ms)
        </div>
      </div>

    </div>
  </article>

  <article class="panel">
    <div class="panel-header">
      <span>5. AUDIT EVENT LOG</span>
      <span class="badge badge-sky">LIVE BUFFER</span>
    </div>

    <div class="table-container">
      <table class="audit-table">
        <thead>
          <tr>
            <th>TIME</th>
            <th>EVENT TYPE</th>
            <th style="text-align: right;">LEVEL</th>
          </tr>
        </thead>

        <tbody id="audit-log-body"></tbody>
      </table>
    </div>

    <button id="btn-export-csv"
      class="btn btn-outline text-xs"
      style="width: 100%; margin-top: auto;">
      EXPORT AUDIT LOG (.CSV)
    </button>
  </article>
</section>

<section class="dashboard-row-3" aria-label="Output Monitoring & Control">
  <article class="panel">

    <div class="panel-header">
      <span>6. ENHANCED OUTPUT STREAM (DOWNLINK)</span>

      <div style="display: flex; flex-wrap: wrap; gap: 12px; font-size: 0.72rem;">
        <span class="mono">
          HARMONIC REJECTION:
          <span id="tel-harmonic" style="color: var(--status-emerald);">
            -- dB
          </span>
        </span>

        <span class="mono">
          OUTPUT SATURATION:
          <span style="color: var(--status-emerald);">
            NOMINAL
          </span>
        </span>
      </div>
    </div>

    <div class="waveform-box">
      <canvas id="canvas-enhanced"></canvas>
    </div>

    <div style="margin-top: 8px;">
      <div class="data-metric-row text-xs">
        <span style="color: var(--text-muted);">
          RAW INPUT AUDIO (0%)
        </span>

        <span id="crossfader-label"
          class="mono font-semibold"
          style="color: var(--status-emerald);">
          Live Crossfader: 100% Enhanced (Clean Voice Active)
        </span>

        <span style="color: var(--status-emerald);">
          ENHANCED AI FILTER (100%)
        </span>
      </div>

      <input type="range"
        id="slider-crossfader"
        min="0"
        max="100"
        value="100"
        style="margin-top: 6px;" />
    </div>
  </article>
</section>

<section class="hardware-chassis" aria-label="Embedded Soldier Comms Diagnostics">

  <div class="panel-header" style="border-bottom: 1px solid var(--border-bezel);">
    <div style="display: flex; align-items: center; gap: 8px;">
      <span class="badge badge-emerald">SOLDIER COMMS BAY</span>

      <span style="font-size: 0.82rem; font-weight: 800; color: #fff;">
        TACTICAL INFANTRY VOICE PROCESSOR • FIELD AUDIO AUDIT
      </span>
    </div>

    <div class="mono text-xs" style="color: var(--text-muted);">
      MIC BIAS:
      <span id="hw-rail" style="color: var(--text-crt);">
        12.04 V
      </span>
      |
      CORE TEMP:
      <span id="hw-temp" style="color: var(--status-amber);">
        42.8 °C
      </span>
      |
      OUTPUT:
      <span id="hw-downlink-mode" style="color: var(--status-emerald);">
        READY
      </span>
    </div>
  </div>

  <div class="dataset-selector-box">

    <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 8px;">

      <div>
        <div style="font-size: 0.78rem; font-weight: 800; color: #fff; letter-spacing: 0.06em;">
          SELECT SOLDIER AUDIO SAMPLE FOR IMMEDIATE CLEANED PLAYBACK
        </div>

        <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 2px;">
          Select one of our 5 defense audio recordings below. The model automatically routes the sample into processing and directly streams the cleaned speech version.
        </div>
      </div>

      <div class="mono text-xs"
        style="color: var(--status-emerald); background: #071510; border: 1px solid #143526; padding: 3px 8px; border-radius: 2px;">
        INPUT FORMAT: MP3 STEREO / 16 KHZ PCM
      </div>
    </div>

    <div class="hw-preset-btn-strip" id="hw-preset-strip"></div>
  </div>

  <div class="charts-row">

    <div class="chart-card">

      <div class="panel-header" style="font-size: 0.7rem; border-color: #1a2538;">
        <span>DEFENSE NOISE DISTRIBUTION</span>
        <span class="badge badge-amber" id="pie-badge">
          AWAITING SAMPLE
        </span>
      </div>

      <div class="pie-container">

        <svg viewBox="0 0 120 120"
          width="105"
          height="105"
          style="transform: rotate(-90deg);">

          <circle id="pie-zero-circle"
            r="40"
            cx="60"
            cy="60"
            fill="transparent"
            stroke="#1b2537"
            stroke-width="20" />

          <circle id="pie-seg-ar"
            r="40"
            cx="60"
            cy="60"
            fill="transparent"
            stroke="#f59e0b"
            stroke-width="20"
            stroke-dasharray="0 251.2"
            stroke-dashoffset="0" />

          <circle id="pie-seg-exp"
            r="40"
            cx="60"
            cy="60"
            fill="transparent"
            stroke="#f43f5e"
            stroke-width="20"
            stroke-dasharray="0 251.2"
            stroke-dashoffset="0" />

          <circle id="pie-seg-sg"
            r="40"
            cx="60"
            cy="60"
            fill="transparent"
            stroke="#6366f1"
            stroke-width="20"
            stroke-dasharray="0 251.2"
            stroke-dashoffset="0" />

          <circle id="pie-seg-rot"
            r="40"
            cx="60"
            cy="60"
            fill="transparent"
            stroke="#10b981"
            stroke-width="20"
            stroke-dasharray="0 251.2"
            stroke-dashoffset="0" />
        </svg>

        <div class="pie-legend">

          <div class="legend-row">
            <span class="legend-dot" style="background: #f59e0b;"></span>
            <span>
              <strong id="legend-val-ar">0%</strong>
              Assault Rifles (AR)
            </span>
          </div>

          <div class="legend-row">
            <span class="legend-dot" style="background: #f43f5e;"></span>
            <span>
              <strong id="legend-val-exp">0%</strong>
              Explosives & Artillery
            </span>
          </div>

          <div class="legend-row">
            <span class="legend-dot" style="background: #6366f1;"></span>
            <span>
              <strong id="legend-val-sg">0%</strong>
              Small Guns & HMG
            </span>
          </div>

          <div class="legend-row">
            <span class="legend-dot" style="background: #10b981;"></span>
            <span>
              <strong id="legend-val-rot">0%</strong>
              Rotor & Drone Whine
            </span>
          </div>

        </div>
      </div>
    </div>

    <div class="chart-card">

      <div class="panel-header" style="font-size: 0.7rem; border-color: #1a2538;">
        <span>
          SPECTRAL INSERTION LOSS (OCTAVE BAND ATTENUATION)
        </span>

        <span class="badge badge-emerald" id="bar-badge">
          STANDBY (0 dB)
        </span>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: flex-end; height: 95px; padding: 4px 10px; background: #060a12; border: 1px solid #141c2c; border-radius: 2px;">

        ${[
          ["b0", "63Hz"],
          ["b1", "125Hz"],
          ["b2", "250Hz"],
          ["b3", "500Hz"],
          ["b4", "1kHz"],
          ["b5", "2kHz"],
          ["b6", "4kHz"],
          ["b7", "8kHz"],
        ]
          .map(
            ([id, label]) => `
          <div style="display: flex; flex-direction: column; align-items: center; gap: 4px; height: 100%; justify-content: flex-end;">
            <div class="mono text-xs bar-val"
              id="val-${id}"
              style="color: var(--text-crt); font-size: 0.6rem;">
              0dB
            </div>

            <div class="octave-bar"
              id="bar-${id}"
              style="height: 0%;">
            </div>

            <div class="mono text-xs"
              style="color: var(--text-muted); font-size: 0.6rem;">
              ${label}
            </div>
          </div>
        `
          )
          .join("")}

      </div>
    </div>
  </div>

  <div class="hardware-grid">

    <div class="hw-module">

      <div class="panel-header" style="font-size: 0.7rem; border-color: #1a2538;">
        <span>SOLDIER HEADSET VU METERS</span>
        <span class="badge badge-amber">ANALOG</span>
      </div>

      <div class="vu-cluster">

        <div class="vu-meter">
          <div class="vu-scale-arc">
            <span class="vu-txt" style="left: 2px;">-20</span>
            <span class="vu-txt" style="left: 45%;">0</span>
            <span class="vu-txt" style="right: 2px; color: #991b1b;">+3</span>
            <div id="hw-needle-raw" class="vu-needle-stick"></div>
          </div>

          <div class="mono"
            style="font-size: 0.52rem; text-align: center; color: #403b29; font-weight: 700; margin-top: 2px;">
            MIC NOISE (dBu)
          </div>
        </div>

        <div class="vu-meter">
          <div class="vu-scale-arc">
            <span class="vu-txt" style="left: 2px;">-20</span>
            <span class="vu-txt" style="left: 45%;">0</span>
            <span class="vu-txt" style="right: 2px; color: #991b1b;">+3</span>
            <div id="hw-needle-clean" class="vu-needle-stick"></div>
          </div>

          <div class="mono"
            style="font-size: 0.52rem; text-align: center; color: #403b29; font-weight: 700; margin-top: 2px;">
            CLEAN VOICE (dBu)
          </div>
        </div>

      </div>

      <div class="knobs-row">

        <div class="knob-item">
          <div class="analog-dial"
            id="dial-trim"
            style="transform: rotate(0deg);">
            <div class="dial-mark"></div>
          </div>

          <span class="mono text-xs"
            style="color: var(--text-muted); font-size: 0.65rem;">
            VOICE BOOST
          </span>

          <span id="readout-trim"
            class="mono text-xs"
            style="color: var(--status-amber);">
            +0.0 dB
          </span>
        </div>

        <div class="knob-item">
          <div class="analog-dial"
            id="dial-notch"
            style="transform: rotate(15deg);">
            <div class="dial-mark"></div>
          </div>

          <span class="mono text-xs"
            style="color: var(--text-muted); font-size: 0.65rem;">
            BURST GATE
          </span>

          <span id="readout-notch"
            class="mono text-xs"
            style="color: var(--text-crt);">
            1.40
          </span>
        </div>

      </div>
    </div>

    <div class="hw-module" style="position: relative;">

      <div class="panel-header" style="font-size: 0.7rem; border-color: #1a2538;">
        <span>CRT RASTER BEAM OSCILLOSCOPE</span>

        <span id="crt-indicator"
          class="mono text-xs"
          style="color: var(--text-muted);">
          STANDBY
        </span>
      </div>

      <div class="crt-monitor">
        <div class="crt-scan"></div>
        <canvas id="canvas-hw-crt"></canvas>
      </div>

    </div>

    <div class="hw-module">

      <div class="panel-header" style="font-size: 0.7rem; border-color: #1a2538;">
        <span>SOLDIER TELEMETRY</span>
        <span class="badge badge-sky">DOWNLINK</span>
      </div>

      <div style="display: flex; flex-direction: column; gap: 6px; font-size: 0.72rem;"
        class="mono">

        <div class="data-metric-row">
          <span style="color: var(--text-muted);">Active Audio:</span>
          <span id="hw-active-name" style="color: var(--text-dim);">
            None Selected
          </span>
        </div>

        <div class="data-metric-row">
          <span style="color: var(--text-muted);">Output Route:</span>
          <span style="color: var(--status-emerald);">
            100% CLEAN VOICE
          </span>
        </div>

        <div class="data-metric-row">
          <span style="color: var(--text-muted);">Combat Gating:</span>
          <span style="color: var(--text-crt);">
            -42.5 dB Transients
          </span>
        </div>

        <div class="data-metric-row">
          <span style="color: var(--text-muted);">Bone-Conduction Sync:</span>
          <span>Locked (16 kHz)</span>
        </div>
      </div>

      <button id="btn-hw-tone"
        class="btn btn-outline text-xs"
        style="margin-top: auto; border-color: #27354d;">
        INJECT 1 KHZ RADIO SQUELCH TONE
      </button>

    </div>
  </div>
</section>

<div id="toast" class="toast mono"></div>
`;

export default function App() {
  useEffect(() => {
    const root = document.getElementById("app-root");

    if (!root) return;

    root.innerHTML = APP_HTML;

    let auditEvents: AuditEvent[] = [];
    let currentPreset: SoldierPreset | null = null;
    let isPipelineRunning = false;
    let crossfaderValue = 100;
    let animationFrameId: number | null = null;
    let isSwitchingTrack = false;

    let audioCtx: AudioContext | null = null;
    let noisyGain: GainNode | null = null;
    let cleanGain: GainNode | null = null;
    let masterRampGain: GainNode | null = null;
    let sourceNoisy: AudioBufferSourceNode | null = null;
    let sourceClean: AudioBufferSourceNode | null = null;
    let bufferNoisy: AudioBuffer | null = null;
    let bufferClean: AudioBuffer | null = null;
    let analyserRaw: AnalyserNode | null = null;
    let analyserEnh: AnalyserNode | null = null;

    let rawByteData = new Uint8Array(256);
    let enhByteData = new Uint8Array(256);

    const getElement = <T extends Element = HTMLElement>(id: string) =>
      document.getElementById(id) as T | null;

    function generateSyntheticCombatAudio(
      targetPreset: SoldierPreset | null
    ) {
      if (!audioCtx) {
        throw new Error("AudioContext not initialized");
      }

      const sampleRate = audioCtx.sampleRate || 16000;
      const duration = 4.0;
      const totalSamples = Math.floor(sampleRate * duration);

      const nBuf = audioCtx.createBuffer(
        1,
        totalSamples,
        sampleRate
      );

      const cBuf = audioCtx.createBuffer(
        1,
        totalSamples,
        sampleRate
      );

      const nOut = nBuf.getChannelData(0);
      const cOut = cBuf.getChannelData(0);

      const type = targetPreset
        ? targetPreset.noiseClass
        : "Combat Noise";

      for (let i = 0; i < totalSamples; i++) {
        const t = i / sampleRate;

        const voiceCadence =
          0.5 + 0.5 * Math.sin(2 * Math.PI * 2.2 * t);

        const speechSignal =
          (
            Math.sin(2 * Math.PI * 190 * t) * 0.45 +
            Math.sin(2 * Math.PI * 750 * t) * 0.25
          ) * voiceCadence;

        cOut[i] = speechSignal;

        let combatNoise = 0;

        if (
          type.includes("Explosives") ||
          type.includes("Artillery")
        ) {
          const burst =
            t % 0.8 < 0.04
              ? (Math.random() * 2 - 1) *
                Math.exp(-(t % 0.8) * 75) *
                3.5
              : 0;

          combatNoise =
            burst + (Math.random() * 2 - 1) * 0.12;
        } else if (
          type.includes("Assault") ||
          type.includes("Small Guns")
        ) {
          const gunshot =
            t % 0.45 < 0.03
              ? (Math.random() * 2 - 1) *
                Math.exp(-(t % 0.45) * 110) *
                2.8
              : 0;

          combatNoise =
            gunshot + (Math.random() * 2 - 1) * 0.15;
        } else {
          combatNoise =
            Math.sin(2 * Math.PI * 65 * t) * 0.5 +
            Math.sin(2 * Math.PI * 130 * t) * 0.3 +
            (Math.random() * 2 - 1) * 0.2;
        }

        nOut[i] =
          speechSignal * 0.35 +
          combatNoise * 0.75;

        const edge = 300;

        if (i < edge) {
          const f = i / edge;
          cOut[i] *= f;
          nOut[i] *= f;
        } else if (i > totalSamples - edge) {
          const f = (totalSamples - i) / edge;
          cOut[i] *= f;
          nOut[i] *= f;
        }
      }

      return {
        noisy: nBuf,
        clean: cBuf,
      };
    }

    async function loadAudioBuffer(
      url: string,
      isClean: boolean,
      targetPreset: SoldierPreset
    ) {
      try {
        if (!audioCtx) {
          throw new Error("AudioContext not initialized");
        }

        const res = await fetch(url);

        if (!res.ok) {
          throw new Error(`HTTP ${res.status} on ${url}`);
        }

        const arrayBuf = await res.arrayBuffer();

        return await audioCtx.decodeAudioData(arrayBuf);
      } catch (err) {
        console.warn(
          `[Audio Fallback] Could not fetch ${url}. Using synthetic procedural buffer.`,
          err
        );

        const synthetic =
          generateSyntheticCombatAudio(targetPreset);

        return isClean
          ? synthetic.clean
          : synthetic.noisy;
      }
    }

    async function initAudioEngine() {
      if (!audioCtx) {
        const AudioContextClass =
          window.AudioContext ||
          window.webkitAudioContext;

        if (!AudioContextClass) {
          throw new Error(
            "Web Audio API is not supported in this browser."
          );
        }

        audioCtx = new AudioContextClass();

        noisyGain = audioCtx.createGain();
        cleanGain = audioCtx.createGain();
        masterRampGain = audioCtx.createGain();

        analyserRaw = audioCtx.createAnalyser();
        analyserEnh = audioCtx.createAnalyser();

        analyserRaw.fftSize = 512;
        analyserEnh.fftSize = 512;

        noisyGain.connect(analyserRaw);
        cleanGain.connect(analyserEnh);

        analyserRaw.connect(masterRampGain);
        analyserEnh.connect(masterRampGain);

        masterRampGain.connect(audioCtx.destination);

        updateCrossfadeGains(crossfaderValue);
      }

      if (audioCtx.state === "suspended") {
        await audioCtx.resume();
      }
    }

    function immediateStopPlayback() {
      if (sourceNoisy) {
        try {
          sourceNoisy.onended = null;
          sourceNoisy.stop();
          sourceNoisy.disconnect();
        } catch {
          // Source may already be stopped.
        }

        sourceNoisy = null;
      }

      if (sourceClean) {
        try {
          sourceClean.onended = null;
          sourceClean.stop();
          sourceClean.disconnect();
        } catch {
          // Source may already be stopped.
        }

        sourceClean = null;
      }
    }

    async function fadeOutAndStop() {
      if (!audioCtx || !masterRampGain) {
        immediateStopPlayback();
        return;
      }

      const now = audioCtx.currentTime;

      masterRampGain.gain.cancelScheduledValues(now);

      masterRampGain.gain.setValueAtTime(
        masterRampGain.gain.value,
        now
      );

      masterRampGain.gain.linearRampToValueAtTime(
        0.0001,
        now + 0.015
      );

      await new Promise<void>((resolve) =>
        setTimeout(resolve, 20)
      );

      immediateStopPlayback();
    }

    function startFadeInPlayback() {
      if (
        !bufferNoisy ||
        !bufferClean ||
        !audioCtx ||
        !noisyGain ||
        !cleanGain ||
        !masterRampGain
      ) {
        return;
      }

      immediateStopPlayback();

      sourceNoisy =
        audioCtx.createBufferSource();

      sourceClean =
        audioCtx.createBufferSource();

      sourceNoisy.buffer = bufferNoisy;
      sourceClean.buffer = bufferClean;

      sourceNoisy.loop = true;
      sourceClean.loop = true;

      sourceNoisy.connect(noisyGain);
      sourceClean.connect(cleanGain);

      const now = audioCtx.currentTime;
      const startTime = now + 0.02;

      masterRampGain.gain.cancelScheduledValues(now);

      masterRampGain.gain.setValueAtTime(
        0.0001,
        now
      );

      masterRampGain.gain.linearRampToValueAtTime(
        1.0,
        startTime + 0.025
      );

      sourceNoisy.start(startTime);
      sourceClean.start(startTime);
    }

    function resetChartsToZero() {
      const circ = 251.2;

      const zeroCircle =
        getElement<SVGCircleElement>(
          "pie-zero-circle"
        );

      zeroCircle?.style.setProperty(
        "display",
        "block"
      );

      ["ar", "exp", "sg", "rot"].forEach((name) => {
        getElement<SVGCircleElement>(
          `pie-seg-${name}`
        )?.setAttribute(
          "stroke-dasharray",
          `0 ${circ}`
        );
      });

      getElement("legend-val-ar")!.innerText = "0%";
      getElement("legend-val-exp")!.innerText = "0%";
      getElement("legend-val-sg")!.innerText = "0%";
      getElement("legend-val-rot")!.innerText = "0%";

      getElement("pie-badge")!.innerText =
        "AWAITING SAMPLE";

      for (let i = 0; i < 8; i++) {
        const bar =
          getElement<HTMLDivElement>(`bar-b${i}`);

        const val =
          getElement<HTMLDivElement>(`val-b${i}`);

        if (bar && val) {
          bar.style.height = "0%";
          val.innerText = "0dB";
        }
      }

      getElement("bar-badge")!.innerText =
        "STANDBY (0 dB)";
    }

    function updateChartsForPreset(
      preset: SoldierPreset
    ) {
      const pie = preset.threatPie;
      const circ = 251.2;

      const zeroCircle =
        getElement<SVGCircleElement>(
          "pie-zero-circle"
        );

      zeroCircle?.style.setProperty(
        "display",
        "none"
      );

      const values = [
        ["ar", pie.ar],
        ["exp", pie.exp],
        ["sg", pie.sg],
        ["rot", pie.rot],
      ] as const;

      let offset = 0;

      values.forEach(([name, percentage]) => {
        const length =
          (percentage / 100) * circ;

        const segment =
          getElement<SVGCircleElement>(
            `pie-seg-${name}`
          );

        if (segment) {
          segment.setAttribute(
            "stroke-dasharray",
            `${length} ${circ}`
          );

          segment.setAttribute(
            "stroke-dashoffset",
            `-${offset}`
          );
        }

        offset += length;
      });

      getElement("legend-val-ar")!.innerText =
        `${pie.ar}%`;

      getElement("legend-val-exp")!.innerText =
        `${pie.exp}%`;

      getElement("legend-val-sg")!.innerText =
        `${pie.sg}%`;

      getElement("legend-val-rot")!.innerText =
        `${pie.rot}%`;

      getElement("pie-badge")!.innerText =
        `${preset.id} PROFILE`;

      preset.octaveLoss.forEach(
        (lossDb, idx) => {
          const bar =
            getElement<HTMLDivElement>(
              `bar-b${idx}`
            );

          const val =
            getElement<HTMLDivElement>(
              `val-b${idx}`
            );

          if (!bar || !val) return;

          const heightPct = Math.min(
            100,
            Math.round((lossDb / 55) * 100)
          );

          bar.style.height =
            `${heightPct}%`;

          val.innerText = `-${lossDb}dB`;

          if (lossDb >= 36) {
            bar.style.background =
              "var(--status-emerald)";
          } else if (lossDb >= 26) {
            bar.style.background =
              "var(--status-sky)";
          } else {
            bar.style.background =
              "var(--status-indigo)";
          }
        }
      );

      getElement("bar-badge")!.innerText =
        `ACTIVE (${preset.attenuation})`;
    }

    async function playCleanAudioSample(
      preset: SoldierPreset
    ) {
      if (isSwitchingTrack) return;

      isSwitchingTrack = true;

      try {
        await initAudioEngine();

        currentPreset = preset;

        const badge =
          getElement("pipeline-status-badge");

        if (badge) {
          badge.innerText =
            "PROCESSING AUDIO...";

          badge.className =
            "badge badge-amber";
        }

        await fadeOutAndStop();

        const [nBuf, cBuf] =
          await Promise.all([
            loadAudioBuffer(
              preset.noisySrc,
              false,
              preset
            ),
            loadAudioBuffer(
              preset.cleanSrc,
              true,
              preset
            ),
          ]);

        bufferNoisy = nBuf;
        bufferClean = cBuf;

        crossfaderValue = 100;

        const crossfader =
          getElement<HTMLInputElement>(
            "slider-crossfader"
          );

        if (crossfader) {
          crossfader.value = "100";
        }

        updateCrossfadeGains(100);

        isPipelineRunning = true;

        const btn =
          getElement<HTMLButtonElement>(
            "btn-pipeline"
          );

        if (btn) {
          btn.innerText =
            "PAUSE PIPELINE";

          btn.className =
            "btn btn-pause";
        }

        if (badge) {
          badge.innerText =
            "RUNNING (CLEAN)";

          badge.className =
            "badge badge-emerald";
        }

        startFadeInPlayback();

        updateChartsForPreset(preset);

        getElement("metric-spl")!.innerText =
          preset.spl;

        getElement(
          "threat-noise-class"
        )!.innerText =
          preset.noiseClass;

        getElement(
          "threat-confidence"
        )!.innerText =
          preset.confidence;

        getElement(
          "threat-attenuation"
        )!.innerText =
          preset.attenuation;

        getElement("metric-snr")!.innerText =
          preset.snr;

        getElement("metric-stoi")!.innerText =
          preset.stoi;

        getElement("metric-pesq")!.innerText =
          preset.pesq;

        getElement("tel-harmonic")!.innerText =
          "-34.8 dB";

        getElement(
          "hw-active-name"
        )!.innerText =
          `${preset.id} (Clean Voice)`;

        const crtIndicator =
          getElement("crt-indicator");

        if (crtIndicator) {
          crtIndicator.innerText =
            "CLEAN VOICE ACTIVE";

          crtIndicator.style.color =
            "var(--text-crt)";
        }

        getElement(
          "hw-downlink-mode"
        )!.innerText =
          "STREAMING CLEAN";

        getElement(
          "badge-neural"
        )!.innerText =
          "ACTIVE";

        getElement(
          "badge-nlms"
        )!.innerText =
          "TRACKING";

        getElement<HTMLDivElement>(
          "meter-neural"
        )!.style.width = "75%";

        getElement<HTMLDivElement>(
          "meter-nlms"
        )!.style.width = "25%";

        const now =
          new Date()
            .toTimeString()
            .split(" ")[0];

        auditEvents.unshift({
          time: now,
          event:
            `${preset.id}: Clean Audio Engaged`,
          level: preset.spl,
        });

        renderAuditLogs();
        renderAllPresetUI();

        showToast(
          `Clean Output Active: ${preset.title}`
        );
      } finally {
        isSwitchingTrack = false;
      }
    }

    function renderAllPresetUI() {
      const topContainer =
        getElement("preset-container");

      if (!topContainer) return;

      topContainer.innerHTML = "";

      SOLDIER_PRESETS.forEach((p) => {
        const isActive =
          currentPreset?.id === p.id;

        const card =
          document.createElement("div");

        card.className =
          `preset-card ${isActive ? "active" : ""}`;

        card.setAttribute(
          "role",
          "button"
        );

        card.setAttribute(
          "tabindex",
          "0"
        );

        card.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: baseline;">
            <span class="mono font-bold text-xs">${p.id}</span>
            ${
              isActive
                ? '<span class="badge badge-sky">ACTIVE</span>'
                : ""
            }
          </div>

          <div class="text-xs font-semibold"
            style="color: var(--text-main);">
            ${p.title}
          </div>

          <div class="text-xs"
            style="color: var(--text-muted);">
            ${p.desc}
          </div>
        `;

        card.onclick = () =>
          playCleanAudioSample(p);

        card.onkeydown = (event) => {
          if (
            event.key === "Enter" ||
            event.key === " "
          ) {
            event.preventDefault();
            playCleanAudioSample(p);
          }
        };

        topContainer.appendChild(card);
      });

      const hwStrip =
        getElement("hw-preset-strip");

      if (!hwStrip) return;

      hwStrip.innerHTML = "";

      SOLDIER_PRESETS.forEach((p) => {
        const isActive =
          currentPreset?.id === p.id;

        const btn =
          document.createElement("div");

        btn.className =
          `hw-preset-btn ${isActive ? "active" : ""}`;

        btn.setAttribute(
          "role",
          "button"
        );

        btn.setAttribute(
          "tabindex",
          "0"
        );

        btn.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span class="mono text-xs font-bold"
              style="color: ${
                isActive
                  ? "var(--text-crt)"
                  : "var(--text-main)"
              };">
              ${p.id}
            </span>

            <span class="mono text-xs"
              style="color: var(--status-emerald);">
              ${p.snr}
            </span>
          </div>

          <div class="text-xs font-semibold"
            style="color: var(--text-main);">
            ${p.title.split("(")[0]}
          </div>

          <div class="mono text-xs"
            style="color: var(--text-muted); font-size: 0.65rem;">
            ${p.datasetTag}
          </div>
        `;

        btn.onclick = () =>
          playCleanAudioSample(p);

        btn.onkeydown = (event) => {
          if (
            event.key === "Enter" ||
            event.key === " "
          ) {
            event.preventDefault();
            playCleanAudioSample(p);
          }
        };

        hwStrip.appendChild(btn);
      });
    }

    function updateCrossfadeGains(
      val: number
    ) {
      crossfaderValue = val;

      if (
        !audioCtx ||
        !noisyGain ||
        !cleanGain
      ) {
        return;
      }

      const now =
        audioCtx.currentTime;

      const angle =
        (val / 100) *
        (Math.PI / 2);

      const gainRaw =
        Math.cos(angle);

      const gainClean =
        Math.sin(angle);

      noisyGain.gain.cancelScheduledValues(
        now
      );

      cleanGain.gain.cancelScheduledValues(
        now
      );

      noisyGain.gain.setValueAtTime(
        gainRaw,
        now
      );

      cleanGain.gain.setValueAtTime(
        gainClean,
        now
      );

      const label =
        getElement("crossfader-label");

      if (!label) return;

      if (val === 0) {
        label.innerText =
          "Raw Noise (0% Cancelled)";

        label.style.color =
          "var(--status-amber)";
      } else if (val === 100) {
        label.innerText =
          "Live Crossfader: 100% Enhanced (Clean Voice Active)";

        label.style.color =
          "var(--status-emerald)";
      } else {
        label.innerText =
          `Blend: ${100 - val}% Raw / ${val}% Clean Voice`;

        label.style.color =
          "var(--status-sky)";
      }
    }

    async function togglePipeline() {
      await initAudioEngine();

      const btn =
        getElement<HTMLButtonElement>(
          "btn-pipeline"
        );

      const badge =
        getElement("pipeline-status-badge");

      if (!btn || !badge) return;

      if (isPipelineRunning) {
        await fadeOutAndStop();

        isPipelineRunning = false;

        btn.innerText =
          "ENGAGE PIPELINE";

        btn.className =
          "btn btn-engage";

        badge.innerText =
          "PAUSED";

        badge.className =
          "badge badge-rose";

        showToast(
          "Audio playback paused."
        );
      } else {
        await playCleanAudioSample(
          currentPreset ||
            SOLDIER_PRESETS[0]
        );
      }
    }

    function renderWaveforms() {
      const cRaw =
        getElement<HTMLCanvasElement>(
          "canvas-raw"
        );

      const cEnh =
        getElement<HTMLCanvasElement>(
          "canvas-enhanced"
        );

      const cCrt =
        getElement<HTMLCanvasElement>(
          "canvas-hw-crt"
        );

      if (
        cRaw &&
        cEnh &&
        cCrt
      ) {
        const ctxRaw =
          cRaw.getContext("2d");

        const ctxEnh =
          cEnh.getContext("2d");

        const ctxCrt =
          cCrt.getContext("2d");

        if (
          ctxRaw &&
          ctxEnh &&
          ctxCrt
        ) {
          const wR =
            cRaw.width;

          const hR =
            cRaw.height;

          const midR =
            hR / 2;

          const wE =
            cEnh.width;

          const hE =
            cEnh.height;

          const midE =
            hE / 2;

          const wC =
            cCrt.width;

          const hC =
            cCrt.height;

          const midC =
            hC / 2;

          ctxRaw.clearRect(
            0,
            0,
            wR,
            hR
          );

          ctxEnh.clearRect(
            0,
            0,
            wE,
            hE
          );

          ctxCrt.fillStyle =
            "rgba(5, 10, 8, 0.35)";

          ctxCrt.fillRect(
            0,
            0,
            wC,
            hC
          );

          ctxRaw.strokeStyle =
            "#121b2a";

          ctxRaw.beginPath();
          ctxRaw.moveTo(
            0,
            midR
          );
          ctxRaw.lineTo(
            wR,
            midR
          );
          ctxRaw.stroke();

          ctxEnh.strokeStyle =
            "#121b2a";

          ctxEnh.beginPath();
          ctxEnh.moveTo(
            0,
            midE
          );
          ctxEnh.lineTo(
            wE,
            midE
          );
          ctxEnh.stroke();

          ctxCrt.strokeStyle =
            "#0e251b";

          ctxCrt.beginPath();
          ctxCrt.moveTo(
            0,
            midC
          );
          ctxCrt.lineTo(
            wC,
            midC
          );
          ctxCrt.stroke();

          if (
            isPipelineRunning &&
            analyserRaw &&
            analyserEnh
          ) {
            analyserRaw.getByteTimeDomainData(
              rawByteData
            );

            analyserEnh.getByteTimeDomainData(
              enhByteData
            );

            ctxRaw.strokeStyle =
              "#f59e0b";

            ctxRaw.lineWidth = 1.6;

            ctxRaw.beginPath();

            const sliceR =
              wR /
              rawByteData.length;

            for (
              let i = 0;
              i < rawByteData.length;
              i++
            ) {
              const y =
                (rawByteData[i] /
                  128.0) *
                midR;

              if (i === 0) {
                ctxRaw.moveTo(
                  i * sliceR,
                  y
                );
              } else {
                ctxRaw.lineTo(
                  i * sliceR,
                  y
                );
              }
            }

            ctxRaw.stroke();

            ctxEnh.strokeStyle =
              "#10b981";

            ctxEnh.lineWidth = 1.8;

            ctxEnh.beginPath();

            const sliceE =
              wE /
              enhByteData.length;

            for (
              let i = 0;
              i < enhByteData.length;
              i++
            ) {
              const blended =
                rawByteData[i] *
                  (1 -
                    crossfaderValue /
                      100) +
                enhByteData[i] *
                  (crossfaderValue /
                    100);

              const y =
                (blended /
                  128.0) *
                midE;

              if (i === 0) {
                ctxEnh.moveTo(
                  i * sliceE,
                  y
                );
              } else {
                ctxEnh.lineTo(
                  i * sliceE,
                  y
                );
              }
            }

            ctxEnh.stroke();

            ctxCrt.strokeStyle =
              "#34d399";

            ctxCrt.lineWidth = 1.9;

            ctxCrt.shadowColor =
              "#34d399";

            ctxCrt.shadowBlur = 6;

            ctxCrt.beginPath();

            const sliceC =
              wC /
              enhByteData.length;

            for (
              let i = 0;
              i < enhByteData.length;
              i++
            ) {
              const blended =
                rawByteData[i] *
                  (1 -
                    crossfaderValue /
                      100) +
                enhByteData[i] *
                  (crossfaderValue /
                    100);

              const y =
                (blended /
                  128.0) *
                midC;

              if (i === 0) {
                ctxCrt.moveTo(
                  i * sliceC,
                  y
                );
              } else {
                ctxCrt.lineTo(
                  i * sliceC,
                  y
                );
              }
            }

            ctxCrt.stroke();

            ctxCrt.shadowBlur = 0;

            const rawV =
              Math.abs(
                rawByteData[10] -
                  128
              ) / 128;

            const cleanV =
              Math.abs(
                enhByteData[10] -
                  128
              ) / 128;

            const rawNeedle =
              getElement(
                "hw-needle-raw"
              );

            const cleanNeedle =
              getElement(
                "hw-needle-clean"
              );

            if (rawNeedle) {
              rawNeedle.style.transform =
                `rotate(${-45 + rawV * 85}deg)`;
            }

            if (cleanNeedle) {
              cleanNeedle.style.transform =
                `rotate(${-45 + cleanV * 80}deg)`;
            }
          } else {
            getElement(
              "hw-needle-raw"
            )!.style.transform =
              "rotate(-45deg)";

            getElement(
              "hw-needle-clean"
            )!.style.transform =
              "rotate(-45deg)";
          }
        }
      }

      animationFrameId =
        requestAnimationFrame(
          renderWaveforms
        );
    }

    function initCanvasSizes() {
      const resize = () => {
        [
          "canvas-raw",
          "canvas-enhanced",
          "canvas-hw-crt",
        ].forEach((id) => {
          const c =
            getElement<HTMLCanvasElement>(
              id
            );

          if (c) {
            c.width =
              c.clientWidth;

            c.height =
              c.clientHeight;
          }
        });
      };

      window.addEventListener(
        "resize",
        resize
      );

      resize();

      return () => {
        window.removeEventListener(
          "resize",
          resize
        );
      };
    }

    function attachKnobDrag(
      knobId: string,
      onDelta: (angle: number) => void
    ) {
      const knob =
        getElement<HTMLDivElement>(
          knobId
        );

      if (!knob) return () => {};

      let startY = 0;
      let curAngle =
        knobId === "dial-notch"
          ? 15
          : 0;

      const onMouseDown = (
        e: MouseEvent
      ) => {
        startY = e.clientY;

        const onMouseMove = (
          ev: MouseEvent
        ) => {
          const dy =
            (startY -
              ev.clientY) *
            1.5;

          const angle =
            Math.max(
              -135,
              Math.min(
                135,
                curAngle + dy
              )
            );

          knob.style.transform =
            `rotate(${angle}deg)`;

          onDelta(angle);
        };

        const onMouseUp = (
          ev: MouseEvent
        ) => {
          curAngle =
            Math.max(
              -135,
              Math.min(
                135,
                curAngle +
                  (startY -
                    ev.clientY) *
                    1.5
              )
            );

          window.removeEventListener(
            "mousemove",
            onMouseMove
          );

          window.removeEventListener(
            "mouseup",
            onMouseUp
          );
        };

        window.addEventListener(
          "mousemove",
          onMouseMove
        );

        window.addEventListener(
          "mouseup",
          onMouseUp
        );
      };

      knob.addEventListener(
        "mousedown",
        onMouseDown
      );

      return () => {
        knob.removeEventListener(
          "mousedown",
          onMouseDown
        );
      };
    }

    function startTelemetryJitter() {
      const interval =
        window.setInterval(() => {
          if (!isPipelineRunning) {
            return;
          }

          const latency =
            (
              7.6 +
              Math.random() * 0.5
            ).toFixed(1);

          const power =
            (
              8.2 +
              Math.random() * 0.4
            ).toFixed(1);

          const volt =
            (
              12.02 +
              Math.random() * 0.05
            ).toFixed(2);

          const temp =
            (
              42.2 +
              Math.random() * 0.7
            ).toFixed(1);

          getElement(
            "tel-latency"
          )!.innerText =
            `${latency} ms`;

          getElement(
            "metric-inference"
          )!.innerText =
            `${latency} ms`;

          getElement(
            "tel-power"
          )!.innerText =
            `${power} W`;

          getElement(
            "hw-rail"
          )!.innerText =
            `${volt} V`;

          getElement(
            "hw-temp"
          )!.innerText =
            `${temp} °C`;
        }, 1400);

      return () =>
        clearInterval(interval);
    }

    function renderAuditLogs() {
      const tbody =
        getElement("audit-log-body");

      if (!tbody) return;

      tbody.innerHTML = "";

      auditEvents
        .slice(0, 8)
        .forEach((entry) => {
          const tr =
            document.createElement("tr");

          tr.innerHTML = `
            <td>${entry.time}</td>
            <td>${entry.event}</td>
            <td style="text-align: right;" class="mono">
              ${entry.level}
            </td>
          `;

          tbody.appendChild(tr);
        });
    }

    function exportAuditCSV() {
      let csv =
        "data:text/csv;charset=utf-8,TIMESTAMP,EVENT_TYPE,ACOUSTIC_LEVEL\r\n";

      auditEvents.forEach((row) => {
        csv += `${row.time},"${row.event.replaceAll(
          '"',
          '""'
        )}",${row.level}\r\n`;
      });

      const uri =
        encodeURI(csv);

      const link =
        document.createElement("a");

      link.setAttribute(
        "href",
        uri
      );

      link.setAttribute(
        "download",
        `Soldier_AI_ANC_${Date.now()}.csv`
      );

      document.body.appendChild(
        link
      );

      link.click();

      document.body.removeChild(
        link
      );

      showToast(
        "Audit telemetry buffer exported."
      );
    }

    function showToast(msg: string) {
      const t =
        getElement("toast");

      if (!t) return;

      t.innerText = msg;
      t.style.display = "block";

      window.setTimeout(() => {
        t.style.display = "none";
      }, 2500);
    }

    function setupEventListeners() {
      const pipelineBtn =
        getElement<HTMLButtonElement>(
          "btn-pipeline"
        );

      pipelineBtn?.addEventListener(
        "click",
        () => {
          void togglePipeline();
        }
      );

      const crossfader =
        getElement<HTMLInputElement>(
          "slider-crossfader"
        );

      crossfader?.addEventListener(
        "input",
        () => {
          updateCrossfadeGains(
            Number(
              crossfader.value
            )
          );
        }
      );

      const fusion =
        getElement<HTMLInputElement>(
          "slider-fusion"
        );

      fusion?.addEventListener(
        "input",
        () => {
          const neuralVal =
            Number(
              fusion.value
            );

          const nlmsVal =
            100 - neuralVal;

          getElement(
            "fusion-ratio-label"
          )!.innerText =
            `${neuralVal}% Neural / ${nlmsVal}% NLMS`;

          getElement<HTMLDivElement>(
            "meter-neural"
          )!.style.width =
            `${neuralVal}%`;

          getElement<HTMLDivElement>(
            "meter-nlms"
          )!.style.width =
            `${nlmsVal}%`;
        }
      );

      const stepSize =
        getElement<HTMLInputElement>(
          "slider-step-size"
        );

      stepSize?.addEventListener(
        "input",
        () => {
          getElement(
            "step-size-label"
          )!.innerText =
            Number(
              stepSize.value
            ).toFixed(3);
        }
      );

      const exportBtn =
        getElement<HTMLButtonElement>(
          "btn-export-csv"
        );

      exportBtn?.addEventListener(
        "click",
        exportAuditCSV
      );

      const toneBtn =
        getElement<HTMLButtonElement>(
          "btn-hw-tone"
        );

      toneBtn?.addEventListener(
        "click",
        async () => {
          await initAudioEngine();

          if (!audioCtx) return;

          const osc =
            audioCtx.createOscillator();

          const g =
            audioCtx.createGain();

          osc.frequency.value =
            1000;

          g.gain.value =
            0.12;

          osc.connect(g);
          g.connect(
            audioCtx.destination
          );

          osc.start();

          osc.stop(
            audioCtx.currentTime +
              0.5
          );

          showToast(
            "Injected 1 kHz radio squelch tone."
          );
        }
      );
    }

    renderAllPresetUI();
    resetChartsToZero();

    setupEventListeners();

    const cleanupResize =
      initCanvasSizes();

    const cleanupTelemetry =
      startTelemetryJitter();

    const cleanupTrim =
      attachKnobDrag(
        "dial-trim",
        (angle) => {
          const db =
            (
              (angle / 135) *
              12
            ).toFixed(1);

          getElement(
            "readout-trim"
          )!.innerText =
            `${Number(db) >= 0 ? "+" : ""}${db} dB`;
        }
      );

    const cleanupNotch =
      attachKnobDrag(
        "dial-notch",
        (angle) => {
          const q =
            (
              1.4 +
              (angle / 135) *
                0.7
            ).toFixed(2);

          getElement(
            "readout-notch"
          )!.innerText =
            q;
        }
      );

    renderWaveforms();

    return () => {
      if (
        animationFrameId !== null
      ) {
        cancelAnimationFrame(
          animationFrameId
        );
      }

      cleanupResize();
      cleanupTelemetry();
      cleanupTrim();
      cleanupNotch();

      immediateStopPlayback();

      if (audioCtx) {
        void audioCtx.close();
        audioCtx = null;
      }

      root.innerHTML = "";
    };
  }, []);

  return <div id="app-root" />;
}