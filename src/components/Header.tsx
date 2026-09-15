import React from 'react';
import { 
  Radio, 
  Activity, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Wifi, 
  Cpu, 
  Bookmark, 
  ListOrdered, 
  Terminal, 
  Settings, 
  Users, 
  Sliders, 
  Palette,
  Disc3,
  HelpCircle
} from 'lucide-react';
import { AppTab, LocalNodeConfig, ScanConfig, SystemStats } from '../types';

interface HeaderProps {
  currentTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  localConfig: LocalNodeConfig;
  scanConfig: ScanConfig;
  systemStats: SystemStats;
  onToggleScan: () => void;
  onToggleMute: () => void;
  onVolumeChange: (vol: number) => void;
  onOpenThemeModal: () => void;
  onOpenHelpModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  localConfig,
  scanConfig,
  systemStats,
  onToggleScan,
  onToggleMute,
  onVolumeChange,
  onOpenThemeModal,
  onOpenHelpModal,
}) => {
  return (
    <header className="bg-neutral-900/95 backdrop-blur border-b border-neutral-800 sticky top-0 z-40 text-neutral-100 shadow-xl">
      {/* Top Banner Bar */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Title */}
        <div className="flex items-center space-x-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/40 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.25)]">
            <Radio className="w-5 h-5 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                AllSee
              </h1>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-700/50 text-emerald-300">
                v2.5 Dark
              </span>
            </div>
            <p className="text-xs text-neutral-400 hidden sm:block">
              AllStarLink Node Scanner & Management Suite
            </p>
          </div>
        </div>

        {/* Live Local Node Status Pill */}
        <div className="flex items-center gap-2 bg-neutral-950/90 border border-neutral-800 rounded-xl px-3 py-1.5 shadow-inner">
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-neutral-500 uppercase font-mono tracking-wider">Node</span>
              <span className="text-sm font-mono font-bold text-white tracking-wide">
                {localConfig.nodeNumber}
              </span>
              <span className="text-xs font-mono text-emerald-400 font-semibold">
                ({localConfig.callsign})
              </span>
            </div>
            <span className="text-[10px] text-neutral-400 font-mono">
              {localConfig.frequency} • {localConfig.tone}
            </span>
          </div>

          <div className="h-6 w-px bg-neutral-800 mx-1" />

          {/* COS / PTT status indicator */}
          <div className="flex items-center gap-1.5">
            {localConfig.pttState === 'rx' ? (
              <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-950/90 border border-emerald-600/60 px-2 py-0.5 rounded-md animate-pulse">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                COS RX
              </span>
            ) : localConfig.pttState === 'tx' ? (
              <span className="flex items-center gap-1 text-xs font-bold text-red-400 bg-red-950/90 border border-red-600/60 px-2 py-0.5 rounded-md animate-pulse">
                <span className="w-2 h-2 rounded-full bg-red-400 shadow-[0_0_8px_#f87171]" />
                PTT TX
              </span>
            ) : scanConfig.isScanning ? (
              <span className="flex items-center gap-1 text-xs font-bold text-cyan-400 bg-cyan-950/90 border border-cyan-600/60 px-2 py-0.5 rounded-md animate-pulse">
                <Disc3 className="w-3 h-3 animate-spin" />
                SCANNING
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs font-medium text-neutral-400 bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded-md">
                <span className="w-2 h-2 rounded-full bg-neutral-500" />
                STANDBY
              </span>
            )}
          </div>
        </div>

        {/* Quick Actions (Scan, Audio, System Telemetry) */}
        <div className="flex items-center gap-2">
          {/* Scan Toggle Button */}
          <button
            id="header-scan-toggle"
            onClick={onToggleScan}
            title={scanConfig.isScanning ? 'Pause Node Scanner' : 'Start Node Scanner'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-md ${
              scanConfig.isScanning
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 hover:bg-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700'
            }`}
          >
            {scanConfig.isScanning ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause Scan</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start Scan</span>
              </>
            )}
          </button>

          {/* Quick Volume / Mute */}
          <div className="flex items-center bg-neutral-950/80 border border-neutral-800 rounded-lg px-2.5 py-1 text-neutral-300">
            <button
              id="header-audio-mute-toggle"
              onClick={onToggleMute}
              title={localConfig.isMuted ? 'Unmute Receiver Audio' : 'Mute Receiver Audio'}
              className="p-1 hover:text-white transition-colors"
            >
              {localConfig.isMuted ? (
                <VolumeX className="w-4 h-4 text-red-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={localConfig.isMuted ? 0 : localConfig.volume}
              onChange={(e) => onVolumeChange(Number(e.target.value))}
              className="w-16 h-1.5 ml-1 accent-emerald-500 bg-neutral-800 rounded-lg cursor-pointer"
              title={`Volume: ${localConfig.volume}%`}
            />
          </div>

          {/* Hardware indicators (WiFi & CPU) */}
          <div className="hidden lg:flex items-center gap-2 text-[11px] text-neutral-400 bg-neutral-950/80 border border-neutral-800 rounded-lg px-2.5 py-1">
            <span className="flex items-center gap-1 text-neutral-300" title={`WiFi SSID: ${systemStats.wifiSsid} (${systemStats.wifiSignalDbm} dBm)`}>
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-mono">{systemStats.wifiSignalDbm}dBm</span>
            </span>
            <span className="text-neutral-700">•</span>
            <span className="flex items-center gap-1 text-neutral-300" title={`CPU Temperature: ${systemStats.cpuTempC}°C`}>
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-mono">{systemStats.cpuTempC}°C</span>
            </span>
          </div>

          {/* Help & Theme Customizer */}
          <button
            id="header-theme-btn"
            onClick={onOpenThemeModal}
            className="p-2 text-neutral-400 hover:text-emerald-400 hover:bg-neutral-800 rounded-lg transition-colors"
            title="Modern Dark UI Settings"
          >
            <Palette className="w-4 h-4" />
          </button>

          <button
            id="header-help-btn"
            onClick={onOpenHelpModal}
            className="p-2 text-neutral-400 hover:text-cyan-400 hover:bg-neutral-800 rounded-lg transition-colors"
            title="AllSee Guide & DTMF Reference"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 border-t border-neutral-800/80">
        <nav className="flex items-center space-x-1 overflow-x-auto py-1 scrollbar-none">
          <button
            id="tab-scanner"
            onClick={() => onTabChange('scanner')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
              currentTab === 'scanner'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Live Scanner</span>
          </button>

          <button
            id="tab-favorites"
            onClick={() => onTabChange('favorites')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
              currentTab === 'favorites'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Favorites</span>
          </button>

          <button
            id="tab-directory"
            onClick={() => onTabChange('directory')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
              currentTab === 'directory'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span>ASL Directory</span>
          </button>

          <button
            id="tab-logs"
            onClick={() => onTabChange('logs')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
              currentTab === 'logs'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Activity Logs</span>
          </button>

          <button
            id="tab-stats"
            onClick={() => onTabChange('stats')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
              currentTab === 'stats'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>System Stats</span>
          </button>

          <button
            id="tab-cfg"
            onClick={() => onTabChange('cfg')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
              currentTab === 'cfg'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Configuration (cfg)</span>
          </button>

          <button
            id="tab-users"
            onClick={() => onTabChange('users')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
              currentTab === 'users'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Users</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
