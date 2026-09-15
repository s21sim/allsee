import React from 'react';
import { Palette, X, Check, Sparkles } from 'lucide-react';

export type AccentTheme = 'emerald' | 'cyan' | 'amber' | 'violet' | 'red';
export type DarkBgMode = 'obsidian' | 'midnight' | 'oled';

interface ThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  accentTheme: AccentTheme;
  onChangeAccent: (theme: AccentTheme) => void;
  darkBgMode: DarkBgMode;
  onChangeBgMode: (mode: DarkBgMode) => void;
}

export const ThemeModal: React.FC<ThemeModalProps> = ({
  isOpen,
  onClose,
  accentTheme,
  onChangeAccent,
  darkBgMode,
  onChangeBgMode,
}) => {
  if (!isOpen) return null;

  const accents: Array<{ id: AccentTheme; name: string; color: string; border: string }> = [
    { id: 'emerald', name: 'Cyber Emerald (Ham Standard)', color: 'bg-emerald-500', border: 'border-emerald-500' },
    { id: 'cyan', name: 'Electric Cyan (Sci-Fi)', color: 'bg-cyan-500', border: 'border-cyan-500' },
    { id: 'amber', name: 'Amber Radiance (Vintage VFD)', color: 'bg-amber-500', border: 'border-amber-500' },
    { id: 'violet', name: 'Neon Violet (Synthwave)', color: 'bg-purple-500', border: 'border-purple-500' },
    { id: 'red', name: 'Signal Crimson (High Alert)', color: 'bg-red-500', border: 'border-red-500' },
  ];

  const backgrounds: Array<{ id: DarkBgMode; name: string; desc: string }> = [
    { id: 'obsidian', name: 'Obsidian Charcoal', desc: 'Balanced high-contrast deep gray with subtle depth' },
    { id: 'midnight', name: 'Midnight Navy', desc: 'Slight cool blue-tinted modern dark aesthetic' },
    { id: 'oled', name: 'True OLED Pitch Black', desc: 'Absolute #000000 black canvas for battery saving and OLED displays' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-700 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 text-neutral-200">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center space-x-2">
            <Palette className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Modern Dark UI Theme</h3>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Accent Selector */}
        <div>
          <label className="text-xs font-mono uppercase tracking-wider text-neutral-400 block mb-2">
            RF Accent Color
          </label>
          <div className="space-y-2">
            {accents.map((acc) => (
              <button
                key={acc.id}
                onClick={() => onChangeAccent(acc.id)}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  accentTheme === acc.id
                    ? 'bg-neutral-800 border-neutral-600 text-white shadow-md'
                    : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:bg-neutral-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-4 h-4 rounded-full ${acc.color} shadow-sm`} />
                  <span>{acc.name}</span>
                </div>
                {accentTheme === acc.id && <Check className="w-4 h-4 text-emerald-400" />}
              </button>
            ))}
          </div>
        </div>

        {/* Background Mode */}
        <div>
          <label className="text-xs font-mono uppercase tracking-wider text-neutral-400 block mb-2">
            Canvas Dark Mode
          </label>
          <div className="space-y-2">
            {backgrounds.map((bg) => (
              <button
                key={bg.id}
                onClick={() => onChangeBgMode(bg.id)}
                className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all ${
                  darkBgMode === bg.id
                    ? 'bg-neutral-800 border-neutral-600 text-white shadow-md'
                    : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:bg-neutral-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-neutral-200">{bg.name}</span>
                  {darkBgMode === bg.id && <Check className="w-4 h-4 text-emerald-400" />}
                </div>
                <p className="text-[11px] text-neutral-500 mt-0.5">{bg.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2 border-t border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg transition-all"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
