import React, { useState } from 'react';
import { 
  Cpu, 
  Wifi, 
  WifiOff, 
  HardDrive, 
  Server, 
  RefreshCw, 
  Power, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Activity,
  Radio,
  Clock,
  Network
} from 'lucide-react';
import { SystemStats } from '../types';
import { soundEngine } from '../utils/audioSynthesizer';

interface SystemStatsViewProps {
  stats: SystemStats;
  onUpdateStats: (partial: Partial<SystemStats>) => void;
  onAddLog: (type: 'system', msg: string) => void;
}

export const SystemStatsView: React.FC<SystemStatsViewProps> = ({
  stats,
  onUpdateStats,
  onAddLog,
}) => {
  const [confirmReboot, setConfirmReboot] = useState<boolean>(false);
  const [confirmPowerOff, setConfirmPowerOff] = useState<boolean>(false);
  const [isReloadingAsterisk, setIsReloadingAsterisk] = useState<boolean>(false);
  const [isPinging, setIsPinging] = useState<boolean>(false);

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hrs = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${days}d ${hrs}h ${mins}m ${secs}s`;
  };

  const handleToggleWifi = () => {
    const nextState = !stats.wifiEnabled;
    onUpdateStats({ wifiEnabled: nextState });
    onAddLog('system', `WiFi interface ${nextState ? 'mlan0 brought UP' : 'mlan0 brought DOWN'}`);
    if (nextState) soundEngine.playConnectChime();
    else soundEngine.playDisconnectChime();
  };

  const handleReloadAsterisk = () => {
    setIsReloadingAsterisk(true);
    soundEngine.playRogerBeep();
    setTimeout(() => {
      setIsReloadingAsterisk(false);
      onAddLog('system', 'Asterisk ASL3 service configuration reloaded successfully');
    }, 1200);
  };

  const handlePingTest = () => {
    setIsPinging(true);
    setTimeout(() => {
      const newPing = 18 + Math.floor(Math.random() * 20);
      onUpdateStats({ lastPingMs: newPing });
      setIsPinging(false);
      onAddLog('system', `Network ping to gateway: ${newPing}ms`);
    }, 800);
  };

  const handleReboot = () => {
    onAddLog('system', 'System reboot command initiated (/sbin/reboot)');
    setConfirmReboot(false);
    soundEngine.playDisconnectChime();
    alert('System reboot command sent. Node will restart shortly.');
  };

  const handlePowerOff = () => {
    onAddLog('system', 'System shutdown command initiated (/sbin/poweroff)');
    setConfirmPowerOff(false);
    soundEngine.playDisconnectChime();
    alert('System power-off command sent. Node will shut down safely.');
  };

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Server className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold uppercase tracking-wider text-white">
              Node Hardware & System Diagnostics
            </h2>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Real-time Raspberry Pi / host telemetry, network status, and Asterisk services
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-reload-asterisk"
            onClick={handleReloadAsterisk}
            disabled={isReloadingAsterisk}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800/60 rounded-lg transition-colors"
            title="Reload rpt.conf and extensions.conf in Asterisk"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isReloadingAsterisk ? 'animate-spin' : ''}`} />
            <span>Reload Asterisk</span>
          </button>
        </div>
      </div>

      {/* Main Stats 4-Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CPU Temp */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-mono mb-2">
            <span>CPU Temperature</span>
            <Cpu className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-mono font-bold text-white">
              {stats.cpuTempC.toFixed(1)}°C
            </span>
            <span className="text-xs text-neutral-500 font-mono">
              ({(stats.cpuTempC * 1.8 + 32).toFixed(1)}°F)
            </span>
          </div>
          <div className="w-full h-2 bg-neutral-950 rounded-full border border-neutral-800 mt-3 overflow-hidden">
            <div
              className={`h-full ${
                stats.cpuTempC > 70
                  ? 'bg-red-500'
                  : stats.cpuTempC > 55
                    ? 'bg-amber-400'
                    : 'bg-emerald-400'
              }`}
              style={{ width: `${Math.min(100, (stats.cpuTempC / 85) * 100)}%` }}
            />
          </div>
          <span className="text-[10px] text-neutral-500 font-mono mt-1 block">
            Status: Thermal Normal (&lt;70°C)
          </span>
        </div>

        {/* CPU Usage */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-mono mb-2">
            <span>CPU Processor Load</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-mono font-bold text-white">
              {stats.cpuUsagePct}%
            </span>
            <span className="text-xs text-emerald-400 font-mono">Quad-Core</span>
          </div>
          <div className="w-full h-2 bg-neutral-950 rounded-full border border-neutral-800 mt-3 overflow-hidden">
            <div
              className="h-full bg-cyan-400"
              style={{ width: `${stats.cpuUsagePct}%` }}
            />
          </div>
          <span className="text-[10px] text-neutral-500 font-mono mt-1 block">
            DSP & Audio Codec: Nominal
          </span>
        </div>

        {/* RAM Memory */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-mono mb-2">
            <span>RAM Memory Usage</span>
            <HardDrive className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-mono font-bold text-white">
              {stats.memUsagePct}%
            </span>
            <span className="text-xs text-neutral-500 font-mono">
              {stats.memUsedMb} / {stats.memTotalMb} MB
            </span>
          </div>
          <div className="w-full h-2 bg-neutral-950 rounded-full border border-neutral-800 mt-3 overflow-hidden">
            <div
              className="h-full bg-purple-400"
              style={{ width: `${stats.memUsagePct}%` }}
            />
          </div>
          <span className="text-[10px] text-neutral-500 font-mono mt-1 block">
            Free RAM: {stats.memTotalMb - stats.memUsedMb} MB
          </span>
        </div>

        {/* Disk Space */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-mono mb-2">
            <span>MicroSD / Disk Storage</span>
            <HardDrive className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-mono font-bold text-white">
              {stats.diskUsagePct}%
            </span>
            <span className="text-xs text-neutral-500 font-mono">32GB eMMC</span>
          </div>
          <div className="w-full h-2 bg-neutral-950 rounded-full border border-neutral-800 mt-3 overflow-hidden">
            <div
              className="h-full bg-amber-400"
              style={{ width: `${stats.diskUsagePct}%` }}
            />
          </div>
          <span className="text-[10px] text-neutral-500 font-mono mt-1 block">
            Logs & Audio Buffers Healthy
          </span>
        </div>
      </div>

      {/* Network & Hardware Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Network & WiFi Control */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <div className="flex items-center space-x-2">
              <Network className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                Network & Wireless (mlan0 / eth0)
              </h3>
            </div>

            <button
              id="btn-toggle-wifi-interface"
              onClick={handleToggleWifi}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-semibold rounded-lg border transition-colors ${
                stats.wifiEnabled
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-700/60'
                  : 'bg-red-950 text-red-300 border-red-800/60'
              }`}
            >
              {stats.wifiEnabled ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              <span>{stats.wifiEnabled ? 'Interface UP' : 'Interface DOWN'}</span>
            </button>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-neutral-800/80">
              <span className="text-neutral-400">Host IPv4 Address:</span>
              <span className="text-emerald-400 font-bold">{stats.ipAddress}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-neutral-800/80">
              <span className="text-neutral-400">Default Gateway:</span>
              <span className="text-neutral-200">{stats.gateway}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-neutral-800/80">
              <span className="text-neutral-400">WiFi SSID:</span>
              <span className="text-cyan-300 font-semibold">{stats.wifiSsid}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-neutral-800/80">
              <span className="text-neutral-400">Signal Strength:</span>
              <span className="text-neutral-200">{stats.wifiSignalDbm} dBm (Good)</span>
            </div>
            <div className="flex justify-between py-1 items-center">
              <span className="text-neutral-400">Gateway Latency:</span>
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">{stats.lastPingMs} ms</span>
                <button
                  id="btn-ping-test"
                  onClick={handlePingTest}
                  disabled={isPinging}
                  className="px-2 py-0.5 text-[10px] bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded border border-neutral-700"
                >
                  {isPinging ? 'Pinging...' : 'Ping Test'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Host Identity & Safe Controls */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-xl space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-neutral-800">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              System Uptime & Node Operations
            </h3>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-neutral-800/80">
              <span className="text-neutral-400">System Hostname:</span>
              <span className="text-white font-bold">{stats.hostname}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-neutral-800/80">
              <span className="text-neutral-400">Asterisk ASL Version:</span>
              <span className="text-cyan-300 font-semibold">{stats.asteriskVersion}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-neutral-800/80">
              <span className="text-neutral-400">AllSee Software Build:</span>
              <span className="text-emerald-400 font-bold">{stats.allscanVersion}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-neutral-800/80">
              <span className="text-neutral-400">Continuous Uptime:</span>
              <span className="text-white">{formatUptime(stats.uptimeSec)}</span>
            </div>
          </div>

          {/* Dangerous Controls with Confirmation */}
          <div className="pt-2 flex flex-wrap gap-2">
            {!confirmReboot ? (
              <button
                id="btn-reboot-confirm-open"
                onClick={() => setConfirmReboot(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-amber-400 border border-neutral-700 rounded-lg text-xs font-mono transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reboot Node Host</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 bg-amber-950/60 p-1 rounded-lg border border-amber-800/60">
                <span className="text-[11px] text-amber-300 px-1 font-mono">Confirm Reboot?</span>
                <button
                  onClick={handleReboot}
                  className="px-2 py-0.5 bg-amber-600 text-black text-xs font-bold rounded"
                >
                  Yes, Reboot
                </button>
                <button
                  onClick={() => setConfirmReboot(false)}
                  className="px-2 py-0.5 bg-neutral-800 text-neutral-300 text-xs rounded"
                >
                  Cancel
                </button>
              </div>
            )}

            {!confirmPowerOff ? (
              <button
                id="btn-poweroff-confirm-open"
                onClick={() => setConfirmPowerOff(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-red-400 border border-neutral-700 rounded-lg text-xs font-mono transition-colors"
              >
                <Power className="w-3.5 h-3.5" />
                <span>Power Off</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 bg-red-950/60 p-1 rounded-lg border border-red-800/60">
                <span className="text-[11px] text-red-300 px-1 font-mono">Confirm Power Off?</span>
                <button
                  onClick={handlePowerOff}
                  className="px-2 py-0.5 bg-red-600 text-white text-xs font-bold rounded"
                >
                  Yes, Power Off
                </button>
                <button
                  onClick={() => setConfirmPowerOff(false)}
                  className="px-2 py-0.5 bg-neutral-800 text-neutral-300 text-xs rounded"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
