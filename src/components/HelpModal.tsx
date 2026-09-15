import React from 'react';
import { HelpCircle, X, Radio, BookOpen, Key, PhoneCall, Disc3, ShieldCheck } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-700 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-5 text-neutral-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center space-x-2">
            <HelpCircle className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">AllSee Quick Reference & Guide</h3>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Intro */}
        <div className="text-xs text-neutral-300 space-y-2 bg-neutral-950 p-3 rounded-xl border border-neutral-800">
          <p className="font-semibold text-white">
            Welcome to AllSee — the Modern Dark UI AllStarLink node scanner and remote management dashboard.
          </p>
          <p className="text-neutral-400">
            AllSee provides full node management, automated favorite hopping with voice carrier pause, active link monitoring, Web Audio DTMF synthesis, and real-time Asterisk control.
          </p>
        </div>

        {/* Standard DTMF Commands Table */}
        <div className="space-y-2">
          <h4 className="text-xs font-mono uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5" />
            Standard AllStarLink DTMF Codes
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2.5 bg-neutral-950 rounded-xl border border-neutral-800">
              <span className="text-emerald-400 font-bold block">*3 &lt;Node&gt;</span>
              <span className="text-neutral-400 text-[11px]">Connect in full Transceive mode (Listen & Talk)</span>
            </div>

            <div className="p-2.5 bg-neutral-950 rounded-xl border border-neutral-800">
              <span className="text-cyan-400 font-bold block">*2 &lt;Node&gt;</span>
              <span className="text-neutral-400 text-[11px]">Connect in Monitor-only mode (Listen only)</span>
            </div>

            <div className="p-2.5 bg-neutral-950 rounded-xl border border-neutral-800">
              <span className="text-red-400 font-bold block">*1 &lt;Node&gt;</span>
              <span className="text-neutral-400 text-[11px]">Disconnect specific remote node link</span>
            </div>

            <div className="p-2.5 bg-neutral-950 rounded-xl border border-neutral-800">
              <span className="text-red-400 font-bold block">*76</span>
              <span className="text-neutral-400 text-[11px]">Disconnect all remote links immediately</span>
            </div>

            <div className="p-2.5 bg-neutral-950 rounded-xl border border-neutral-800">
              <span className="text-amber-400 font-bold block">*70</span>
              <span className="text-neutral-400 text-[11px]">Voice status report (connected nodes & PTT state)</span>
            </div>

            <div className="p-2.5 bg-neutral-950 rounded-xl border border-neutral-800">
              <span className="text-amber-400 font-bold block">*81</span>
              <span className="text-neutral-400 text-[11px]">Say Local IP address of this node host</span>
            </div>

            <div className="p-2.5 bg-neutral-950 rounded-xl border border-neutral-800">
              <span className="text-amber-400 font-bold block">*82</span>
              <span className="text-neutral-400 text-[11px]">Say current system time</span>
            </div>

            <div className="p-2.5 bg-neutral-950 rounded-xl border border-neutral-800">
              <span className="text-amber-400 font-bold block">*80</span>
              <span className="text-neutral-400 text-[11px]">Force voice / CW Morse station identification</span>
            </div>
          </div>
        </div>

        {/* Scanner Engine explanation */}
        <div className="space-y-2 text-xs">
          <h4 className="font-mono uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
            <Disc3 className="w-3.5 h-3.5" />
            Automated Scanner Operation
          </h4>
          <ul className="list-disc list-inside space-y-1 text-neutral-400 bg-neutral-950 p-3 rounded-xl border border-neutral-800">
            <li>The scanner selects nodes from your Favorites that have "Include in Scan" enabled.</li>
            <li>Dwell time specifies how long to listen on a quiet node before stepping to the next.</li>
            <li>When carrier voice activity (COS) is detected, the scanner holds on the node until transmission ends plus the configured hang time.</li>
            <li>You can pause, resume, or skip to the next target at any time via the top toolbar or scanner view.</li>
          </ul>
        </div>

        <div className="pt-2 border-t border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold rounded-xl text-xs transition-all"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
