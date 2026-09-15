import { DirectoryNode, FavoriteNode, LocalNodeConfig, NodeLink, SystemStats, UserAccount } from '../types';

export const INITIAL_DIRECTORY_NODES: DirectoryNode[] = [
  {
    node: '2560',
    callsign: 'W6IN',
    name: 'The WIN System (Worldwide Intertie)',
    location: 'Southern California, USA',
    frequency: '447.800 MHz',
    tone: '100.0 Hz',
    status: 'online',
    activeLinks: 48,
    info: 'One of the largest linked repeater systems in the world with global repeaters and reflectors.',
    category: 'Hubs'
  },
  {
    node: '2146',
    callsign: 'K3WAN',
    name: 'WAN Repeater System (Western Area Network)',
    location: 'Western PA / Eastern OH, USA',
    frequency: '146.910 MHz',
    tone: '131.8 Hz',
    status: 'online',
    activeLinks: 32,
    info: 'Major wide-coverage system linking Pennsylvania, Maryland, Ohio, and West Virginia.',
    category: 'Hubs'
  },
  {
    node: '27339',
    callsign: 'K4ECR',
    name: 'East Coast Reflector (ECR)',
    location: 'Philadelphia, PA, USA',
    frequency: '443.850 MHz',
    tone: '114.8 Hz',
    status: 'online',
    activeLinks: 65,
    info: 'Primary East Coast AllStar hub hosting Skywarn nets, emergency drills, and international traffic.',
    category: 'Weather & Nets'
  },
  {
    node: '41522',
    callsign: 'MB7INH',
    name: 'HUBNet United Kingdom',
    location: 'London / Nationwide, UK',
    frequency: '430.400 MHz',
    tone: '82.5 Hz',
    status: 'online',
    activeLinks: 94,
    info: 'The largest linked repeater network in the UK connecting repeaters, gateways, and AllStar nodes.',
    category: 'International'
  },
  {
    node: '29332',
    callsign: 'KL7AA',
    name: 'Alaska Morning Net Hub',
    location: 'Anchorage, Alaska, USA',
    frequency: '147.300 MHz',
    tone: '107.2 Hz',
    status: 'online',
    activeLinks: 19,
    info: 'Daily morning roll call and emergency communications backbone for Alaska and Yukon territories.',
    category: 'Weather & Nets'
  },
  {
    node: '40864',
    callsign: 'WW7PSR',
    name: 'Puget Sound Repeater Group',
    location: 'Seattle, WA, USA',
    frequency: '146.960 MHz',
    tone: '103.5 Hz',
    status: 'online',
    activeLinks: 24,
    info: 'Premier Pacific Northwest repeater system with 24/7 technical nets and emergency monitoring.',
    category: 'Regional'
  },
  {
    node: '42790',
    callsign: 'VK2RAZ',
    name: 'VK National AllStar Hub',
    location: 'Sydney, NSW, Australia',
    frequency: '438.525 MHz',
    tone: '91.5 Hz',
    status: 'online',
    activeLinks: 41,
    info: 'Cross-continent Australian linked network bridging VK, ZL, and international nodes.',
    category: 'International'
  },
  {
    node: '50555',
    callsign: 'W5TEX',
    name: 'Texas Statewide Interconnect',
    location: 'Dallas / Fort Worth, TX, USA',
    frequency: '442.250 MHz',
    tone: '110.9 Hz',
    status: 'online',
    activeLinks: 38,
    info: 'Wide-area Texas network covering DFW, Austin, San Antonio, and Houston repeater links.',
    category: 'Regional'
  },
  {
    node: '43232',
    callsign: 'K9CHI',
    name: 'Midwest Intertie System',
    location: 'Chicago, IL, USA',
    frequency: '147.270 MHz',
    tone: '107.2 Hz',
    status: 'online',
    activeLinks: 18,
    info: 'Great Lakes regional repeater network covering Illinois, Indiana, and Wisconsin.',
    category: 'Regional'
  },
  {
    node: '51010',
    callsign: 'W0RMT',
    name: 'Rocky Mountain VHF Link',
    location: 'Denver, Colorado, USA',
    frequency: '146.880 MHz',
    tone: '123.0 Hz',
    status: 'online',
    activeLinks: 21,
    info: 'High-altitude mountain top repeater chain across the Colorado Rockies.',
    category: 'Regional'
  },
  {
    node: '52500',
    callsign: 'JA1ZLO',
    name: 'Japan AllStar Gateway',
    location: 'Tokyo, Japan',
    frequency: '433.000 MHz',
    tone: '88.5 Hz',
    status: 'online',
    activeLinks: 15,
    info: 'Japanese amateur radio gateway bridging D-Star, WIRES-X, and AllStarLink.',
    category: 'International'
  },
  {
    node: '53000',
    callsign: 'DL0BER',
    name: 'Europe Conference Bridge',
    location: 'Berlin, Germany',
    frequency: '438.800 MHz',
    tone: '77.0 Hz',
    status: 'online',
    activeLinks: 27,
    info: 'Pan-European multilingual discussion hub with daily nets.',
    category: 'International'
  },
  {
    node: '9999',
    callsign: 'ECHOTEST',
    name: 'Parrot Echo Server',
    location: 'Automated Audio Loopback',
    frequency: 'Digital VoIP',
    tone: 'None',
    status: 'online',
    activeLinks: 3,
    info: 'Audio test server - records your transmission and replays it back to check modulation and levels.',
    category: 'Test'
  },
  {
    node: '2000',
    callsign: 'OPENHUB',
    name: 'Open Repeater Hub 2000',
    location: 'Global Virtual Hub',
    frequency: 'VoIP Bridge',
    tone: 'CSQ',
    status: 'online',
    activeLinks: 52,
    info: 'Open public hub for general ragchewing and link testing without restrictions.',
    category: 'Hubs'
  }
];

export const INITIAL_FAVORITES: FavoriteNode[] = [
  {
    id: 'fav-1',
    node: '2560',
    callsign: 'W6IN',
    name: 'The WIN System',
    location: 'Southern California, USA',
    category: 'Hubs',
    defaultMode: 'transceive',
    includeInScan: true,
    priority: true,
    frequency: '447.800 MHz',
    notes: 'Worldwide Intertie system - great activity daily.'
  },
  {
    id: 'fav-2',
    node: '2146',
    callsign: 'K3WAN',
    name: 'WAN Repeater System',
    location: 'Western PA / Eastern OH',
    category: 'Hubs',
    defaultMode: 'monitor',
    includeInScan: true,
    frequency: '146.910 MHz',
    notes: 'Monitors tri-state repeaters and technical nets.'
  },
  {
    id: 'fav-3',
    node: '27339',
    callsign: 'K4ECR',
    name: 'East Coast Reflector',
    location: 'Philadelphia, PA',
    category: 'Weather & Nets',
    defaultMode: 'monitor',
    includeInScan: true,
    priority: true,
    frequency: '443.850 MHz',
    notes: 'Skywarn weather emergency monitor hub.'
  },
  {
    id: 'fav-4',
    node: '41522',
    callsign: 'MB7INH',
    name: 'HUBNet UK',
    location: 'London, UK',
    category: 'International',
    defaultMode: 'monitor',
    includeInScan: true,
    frequency: '430.400 MHz',
    notes: 'UK nationwide repeaters and evening ragchew nets.'
  },
  {
    id: 'fav-5',
    node: '40864',
    callsign: 'WW7PSR',
    name: 'Puget Sound Repeater Group',
    location: 'Seattle, WA',
    category: 'Regional',
    defaultMode: 'monitor',
    includeInScan: true,
    frequency: '146.960 MHz'
  },
  {
    id: 'fav-6',
    node: '9999',
    callsign: 'ECHOTEST',
    name: 'Parrot Echo Server',
    location: 'Test Loopback',
    category: 'Test',
    defaultMode: 'transceive',
    includeInScan: false,
    notes: 'Use for radio audio check.'
  }
];

export const INITIAL_CONNECTED_LINKS: NodeLink[] = [
  {
    node: '2560',
    callsign: 'W6IN',
    description: 'The WIN System - SoCal Master Hub',
    location: 'Los Angeles, CA',
    mode: 'transceive',
    direction: 'out',
    connectedSince: '48m ago',
    durationSec: 2894,
    isKeyed: false,
    signalLevel: 94,
    lastKeyedCall: 'WB6WTA',
    lastKeyedSecAgo: 14,
    ip: '198.51.100.42',
    frequency: '447.800 MHz'
  },
  {
    node: '27339',
    callsign: 'K4ECR',
    description: 'East Coast Reflector Skywarn Hub',
    location: 'Philadelphia, PA',
    mode: 'monitor',
    direction: 'out',
    connectedSince: '1h 12m ago',
    durationSec: 4320,
    isKeyed: true,
    signalLevel: 88,
    lastKeyedCall: 'KB3WXA',
    lastKeyedSecAgo: 0,
    ip: '203.0.113.88',
    frequency: '443.850 MHz'
  }
];

export const DEFAULT_LOCAL_CONFIG: LocalNodeConfig = {
  nodeNumber: '58841',
  callsign: 'K1SEE',
  frequency: '446.025 MHz',
  tone: '100.0 Hz',
  powerWatts: '25W',
  location: 'New York Metro, NY',
  pttState: 'rx',
  cosActive: true,
  pttActive: false,
  amiHost: '127.0.0.1',
  amiPort: 5038,
  amiUser: 'admin',
  amiSecret: '••••••••••••',
  amiConnected: true,
  rogerBeep: true,
  audioStreamUrl: 'https://stream.allstarlink.org:8000/live',
  squelchLevel: 35,
  volume: 80,
  isMuted: false
};

export const INITIAL_SYSTEM_STATS: SystemStats = {
  hostname: 'allsee-node-01',
  ipAddress: '192.168.1.185',
  gateway: '192.168.1.1',
  wifiSsid: 'HamRadio_Mesh_5G',
  wifiSignalDbm: -58,
  wifiEnabled: true,
  cpuTempC: 44.8,
  cpuUsagePct: 14.2,
  memUsagePct: 29.5,
  memTotalMb: 3940,
  memUsedMb: 1162,
  diskUsagePct: 38.4,
  uptimeSec: 384910,
  asteriskVersion: 'Asterisk 20.6.0-ASL3',
  allscanVersion: 'AllSee v2.5.0-Dark',
  lastPingMs: 24
};

export const INITIAL_USERS: UserAccount[] = [
  {
    id: 'user-1',
    username: 'admin',
    name: 'Station Control Operator',
    role: 'admin',
    email: 'admin@allsee.station',
    lastLogin: 'Today, 10:45 AM',
    active: true
  },
  {
    id: 'user-2',
    username: 'operator',
    name: 'Club Operator 01',
    role: 'operator',
    email: 'op@allsee.station',
    lastLogin: 'Yesterday, 06:12 PM',
    active: true
  },
  {
    id: 'user-3',
    username: 'guest',
    name: 'Public Listen-Only Guest',
    role: 'monitor',
    email: 'guest@allsee.station',
    lastLogin: '3 days ago',
    active: true
  }
];
