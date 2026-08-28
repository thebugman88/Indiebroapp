import React, { useState } from 'react';
import { 
  Folder as FolderIcon, 
  FolderPlus, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  Layers, 
  Music, 
  AlertCircle,
  FileText
} from 'lucide-react';
import { Folder } from '../types';

interface SidebarProps {
  folders: Folder[];
  activeFolderId: string | null;
  activeView: 'all' | 'tracks' | 'unverified' | 'folder';
  onSelectView: (view: 'all' | 'tracks' | 'unverified' | 'folder', folderId?: string | null) => void;
  onCreateFolder: (name: string, color: string) => Promise<void>;
  onRenameFolder: (id: string, newName: string) => Promise<void>;
  onDeleteFolder: (id: string) => Promise<void>;
  totalFiles: number;
  totalTracks: number;
  unverifiedTracksCount: number;
  getFileCountForFolder: (folderId: string | null) => number;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const FOLDER_COLORS = [
  '#f59e0b', // Amber (design theme default)
  '#6366f1', // Indigo
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#ec4899', // Pink
  '#8b5cf6', // Purple
  '#14b8a6', // Teal
];

export const Sidebar: React.FC<SidebarProps> = ({
  folders,
  activeFolderId,
  activeView,
  onSelectView,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  totalFiles,
  totalTracks,
  unverifiedTracksCount,
  getFileCountForFolder,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedColor, setSelectedColor] = useState(FOLDER_COLORS[0]);

  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    await onCreateFolder(newFolderName.trim(), selectedColor);
    setNewFolderName('');
    setIsCreating(false);
    if (onCloseMobile) onCloseMobile();
  };

  const handleStartRename = (folder: Folder, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingFolderId(folder.id);
    setEditName(folder.name);
  };

  const handleSaveRename = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editName.trim()) {
      await onRenameFolder(id, editName.trim());
    }
    setEditingFolderId(null);
  };

  const handleDelete = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Delete folder "${name}"? Files will be moved to unorganized.`)) {
      await onDeleteFolder(id);
    }
  };

  const handleSelectAndCloseMobile = (view: 'all' | 'tracks' | 'unverified' | 'folder', folderId?: string | null) => {
    onSelectView(view, folderId);
    if (onCloseMobile) onCloseMobile();
  };

  // Estimated storage computation
  const estimatedStorageMb = ((totalFiles * 1.8) + (totalTracks * 0.05)).toFixed(1);
  const storagePercentage = Math.min(100, Math.max(8, Math.round((parseFloat(estimatedStorageMb) / 50) * 100)));

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs md:hidden"
        />
      )}

      <aside className={`
        fixed md:static inset-y-0 left-0 z-40
        w-64 sm:w-72 md:w-60 lg:w-64 border-r border-slate-800 bg-[#0f172a] 
        flex flex-col h-full md:h-[calc(100vh-4rem)] text-slate-300 select-none shrink-0
        transition-transform duration-200 ease-in-out
        ${isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* File System Header */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-[#0f172a]">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            File System
          </span>
          <div className="flex items-center gap-2">
            <button
              id="create-folder-btn"
              onClick={() => setIsCreating(true)}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-bold tracking-tight transition-colors"
            >
              + NEW FOLDER
            </button>
            {onCloseMobile && (
              <button
                onClick={onCloseMobile}
                className="p-1 md:hidden text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation Links */}
        <div className="p-3 space-y-1 border-b border-slate-800/80">
          <button
            id="nav-all-files"
            onClick={() => handleSelectAndCloseMobile('all', null)}
            className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded transition-colors ${
              activeView === 'all' && activeFolderId === null
                ? 'bg-slate-800 text-slate-100 font-semibold'
                : 'hover:bg-slate-800/50 text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>All Documents & Images</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
              {totalFiles}
            </span>
          </button>

          <button
            id="nav-all-tracks"
            onClick={() => handleSelectAndCloseMobile('tracks', null)}
            className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded transition-colors ${
              activeView === 'tracks'
                ? 'bg-slate-800 text-slate-100 font-semibold'
                : 'hover:bg-slate-800/50 text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Music className="w-4 h-4 text-violet-400" />
              <span>Extracted Tracks Database</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
              {totalTracks}
            </span>
          </button>

          {unverifiedTracksCount > 0 && (
            <button
              id="nav-unverified"
              onClick={() => handleSelectAndCloseMobile('unverified', null)}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded transition-colors ${
                activeView === 'unverified'
                  ? 'bg-amber-500/10 text-amber-300 font-semibold border border-amber-500/20'
                  : 'hover:bg-slate-800/50 text-amber-400/90'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span>Needs Review</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {unverifiedTracksCount}
              </span>
            </button>
          )}
        </div>

        {/* Folders List Area */}
      <div className="flex-1 overflow-y-auto py-2 px-3 space-y-1">
        <div className="px-2 py-1 flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Folders & Albums
          </span>
        </div>

        {/* Create Folder Form */}
        {isCreating && (
          <form onSubmit={handleCreateSubmit} className="p-2.5 my-1.5 bg-slate-900 rounded-lg border border-slate-800 space-y-2">
            <input
              type="text"
              autoFocus
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="e.g. 2024_Q1_Spotify..."
              className="w-full text-xs px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
            />
            {/* Color swatches */}
            <div className="flex items-center justify-between">
              <div className="flex space-x-1">
                {FOLDER_COLORS.slice(0, 5).map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    style={{ backgroundColor: color }}
                    className={`w-3.5 h-3.5 rounded-full border ${
                      selectedColor === color ? 'border-white ring-1 ring-white' : 'border-transparent'
                    }`}
                  />
                ))}
              </div>
              <div className="flex space-x-1">
                <button
                  type="submit"
                  className="px-2 py-0.5 text-[10px] bg-indigo-600 hover:bg-indigo-500 text-white rounded font-bold"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="p-0.5 text-slate-400 hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Unorganized Folder */}
        <div
          id="folder-unorganized"
          onClick={() => onSelectView('folder', null)}
          className={`flex items-center gap-2 p-2 rounded text-sm transition-colors cursor-pointer ${
            activeView === 'folder' && activeFolderId === null
              ? 'bg-slate-800/80 text-slate-100 font-medium'
              : 'hover:bg-slate-800/40 text-slate-400'
          }`}
        >
          <svg className="w-4 h-4 text-slate-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"></path>
          </svg>
          <span className="truncate flex-1 text-xs">Unsorted Uploads</span>
          <span className="text-[10px] font-mono text-slate-500">
            {getFileCountForFolder(null)}
          </span>
        </div>

        {/* Custom Folders */}
        {folders.map((folder) => {
          const isSelected = activeView === 'folder' && activeFolderId === folder.id;
          const isEditing = editingFolderId === folder.id;
          const fileCount = getFileCountForFolder(folder.id);

          return (
            <div
              key={folder.id}
              onClick={() => onSelectView('folder', folder.id)}
              className={`flex items-center gap-2 p-2 rounded text-sm transition-colors cursor-pointer group ${
                isSelected
                  ? 'bg-slate-800/80 text-slate-100 font-medium'
                  : 'hover:bg-slate-800/40 text-slate-400'
              }`}
            >
              <svg 
                className="w-4 h-4 shrink-0" 
                style={{ color: folder.color || '#f59e0b' }} 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"></path>
              </svg>

              {isEditing ? (
                <input
                  type="text"
                  autoFocus
                  value={editName}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveRename(folder.id, e as any);
                    if (e.key === 'Escape') setEditingFolderId(null);
                  }}
                  className="w-full text-xs px-1.5 py-0.5 bg-slate-900 border border-indigo-500 rounded text-slate-100 focus:outline-none font-mono"
                />
              ) : (
                <span className="truncate flex-1 text-xs font-mono">{folder.name}</span>
              )}

              {/* Action Buttons & Counter */}
              <div className="flex items-center space-x-1 shrink-0">
                {isEditing ? (
                  <>
                    <button
                      onClick={(e) => handleSaveRename(folder.id, e)}
                      className="p-1 text-emerald-400 hover:text-emerald-300"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingFolderId(null);
                      }}
                      className="p-1 text-slate-400 hover:text-slate-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-[10px] font-mono text-slate-500 group-hover:hidden">
                      {fileCount}
                    </span>
                    <div className="hidden group-hover:flex items-center space-x-0.5">
                      <button
                        onClick={(e) => handleStartRename(folder, e)}
                        className="p-1 text-slate-400 hover:text-indigo-400 transition-colors"
                        title="Rename Folder"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(folder.id, folder.name, e)}
                        className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Delete Folder"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}

        {folders.length === 0 && !isCreating && (
          <div className="py-6 text-center">
            <p className="text-[10px] text-slate-500 font-mono">No custom folders created</p>
            <button
              onClick={() => setIsCreating(true)}
              className="mt-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-bold"
            >
              + Create folder
            </button>
          </div>
        )}
      </div>

      {/* Sleek Storage Usage Widget */}
      <div className="p-4 bg-slate-900/80 border-t border-slate-800">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-tighter">
            Storage Usage
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            {estimatedStorageMb} MB / 50 MB
          </span>
        </div>
        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-indigo-500 transition-all duration-300"
            style={{ width: `${storagePercentage}%` }}
          />
        </div>
      </div>
    </aside>
  </>
);
};
