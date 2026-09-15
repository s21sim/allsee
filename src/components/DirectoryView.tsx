import React, { useState } from 'react';
import { 
  ListOrdered, 
  Search, 
  Radio, 
  PhoneCall, 
  Eye, 
  Bookmark, 
  Check, 
  Globe, 
  Signal, 
  Info,
  ExternalLink
} from 'lucide-react';
import { ConnectionMode, DirectoryNode, FavoriteNode } from '../types';
import { soundEngine } from '../utils/audioSynthesizer';

interface DirectoryViewProps {
  directoryNodes: DirectoryNode[];
  favorites: FavoriteNode[];
  onConnectNode: (nodeNumber: string, mode: ConnectionMode) => void;
  onAddFavorite: (fav: FavoriteNode) => void;
}

export const DirectoryView: React.FC<DirectoryViewProps> = ({
  directoryNodes,
  favorites,
  onConnectNode,
  onAddFavorite,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Hubs', 'Weather & Nets', 'Regional', 'International', 'Test'];

  const filteredNodes = directoryNodes.filter((node) => {
    const matchesSearch =
      node.node.includes(searchQuery) ||
      node.callsign.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.frequency.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'All' || node.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const isFavorite = (nodeNumber: string) => {
    return favorites.some((f) => f.node === nodeNumber);
  };

  const handleQuickAddFav = (node: DirectoryNode) => {
    if (isFavorite(node.node)) return;
    const newFav: FavoriteNode = {
      id: `fav-${Date.now()}-${Math.random()}`,
      node: node.node,
      callsign: node.callsign,
      name: node.name,
      location: node.location,
      category: node.category,
      defaultMode: 'transceive',
      includeInScan: true,
      frequency: node.frequency,
      notes: node.info,
    };
    onAddFavorite(newFav);
    soundEngine.playConnectChime();
  };

  return (
    <div className="space-y-5">
      {/* Directory Header Banner */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Globe className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold uppercase tracking-wider text-white">
              AllStarLink Global Node Directory
            </h2>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Search active worldwide repeaters, system reflectors, and conference bridges
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 bg-neutral-950 px-3 py-1.5 rounded-xl border border-neutral-800">
          <span>Catalog:</span>
          <span className="text-emerald-400 font-bold">{directoryNodes.length} Verified Nodes</span>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3 shadow-md flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
          <input
            id="directory-search-input"
            type="text"
            placeholder="Search by Node ID, Callsign, City, or Frequency..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

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

      {/* Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredNodes.length === 0 ? (
          <div className="col-span-full bg-neutral-900/50 border border-dashed border-neutral-800 rounded-2xl p-8 text-center text-neutral-500">
            <Radio className="w-8 h-8 mx-auto mb-2 text-neutral-600" />
            <p className="text-sm font-semibold text-neutral-400">No directory nodes match your query</p>
            <p className="text-xs text-neutral-600 mt-1">Search by node number like 2560 or callsign W6IN.</p>
          </div>
        ) : (
          filteredNodes.map((node) => {
            const isFav = isFavorite(node.node);

            return (
              <div
                key={node.node}
                className="bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-2xl p-4 transition-all shadow-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-mono font-bold text-white tracking-tight">
                          Node {node.node}
                        </span>
                        <span className="text-sm font-mono font-bold text-emerald-400">
                          {node.callsign}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-700/60 text-emerald-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          ONLINE
                        </span>
                      </div>
                      <h4 className="text-xs font-semibold text-neutral-200 mt-1">
                        {node.name}
                      </h4>
                    </div>

                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-neutral-400">
                      {node.category}
                    </span>
                  </div>

                  <p className="text-xs text-neutral-400 mt-1">
                    {node.location}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-mono text-neutral-400">
                    <span className="bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
                      Freq: <strong className="text-neutral-200">{node.frequency}</strong>
                    </span>
                    <span className="bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
                      Tone: <strong className="text-neutral-200">{node.tone}</strong>
                    </span>
                    <span className="bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800 text-cyan-400">
                      Active Links: <strong>{node.activeLinks}</strong>
                    </span>
                  </div>

                  <p className="text-xs text-neutral-400 mt-2 bg-neutral-950/60 p-2 rounded-xl border border-neutral-800/80">
                    {node.info}
                  </p>
                </div>

                {/* Card Action Row */}
                <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between">
                  <button
                    onClick={() => handleQuickAddFav(node)}
                    disabled={isFav}
                    className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                      isFav
                        ? 'bg-neutral-950 border-neutral-800 text-emerald-400 cursor-default'
                        : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-300'
                    }`}
                  >
                    {isFav ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Saved to Favs</span>
                      </>
                    ) : (
                      <>
                        <Bookmark className="w-3.5 h-3.5 text-neutral-400" />
                        <span>Add to Favs</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      id={`dir-connect-monitor-${node.node}`}
                      onClick={() => {
                        soundEngine.playConnectChime();
                        onConnectNode(node.node, 'monitor');
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-cyan-300 border border-neutral-700 rounded-lg text-xs font-mono font-semibold transition-colors"
                      title="Connect Listen-Only Monitor (*2)"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Monitor (*2)</span>
                    </button>

                    <button
                      id={`dir-connect-transceive-${node.node}`}
                      onClick={() => {
                        soundEngine.playConnectChime();
                        onConnectNode(node.node, 'transceive');
                      }}
                      className="flex items-center gap-1 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-mono font-bold transition-all shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                      title="Connect Full Transceive (*3)"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>Connect (*3)</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
