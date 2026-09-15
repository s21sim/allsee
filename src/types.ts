export type ConnectionMode = 'monitor' | 'transceive' | 'permanent' | 'command';
export type LinkDirection = 'in' | 'out';
export type PttState = 'idle' | 'rx' | 'tx' | 'scanning';

export interface NodeLink {
  node: string;
  callsign: string;
  description: string;
  location: string;
  mode: ConnectionMode;
  direction: LinkDirection;
  connectedSince: string;
  durationSec: number;
  isKeyed: boolean;
  signalLevel: number; // 0 - 100
  lastKeyedCall?: string;
  lastKeyedSecAgo?: number;
  ip?: string;
  frequency?: string;
}

export interface DirectoryNode {
  node: string;
  callsign: string;
  name: string;
  location: string;
  frequency: string;
  tone: string;
  status: 'online' | 'busy' | 'offline';
  activeLinks: number;
  info: string;
  category: string;
}

export interface FavoriteNode {
  id: string;
  node: string;
  callsign: string;
  name: string;
  location: string;
  category: string;
  defaultMode: ConnectionMode;
  includeInScan: boolean;
  priority?: boolean;
  notes?: string;
  frequency?: string;
}

export interface ScanConfig {
  isScanning: boolean;
  isPaused: boolean;
  currentScanIndex: number;
  currentScanNode: string | null;
  dwellTimeSec: number;
  dwellRemaining: number;
  pauseOnCos: boolean;
  hangTimeSec: number;
  scanCategory: string;
  scanMode: ConnectionMode; // whether to connect as monitor or transceive
  alertToneOnConnect: boolean;
}

export interface LocalNodeConfig {
  nodeNumber: string;
  callsign: string;
  frequency: string;
  tone: string;
  powerWatts: string;
  location: string;
  pttState: PttState;
  cosActive: boolean;
  pttActive: boolean;
  amiHost: string;
  amiPort: number;
  amiUser: string;
  amiSecret: string;
  amiConnected: boolean;
  rogerBeep: boolean;
  audioStreamUrl: string;
  squelchLevel: number;
  volume: number;
  isMuted: boolean;
}

export interface SystemStats {
  hostname: string;
  ipAddress: string;
  gateway: string;
  wifiSsid: string;
  wifiSignalDbm: number;
  wifiEnabled: boolean;
  cpuTempC: number;
  cpuUsagePct: number;
  memUsagePct: number;
  memTotalMb: number;
  memUsedMb: number;
  diskUsagePct: number;
  uptimeSec: number;
  asteriskVersion: string;
  allscanVersion: string;
  lastPingMs: number;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  type: 'connect' | 'disconnect' | 'ptt_rx' | 'ptt_tx' | 'scan' | 'dtmf' | 'system' | 'alert';
  node?: string;
  callsign?: string;
  message: string;
}

export interface UserAccount {
  id: string;
  username: string;
  name: string;
  role: 'admin' | 'operator' | 'monitor';
  email: string;
  lastLogin: string;
  active: boolean;
}

export type AppTab = 'scanner' | 'favorites' | 'directory' | 'logs' | 'stats' | 'cfg' | 'users';
