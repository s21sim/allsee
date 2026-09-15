import React, { useState } from 'react';
import { 
  Terminal, 
  Trash2, 
  Download, 
  Search, 
  Filter, 
  Radio, 
  PhoneCall, 
  Unlink, 
  Key, 
  AlertCircle,
  Disc3,
  Sliders
} from 'lucide-react';
import { ActivityLog } from '../types';

interface ActivityLogsViewProps {
  logs: ActivityLog[];
  onClearLogs: () => void;
}

export const ActivityLogsView: React.FC<ActivityLogsViewProps> = ({
  logs,
  onClearLogs,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredLogs = logs.filter((log) => {
    const matchesType = filterType === 'all' || log.type === filterType;
    const matchesSearch =
      log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.node && log.node.includes(searchQuery)) ||
      (log.callsign && log.callsign.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesType && matchesSearch;
  });

  const handleExportLogs = () => {
    let content = `AllSee Radio Activity Log\nGenerated: ${new Date().toISOString()}\nTotal Records: ${logs.length}\n\n`;
    logs.forEach((log) => {
      content += `[${log.timestamp}] [${log.type.toUpperCase()}] ${log.message}\n`;
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `allsee-activity-${Date.now()}.log`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getTypeBadge = (type: ActivityLog['type']) => {
    switch (type) {
      case 'ptt_rx':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 border border-emerald-700/60 text-emerald-300">
            <Radio className="w-3 h-3 text-emerald-400" />
            COS RX
          </span>
        );
      case 'ptt_tx':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-950 border border-red-700/60 text-red-300">
            <Radio className="w-3 h-3 text-red-400" />
            PTT TX
          </span>
        );
      case 'connect':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-cyan-950 border border-cyan-700/60 text-cyan-300">
            <PhoneCall className="w-3 h-3 text-cyan-400" />
            CONNECT
          </span>
        );
      case 'disconnect':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-neutral-800 border border-neutral-700 text-neutral-400">
            <Unlink className="w-3 h-3 text-neutral-400" />
            DROP
          </span>
        );
      case 'scan':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-blue-950 border border-blue-700/60 text-blue-300">
            <Disc3 className="w-3 h-3 text-blue-400" />
            SCAN
          </span>
        );
      case 'dtmf':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-950 border border-amber-700/60 text-amber-300">
            <Key className="w-3 h-3 text-amber-400" />
            DTMF
          </span>
        );
      case 'alert':
      case 'system':
      default:
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-neutral-900 border border-neutral-700 text-neutral-300">
            <AlertCircle className="w-3 h-3 text-neutral-400" />
            SYSTEM
          </span>
        );
    }
  };

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Terminal className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold uppercase tracking-wider text-white">
              Transmission & Scanner Activity Logs
            </h2>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Real-time event stream of link connects, PTT carrier states, and scanner hops
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="logs-export-btn"
            onClick={handleExportLogs}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-300 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg transition-colors font-mono"
            title="Download log file"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Log</span>
          </button>

          <button
            id="logs-clear-btn"
            onClick={onClearLogs}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-400 bg-red-950/50 hover:bg-red-900/60 border border-red-800/60 rounded-lg transition-colors"
            title="Clear all log entries"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Log</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3 shadow-md flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
          <input
            id="logs-search-input"
            type="text"
            placeholder="Search logs by keyword, node number, or callsign..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: 'all', label: 'All Events' },
            { id: 'ptt_rx', label: 'COS / RX' },
            { id: 'ptt_tx', label: 'PTT / TX' },
            { id: 'connect', label: 'Connects' },
            { id: 'scan', label: 'Scanner' },
            { id: 'dtmf', label: 'DTMF' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilterType(item.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                filterType === item.id
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Terminal List */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-3 font-mono text-xs shadow-2xl overflow-hidden">
        <div className="max-h-[500px] overflow-y-auto space-y-1.5 pr-1">
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-neutral-500">
              <Terminal className="w-8 h-8 mx-auto mb-2 text-neutral-700" />
              <p>No activity logs to display.</p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start sm:items-center justify-between gap-3 p-2 rounded-lg bg-neutral-900/60 hover:bg-neutral-900 border border-neutral-800/80 transition-colors"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-neutral-500 text-[11px] whitespace-nowrap">
                    {log.timestamp}
                  </span>
                  {getTypeBadge(log.type)}
                  <span className="text-neutral-200 font-sans sm:font-mono text-xs">
                    {log.message}
                  </span>
                </div>

                {log.node && (
                  <span className="text-[11px] text-emerald-400 font-bold bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800 whitespace-nowrap">
                    Node {log.node}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
