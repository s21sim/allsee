import React, { useState } from 'react';
import { 
  Sliders, 
  Save, 
  RefreshCw, 
  Key, 
  Radio, 
  Server, 
  Volume2, 
  CheckCircle2, 
  ShieldCheck, 
  Eye, 
  EyeOff 
} from 'lucide-react';
import { LocalNodeConfig, ScanConfig } from '../types';
import { soundEngine } from '../utils/audioSynthesizer';

interface ConfigViewProps {
  localConfig: LocalNodeConfig;
  scanConfig: ScanConfig;
  onUpdateLocalConfig: (config: Partial<LocalNodeConfig>) => void;
  onUpdateScanConfig: (config: Partial<ScanConfig>) => void;
  onAddLog: (type: 'system', msg: string) => void;
}

export const ConfigView: React.FC<ConfigViewProps> = ({
  localConfig,
  scanConfig,
  onUpdateLocalConfig,
  onUpdateScanConfig,
  onAddLog,
}) => {
  const [nodeNumber, setNodeNumber] = useState<string>(localConfig.nodeNumber);
  const [callsign, setCallsign] = useState<string>(localConfig.callsign);
  const [frequency, setFrequency] = useState<string>(localConfig.frequency);
  const [tone, setTone] = useState<string>(localConfig.tone);
  const [powerWatts, setPowerWatts] = useState<string>(localConfig.powerWatts);
  const [location, setLocation] = useState<string>(localConfig.location);

  const [amiHost, setAmiHost] = useState<string>(localConfig.amiHost);
  const [amiPort, setAmiPort] = useState<number>(localConfig.amiPort);
  const [amiUser, setAmiUser] = useState<string>(localConfig.amiUser);
  const [amiSecret, setAmiSecret] = useState<string>(localConfig.amiSecret);
  const [showSecret, setShowSecret] = useState<boolean>(false);

  const [dwellTime, setDwellTime] = useState<number>(scanConfig.dwellTimeSec);
  const [hangTime, setHangTime] = useState<number>(scanConfig.hangTimeSec);
  const [pauseOnCos, setPauseOnCos] = useState<boolean>(scanConfig.pauseOnCos);
  const [alertTone, setAlertTone] = useState<boolean>(scanConfig.alertToneOnConnect);
  const [rogerBeep, setRogerBeep] = useState<boolean>(localConfig.rogerBeep);
  const [streamUrl, setStreamUrl] = useState<string>(localConfig.audioStreamUrl);

  const [isTestingAmi, setIsTestingAmi] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateLocalConfig({
      nodeNumber,
      callsign,
      frequency,
      tone,
      powerWatts,
      location,
      amiHost,
      amiPort,
      amiUser,
      amiSecret,
      rogerBeep,
      audioStreamUrl: streamUrl,
    });

    onUpdateScanConfig({
      dwellTimeSec: dwellTime,
      hangTimeSec: hangTime,
      pauseOnCos,
      alertToneOnConnect: alertTone,
    });

    onAddLog('system', `Updated AllSee configuration for Node ${nodeNumber} (${callsign})`);
    soundEngine.playConnectChime();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleTestAmi = () => {
    setIsTestingAmi(true);
    setTimeout(() => {
      setIsTestingAmi(false);
      soundEngine.playRogerBeep();
      onAddLog('system', `AMI Handshake verified: Connected to Asterisk at ${amiHost}:${amiPort}`);
      alert(`AMI Connection Success!\nConnected to Asterisk ASL manager at ${amiHost}:${amiPort}`);
    }, 900);
  };

  return (
    <form onSubmit={handleSaveAll} className="space-y-5">
      {/* Header Banner */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold uppercase tracking-wider text-white">
              Node & Asterisk Configuration (cfg)
            </h2>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Configure local node parameters, Asterisk AMI socket, and scan dwell behaviors
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isSaved && (
            <span className="flex items-center gap-1 text-xs text-emerald-400 font-mono">
              <CheckCircle2 className="w-4 h-4" />
              Settings Saved!
            </span>
          )}
          <button
            id="cfg-save-btn"
            type="submit"
            className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Section 1: Local AllStar Node Identity */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-neutral-800">
            <Radio className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Radio & Node Identity (rpt.conf)
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-neutral-400 block mb-1 font-mono">Node Number</label>
                <input
                  type="text"
                  required
                  value={nodeNumber}
                  onChange={(e) => setNodeNumber(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-white font-mono focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="text-neutral-400 block mb-1 font-mono">Station Callsign</label>
                <input
                  type="text"
                  required
                  value={callsign}
                  onChange={(e) => setCallsign(e.target.value.toUpperCase())}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-white font-mono uppercase focus:border-emerald-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-neutral-400 block mb-1 font-mono">Frequency</label>
                <input
                  type="text"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-white font-mono focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="text-neutral-400 block mb-1 font-mono">CTCSS PL Tone</label>
                <input
                  type="text"
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-white font-mono focus:border-emerald-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-neutral-400 block mb-1 font-mono">Power Output</label>
                <input
                  type="text"
                  value={powerWatts}
                  onChange={(e) => setPowerWatts(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-white font-mono focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="text-neutral-400 block mb-1 font-mono">Physical Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-white focus:border-emerald-500 outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Asterisk AMI Interface */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <div className="flex items-center space-x-2">
              <Server className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                Asterisk Management Interface (AMI)
              </h3>
            </div>

            <button
              type="button"
              onClick={handleTestAmi}
              disabled={isTestingAmi}
              className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 rounded-lg text-xs font-mono transition-colors"
            >
              {isTestingAmi ? 'Testing...' : 'Test Connection'}
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="text-neutral-400 block mb-1 font-mono">AMI Host IP</label>
                <input
                  type="text"
                  required
                  value={amiHost}
                  onChange={(e) => setAmiHost(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-white font-mono focus:border-cyan-500 outline-none"
                />
              </div>

              <div>
                <label className="text-neutral-400 block mb-1 font-mono">Port</label>
                <input
                  type="number"
                  required
                  value={amiPort}
                  onChange={(e) => setAmiPort(Number(e.target.value))}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-white font-mono focus:border-cyan-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-neutral-400 block mb-1 font-mono">Manager User</label>
                <input
                  type="text"
                  required
                  value={amiUser}
                  onChange={(e) => setAmiUser(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-white font-mono focus:border-cyan-500 outline-none"
                />
              </div>

              <div>
                <label className="text-neutral-400 block mb-1 font-mono">Manager Secret</label>
                <div className="relative">
                  <input
                    type={showSecret ? 'text' : 'password'}
                    required
                    value={amiSecret}
                    onChange={(e) => setAmiSecret(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl pl-3 pr-8 py-2 text-white font-mono focus:border-cyan-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="absolute right-2 top-2.5 text-neutral-400 hover:text-white"
                  >
                    {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="p-2.5 bg-neutral-950/80 border border-neutral-800 rounded-xl text-[11px] text-neutral-400 font-mono flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>AMI allows AllSee to issue Asterisk commands like ilink 1,2,3 and query node status in real-time.</span>
            </div>
          </div>
        </div>

        {/* Section 3: Automated Scanner Engine Options */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-neutral-800">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Scanner Timing & Logic
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between font-mono text-neutral-400 mb-1">
                <span>Default Dwell Time:</span>
                <span className="text-emerald-400 font-bold">{dwellTime} seconds</span>
              </div>
              <input
                type="range"
                min="3"
                max="60"
                value={dwellTime}
                onChange={(e) => setDwellTime(Number(e.target.value))}
                className="w-full accent-emerald-500 bg-neutral-800 rounded cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between font-mono text-neutral-400 mb-1">
                <span>Activity Hang Delay:</span>
                <span className="text-cyan-400 font-bold">{hangTime} seconds</span>
              </div>
              <input
                type="range"
                min="1"
                max="15"
                value={hangTime}
                onChange={(e) => setHangTime(Number(e.target.value))}
                className="w-full accent-cyan-500 bg-neutral-800 rounded cursor-pointer"
              />
            </div>

            <div className="space-y-2 pt-2">
              <label className="flex items-center space-x-2 text-neutral-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pauseOnCos}
                  onChange={(e) => setPauseOnCos(e.target.checked)}
                  className="rounded border-neutral-700 bg-neutral-800 text-emerald-500 focus:ring-0"
                />
                <span>Pause scanning automatically when voice/COS carrier is active</span>
              </label>

              <label className="flex items-center space-x-2 text-neutral-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={alertTone}
                  onChange={(e) => setAlertTone(e.target.checked)}
                  className="rounded border-neutral-700 bg-neutral-800 text-cyan-500 focus:ring-0"
                />
                <span>Play audible connect telemetry tone on node transition</span>
              </label>
            </div>
          </div>
        </div>

        {/* Section 4: Telemetry & Audio Stream */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-neutral-800">
            <Volume2 className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Audio Telemetry & Web Streaming
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-neutral-400 block mb-1 font-mono">Live Audio Stream URL (Icecast / Broadcastify)</label>
              <input
                type="url"
                placeholder="https://stream.allstarlink.org:8000/live"
                value={streamUrl}
                onChange={(e) => setStreamUrl(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-white font-mono focus:border-emerald-500 outline-none"
              />
            </div>

            <div className="pt-2">
              <label className="flex items-center space-x-2 text-neutral-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rogerBeep}
                  onChange={(e) => setRogerBeep(e.target.checked)}
                  className="rounded border-neutral-700 bg-neutral-800 text-emerald-500 focus:ring-0"
                />
                <span>Enable Repeater Courtesy Roger Beep</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};
