import React, { useState } from 'react';
import { 
  Bookmark, 
  Plus, 
  Trash2, 
  Edit3, 
  PhoneCall, 
  Eye, 
  Download, 
  Upload, 
  Search, 
  Star, 
  Check, 
  Radio, 
  Filter,
  CheckCircle2,
  X
} from 'lucide-react';
import { ConnectionMode, DirectoryNode, FavoriteNode } from '../types';
import { soundEngine } from '../utils/audioSynthesizer';

interface FavoritesManagerProps {
  favorites: FavoriteNode[];
  directoryNodes: DirectoryNode[];
  onAddFavorite: (fav: FavoriteNode) => void;
  onUpdateFavorite: (id: string, fav: Partial<FavoriteNode>) => void;
  onDeleteFavorite: (id: string) => void;
  onConnectNode: (nodeNumber: string, mode: ConnectionMode) => void;
  onImportFavorites: (newFavs: FavoriteNode[]) => void;
}

export const FavoritesManager: React.FC<FavoritesManagerProps> = ({
  favorites,
  directoryNodes,
  onAddFavorite,
  onUpdateFavorite,
  onDeleteFavorite,
  onConnectNode,
  onImportFavorites,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingFav, setEditingFav] = useState<FavoriteNode | null>(null);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [importText, setImportText] = useState<string>('');

  // Form State
  const [formNode, setFormNode] = useState<string>('');
  const [formCallsign, setFormCallsign] = useState<string>('');
  const [formName, setFormName] = useState<string>('');
  const [formLocation, setFormLocation] = useState<string>('');
  const [formCategory, setFormCategory] = useState<string>('Hubs');
  const [formMode, setFormMode] = useState<ConnectionMode>('transceive');
  const [formScan, setFormScan] = useState<boolean>(true);
  const [formPriority, setFormPriority] = useState<boolean>(false);
  const [formFrequency, setFormFrequency] = useState<string>('');
  const [formNotes, setFormNotes] = useState<string>('');

  const categories = ['All', 'Hubs', 'Weather & Nets', 'Regional', 'International', 'Test'];

  const filteredFavorites = favorites.filter((fav) => {
    const matchesSearch =
      fav.node.includes(searchQuery) ||
      fav.callsign.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fav.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fav.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'All' || fav.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const openAddModal = () => {
    setEditingFav(null);
    setFormNode('');
    setFormCallsign('');
    setFormName('');
    setFormLocation('');
    setFormCategory('Hubs');
    setFormMode('transceive');
    setFormScan(true);
    setFormPriority(false);
    setFormFrequency('');
    setFormNotes('');
    setShowAddModal(true);
  };

  const openEditModal = (fav: FavoriteNode) => {
    setEditingFav(fav);
    setFormNode(fav.node);
    setFormCallsign(fav.callsign);
    setFormName(fav.name);
    setFormLocation(fav.location);
    setFormCategory(fav.category);
    setFormMode(fav.defaultMode);
    setFormScan(fav.includeInScan);
    setFormPriority(!!fav.priority);
    setFormFrequency(fav.frequency || '');
    setFormNotes(fav.notes || '');
    setShowAddModal(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNode.trim() || !formCallsign.trim()) return;

    if (editingFav) {
      onUpdateFavorite(editingFav.id, {
        node: formNode.trim(),
        callsign: formCallsign.trim().toUpperCase(),
        name: formName.trim() || `Node ${formNode}`,
        location: formLocation.trim() || 'Worldwide Link',
        category: formCategory,
        defaultMode: formMode,
        includeInScan: formScan,
        priority: formPriority,
        frequency: formFrequency.trim(),
        notes: formNotes.trim(),
      });
    } else {
      const newFav: FavoriteNode = {
        id: `fav-${Date.now()}`,
        node: formNode.trim(),
        callsign: formCallsign.trim().toUpperCase(),
        name: formName.trim() || `Node ${formNode}`,
        location: formLocation.trim() || 'Worldwide Link',
        category: formCategory,
        defaultMode: formMode,
        includeInScan: formScan,
        priority: formPriority,
        frequency: formFrequency.trim(),
        notes: formNotes.trim(),
      };
      onAddFavorite(newFav);
      soundEngine.playConnectChime();
    }

    setShowAddModal(false);
  };

  // Export to INI format (like AllScan favorites.ini)
  const handleExportIni = () => {
    let iniContent = '; AllSee / AllScan favorites export\n; Generated on ' + new Date().toISOString() + '\n\n';
    favorites.forEach((fav) => {
      iniContent += `[${fav.node}]\n`;
      iniContent += `callsign = ${fav.callsign}\n`;
      iniContent += `name = ${fav.name}\n`;
      iniContent += `location = ${fav.location}\n`;
      iniContent += `category = ${fav.category}\n`;
      iniContent += `default_mode = ${fav.defaultMode}\n`;
      iniContent += `include_in_scan = ${fav.includeInScan ? '1' : '0'}\n`;
      if (fav.frequency) iniContent += `frequency = ${fav.frequency}\n`;
      if (fav.notes) iniContent += `notes = ${fav.notes}\n`;
      iniContent += '\n';
    });

    const blob = new Blob([iniContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'favorites.ini';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportSubmit = () => {
    try {
      // Parse INI or JSON
      const parsedFavs: FavoriteNode[] = [];
      const lines = importText.split('\n');
      let currentNode: Partial<FavoriteNode> | null = null;

      lines.forEach((rawLine) => {
        const line = rawLine.trim();
        if (!line || line.startsWith(';') || line.startsWith('#')) return;

        const sectionMatch = line.match(/^\[(.*)\]$/);
        if (sectionMatch) {
          if (currentNode && currentNode.node) {
            parsedFavs.push({
              id: `fav-${Date.now()}-${Math.random()}`,
              node: currentNode.node,
              callsign: currentNode.callsign || `NODE${currentNode.node}`,
              name: currentNode.name || `Node ${currentNode.node}`,
              location: currentNode.location || 'Imported Link',
              category: currentNode.category || 'Hubs',
              defaultMode: currentNode.defaultMode || 'transceive',
              includeInScan: currentNode.includeInScan !== false,
            });
          }
          currentNode = { node: sectionMatch[1].trim() };
          return;
        }

        if (currentNode && line.includes('=')) {
          const [key, ...rest] = line.split('=');
          const val = rest.join('=').trim();
          const cleanKey = key.trim().toLowerCase();

          if (cleanKey === 'callsign') currentNode.callsign = val.toUpperCase();
          if (cleanKey === 'name') currentNode.name = val;
          if (cleanKey === 'location') currentNode.location = val;
          if (cleanKey === 'category') currentNode.category = val;
          if (cleanKey === 'default_mode') currentNode.defaultMode = val as ConnectionMode;
          if (cleanKey === 'include_in_scan') currentNode.includeInScan = val === '1' || val.toLowerCase() === 'true';
          if (cleanKey === 'frequency') currentNode.frequency = val;
          if (cleanKey === 'notes') currentNode.notes = val;
        }
      });

      if (currentNode && currentNode.node) {
        parsedFavs.push({
          id: `fav-${Date.now()}-${Math.random()}`,
          node: currentNode.node,
          callsign: currentNode.callsign || `NODE${currentNode.node}`,
          name: currentNode.name || `Node ${currentNode.node}`,
          location: currentNode.location || 'Imported Link',
          category: currentNode.category || 'Hubs',
          defaultMode: currentNode.defaultMode || 'transceive',
          includeInScan: currentNode.includeInScan !== false,
        });
      }

      if (parsedFavs.length > 0) {
        onImportFavorites(parsedFavs);
        setShowImportModal(false);
        setImportText('');
        soundEngine.playConnectChime();
      }
    } catch {
      alert('Could not parse favorites. Please ensure valid INI format.');
    }
  };

  return (
    <div className="space-y-5">
      {/* Header Bar */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Bookmark className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold uppercase tracking-wider text-white">
              Node Favorites & Scanner Playlists
            </h2>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Manage your saved repeaters, conference reflectors, and scan groups
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            id="fav-export-btn"
            onClick={handleExportIni}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-300 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg transition-colors font-mono"
            title="Export to favorites.ini"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export (.ini)</span>
          </button>

          <button
            id="fav-import-btn"
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-300 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg transition-colors font-mono"
            title="Import from favorites.ini"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import (.ini)</span>
          </button>

          <button
            id="fav-add-new-btn"
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-all shadow-[0_0_12px_rgba(16,185,129,0.35)]"
          >
            <Plus className="w-4 h-4" />
            <span>Add Node</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3 shadow-md flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Box */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
          <input
            id="fav-search-input"
            type="text"
            placeholder="Filter by node number, callsign, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Favorites Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFavorites.length === 0 ? (
          <div className="col-span-full bg-neutral-900/50 border border-dashed border-neutral-800 rounded-2xl p-8 text-center text-neutral-500">
            <Bookmark className="w-8 h-8 mx-auto mb-2 text-neutral-600" />
            <p className="text-sm font-semibold text-neutral-400">No favorites match your search</p>
            <p className="text-xs text-neutral-600 mt-1">Try changing filters or add a new node favorite above.</p>
          </div>
        ) : (
          filteredFavorites.map((fav) => (
            <div
              key={fav.id}
              className="bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-2xl p-4 transition-all shadow-lg flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-lg font-mono font-bold text-white tracking-tight">
                        Node {fav.node}
                      </span>
                      <span className="text-xs font-mono font-semibold text-emerald-400">
                        {fav.callsign}
                      </span>
                      {fav.priority && (
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-current" />
                      )}
                    </div>
                    <h4 className="text-xs font-semibold text-neutral-200 mt-0.5 line-clamp-1">
                      {fav.name}
                    </h4>
                  </div>

                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-neutral-400">
                    {fav.category}
                  </span>
                </div>

                <p className="text-[11px] text-neutral-400 mt-1 line-clamp-1">
                  {fav.location}
                </p>

                {fav.frequency && (
                  <p className="text-[10px] font-mono text-neutral-500 mt-0.5">
                    Freq: {fav.frequency}
                  </p>
                )}

                {fav.notes && (
                  <p className="text-[11px] text-neutral-400 mt-2 bg-neutral-950/60 p-1.5 rounded-lg border border-neutral-800/80 italic">
                    "{fav.notes}"
                  </p>
                )}
              </div>

              {/* Action Bar */}
              <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between">
                {/* Include in scan toggle */}
                <label
                  className="flex items-center gap-1.5 text-[11px] font-mono text-neutral-300 cursor-pointer"
                  title="Toggle inclusion in automated scanner"
                >
                  <input
                    type="checkbox"
                    checked={fav.includeInScan}
                    onChange={(e) =>
                      onUpdateFavorite(fav.id, { includeInScan: e.target.checked })
                    }
                    className="rounded border-neutral-700 bg-neutral-800 text-cyan-500 focus:ring-0"
                  />
                  <span className={fav.includeInScan ? 'text-cyan-400' : 'text-neutral-500'}>
                    Scan
                  </span>
                </label>

                {/* Connect Buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      soundEngine.playConnectChime();
                      onConnectNode(fav.node, 'transceive');
                    }}
                    className="flex items-center gap-1 px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-mono font-bold transition-all shadow-sm"
                    title="Connect Transceive (*3)"
                  >
                    <PhoneCall className="w-3 h-3" />
                    <span>*3</span>
                  </button>

                  <button
                    onClick={() => {
                      soundEngine.playConnectChime();
                      onConnectNode(fav.node, 'monitor');
                    }}
                    className="flex items-center gap-1 px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-cyan-300 border border-neutral-700 rounded-lg text-xs font-mono font-semibold transition-colors"
                    title="Connect Monitor Only (*2)"
                  >
                    <Eye className="w-3 h-3" />
                    <span>*2</span>
                  </button>

                  <button
                    onClick={() => openEditModal(fav)}
                    className="p-1 text-neutral-400 hover:text-neutral-200 transition-colors"
                    title="Edit favorite"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onDeleteFavorite(fav.id)}
                    className="p-1 text-neutral-400 hover:text-red-400 transition-colors"
                    title="Delete favorite"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Favorite Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-5 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-emerald-400" />
                {editingFav ? 'Edit Node Favorite' : 'Add Node Favorite'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-400 block mb-1 font-mono">Node Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2560"
                    value={formNode}
                    onChange={(e) => setFormNode(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-white font-mono focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-neutral-400 block mb-1 font-mono">Callsign *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. W6IN"
                    value={formCallsign}
                    onChange={(e) => setFormCallsign(e.target.value.toUpperCase())}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-white font-mono uppercase focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-neutral-400 block mb-1 font-mono">System / Net Name</label>
                <input
                  type="text"
                  placeholder="e.g. The WIN System - Worldwide"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-white focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-400 block mb-1 font-mono">Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Los Angeles, CA"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-white focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-neutral-400 block mb-1 font-mono">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-white focus:border-emerald-500 outline-none"
                  >
                    <option value="Hubs">Hubs</option>
                    <option value="Weather & Nets">Weather & Nets</option>
                    <option value="Regional">Regional</option>
                    <option value="International">International</option>
                    <option value="Test">Test / Echo</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-400 block mb-1 font-mono">Frequency (optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. 447.800 MHz"
                    value={formFrequency}
                    onChange={(e) => setFormFrequency(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-white font-mono focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-neutral-400 block mb-1 font-mono">Default Connect Mode</label>
                  <select
                    value={formMode}
                    onChange={(e) => setFormMode(e.target.value as ConnectionMode)}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-white focus:border-emerald-500 outline-none"
                  >
                    <option value="transceive">Transceive (*3)</option>
                    <option value="monitor">Monitor Only (*2)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-neutral-400 block mb-1 font-mono">Notes</label>
                <textarea
                  placeholder="Notes, net times, tones, or description..."
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-white focus:border-emerald-500 outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center space-x-2 text-neutral-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formScan}
                    onChange={(e) => setFormScan(e.target.checked)}
                    className="rounded border-neutral-700 bg-neutral-800 text-emerald-500 focus:ring-0"
                  />
                  <span>Include in Automated Scanner</span>
                </label>

                <label className="flex items-center space-x-2 text-neutral-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formPriority}
                    onChange={(e) => setFormPriority(e.target.checked)}
                    className="rounded border-neutral-700 bg-neutral-800 text-amber-500 focus:ring-0"
                  />
                  <span>Priority Favorite</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-neutral-300 hover:bg-neutral-800 rounded-xl font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition-all"
                >
                  {editingFav ? 'Save Changes' : 'Add to Favorites'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-5 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-cyan-400" />
                Import Favorites (.ini)
              </h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-400">
              Paste contents of an AllScan <code className="text-cyan-400 font-mono">favorites.ini</code> file below:
            </p>

            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="[2560]
callsign = W6IN
name = The WIN System
location = California, USA
include_in_scan = 1"
              rows={8}
              className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-3 text-xs font-mono text-emerald-400 focus:border-cyan-500 outline-none"
            />

            <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 text-neutral-300 hover:bg-neutral-800 rounded-xl font-semibold transition-colors text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImportSubmit}
                disabled={!importText.trim()}
                className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-bold rounded-xl shadow-lg transition-all text-xs"
              >
                Import Nodes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
