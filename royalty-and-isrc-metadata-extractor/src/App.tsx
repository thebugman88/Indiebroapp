import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { FileManager } from './components/FileManager';
import { TrackTable } from './components/TrackTable';
import { OcrInspector } from './components/OcrInspector';
import { ExportModal } from './components/ExportModal';
import { SettingsModal } from './components/SettingsModal';
import { ManualTrackModal } from './components/ManualTrackModal';
import { AiAssistantModal } from './components/AiAssistantModal';
import { ByokIntegrationsModal } from './components/ByokIntegrationsModal';
import { Footer } from './components/Footer';
import { Folder, MediaFile, ParsedTrack, AppSettings } from './types';
import { createRoyaltyStorage, DEFAULT_SETTINGS } from './services/storage';
import { getCurrentAuthUser } from '../../src/services/authService';
import { processImageWithOCR } from './services/ocrEngine';
import { Sparkles, Bot } from 'lucide-react';

export default function App() {
  const [session, setSession] = useState(() => ({ uid: getCurrentAuthUser().id, revision: 0 }));
  useEffect(() => {
    const sync = () => { const uid = getCurrentAuthUser().id; setSession(old => old.uid === uid ? old : { uid, revision: old.revision + 1 }); };
    window.addEventListener('ib_auth_changed', sync); sync();
    return () => window.removeEventListener('ib_auth_changed', sync);
  }, []);
  if (session.uid === 'guest') return <p role="status" className="p-6 text-amber-300">Sign in to use your private RoyaltyOps workspace.</p>;
  return <RoyaltyWorkspace key={session.revision} uid={session.uid} />;
}
function RoyaltyWorkspace({ uid }: { uid: string }) {
  const active = useRef(true);
  const isCurrent = () => active.current && getCurrentAuthUser().id === uid;
  useEffect(() => {
    active.current = true;
    const changed = () => { if (getCurrentAuthUser().id !== uid) active.current = false; };
    window.addEventListener('ib_auth_changed', changed);
    return () => { active.current = false; window.removeEventListener('ib_auth_changed', changed); };
  }, [uid]);
  const [storage] = useState(() => createRoyaltyStorage(uid, isCurrent));
  const [storageError, setStorageError] = useState('');
  // Application Data States (Loaded from IndexedDB)
  const [folders, setFolders] = useState<Folder[]>([]);
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [tracks, setTracks] = useState<ParsedTrack[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Navigation & View States
  const [activeView, setActiveView] = useState<'all' | 'tracks' | 'unverified' | 'folder'>('all');
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Selection States
  const [selectedTrackIds, setSelectedTrackIds] = useState<string[]>([]);

  // Modal States
  const [inspectingFile, setInspectingFile] = useState<MediaFile | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isManualTrackModalOpen, setIsManualTrackModalOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isByokModalOpen, setIsByokModalOpen] = useState(false);

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);

  // Load initial data from IndexedDB
  const loadDatabase = useCallback(async () => {
    try {
      const [savedFolders, savedFiles, savedTracks, savedSettings] = await Promise.all([
        storage.getAllFolders(),
        storage.getAllFiles(),
        storage.getAllTracks(),
        storage.getSettings(),
      ]);
      if (!isCurrent()) return;
      setStorageError('');
      setFolders(savedFolders);
      setFiles(savedFiles);
      setTracks(savedTracks);
      setSettings(savedSettings);
    } catch (err) {
      if (isCurrent()) setStorageError('Saved data could not be loaded. It has not been replaced. Check browser storage and reopen RoyaltyOps.');
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadDatabase();
  }, [loadDatabase]);

  // ----------------- FOLDER HANDLERS -----------------
  const handleCreateFolder = async (name: string, color: string) => {
    const newFolder: Folder = {
      id: `fld-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name,
      parentId: null,
      color,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await storage.saveFolder(newFolder);
    setFolders(prev => [...prev, newFolder]);
    setActiveView('folder');
    setActiveFolderId(newFolder.id);
  };

  const handleRenameFolder = async (id: string, newName: string) => {
    const folder = folders.find(f => f.id === id);
    if (folder) {
      const updated = { ...folder, name: newName, updatedAt: Date.now() };
      await storage.saveFolder(updated);
      setFolders(prev => prev.map(f => f.id === id ? updated : f));
    }
  };

  const handleDeleteFolder = async (id: string) => {
    await storage.deleteFolder(id);
    setFolders(prev => prev.filter(f => f.id !== id));
    setFiles(prev => prev.map(f => f.folderId === id ? { ...f, folderId: null } : f));
    setTracks(prev => prev.map(t => t.folderId === id ? { ...t, folderId: null } : t));
    if (activeFolderId === id) {
      setActiveFolderId(null);
      setActiveView('all');
    }
  };

  // ----------------- FILE & OCR HANDLERS -----------------
  const handleUploadFiles = async (uploadedFiles: File[]) => {
    const newMediaFiles: MediaFile[] = [];

    for (const file of uploadedFiles) {
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });

      const mediaFile: MediaFile = {
        id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        folderId: activeView === 'folder' ? activeFolderId : null,
        name: file.name,
        size: file.size,
        type: file.type,
        dataUrl,
        status: 'pending',
        ocrProgress: 0,
        trackCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await storage.saveFile(mediaFile);
      newMediaFiles.push(mediaFile);
    }

    setFiles(prev => [...prev, ...newMediaFiles]);

    // Files are persisted before OCR starts
    for (const mediaFile of newMediaFiles) {
      await handleRunOcr(mediaFile.id);
    }
  };

  const handleRunOcr = async (fileId: string) => {
    if (!isCurrent()) return;
    const file = await storage.getFileById(fileId);
    if (!file) return;

    setIsProcessing(true);
    await storage.updateFileStatus(fileId, 'processing', 10);
    setFiles(prev => prev.map(f => f.id === fileId ? { ...f, status: 'processing', ocrProgress: 10 } : f));

    try {
      const result = await processImageWithOCR(
        file.dataUrl,
        file.id,
        file.folderId,
        settings,
        async (progress, statusText) => {
          setFiles(prev => prev.map(f => f.id === fileId ? { ...f, ocrProgress: progress } : f));
        }
      );

      // Save tracks to IndexedDB
      await storage.saveTracks(result.parsedTracks);

      // Update file status
      await storage.updateFileStatus(
        fileId,
        'completed',
        100,
        result.rawText,
        undefined,
        result.parsedTracks.length
      );

      setFiles(prev => prev.map(f => f.id === fileId ? {
        ...f,
        status: 'completed',
        ocrProgress: 100,
        rawOcrText: result.rawText,
        trackCount: result.parsedTracks.length,
      } : f));

      // Refresh tracks in state
      const allTracks = await storage.getAllTracks();
      setTracks(allTracks);

      // If inspecting, update inspecting file
      if (inspectingFile && inspectingFile.id === fileId) {
        setInspectingFile(prev => prev ? {
          ...prev,
          status: 'completed',
          ocrProgress: 100,
          rawOcrText: result.rawText,
          trackCount: result.parsedTracks.length,
        } : null);
      }
    } catch (err: any) {
      console.error('OCR processing error:', err);
      if (!isCurrent()) return;
      await storage.updateFileStatus(fileId, 'error', 0, undefined, err.message || 'OCR processing failed');
      setFiles(prev => prev.map(f => f.id === fileId ? {
        ...f,
        status: 'error',
        errorMessage: err.message || 'OCR failed',
      } : f));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRunBatchOcr = async (fileIds: string[]) => {
    for (const id of fileIds) {
      await handleRunOcr(id);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    await storage.deleteFile(fileId);
    setFiles(prev => prev.filter(f => f.id !== fileId));
    setTracks(prev => prev.filter(t => t.fileId !== fileId));
    if (inspectingFile?.id === fileId) {
      setInspectingFile(null);
    }
  };

  const handleDeleteBatchFiles = async (fileIds: string[]) => {
    for (const id of fileIds) {
      await storage.deleteFile(id);
    }
    setFiles(prev => prev.filter(f => !fileIds.includes(f.id)));
    setTracks(prev => prev.filter(t => !fileIds.includes(t.fileId || '')));
  };

  const handleMoveFileToFolder = async (fileId: string, folderId: string | null) => {
    const file = files.find(f => f.id === fileId);
    if (file) {
      const updated = { ...file, folderId, updatedAt: Date.now() };
      await storage.saveFile(updated);
      setFiles(prev => prev.map(f => f.id === fileId ? updated : f));
      const associatedTracks = tracks.filter(t => t.fileId === fileId);
      for (const t of associatedTracks) {
        const upTrack = { ...t, folderId, updatedAt: Date.now() };
        await storage.saveTrack(upTrack);
      }
      const all = await storage.getAllTracks();
      setTracks(all);
    }
  };

  const handleMoveBatchToFolder = async (fileIds: string[], folderId: string | null) => {
    for (const id of fileIds) {
      await handleMoveFileToFolder(id, folderId);
    }
  };

  // ----------------- TRACK HANDLERS -----------------
  const handleSaveTrack = async (track: ParsedTrack) => {
    await storage.saveTrack(track);
    setTracks(prev => {
      const exists = prev.some(t => t.id === track.id);
      if (exists) {
        return prev.map(t => t.id === track.id ? track : t);
      }
      return [...prev, track];
    });

    if (track.fileId) {
      const fileTracks = await storage.getTracksByFileId(track.fileId);
      const file = files.find(f => f.id === track.fileId);
      if (file) {
        file.trackCount = fileTracks.length;
        await storage.saveFile(file);
        setFiles(prev => prev.map(f => f.id === file.id ? { ...f, trackCount: fileTracks.length } : f));
      }
    }
  };

  const handleAddTrackToFile = async (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    const newTrack: ParsedTrack = {
      id: `trk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      fileId,
      folderId: file?.folderId || null,
      title: 'New Extracted Track',
      artist: 'Primary Artist',
      isrc: settings.isrcPrefix || '',
      currency: settings.defaultCurrency || 'USD',
      platform: settings.defaultPlatform || 'Spotify',
      duration: '03:30',
      writers: [{ id: `w-${Date.now()}`, name: 'Primary Artist', role: 'Writer', percentage: 100 }],
      publishers: [{ id: `p-${Date.now()}`, name: 'Direct / Self-Published', role: 'Publisher', percentage: 100 }],
      confidence: 100,
      validated: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await handleSaveTrack(newTrack);
  };

  const handleDeleteTrack = async (trackId: string) => {
    await storage.deleteTrack(trackId);
    setTracks(prev => prev.filter(t => t.id !== trackId));
    setSelectedTrackIds(prev => prev.filter(id => id !== trackId));
  };

  const handleDeleteBatchTracks = async (trackIds: string[]) => {
    for (const id of trackIds) {
      await storage.deleteTrack(id);
    }
    setTracks(prev => prev.filter(t => !trackIds.includes(t.id)));
    setSelectedTrackIds([]);
  };

  const handleUpdateRawText = async (fileId: string, newText: string) => {
    const file = files.find(f => f.id === fileId);
    if (file) {
      file.rawOcrText = newText;
      await storage.saveFile(file);
      setFiles(prev => prev.map(f => f.id === fileId ? { ...f, rawOcrText: newText } : f));
    }
  };

  // ----------------- SETTINGS & RESET -----------------
  const handleSaveSettings = async (newSettings: AppSettings) => {
    await storage.saveSettings(newSettings);
    setSettings(newSettings);
  };

  const handleClearAllData = async () => {
    await storage.clearAllData();
    setFolders([]);
    setFiles([]);
    setTracks([]);
    setSelectedTrackIds([]);
    setInspectingFile(null);
  };

  // ----------------- COMPUTED METRICS -----------------
  const totalStreams = useMemo(() => {
    return tracks.reduce((sum, t) => sum + (t.streams || 0), 0);
  }, [tracks]);

  const totalRevenue = useMemo(() => {
    return tracks
      .filter((track) => track.currency === settings.defaultCurrency)
      .reduce((sum, track) => sum + (track.revenue || 0), 0);
  }, [tracks, settings.defaultCurrency]);

  const unverifiedTracksCount = useMemo(() => {
    return tracks.filter(t => !t.validated).length;
  }, [tracks]);

  // Filtered files & tracks based on search & view
  const visibleFiles = useMemo(() => {
    return files.filter(f => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = f.name.toLowerCase().includes(query);
        const matchesOcr = f.rawOcrText?.toLowerCase().includes(query);
        if (!matchesName && !matchesOcr) return false;
      }

      if (activeView === 'folder') {
        return f.folderId === activeFolderId;
      }
      return true;
    });
  }, [files, activeView, activeFolderId, searchQuery]);

  const visibleTracks = useMemo(() => {
    return tracks.filter(t => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(query);
        const matchesArtist = t.artist.toLowerCase().includes(query);
        const matchesIsrc = t.isrc.toLowerCase().includes(query);
        const matchesIswc = t.iswc?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesArtist && !matchesIsrc && !matchesIswc) return false;
      }

      if (activeView === 'unverified') {
        return !t.validated;
      }

      if (activeView === 'folder') {
        return t.folderId === activeFolderId;
      }

      return true;
    });
  }, [tracks, activeView, activeFolderId, searchQuery]);

  const getFileCountForFolder = (folderId: string | null) => {
    return files.filter(f => f.folderId === folderId).length;
  };

  if (storageError) return <p role="alert" className="p-6 text-red-300">{storageError}</p>;

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Loading TrackVault Local Storage...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f1a] text-slate-100 font-sans antialiased relative">
      {/* Top Navbar */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenUpload={() => {
          setActiveView('all');
          const uploadBtn = document.getElementById('header-upload-btn');
          uploadBtn?.scrollIntoView();
        }}
        onOpenExport={() => setIsExportModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenAddTrack={() => setIsManualTrackModalOpen(true)}
        onOpenAssistant={() => setIsAssistantOpen(true)}
        onOpenByok={() => setIsByokModalOpen(true)}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
        totalTracks={tracks.length}
        totalStreams={totalStreams}
        totalRevenue={totalRevenue}
        currency={settings.defaultCurrency}
        isProcessing={isProcessing}
        unverifiedCount={unverifiedTracksCount}
      />

      {/* Main Workspace Layout */}
      <div className="flex flex-1 min-h-0 relative">
        {/* Sidebar Folders & Navigation */}
        <Sidebar
          folders={folders}
          activeFolderId={activeFolderId}
          activeView={activeView}
          onSelectView={(view, folderId) => {
            setActiveView(view);
            setActiveFolderId(folderId || null);
          }}
          onCreateFolder={handleCreateFolder}
          onRenameFolder={handleRenameFolder}
          onDeleteFolder={handleDeleteFolder}
          totalFiles={files.length}
          totalTracks={tracks.length}
          unverifiedTracksCount={unverifiedTracksCount}
          getFileCountForFolder={getFileCountForFolder}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Dynamic Center Panel */}
        {activeView === 'tracks' || activeView === 'unverified' ? (
          <TrackTable
            tracks={visibleTracks}
            folders={folders}
            files={files}
            selectedTrackIds={selectedTrackIds}
            onToggleSelectTrack={(id) => {
              setSelectedTrackIds(prev =>
                prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
              );
            }}
            onToggleSelectAll={() => {
              if (selectedTrackIds.length === visibleTracks.length) {
                setSelectedTrackIds([]);
              } else {
                setSelectedTrackIds(visibleTracks.map(t => t.id));
              }
            }}
            onUpdateTrack={handleSaveTrack}
            onDeleteTrack={handleDeleteTrack}
            onDeleteBatchTracks={handleDeleteBatchTracks}
            onInspectFileForTrack={(fileId) => {
              const f = files.find(x => x.id === fileId);
              if (f) setInspectingFile(f);
            }}
            onOpenExportModal={() => setIsExportModalOpen(true)}
            onOpenManualTrackModal={() => setIsManualTrackModalOpen(true)}
          />
        ) : (
          <FileManager
            files={visibleFiles}
            folders={folders}
            currentFolderId={activeFolderId}
            onUploadFiles={handleUploadFiles}
            onRunOcr={handleRunOcr}
            onRunBatchOcr={handleRunBatchOcr}
            onDeleteFile={handleDeleteFile}
            onDeleteBatchFiles={handleDeleteBatchFiles}
            onMoveFileToFolder={handleMoveFileToFolder}
            onMoveBatchToFolder={handleMoveBatchToFolder}
            onInspectFile={(file) => setInspectingFile(file)}
            isProcessing={isProcessing}
          />
        )}
      </div>

      {/* Floating AI Assistant Trigger Button (Bottom Right) */}
      <button
        onClick={() => setIsAssistantOpen(prev => !prev)}
        className="fixed bottom-14 sm:bottom-16 right-4 sm:right-6 z-40 flex items-center gap-2 px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-2xl shadow-indigo-600/50 transition-all transform hover:scale-105"
        title="Open AI Music & Royalty Assistant"
      >
        <Sparkles className="w-4 h-4 text-amber-300 animate-spin" style={{ animationDuration: '4s' }} />
        <span className="text-xs font-bold font-mono">Ask Assistant</span>
        {unverifiedTracksCount > 0 && (
          <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-bold text-[10px] flex items-center justify-center">
            {unverifiedTracksCount}
          </span>
        )}
      </button>

      {/* Professional Footer & Help / Legal Hub */}
      <Footer 
        onOpenSettings={() => setIsSettingsModalOpen(true)} 
        onOpenExport={() => setIsExportModalOpen(true)} 
      />

      {/* AI Music & Royalty Assistant Modal */}
      {isAssistantOpen && (
        <AiAssistantModal
          tracks={tracks}
          folders={folders}
          files={files}
          settings={settings}
          onClose={() => setIsAssistantOpen(false)}
          onNavigateToView={(view) => setActiveView(view)}
          onOpenExport={() => setIsExportModalOpen(true)}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
        />
      )}

      {/* BYOK & Integrations Modal */}
      {isByokModalOpen && (
        <ByokIntegrationsModal
          settings={settings}
          onSaveSettings={handleSaveSettings}
          onClose={() => setIsByokModalOpen(false)}
        />
      )}

      {/* OCR Inspector & Side-by-Side Editor Modal */}
      {inspectingFile && (
        <OcrInspector
          file={inspectingFile}
          tracks={tracks.filter(t => t.fileId === inspectingFile.id)}
          settings={settings}
          onClose={() => setInspectingFile(null)}
          onRunOcr={handleRunOcr}
          onSaveTrack={handleSaveTrack}
          onAddTrackToFile={handleAddTrackToFile}
          onDeleteTrack={handleDeleteTrack}
          onUpdateRawText={handleUpdateRawText}
          isProcessing={isProcessing}
        />
      )}

      {/* Platform Export Modal */}
      {isExportModalOpen && (
        <ExportModal isCurrent={isCurrent}
          tracks={tracks}
          selectedTrackIds={selectedTrackIds}
          onClose={() => setIsExportModalOpen(false)}
        />
      )}

      {/* Settings Modal */}
      {isSettingsModalOpen && (
        <SettingsModal
          settings={settings}
          onSaveSettings={handleSaveSettings}
          onClearAllData={handleClearAllData}
          onClose={() => setIsSettingsModalOpen(false)}
        />
      )}

      {/* Manual Track Entry Modal */}
      {isManualTrackModalOpen && (
        <ManualTrackModal
          folders={folders}
          currentFolderId={activeFolderId}
          settings={settings}
          onSaveTrack={handleSaveTrack}
          onClose={() => setIsManualTrackModalOpen(false)}
        />
      )}
    </div>
  );
}
