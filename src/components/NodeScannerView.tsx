import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  XOctagon, 
  Radio, 
  Unlink, 
  Eye, 
  Volume2, 
  PhoneCall, 
  Key, 
  Info, 
  ShieldAlert, 
  Layers,
  Search,
  Sparkles,
  Signal,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  SlidersHorizontal
} from 'lucide-react';
import { ConnectionMode, DirectoryNode, FavoriteNode, LocalNodeConfig, NodeLink, ScanConfig } from '../types';
import { soundEngine } from '../utils/audioSynthesizer';

interface NodeScannerViewProps {
  localConfig: LocalNodeConfig;
  scanConfig: ScanConfig;
  connectedLinks: NodeLink[];
  favorites: FavoriteNode[];
  directoryNodes: DirectoryNode[];
  onToggleScan: () => void;
  onSkipScan: () => void;
  onStopScan: () => void;
  onUpdateScanConfig: (config: Partial<ScanConfig>) => void;
  onConnectNode: (nodeNumber: string, mode: ConnectionMode) => void;
  onDisconnectNode: (nodeNumber: string) => void;
  onDisconnectAll: () => void;
  onSendDtmf: (digit: string) => void;
  onQueryNode: (nodeNumber: string) => void;
}

export const NodeScannerView: React.FC<NodeScannerViewProps> = ({
  localConfig,
  scanConfig,
  connectedLinks,
  favorites,
  directoryNodes,
  onToggleScan,
  onSkipScan,
  onStopScan,
  onUpdateScanConfig,
  onConnectNode,
  onDisconnectNode,
  onDisconnectAll,
  onSendDtmf,
  onQueryNode,
}) => {
  const [inputNode, setInputNode] = useState<string>('');
  const [connectMode, setConnectMode] = useState<ConnectionMode>('transceive');
  const [showDtmfPad, setShowDtmfPad] = useState<boolean>(true);
  const [showQuickSettings, setShowQuickSettings] = useState<boolean>(false);

  // Suggestions filtered from directory
  const filteredSuggestions = inputNode.trim().length >= 1
    ? directoryNodes.filter(
        (n) =>
          n.node.startsWith(inputNode.trim()) ||
          n.callsign.toLowerCase().includes(inputNode.toLowerCase()) ||
          n.name.toLowerCase().includes(inputNode.toLowerCase())
      ).slice(0, 4)
    : [];

  const handleDtmfPress = (digit: string) => {
    soundEngine.playDtmf(digit, 160);
    onSendDtmf(digit);
    setInputNode((prev) => prev + digit);
  };

  const handleManualConnect = (mode: ConnectionMode) => {
    if (!inputNode.trim()) return;
    onConnectNode(inputNode.trim(), mode);
    setInputNode('');
  };

  return (
    <div className="space-y-5">
      {/* Node Status Banner */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-900 to-neutral-950 border border-neutral-800 rounded-2xl p-4 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left: Station Identity */}
          <div className="flex items-center gap-4">
            <div className="relative w-14 h-14 rounded-2xl bg-neutral-950 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
              <Radio className="w-7 h-7" />
              <span className={`absolute bottom-1 right-1 w-3 h-3 rounded-full border-2 border-neutral-950 ${
                localConfig.pttState === 'rx' 
                  ? 'bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse'
                  : localConfig.pttState === 'tx'
                    ? 'bg-red-500 shadow-[0_0_8px_#ef4444] animate-pulse'
                    : 'bg-neutral-600'
              }`} />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-mono tracking-widest text-neutral-400">
                  Local Master Node
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-700/50 text-emerald-300">
                  AMI Online
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <h2 className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-tight">
                  Node {localConfig.nodeNumber}
                </h2>
                <span className="text-lg font-mono font-semibold text-emerald-400">
                  {localConfig.callsign}
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                {localConfig.location} • {localConfig.frequency} (PL {localConfig.tone}) • {localConfig.powerWatts}
              </p>
            </div>
          </div>

          {/* Right: Quick Stat Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-neutral-950/80 border border-neutral-800 rounded-xl px-3 py-2 text-center min-w-[90px]">
              <span className="text-[10px] text-neutral-500 uppercase font-mono block">Connected Links</span>
              <span className="text-lg font-mono font-bold text-emerald-400">
                {connectedLinks.length}
              </span>
            </div>

            <div className="bg-neutral-950/80 border border-neutral-800 rounded-xl px-3 py-2 text-center min-w-[90px]">
              <span className="text-[10px] text-neutral-500 uppercase font-mono block">Scan Dwell</span>
              <span className="text-lg font-mono font-bold text-cyan-400">
                {scanConfig.dwellTimeSec}s
              </span>
            </div>

            <div className="bg-neutral-950/80 border border-neutral-800 rounded-xl px-3 py-2 text-center min-w-[90px]">
              <span className="text-[10px] text-neutral-500 uppercase font-mono block">Scanner State</span>
              <span className={`text-sm font-mono font-bold uppercase ${
                scanConfig.isScanning ? 'text-cyan-400 animate-pulse' : 'text-neutral-400'
              }`}>
                {scanConfig.isScanning ? 'Scanning' : 'Halted'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Scanner Controller Section */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-800">
          <div className="flex items-center space-x-2">
            <div className={`p-1.5 rounded-lg ${scanConfig.isScanning ? 'bg-cyan-500/20 text-cyan-400 animate-pulse' : 'bg-neutral-800 text-neutral-400'}`}>
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-wide uppercase text-white">
                AllSee Automated Node Scanner
              </h3>
              <p className="text-xs text-neutral-400">
                Sequentially cycles through priority favorites with COS activity pause detection
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="scanner-settings-btn"
              onClick={() => setShowQuickSettings(!showQuickSettings)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-300 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Scan Settings</span>
            </button>

            {/* Main Scan Trigger */}
            <button
              id="scanner-main-toggle-btn"
              onClick={onToggleScan}
              className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-lg transition-all shadow-md ${
                scanConfig.isScanning
                  ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.35)]'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.35)]'
              }`}
            >
              {scanConfig.isScanning ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>PAUSE SCAN</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>START SCANNER</span>
                </>
              )}
            </button>

            {/* Skip Next */}
            <button
              id="scanner-skip-btn"
              onClick={onSkipScan}
              disabled={!scanConfig.isScanning}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-300 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed border border-neutral-700 rounded-lg transition-colors"
              title="Skip to next node"
            >
              <SkipForward className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Skip</span>
            </button>

            {/* Stop Scan */}
            <button
              id="scanner-stop-btn"
              onClick={onStopScan}
              disabled={!scanConfig.isScanning}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-400 bg-red-950/60 hover:bg-red-900/60 disabled:opacity-40 disabled:cursor-not-allowed border border-red-800/60 rounded-lg transition-colors"
              title="Stop scan and disconnect"
            >
              <XOctagon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Halt</span>
            </button>
          </div>
        </div>

        {/* Scan Status & Dwell Countdown Bar */}
        <div className="mt-3">
          <div className="flex flex-wrap items-center justify-between text-xs font-mono text-neutral-400 mb-1.5">
            <div className="flex items-center gap-2">
              <span className="text-neutral-500">Current Target:</span>
              {scanConfig.currentScanNode ? (
                <span className="text-emerald-400 font-bold bg-neutral-950 px-2 py-0.5 rounded border border-emerald-900">
                  Node {scanConfig.currentScanNode} ({favorites.find(f => f.node === scanConfig.currentScanNode)?.callsign || 'Link'})
                </span>
              ) : (
                <span className="text-neutral-500 italic">No node actively being scanned</span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span>
                Target Group:{' '}
                <span className="text-cyan-300 font-semibold">{scanConfig.scanCategory}</span>
              </span>
              <span>
                Dwell Remaining:{' '}
                <span className="text-emerald-300 font-bold">{scanConfig.dwellRemaining}s</span>
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 bg-neutral-950 rounded-full border border-neutral-800 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                scanConfig.isScanning
                  ? 'bg-gradient-to-r from-emerald-500 to-cyan-400'
                  : 'bg-neutral-700'
              }`}
              style={{
                width: scanConfig.isScanning && scanConfig.dwellTimeSec > 0
                  ? `${Math.max(5, (scanConfig.dwellRemaining / scanConfig.dwellTimeSec) * 100)}%`
                  : '0%',
              }}
            />
          </div>
        </div>

        {/* Expandable Scan Settings Panel */}
        {showQuickSettings && (
          <div className="mt-4 pt-4 border-t border-neutral-800 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="text-neutral-400 block mb-1 font-mono">Dwell Time ({scanConfig.dwellTimeSec} sec)</label>
              <input
                type="range"
                min="3"
                max="30"
                value={scanConfig.dwellTimeSec}
                onChange={(e) => onUpdateScanConfig({ dwellTimeSec: Number(e.target.value) })}
                className="w-full accent-cyan-500 bg-neutral-800 rounded cursor-pointer"
              />
              <span className="text-[10px] text-neutral-500">Seconds spent listening on quiet nodes</span>
            </div>

            <div>
              <label className="text-neutral-400 block mb-1 font-mono">Scan Group Filter</label>
              <select
                value={scanConfig.scanCategory}
                onChange={(e) => onUpdateScanConfig({ scanCategory: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-neutral-200 text-xs focus:border-cyan-500 outline-none"
              >
                <option value="All Favorites">All Favorites ({favorites.filter(f => f.includeInScan).length} active)</option>
                <option value="Hubs">Major Hubs</option>
                <option value="Weather & Nets">Weather & Nets</option>
                <option value="International">International</option>
                <option value="Regional">Regional Repeaters</option>
              </select>
            </div>

            <div className="flex flex-col justify-end space-y-2">
              <label className="flex items-center space-x-2 text-neutral-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={scanConfig.pauseOnCos}
                  onChange={(e) => onUpdateScanConfig({ pauseOnCos: e.target.checked })}
                  className="rounded border-neutral-700 bg-neutral-800 text-emerald-500 focus:ring-0"
                />
                <span>Hold Scan on Voice / COS Activity</span>
              </label>

              <label className="flex items-center space-x-2 text-neutral-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={scanConfig.alertToneOnConnect}
                  onChange={(e) => onUpdateScanConfig({ alertToneOnConnect: e.target.checked })}
                  className="rounded border-neutral-700 bg-neutral-800 text-emerald-500 focus:ring-0"
                />
                <span>Chime Tone on Node Hop</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: Active Links + Direct Dialpad */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 Cols: Connected Active Links Table/Cards */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Signal className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-200">
                Connected Nodes & Active Links ({connectedLinks.length})
              </h3>
            </div>

            {connectedLinks.length > 0 && (
              <button
                id="btn-disconnect-all-links"
                onClick={onDisconnectAll}
                className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 bg-red-950/40 hover:bg-red-950/70 border border-red-800/50 px-2.5 py-1 rounded-lg transition-colors font-mono"
                title="Disconnect all linked nodes (*76)"
              >
                <Unlink className="w-3 h-3" />
                <span>Disconnect All (*76)</span>
              </button>
            )}
          </div>

          {connectedLinks.length === 0 ? (
            <div className="bg-neutral-900/60 border border-dashed border-neutral-800 rounded-2xl p-8 text-center text-neutral-400">
              <Radio className="w-10 h-10 mx-auto text-neutral-600 mb-2" />
              <p className="text-sm font-semibold text-neutral-300">No Remote Nodes Linked</p>
              <p className="text-xs text-neutral-500 mt-1 max-w-md mx-auto">
                Use the direct connect bar below, pick a favorite node, or start the automated scanner to connect to an AllStarLink node.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {connectedLinks.map((link) => (
                <div
                  key={link.node}
                  className={`relative bg-neutral-900 border rounded-xl p-4 transition-all shadow-lg ${
                    link.isKeyed
                      ? 'border-emerald-500/70 shadow-[0_0_20px_rgba(16,185,129,0.2)] bg-neutral-900/95'
                      : 'border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Link Info */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-mono font-bold text-white tracking-wide">
                          Node {link.node}
                        </span>
                        <span className="text-sm font-mono font-semibold text-emerald-400">
                          {link.callsign}
                        </span>

                        {/* Mode badge */}
                        <span
                          className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
                            link.mode === 'transceive'
                              ? 'bg-emerald-950 border-emerald-700/60 text-emerald-300'
                              : 'bg-cyan-950 border-cyan-700/60 text-cyan-300'
                          }`}
                        >
                          {link.mode === 'transceive' ? 'Transceive (*3)' : 'Monitor (*2)'}
                        </span>

                        {/* Direction badge */}
                        <span className="text-[10px] font-mono text-neutral-400 flex items-center gap-0.5">
                          {link.direction === 'in' ? (
                            <span className="flex items-center text-amber-400">
                              <ArrowDownLeft className="w-3 h-3" /> In
                            </span>
                          ) : (
                            <span className="flex items-center text-blue-400">
                              <ArrowUpRight className="w-3 h-3" /> Out
                            </span>
                          )}
                        </span>

                        {/* Keyed badge */}
                        {link.isKeyed && (
                          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500 text-black font-bold animate-pulse">
                            KEYED / RX
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-neutral-300 font-medium">
                        {link.description}
                      </p>
                      <p className="text-[11px] text-neutral-400">
                        {link.location} • {link.frequency || 'VoIP Link'}
                      </p>
                    </div>

                    {/* Quick Link Action Buttons */}
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        id={`btn-query-node-${link.node}`}
                        onClick={() => onQueryNode(link.node)}
                        className="p-1.5 text-neutral-400 hover:text-cyan-400 bg-neutral-950 border border-neutral-800 rounded-lg transition-colors"
                        title="Query Node Info (*70)"
                      >
                        <Info className="w-4 h-4" />
                      </button>

                      {/* Toggle mode (*2 monitor / *3 transceive) */}
                      <button
                        id={`btn-toggle-mode-${link.node}`}
                        onClick={() =>
                          onConnectNode(
                            link.node,
                            link.mode === 'transceive' ? 'monitor' : 'transceive'
                          )
                        }
                        className="flex items-center gap-1 text-xs px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 rounded-lg transition-colors font-mono"
                        title="Toggle Listen Only vs Transceive"
                      >
                        <Eye className="w-3 h-3 text-cyan-400" />
                        <span>{link.mode === 'transceive' ? 'Set Mon' : 'Set Tx'}</span>
                      </button>

                      {/* Disconnect (*1) */}
                      <button
                        id={`btn-disconnect-${link.node}`}
                        onClick={() => onDisconnectNode(link.node)}
                        className="flex items-center gap-1 text-xs px-2.5 py-1 bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-800/60 rounded-lg transition-colors font-mono"
                        title="Disconnect Node (*1)"
                      >
                        <Unlink className="w-3 h-3" />
                        <span>Drop (*1)</span>
                      </button>
                    </div>
                  </div>

                  {/* Telemetry bar: Last keyed and duration */}
                  <div className="mt-3 pt-2.5 border-t border-neutral-800/80 flex flex-wrap items-center justify-between text-[11px] font-mono text-neutral-400">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-neutral-500" />
                        <span>Up: {Math.floor(link.durationSec / 60)}m {link.durationSec % 60}s</span>
                      </span>

                      {link.lastKeyedCall && (
                        <span>
                          Last Keyed:{' '}
                          <strong className="text-emerald-400">{link.lastKeyedCall}</strong>{' '}
                          ({link.lastKeyedSecAgo === 0 ? 'Active Now' : `${link.lastKeyedSecAgo}s ago`})
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span>Signal:</span>
                      <div className="w-16 h-1.5 bg-neutral-950 rounded-full border border-neutral-800 overflow-hidden">
                        <div
                          className="h-full bg-emerald-400"
                          style={{ width: `${link.signalLevel}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Direct Node Connect Bar */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center space-x-2 mb-3">
              <PhoneCall className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-200">
                Direct Node Connect & Command Dial
              </h4>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch gap-2">
              <div className="relative flex-1">
                <input
                  id="direct-node-input"
                  type="text"
                  placeholder="Enter Node # (e.g. 2560, 27339, 41522)..."
                  value={inputNode}
                  onChange={(e) => setInputNode(e.target.value.replace(/[^0-9*#A-Da-d]/g, ''))}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm font-mono text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />

                {inputNode && (
                  <button
                    onClick={() => setInputNode('')}
                    className="absolute right-3 top-3 text-neutral-500 hover:text-neutral-300 text-xs"
                  >
                    Clear
                  </button>
                )}

                {/* Autocomplete dropdown */}
                {filteredSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-neutral-950 border border-neutral-700 rounded-xl shadow-2xl z-20 overflow-hidden">
                    {filteredSuggestions.map((item) => (
                      <button
                        key={item.node}
                        onClick={() => {
                          setInputNode(item.node);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-neutral-800/80 flex items-center justify-between border-b border-neutral-800 last:border-0"
                      >
                        <div>
                          <span className="font-mono font-bold text-emerald-400 mr-2">
                            Node {item.node}
                          </span>
                          <span className="text-xs text-neutral-300 font-semibold mr-2">
                            {item.callsign}
                          </span>
                          <span className="text-xs text-neutral-400">{item.name}</span>
                        </div>
                        <span className="text-[10px] text-neutral-500 uppercase font-mono">
                          {item.location}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="btn-connect-transceive"
                  onClick={() => handleManualConnect('transceive')}
                  disabled={!inputNode.trim()}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all shadow-[0_0_12px_rgba(16,185,129,0.3)] font-mono"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Connect (*3)</span>
                </button>

                <button
                  id="btn-connect-monitor"
                  onClick={() => handleManualConnect('monitor')}
                  disabled={!inputNode.trim()}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2.5 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed text-cyan-300 border border-neutral-700 rounded-xl transition-colors text-xs font-semibold font-mono"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Monitor (*2)</span>
                </button>
              </div>
            </div>

            {/* Common quick dial presets */}
            <div className="mt-3 pt-3 border-t border-neutral-800 flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-neutral-500 text-[11px] font-mono mr-1">Quick Command:</span>
              <button
                onClick={() => {
                  soundEngine.playConnectChime();
                  onSendDtmf('*70');
                }}
                className="px-2 py-1 bg-neutral-950 border border-neutral-800 hover:border-neutral-600 rounded text-neutral-300 font-mono text-[11px]"
              >
                *70 (Status)
              </button>
              <button
                onClick={() => {
                  soundEngine.playConnectChime();
                  onSendDtmf('*81');
                }}
                className="px-2 py-1 bg-neutral-950 border border-neutral-800 hover:border-neutral-600 rounded text-neutral-300 font-mono text-[11px]"
              >
                *81 (Say IP)
              </button>
              <button
                onClick={() => {
                  soundEngine.playConnectChime();
                  onSendDtmf('*82');
                }}
                className="px-2 py-1 bg-neutral-950 border border-neutral-800 hover:border-neutral-600 rounded text-neutral-300 font-mono text-[11px]"
              >
                *82 (Say Time)
              </button>
              <button
                onClick={() => {
                  soundEngine.playRogerBeep();
                  onSendDtmf('*80');
                }}
                className="px-2 py-1 bg-neutral-950 border border-neutral-800 hover:border-neutral-600 rounded text-neutral-300 font-mono text-[11px]"
              >
                *80 (Force ID)
              </button>
              <button
                onClick={() => {
                  soundEngine.playDisconnectChime();
                  onDisconnectAll();
                }}
                className="px-2 py-1 bg-red-950/60 border border-red-800/60 hover:border-red-600 rounded text-red-300 font-mono text-[11px]"
              >
                *76 (Drop All)
              </button>
            </div>
          </div>
        </div>

        {/* Right Col: DTMF Keypad & Presets */}
        <div className="space-y-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-neutral-800">
              <div className="flex items-center space-x-2">
                <Key className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-200">
                  DTMF Radio Keypad
                </h3>
              </div>
              <span className="text-[10px] text-neutral-500 font-mono">Web Audio Synthesizer</span>
            </div>

            {/* DTMF Matrix: 16-key matrix (0-9, *, #, A-D) */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: '1', sub: '' },
                { label: '2', sub: 'ABC' },
                { label: '3', sub: 'DEF' },
                { label: 'A', sub: 'CMD' },
                { label: '4', sub: 'GHI' },
                { label: '5', sub: 'JKL' },
                { label: '6', sub: 'MNO' },
                { label: 'B', sub: 'CMD' },
                { label: '7', sub: 'PQRS' },
                { label: '8', sub: 'TUV' },
                { label: '9', sub: 'WXYZ' },
                { label: 'C', sub: 'CMD' },
                { label: '*', sub: 'PREFIX' },
                { label: '0', sub: 'OPER' },
                { label: '#', sub: 'ENTER' },
                { label: 'D', sub: 'CMD' },
              ].map((key) => {
                const isSpecial = ['A', 'B', 'C', 'D'].includes(key.label);
                const isPrefix = ['*', '#'].includes(key.label);

                return (
                  <button
                    key={key.label}
                    id={`dtmf-key-${key.label === '*' ? 'star' : key.label === '#' ? 'hash' : key.label}`}
                    onClick={() => handleDtmfPress(key.label)}
                    className={`h-14 rounded-xl flex flex-col items-center justify-center transition-all active:scale-95 shadow-md border ${
                      isSpecial
                        ? 'bg-neutral-950 hover:bg-neutral-800 text-amber-400 border-amber-500/30'
                        : isPrefix
                          ? 'bg-neutral-950 hover:bg-neutral-800 text-cyan-400 border-cyan-500/30'
                          : 'bg-neutral-950 hover:bg-neutral-800 text-neutral-100 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <span className="text-lg font-mono font-bold leading-none">
                      {key.label}
                    </span>
                    {key.sub && (
                      <span className="text-[9px] font-mono text-neutral-500 mt-0.5 tracking-tighter">
                        {key.sub}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* DTMF Functions Help */}
            <div className="mt-4 p-3 bg-neutral-950/80 border border-neutral-800/80 rounded-xl text-[11px] text-neutral-400 space-y-1 font-mono">
              <div className="flex justify-between">
                <span>*3 &lt;Node&gt;</span>
                <span className="text-neutral-300">Connect Transceive</span>
              </div>
              <div className="flex justify-between">
                <span>*2 &lt;Node&gt;</span>
                <span className="text-neutral-300">Connect Monitor Only</span>
              </div>
              <div className="flex justify-between">
                <span>*1 &lt;Node&gt;</span>
                <span className="text-neutral-300">Disconnect Link</span>
              </div>
              <div className="flex justify-between">
                <span>*76</span>
                <span className="text-neutral-300">Disconnect All Links</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
