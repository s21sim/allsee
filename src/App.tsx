/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  AppTab, 
  ConnectionMode, 
  FavoriteNode, 
  LocalNodeConfig, 
  NodeLink, 
  ScanConfig, 
  SystemStats, 
  ActivityLog, 
  UserAccount 
} from './types';
import { 
  INITIAL_CONNECTED_LINKS, 
  INITIAL_DIRECTORY_NODES, 
  INITIAL_FAVORITES, 
  INITIAL_SYSTEM_STATS, 
  INITIAL_USERS, 
  DEFAULT_LOCAL_CONFIG 
} from './data/initialData';
import { Header } from './components/Header';
import { NodeScannerView } from './components/NodeScannerView';
import { LiveAudioScope } from './components/LiveAudioScope';
import { FavoritesManager } from './components/FavoritesManager';
import { DirectoryView } from './components/DirectoryView';
import { ActivityLogsView } from './components/ActivityLogsView';
import { SystemStatsView } from './components/SystemStatsView';
import { ConfigView } from './components/ConfigView';
import { UsersView } from './components/UsersView';
import { ThemeModal, AccentTheme, DarkBgMode } from './components/ThemeModal';
import { HelpModal } from './components/HelpModal';
import { soundEngine } from './utils/audioSynthesizer';

export default function App() {
  // State Initialization with localStorage fallback
  const [currentTab, setCurrentTab] = useState<AppTab>('scanner');

  const [localConfig, setLocalConfig] = useState<LocalNodeConfig>(() => {
    const saved = localStorage.getItem('allsee_local_config');
    return saved ? { ...DEFAULT_LOCAL_CONFIG, ...JSON.parse(saved) } : DEFAULT_LOCAL_CONFIG;
  });

  const [scanConfig, setScanConfig] = useState<ScanConfig>(() => {
    return {
      isScanning: false,
      isPaused: false,
      currentScanIndex: 0,
      currentScanNode: null,
      dwellTimeSec: 8,
      dwellRemaining: 8,
      pauseOnCos: true,
      hangTimeSec: 3,
      scanCategory: 'All Favorites',
      scanMode: 'monitor',
      alertToneOnConnect: true,
    };
  });

  const [connectedLinks, setConnectedLinks] = useState<NodeLink[]>(() => {
    const saved = localStorage.getItem('allsee_links');
    return saved ? JSON.parse(saved) : INITIAL_CONNECTED_LINKS;
  });

  const [favorites, setFavorites] = useState<FavoriteNode[]>(() => {
    const saved = localStorage.getItem('allsee_favs');
    return saved ? JSON.parse(saved) : INITIAL_FAVORITES;
  });

  const [directoryNodes] = useState(INITIAL_DIRECTORY_NODES);

  const [systemStats, setSystemStats] = useState<SystemStats>(INITIAL_SYSTEM_STATS);

  const [users, setUsers] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem('allsee_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [logs, setLogs] = useState<ActivityLog[]>(() => {
    return [
      {
        id: 'log-init-1',
        timestamp: new Date(Date.now() - 60000).toLocaleTimeString(),
        type: 'system',
        message: 'AllSee Asterisk ASL3 Interface initialized on node 58841',
      },
      {
        id: 'log-init-2',
        timestamp: new Date(Date.now() - 45000).toLocaleTimeString(),
        type: 'connect',
        node: '2560',
        callsign: 'W6IN',
        message: 'Linked to Node 2560 (The WIN System) [Transceive *3]',
      },
      {
        id: 'log-init-3',
        timestamp: new Date(Date.now() - 30000).toLocaleTimeString(),
        type: 'connect',
        node: '27339',
        callsign: 'K4ECR',
        message: 'Linked to Node 27339 (East Coast Reflector) [Monitor *2]',
      },
    ];
  });

  // UI Theme state
  const [accentTheme, setAccentTheme] = useState<AccentTheme>('emerald');
  const [darkBgMode, setDarkBgMode] = useState<DarkBgMode>('obsidian');
  const [showThemeModal, setShowThemeModal] = useState<boolean>(false);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);

  // Persistence effects
  useEffect(() => {
    localStorage.setItem('allsee_local_config', JSON.stringify(localConfig));
  }, [localConfig]);

  useEffect(() => {
    localStorage.setItem('allsee_links', JSON.stringify(connectedLinks));
  }, [connectedLinks]);

  useEffect(() => {
    localStorage.setItem('allsee_favs', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('allsee_users', JSON.stringify(users));
  }, [users]);

  // Sync soundEngine volume and mute
  useEffect(() => {
    soundEngine.setMuted(localConfig.isMuted);
    soundEngine.setVolume(localConfig.volume / 100);
  }, [localConfig.isMuted, localConfig.volume]);

  // Log Helper
  const addLog = useCallback(
    (type: ActivityLog['type'], message: string, node?: string, callsign?: string) => {
      const newLog: ActivityLog = {
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: new Date().toLocaleTimeString(),
        type,
        message,
        node,
        callsign,
      };
      setLogs((prev) => [newLog, ...prev.slice(0, 199)]);
    },
    []
  );

  // Eligible favorites for automated scanner
  const eligibleScanFavorites = useMemo(() => {
    return favorites.filter((f) => {
      if (!f.includeInScan) return false;
      if (scanConfig.scanCategory === 'All Favorites') return true;
      return f.category === scanConfig.scanCategory;
    });
  }, [favorites, scanConfig.scanCategory]);

  // Live Radio Simulation & Scanner Clock Loop
  useEffect(() => {
    const timer = setInterval(() => {
      // 1. Increment duration for all connected links
      setConnectedLinks((prevLinks) =>
        prevLinks.map((link) => ({
          ...link,
          durationSec: link.durationSec + 1,
          lastKeyedSecAgo: (link.lastKeyedSecAgo ?? 0) + 1,
        }))
      );

      // 2. Increment host uptime
      setSystemStats((prev) => ({
        ...prev,
        uptimeSec: prev.uptimeSec + 1,
      }));

      // 3. Automated Scanner Clock Logic
      if (scanConfig.isScanning && !scanConfig.isPaused) {
        // If carrier COS is active and pauseOnCos is true, hold scan
        const isVoiceHolding = scanConfig.pauseOnCos && localConfig.cosActive;

        if (!isVoiceHolding) {
          if (scanConfig.dwellRemaining <= 1) {
            // Step to next favorite node
            if (eligibleScanFavorites.length > 0) {
              const nextIndex = (scanConfig.currentScanIndex + 1) % eligibleScanFavorites.length;
              const nextNode = eligibleScanFavorites[nextIndex];

              setScanConfig((prev) => ({
                ...prev,
                currentScanIndex: nextIndex,
                currentScanNode: nextNode.node,
                dwellRemaining: prev.dwellTimeSec,
              }));

              if (scanConfig.alertToneOnConnect) {
                soundEngine.playConnectChime();
              }

              addLog(
                'scan',
                `Scanner hopped to Node ${nextNode.node} (${nextNode.callsign} - ${nextNode.name})`,
                nextNode.node,
                nextNode.callsign
              );
            }
          } else {
            setScanConfig((prev) => ({
              ...prev,
              dwellRemaining: prev.dwellRemaining - 1,
            }));
          }
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [
    scanConfig.isScanning,
    scanConfig.isPaused,
    scanConfig.dwellRemaining,
    scanConfig.currentScanIndex,
    scanConfig.dwellTimeSec,
    scanConfig.pauseOnCos,
    scanConfig.alertToneOnConnect,
    localConfig.cosActive,
    eligibleScanFavorites,
    addLog,
  ]);

  // Random Traffic & Carrier Voice Simulation on Connected Links
  useEffect(() => {
    const trafficInterval = setInterval(() => {
      // Randomly simulate transmission key/unkey
      if (connectedLinks.length > 0 && Math.random() > 0.4) {
        const randomIndex = Math.floor(Math.random() * connectedLinks.length);
        const targetLink = connectedLinks[randomIndex];
        const nextKeyed = !targetLink.isKeyed;

        setConnectedLinks((prev) =>
          prev.map((l, i) =>
            i === randomIndex
              ? {
                  ...l,
                  isKeyed: nextKeyed,
                  lastKeyedSecAgo: nextKeyed ? 0 : l.lastKeyedSecAgo,
                }
              : l
          )
        );

        // Update local COS active state
        setLocalConfig((prev) => ({
          ...prev,
          cosActive: nextKeyed,
          pttState: nextKeyed ? 'rx' : prev.pttActive ? 'tx' : prev.pttState === 'scanning' ? 'scanning' : 'idle',
        }));

        if (nextKeyed) {
          soundEngine.playSquelchTail();
          addLog(
            'ptt_rx',
            `Voice carrier active on Node ${targetLink.node} (${targetLink.callsign})`,
            targetLink.node,
            targetLink.callsign
          );
        } else {
          if (localConfig.rogerBeep) {
            soundEngine.playRogerBeep();
          }
        }
      }
    }, 6500);

    return () => clearInterval(trafficInterval);
  }, [connectedLinks, localConfig.rogerBeep, addLog]);

  // Handler: Scanner Toggle
  const handleToggleScan = () => {
    if (scanConfig.isScanning) {
      setScanConfig((prev) => ({ ...prev, isScanning: false, isPaused: false, currentScanNode: null }));
      setLocalConfig((prev) => ({
        ...prev,
        pttState: prev.cosActive ? 'rx' : prev.pttActive ? 'tx' : 'idle',
      }));
      addLog('scan', 'Automated scanner paused / halted');
      soundEngine.playDisconnectChime();
    } else {
      if (eligibleScanFavorites.length === 0) {
        alert('No favorites currently enabled for automated scanning. Please enable "Scan" on at least one favorite.');
        return;
      }
      const firstTarget = eligibleScanFavorites[0];
      setScanConfig((prev) => ({
        ...prev,
        isScanning: true,
        isPaused: false,
        currentScanIndex: 0,
        currentScanNode: firstTarget.node,
        dwellRemaining: prev.dwellTimeSec,
      }));
      setLocalConfig((prev) => ({
        ...prev,
        pttState: prev.pttState === 'tx' ? 'tx' : 'scanning',
      }));
      addLog('scan', `Automated scanner initiated on group "${scanConfig.scanCategory}"`);
      soundEngine.playConnectChime();
    }
  };

  // Handler: Skip Next in Scanner
  const handleSkipScan = () => {
    if (!scanConfig.isScanning || eligibleScanFavorites.length === 0) return;
    const nextIndex = (scanConfig.currentScanIndex + 1) % eligibleScanFavorites.length;
    const nextNode = eligibleScanFavorites[nextIndex];
    setScanConfig((prev) => ({
      ...prev,
      currentScanIndex: nextIndex,
      currentScanNode: nextNode.node,
      dwellRemaining: prev.dwellTimeSec,
    }));
    soundEngine.playConnectChime();
    addLog('scan', `Manual scan skip to Node ${nextNode.node} (${nextNode.callsign})`, nextNode.node, nextNode.callsign);
  };

  // Handler: Stop Scan
  const handleStopScan = () => {
    setScanConfig((prev) => ({ ...prev, isScanning: false, isPaused: false, currentScanNode: null }));
    setLocalConfig((prev) => ({
      ...prev,
      pttState: prev.cosActive ? 'rx' : prev.pttActive ? 'tx' : 'idle',
    }));
    soundEngine.playDisconnectChime();
    addLog('scan', 'Automated scanner stopped');
  };

  // Handler: Connect Node
  const handleConnectNode = (nodeNumber: string, mode: ConnectionMode) => {
    const existing = connectedLinks.find((l) => l.node === nodeNumber);
    if (existing) {
      // Toggle / change mode
      setConnectedLinks((prev) =>
        prev.map((l) => (l.node === nodeNumber ? { ...l, mode } : l))
      );
      addLog('connect', `Node ${nodeNumber} mode updated to ${mode.toUpperCase()} (*${mode === 'transceive' ? 3 : 2})`, nodeNumber);
      soundEngine.playRogerBeep();
      return;
    }

    // Lookup directory or fallback
    const dirNode = directoryNodes.find((n) => n.node === nodeNumber);
    const favNode = favorites.find((f) => f.node === nodeNumber);

    const newLink: NodeLink = {
      node: nodeNumber,
      callsign: dirNode?.callsign || favNode?.callsign || `NODE${nodeNumber}`,
      description: dirNode?.name || favNode?.name || `Remote Node ${nodeNumber}`,
      location: dirNode?.location || favNode?.location || 'Remote AllStar Link',
      mode,
      direction: 'out',
      connectedSince: 'Just now',
      durationSec: 1,
      isKeyed: false,
      signalLevel: 85 + Math.floor(Math.random() * 12),
      lastKeyedSecAgo: 0,
      frequency: dirNode?.frequency || favNode?.frequency || 'VoIP',
    };

    setConnectedLinks((prev) => [newLink, ...prev]);
    addLog(
      'connect',
      `Linked to Node ${nodeNumber} (${newLink.callsign}) [${mode.toUpperCase()} *${mode === 'transceive' ? 3 : 2}]`,
      nodeNumber,
      newLink.callsign
    );
    soundEngine.playConnectChime();
  };

  // Handler: Disconnect Single Node (*1)
  const handleDisconnectNode = (nodeNumber: string) => {
    const target = connectedLinks.find((l) => l.node === nodeNumber);
    setConnectedLinks((prev) => prev.filter((l) => l.node !== nodeNumber));
    addLog('disconnect', `Disconnected link to Node ${nodeNumber} (*1${nodeNumber})`, nodeNumber, target?.callsign);
    soundEngine.playDisconnectChime();
  };

  // Handler: Disconnect All (*76)
  const handleDisconnectAll = () => {
    if (connectedLinks.length === 0) return;
    setConnectedLinks([]);
    addLog('disconnect', 'Executed Disconnect All Links command (*76)');
    soundEngine.playDisconnectChime();
  };

  // Handler: DTMF press
  const handleSendDtmf = (digit: string) => {
    addLog('dtmf', `Dialed DTMF digit [${digit}]`);
  };

  // Handler: Query Node Info (*70)
  const handleQueryNode = (nodeNumber: string) => {
    soundEngine.playRogerBeep();
    const link = connectedLinks.find((l) => l.node === nodeNumber) || directoryNodes.find((n) => n.node === nodeNumber);
    addLog('system', `Status Query (*70) executed for Node ${nodeNumber}: ${link ? `${link.callsign} (${link.location})` : 'Node linked'}`);
    alert(`Node ${nodeNumber} Telemetry (*70):\nCallsign: ${link?.callsign || 'N/A'}\nMode: ${link && 'mode' in link ? link.mode : 'Online'}\nLocation: ${link?.location || 'Global AllStar'}`);
  };

  // Handler: Toggle Test PTT
  const handleTestTxToggle = () => {
    const nextTx = !localConfig.pttActive;
    setLocalConfig((prev) => ({
      ...prev,
      pttActive: nextTx,
      pttState: nextTx ? 'tx' : prev.cosActive ? 'rx' : prev.pttState === 'scanning' ? 'scanning' : 'idle',
    }));

    if (nextTx) {
      soundEngine.playRogerBeep();
      addLog('ptt_tx', `Local PTT transmitter keyed on ${localConfig.frequency} (${localConfig.powerWatts})`);
    } else {
      if (localConfig.rogerBeep) {
        soundEngine.playRogerBeep();
      }
      addLog('ptt_tx', 'Local PTT transmitter unkeyed');
    }
  };

  // Background style classes based on user setting
  const getBgClass = () => {
    switch (darkBgMode) {
      case 'oled':
        return 'bg-black text-neutral-100';
      case 'midnight':
        return 'bg-[#0b0f19] text-neutral-100';
      case 'obsidian':
      default:
        return 'bg-[#0d1117] text-neutral-100';
    }
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${getBgClass()}`}>
      {/* Top Header */}
      <Header
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        localConfig={localConfig}
        scanConfig={scanConfig}
        systemStats={systemStats}
        onToggleScan={handleToggleScan}
        onToggleMute={() => setLocalConfig((prev) => ({ ...prev, isMuted: !prev.isMuted }))}
        onVolumeChange={(vol) => setLocalConfig((prev) => ({ ...prev, volume: vol }))}
        onOpenThemeModal={() => setShowThemeModal(true)}
        onOpenHelpModal={() => setShowHelpModal(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Oscilloscope Spectrum Bar on Scanner & Scope views */}
        {(currentTab === 'scanner') && (
          <LiveAudioScope
            localConfig={localConfig}
            onUpdateConfig={(partial) => setLocalConfig((prev) => ({ ...prev, ...partial }))}
            isReceiving={localConfig.cosActive}
            isTransmitting={localConfig.pttActive}
            onTestTxToggle={handleTestTxToggle}
          />
        )}

        {/* Tab Views */}
        {currentTab === 'scanner' && (
          <NodeScannerView
            localConfig={localConfig}
            scanConfig={scanConfig}
            connectedLinks={connectedLinks}
            favorites={favorites}
            directoryNodes={directoryNodes}
            onToggleScan={handleToggleScan}
            onSkipScan={handleSkipScan}
            onStopScan={handleStopScan}
            onUpdateScanConfig={(partial) => setScanConfig((prev) => ({ ...prev, ...partial }))}
            onConnectNode={handleConnectNode}
            onDisconnectNode={handleDisconnectNode}
            onDisconnectAll={handleDisconnectAll}
            onSendDtmf={handleSendDtmf}
            onQueryNode={handleQueryNode}
          />
        )}

        {currentTab === 'favorites' && (
          <FavoritesManager
            favorites={favorites}
            directoryNodes={directoryNodes}
            onAddFavorite={(newFav) => setFavorites((prev) => [newFav, ...prev])}
            onUpdateFavorite={(id, updated) =>
              setFavorites((prev) =>
                prev.map((f) => (f.id === id ? { ...f, ...updated } : f))
              )
            }
            onDeleteFavorite={(id) => setFavorites((prev) => prev.filter((f) => f.id !== id))}
            onConnectNode={handleConnectNode}
            onImportFavorites={(imported) => setFavorites((prev) => [...imported, ...prev])}
          />
        )}

        {currentTab === 'directory' && (
          <DirectoryView
            directoryNodes={directoryNodes}
            favorites={favorites}
            onConnectNode={handleConnectNode}
            onAddFavorite={(newFav) => setFavorites((prev) => [newFav, ...prev])}
          />
        )}

        {currentTab === 'logs' && (
          <ActivityLogsView
            logs={logs}
            onClearLogs={() => setLogs([])}
          />
        )}

        {currentTab === 'stats' && (
          <SystemStatsView
            stats={systemStats}
            onUpdateStats={(partial) => setSystemStats((prev) => ({ ...prev, ...partial }))}
            onAddLog={(type, msg) => addLog(type, msg)}
          />
        )}

        {currentTab === 'cfg' && (
          <ConfigView
            localConfig={localConfig}
            scanConfig={scanConfig}
            onUpdateLocalConfig={(partial) => setLocalConfig((prev) => ({ ...prev, ...partial }))}
            onUpdateScanConfig={(partial) => setScanConfig((prev) => ({ ...prev, ...partial }))}
            onAddLog={(type, msg) => addLog(type, msg)}
          />
        )}

        {currentTab === 'users' && (
          <UsersView
            users={users}
            onAddUser={(newUser) => setUsers((prev) => [...prev, newUser])}
            onUpdateUser={(id, updated) =>
              setUsers((prev) =>
                prev.map((u) => (u.id === id ? { ...u, ...updated } : u))
              )
            }
            onDeleteUser={(id) => setUsers((prev) => prev.filter((u) => u.id !== id))}
          />
        )}
      </main>

      {/* Modern Dark Footer */}
      <footer className="border-t border-neutral-800/80 bg-neutral-950/90 text-neutral-400 py-3 px-4 text-xs font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-neutral-300 font-bold">AllSee Node {localConfig.nodeNumber}</span>
            <span className="text-neutral-500">•</span>
            <span>ASL3 Asterisk 20</span>
            <span className="text-neutral-500">•</span>
            <span>Host: {systemStats.ipAddress}</span>
          </div>

          <div className="flex items-center space-x-4 text-[11px] text-neutral-500">
            <span>DTMF: *3 (Connect)</span>
            <span>*2 (Monitor)</span>
            <span>*1 (Drop)</span>
            <span>*76 (Drop All)</span>
            <span>*81 (Say IP)</span>
          </div>
        </div>
      </footer>

      {/* Theme Customizer Modal */}
      <ThemeModal
        isOpen={showThemeModal}
        onClose={() => setShowThemeModal(false)}
        accentTheme={accentTheme}
        onChangeAccent={setAccentTheme}
        darkBgMode={darkBgMode}
        onChangeBgMode={setDarkBgMode}
      />

      {/* Guide & Help Modal */}
      <HelpModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
      />
    </div>
  );
}
