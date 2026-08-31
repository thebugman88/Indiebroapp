import { currentPrivateStorage } from '../../shared/privateStorage';
import React, { useState, useEffect, useRef } from "react";
import {
  Music,
  Folder,
  Calendar,
  FileSpreadsheet,
  Bot,
  Settings,
  Sparkles,
  ShieldCheck,
  Zap,
  HelpCircle,
} from "lucide-react";
import {
  ArtistProfile,
  ChatMessage,
  FolderItem,
  ScheduledEvent,
  SettingsState,
  SongMetadata,
  UploadedDocument,
} from "./types";
import { createCareerVault, emptyCareerSnapshot } from "./lib/storage";
import { getCurrentAuthUser } from '../../src/services/authService';
import { checkAndTriggerEventReminders } from "./lib/notificationEngine";

// UI Components
import { TopTicker } from "./components/TopTicker";
import { Footer } from "./components/Footer";
import { CatalogueManager } from "./components/CatalogueManager";
import { FileManager } from "./components/FileManager";
import { ReleaseScheduler } from "./components/ReleaseScheduler";
import { ExportSuite } from "./components/ExportSuite";
import { AssistantChat } from "./components/AssistantChat";
import { SettingsModal } from "./components/SettingsModal";
import { TermsPrivacyModal } from "./components/TermsPrivacyModal";
import { HelpModal } from "./components/HelpModal";

export function App() {
  const [session, setSession] = useState(() => ({ uid: getCurrentAuthUser().id, revision: 0 }));
  useEffect(() => {
    const sync = () => {
      const uid = getCurrentAuthUser().id;
      setSession(old => uid === old.uid ? old : { uid, revision: old.revision + 1 });
    };
    window.addEventListener('ib_auth_changed', sync);
    sync();
    return () => window.removeEventListener('ib_auth_changed', sync);
  }, []);
  return <CareerWorkspace key={session.revision} uid={session.uid} />;
}

function CareerWorkspace({ uid }: { uid: string }) {
  const active = useRef(true);
  const isCurrent = () => active.current && getCurrentAuthUser().id === uid;
  useEffect(() => {
    active.current = true;
    const changed = () => { if (getCurrentAuthUser().id !== uid) active.current = false; };
    window.addEventListener('ib_auth_changed', changed);
    return () => { active.current = false; window.removeEventListener('ib_auth_changed', changed); };
  }, [uid]);
  const [vault] = useState(() => createCareerVault(uid, isCurrent, () => currentPrivateStorage()));
  const [initial] = useState(() => {
    try { return { data: vault.load(), error: '' }; }
    catch { return { data: emptyCareerSnapshot(), error: 'Saved workspace could not be read. It has not been overwritten. Check browser storage, then reopen this tool.' }; }
  });
  const [saveError, setSaveError] = useState('');
  const [saved, setSaved] = useState(false);

  // Main State
  const [profile, setProfile] = useState<ArtistProfile>(initial.data.profile);
  const [settings, setSettings] = useState<SettingsState>(initial.data.settings);
  const [songs, setSongs] = useState<SongMetadata[]>(initial.data.songs);
  const [folders, setFolders] = useState<FolderItem[]>(initial.data.folders);
  const [documents, setDocuments] = useState<UploadedDocument[]>(initial.data.documents);
  const [events, setEvents] = useState<ScheduledEvent[]>(initial.data.events);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(initial.data.chatMessages);

  // Active Tab
  const [activeTab, setActiveTab] = useState<"catalogue" | "files" | "schedule" | "export" | "chat">("catalogue");

  // Modals
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Cross-component initial prompt to send into Assistant Chat
  const [assistantInitialPrompt, setAssistantInitialPrompt] = useState<string>("");

  const snapshot = { profile, settings, songs, folders, documents, events, chatMessages };
  // One account-owned snapshot prevents partial updates across separate browser keys.
  useEffect(() => {
    if (initial.error || !isCurrent()) return;
    try { setSaved(vault.save(snapshot)); setSaveError(''); }
    catch { setSaved(false); setSaveError('Changes could not be saved. Keep this page open and export your current work before retrying.'); }
  }, [profile, settings, songs, folders, documents, events, chatMessages]);

  // Periodic Reminder Daemon (checks every 60s for due events)
  useEffect(() => {
    const timer = setInterval(() => {
      if (isCurrent()) checkAndTriggerEventReminders(events, settings);
    }, 60000);

    return () => clearInterval(timer);
  }, [events, settings]);

  // CRUD Handlers for Catalogue
  const handleAddSong = (song: SongMetadata) => {
    setSongs((prev) => [song, ...prev]);
  };

  const handleUpdateSong = (updated: SongMetadata) => {
    setSongs((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  const handleDeleteSong = (id: string) => {
    setSongs((prev) => prev.filter((s) => s.id !== id));
  };

  // Folder Handlers
  const handleAddFolder = (name: string, color: string, description?: string) => {
    const newFolder: FolderItem = {
      id: `folder_${Date.now()}`,
      name,
      color,
      description,
      createdAt: new Date().toISOString(),
    };
    setFolders((prev) => [...prev, newFolder]);
  };

  const handleRenameFolder = (id: string, name: string) => {
    setFolders((prev) =>
      prev.map((f) => (f.id === id ? { ...f, name } : f))
    );
  };

  const handleDeleteFolder = (id: string) => {
    setFolders((prev) => prev.filter((f) => f.id !== id));
    // Move orphaned documents to first remaining folder
    const fallbackFolder = folders.find((f) => f.id !== id)?.id || "folder_root";
    setDocuments((prev) =>
      prev.map((d) => (d.folderId === id ? { ...d, folderId: fallbackFolder } : d))
    );
  };

  // Document Handlers
  const handleUploadDocument = (doc: UploadedDocument) => {
    setDocuments((prev) => [doc, ...prev]);
  };

  const handleUpdateDocument = (doc: UploadedDocument) => {
    setDocuments((prev) => prev.map((d) => (d.id === doc.id ? doc : d)));
  };

  const handleDeleteDocument = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  // Event Handlers
  const handleAddEvent = (evt: ScheduledEvent) => {
    setEvents((prev) => [evt, ...prev]);
  };

  const handleUpdateEvent = (updated: ScheduledEvent) => {
    setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
  };

  const handleDeleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  // Chat Handlers
  const handleSendMessage = (msg: ChatMessage) => {
    setChatMessages((prev) => [...prev, msg]);
  };

  const handleClearHistory = () => {
    setChatMessages([]);
  };

  // Send cross-component text prompt to Assistant
  const handleSendToAssistant = (promptText: string) => {
    setAssistantInitialPrompt(promptText);
    setActiveTab("chat");
  };

  // Reset entire database
  const handleResetAllData = () => {
    if (!isCurrent()) return;
    try { vault.reset(snapshot); }
    catch { setSaveError('Could not reset the saved workspace. No reset was applied to the editor.'); return; }
    setFolders(structuredClone(emptyCareerSnapshot().folders));
    setSongs([]);
    setDocuments([]);
    setEvents([]);
    setChatMessages([]);
  };

  if (initial.error) return <div role="alert" className="p-6 text-amber-300">{initial.error}</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      <div role="status" className="p-3 text-xs text-slate-300">
        {uid === 'guest' ? 'Guest work is temporary. Export before signing in or leaving this tool.' : saved ? 'Saved for this account in this browser. Not a cloud backup.' : 'Saving this account’s workspace…'}
        {' '}Legacy shared-browser data is retained but not automatically imported.
        {saveError && <p role="alert" className="text-amber-300">{saveError}</p>}
      </div>
      {/* 1. Live Ticker Across the Top */}
      <TopTicker
        events={events}
        enableSound={settings.enableSoundAlerts}
        onToggleSound={() =>
          setSettings((prev) => ({ ...prev, enableSoundAlerts: !prev.enableSoundAlerts }))
        }
      />

      {/* 2. Main Navigation Bar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-100 tracking-tight">
                  INDIE BROTHERHOOD
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  AI Career Assistant
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {profile.artistName || "Independent Artist"} • {profile.pro || "ASCAP"} (IPI: {profile.ipi || "Pending"})
              </p>
            </div>
          </div>

          {/* Center Tab Navigation (Desktop) */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800 text-xs font-medium">
            <button
              onClick={() => setActiveTab("catalogue")}
              className={`px-3.5 py-1.5 rounded-lg flex items-center gap-2 transition-all ${
                activeTab === "catalogue"
                  ? "bg-indigo-600 text-white font-semibold shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <Music className="w-4 h-4" />
              <span>Song Catalog ({songs.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("files")}
              className={`px-3.5 py-1.5 rounded-lg flex items-center gap-2 transition-all ${
                activeTab === "files"
                  ? "bg-indigo-600 text-white font-semibold shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <Folder className="w-4 h-4" />
              <span>Files & OCR ({documents.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("schedule")}
              className={`px-3.5 py-1.5 rounded-lg flex items-center gap-2 transition-all ${
                activeTab === "schedule"
                  ? "bg-indigo-600 text-white font-semibold shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Timeline ({events.filter((e) => !e.completed).length})</span>
            </button>

            <button
              onClick={() => setActiveTab("export")}
              className={`px-3.5 py-1.5 rounded-lg flex items-center gap-2 transition-all ${
                activeTab === "export"
                  ? "bg-indigo-600 text-white font-semibold shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Suite</span>
            </button>

            <button
              onClick={() => setActiveTab("chat")}
              className={`px-3.5 py-1.5 rounded-lg flex items-center gap-2 transition-all ${
                activeTab === "chat"
                  ? "bg-indigo-600 text-white font-semibold shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <Bot className="w-4 h-4" />
              <span>Gemini AI</span>
            </button>
          </nav>

          {/* Right Actions (Settings & Playbook) */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHelpModal(true)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700"
              title="2026 Indie Playbook & Help"
            >
              <HelpCircle className="w-5 h-5" />
            </button>

            <button
              onClick={() => setShowSettingsModal(true)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700"
              title="Settings & Artist Profile"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Tab Strip */}
        <div className="md:hidden flex overflow-x-auto px-4 py-2 border-t border-slate-800 gap-1 text-xs">
          {[
            { id: "catalogue", label: "Catalog", icon: Music },
            { id: "files", label: "Files & OCR", icon: Folder },
            { id: "schedule", label: "Timeline", icon: Calendar },
            { id: "export", label: "Export", icon: FileSpreadsheet },
            { id: "chat", label: "Gemini AI", icon: Bot },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  isSelected ? "bg-indigo-600 text-white font-semibold" : "text-slate-400 bg-slate-900"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* 3. Main Body Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === "catalogue" && (
          <CatalogueManager
            songs={songs}
            profile={profile}
            onAddSong={handleAddSong}
            onUpdateSong={handleUpdateSong}
            onDeleteSong={handleDeleteSong}
            onOpenAssistantForSong={(song) => {
              handleSendToAssistant(
                `Here is my track '${song.title}' (${song.genre || "Indie"}):\n- ISRC: ${song.isrc || "Pending"}\n- Writers: ${JSON.stringify(song.writers)}\n\nPlease audit this song's metadata, check for registration completeness, and suggest a 3-tier promotional campaign.`
              );
            }}
          />
        )}

        {activeTab === "files" && (
          <FileManager
            folders={folders}
            documents={documents}
            settings={settings}
            onAddFolder={handleAddFolder}
            onRenameFolder={handleRenameFolder}
            onDeleteFolder={handleDeleteFolder}
            onUploadDocument={handleUploadDocument}
            onUpdateDocument={handleUpdateDocument}
            onDeleteDocument={handleDeleteDocument}
            onImportSongToCatalogue={handleAddSong}
            onSendToAssistant={handleSendToAssistant}
          />
        )}

        {activeTab === "schedule" && (
          <ReleaseScheduler
            events={events}
            songs={songs}
            profile={profile}
            settings={settings}
            onAddEvent={handleAddEvent}
            onUpdateEvent={handleUpdateEvent}
            onDeleteEvent={handleDeleteEvent}
          />
        )}

        {activeTab === "export" && (
          <ExportSuite songs={songs} profile={profile} />
        )}

        {activeTab === "chat" && (
          <AssistantChat
            messages={chatMessages}
            profile={profile}
            songs={songs}
            settings={settings}
            onSendMessage={handleSendMessage}
            onClearHistory={handleClearHistory}
            initialPrompt={assistantInitialPrompt}
            onClearInitialPrompt={() => setAssistantInitialPrompt("")}
          />
        )}
      </main>

      {/* 4. Footer */}
      <Footer
        onOpenTerms={() => setShowTermsModal(true)}
        onOpenHelp={() => setShowHelpModal(true)}
        songCount={songs.length}
        folderCount={folders.length}
      />

      {/* 5. Modals */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        profile={profile}
        settings={settings}
        onSaveProfile={setProfile}
        onSaveSettings={setSettings}
        onResetData={handleResetAllData}
        onExportBackup={() => vault.export(snapshot)}
      />

      <TermsPrivacyModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
      />

      <HelpModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
      />
    </div>
  );
}
export default App;
