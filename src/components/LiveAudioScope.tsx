import React, { useEffect, useRef, useState } from 'react';
import { Radio, Volume2, VolumeX, Bell, Play, Square, RefreshCw, Activity } from 'lucide-react';
import { LocalNodeConfig } from '../types';
import { soundEngine } from '../utils/audioSynthesizer';

interface LiveAudioScopeProps {
  localConfig: LocalNodeConfig;
  onUpdateConfig: (config: Partial<LocalNodeConfig>) => void;
  isReceiving: boolean;
  isTransmitting: boolean;
  onTestTxToggle: () => void;
}

export const LiveAudioScope: React.FC<LiveAudioScopeProps> = ({
  localConfig,
  onUpdateConfig,
  isReceiving,
  isTransmitting,
  onTestTxToggle,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [signalStrength, setSignalStrength] = useState<number>(85);

  // Simulated S-Meter & Audio Oscilloscope loop
  useEffect(() => {
    let animationFrameId: number;
    let phase = 0;

    const render = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const width = canvas.width;
          const height = canvas.height;

          // Clear with deep obsidian
          ctx.fillStyle = '#0a0d12';
          ctx.fillRect(0, 0, width, height);

          // Grid lines
          ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
          ctx.lineWidth = 1;

          // Horizontal grid lines
          for (let y = 0; y < height; y += 20) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
          }

          // Vertical grid lines
          for (let x = 0; x < width; x += 30) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
          }

          // Center baseline
          ctx.strokeStyle = 'rgba(71, 85, 105, 0.6)';
          ctx.beginPath();
          ctx.moveTo(0, height / 2);
          ctx.lineTo(width, height / 2);
          ctx.stroke();

          // Active signal waveform
          const isActive = isReceiving || isTransmitting || isPlayingAudio;
          const waveColor = isTransmitting 
            ? '#f87171' 
            : isReceiving 
              ? '#34d399' 
              : '#06b6d4';

          ctx.lineWidth = 2;
          ctx.strokeStyle = waveColor;
          ctx.shadowBlur = 8;
          ctx.shadowColor = waveColor;

          ctx.beginPath();
          const numPoints = width;
          const baseAmp = isActive ? (height / 2.8) : 3;

          for (let i = 0; i < numPoints; i++) {
            const x = i;
            const freq1 = 0.05;
            const freq2 = 0.12;
            const noise = (Math.random() - 0.5) * (isActive ? 8 : 2);
            
            const y = (height / 2) + Math.sin(i * freq1 + phase) * (baseAmp * 0.7)
              + Math.sin(i * freq2 - phase * 1.5) * (baseAmp * 0.3)
              + noise;

            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
          ctx.stroke();
          ctx.shadowBlur = 0; // reset
        }
      }

      phase += 0.1;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isReceiving, isTransmitting, isPlayingAudio]);

  // Fluctuating realistic signal S-Meter
  useEffect(() => {
    const interval = setInterval(() => {
      if (isReceiving) {
        setSignalStrength(82 + Math.floor(Math.random() * 15));
      } else if (isTransmitting) {
        setSignalStrength(98);
      } else {
        setSignalStrength(15 + Math.floor(Math.random() * 10));
      }
    }, 400);

    return () => clearInterval(interval);
  }, [isReceiving, isTransmitting]);

  // Calculate S-Units based on 0-100%
  const getSUnits = (pct: number) => {
    if (pct < 20) return 'S2';
    if (pct < 35) return 'S5';
    if (pct < 50) return 'S7';
    if (pct < 70) return 'S9';
    if (pct < 85) return 'S9+10dB';
    if (pct < 95) return 'S9+20dB';
    return 'S9+30dB';
  };

  const handleToggleAudio = () => {
    const next = !isPlayingAudio;
    setIsPlayingAudio(next);
    if (next) {
      soundEngine.playSquelchTail();
    } else {
      soundEngine.playRogerBeep();
    }
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-xl text-neutral-200">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-3 border-b border-neutral-800">
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-emerald-400" />
          <h2 className="text-sm font-semibold tracking-wide uppercase text-neutral-100">
            Audio Spectrum & RF Signal Telemetry
          </h2>
        </div>

        <div className="flex items-center gap-3">
          {/* Audio stream toggle */}
          <button
            id="scope-stream-toggle"
            onClick={handleToggleAudio}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-all border ${
              isPlayingAudio
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/60 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-700'
            }`}
          >
            {isPlayingAudio ? (
              <>
                <Square className="w-3 h-3 fill-current" />
                <span>Stop Stream</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-current" />
                <span>Monitor Stream</span>
              </>
            )}
          </button>

          {/* Test PTT button */}
          <button
            id="scope-ptt-toggle"
            onClick={onTestTxToggle}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-all border ${
              isTransmitting
                ? 'bg-red-600 text-white border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.4)] animate-pulse'
                : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:text-red-400 hover:border-red-900'
            }`}
          >
            <Radio className="w-3 h-3" />
            <span>{isTransmitting ? 'TRANSMITTING' : 'Test PTT'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Visualizer Canvas */}
        <div className="lg:col-span-2 relative bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden p-1 shadow-inner">
          <canvas
            ref={canvasRef}
            width={600}
            height={130}
            className="w-full h-[120px] rounded-lg block"
          />

          {/* Overlay info badges */}
          <div className="absolute top-2.5 left-3 flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-black/60 border border-neutral-700/60 text-neutral-300 backdrop-blur">
              {isTransmitting ? 'TX Carrier Active' : isReceiving ? 'RX Audio Ingest' : 'Squelch Muted'}
            </span>
            <span className="text-[10px] font-mono text-neutral-400">
              48.0 kHz / 16-Bit PCM
            </span>
          </div>

          <div className="absolute top-2.5 right-3">
            <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border ${
              isTransmitting 
                ? 'bg-red-950/80 border-red-700 text-red-300' 
                : isReceiving 
                  ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300' 
                  : 'bg-neutral-900/80 border-neutral-700 text-neutral-400'
            }`}>
              {getSUnits(signalStrength)}
            </span>
          </div>
        </div>

        {/* RF Signal S-Meter Bar & Audio Controls */}
        <div className="flex flex-col justify-between space-y-3 bg-neutral-950/60 border border-neutral-800 rounded-xl p-3">
          {/* Precision S-Meter LED Bar */}
          <div>
            <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 mb-1">
              <span>S1 S3 S5 S7 S9</span>
              <span className="text-red-400">+10 +20 +30dB</span>
            </div>
            
            <div className="w-full h-3.5 bg-neutral-900 border border-neutral-700 rounded overflow-hidden flex p-0.5 gap-0.5">
              {Array.from({ length: 24 }).map((_, idx) => {
                const threshold = (idx / 24) * 100;
                const isLit = signalStrength >= threshold;
                const isRedZone = idx >= 17; // over S9
                const isYellowZone = idx >= 12 && idx < 17; // S7-S9

                return (
                  <div
                    key={idx}
                    className={`flex-1 rounded-[1px] transition-colors duration-100 ${
                      !isLit
                        ? 'bg-neutral-800/40'
                        : isRedZone
                          ? 'bg-red-500 shadow-[0_0_6px_#ef4444]'
                          : isYellowZone
                            ? 'bg-amber-400 shadow-[0_0_5px_#f59e0b]'
                            : 'bg-emerald-400 shadow-[0_0_5px_#10b981]'
                    }`}
                  />
                );
              })}
            </div>
            <div className="flex justify-between text-[10px] font-mono text-neutral-500 mt-1">
              <span>Signal: {signalStrength}%</span>
              <span>Level: {getSUnits(signalStrength)}</span>
            </div>
          </div>

          {/* Roger Beep & Squelch Sliders */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-neutral-900/90 border border-neutral-800 rounded-lg p-2 flex items-center justify-between">
              <span className="text-neutral-300 text-[11px]">Roger Beep</span>
              <button
                id="scope-roger-toggle"
                onClick={() => {
                  const next = !localConfig.rogerBeep;
                  onUpdateConfig({ rogerBeep: next });
                  if (next) soundEngine.playRogerBeep();
                }}
                className={`w-7 h-4 rounded-full p-0.5 transition-colors ${
                  localConfig.rogerBeep ? 'bg-emerald-500' : 'bg-neutral-700'
                }`}
              >
                <div
                  className={`w-3 h-3 rounded-full bg-white transition-transform ${
                    localConfig.rogerBeep ? 'translate-x-3' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="bg-neutral-900/90 border border-neutral-800 rounded-lg p-2 flex items-center justify-between">
              <span className="text-neutral-300 text-[11px]">Courtesy Tone</span>
              <button
                id="scope-courtesy-test"
                onClick={() => soundEngine.playConnectChime()}
                title="Test Telemetry Tone"
                className="p-1 text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                <Bell className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Squelch slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-mono text-neutral-400">
              <span>Squelch Threshold</span>
              <span className="text-emerald-400">{localConfig.squelchLevel}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={localConfig.squelchLevel}
              onChange={(e) => onUpdateConfig({ squelchLevel: Number(e.target.value) })}
              className="w-full h-1.5 accent-emerald-500 bg-neutral-800 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
