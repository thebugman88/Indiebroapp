import React, { useState, useRef } from "react";
import {
  Folder,
  FolderPlus,
  FileText,
  Image as ImageIcon,
  UploadCloud,
  Trash2,
  Edit2,
  ScanLine,
  CheckCircle,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
  Eye,
  Plus,
  Move,
  Filter,
  Search,
  X,
} from "lucide-react";
import { FolderItem, SongMetadata, UploadedDocument, SettingsState } from "../types";
import { analyzeDocumentOrScreenshot } from "../lib/ocrEngine";
import { playNotificationChime } from "../lib/notificationEngine";
import confetti from "canvas-confetti";

interface FileManagerProps {
  folders: FolderItem[];
  documents: UploadedDocument[];
  settings: SettingsState;
  onAddFolder: (name: string, color: string, description?: string) => void;
  onRenameFolder: (id: string, name: string) => void;
  onDeleteFolder: (id: string) => void;
  onUploadDocument: (doc: UploadedDocument) => void;
  onUpdateDocument: (doc: UploadedDocument) => void;
  onDeleteDocument: (id: string) => void;
  onImportSongToCatalogue: (song: SongMetadata) => void;
  onSendToAssistant: (text: string) => void;
}

export const FileManager: React.FC<FileManagerProps> = ({
  folders,
  documents,
  settings,
  onAddFolder,
  onRenameFolder,
  onDeleteFolder,
  onUploadDocument,
  onUpdateDocument,
  onDeleteDocument,
  onImportSongToCatalogue,
  onSendToAssistant,
}) => {
  const [selectedFolderId, setSelectedFolderId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "parsed" | "ready" | "processing">("all");

  // New folder modal
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderColor, setNewFolderColor] = useState("#6366f1");
  const [newFolderDesc, setNewFolderDesc] = useState("");

  // Rename folder state
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState("");

  // OCR Inspector Modal state
  const [inspectDoc, setInspectDoc] = useState<UploadedDocument | null>(null);
  const [ocrProgressText, setOcrProgressText] = useState("");
  const [ocrProgressPct, setOcrProgressPct] = useState(0);

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Folder color options
  const FOLDER_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4", "#ef4444"];

  // Filtered documents
  const filteredDocuments = documents.filter((doc) => {
    const matchesFolder =
      selectedFolderId === "all" ? true : doc.folderId === selectedFolderId;
    const matchesSearch =
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.ocrRawText || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ? true : doc.status === statusFilter;
    return matchesFolder && matchesSearch && matchesStatus;
  });

  // Handle files selection
  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();

      reader.onload = async () => {
        const base64Data = reader.result as string;
        const targetFolder =
          selectedFolderId === "all" ? folders[0]?.id || "folder_rollout" : selectedFolderId;

        const newDoc: UploadedDocument = {
          id: `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          folderId: targetFolder,
          size: file.size,
          mimeType: file.type || "application/octet-stream",
          fileDataUrl: base64Data,
          status: "ready",
          uploadedAt: new Date().toISOString(),
        };

        onUploadDocument(newDoc);

        // Auto-run OCR on image uploads (screenshots of Spotify/Apple/Split sheets)
        if (file.type.startsWith("image/")) {
          processOCRForDocument(newDoc, file);
        }
      };

      reader.readAsDataURL(file);
    }
  };

  // Run OCR on document
  const processOCRForDocument = async (doc: UploadedDocument, fileObj?: File) => {
    try {
      const updatedDoc: UploadedDocument = {
        ...doc,
        status: "processing",
      };
      onUpdateDocument(updatedDoc);
      setInspectDoc(updatedDoc);
      setOcrProgressText("Initializing OCR & Multimodal Analysis...");
      setOcrProgressPct(15);

      let fileToAnalyze: File;
      if (fileObj) {
        fileToAnalyze = fileObj;
      } else {
        // Convert dataUrl to blob
        const res = await fetch(doc.fileDataUrl);
        const blob = await res.blob();
        fileToAnalyze = new File([blob], doc.name, { type: doc.mimeType });
      }

      const result = await analyzeDocumentOrScreenshot(
        fileToAnalyze,
        settings.customApiKey,
        (step, pct) => {
          setOcrProgressText(step);
          setOcrProgressPct(pct);
        }
      );

      const finalizedDoc: UploadedDocument = {
        ...doc,
        status: "parsed",
        ocrRawText: result.rawText,
        confidenceScore: result.confidence,
        parsedSongMetadata: result.parsedMetadata,
      };

      onUpdateDocument(finalizedDoc);
      setInspectDoc(finalizedDoc);

      if (settings.enableSoundAlerts) {
        playNotificationChime();
      }

      confetti({
        particleCount: 35,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch (err: any) {
      console.error("OCR Processing Failed:", err);
      const errorDoc: UploadedDocument = {
        ...doc,
        status: "error",
        errorMessage: err.message || "Failed to parse document text.",
      };
      onUpdateDocument(errorDoc);
      setInspectDoc(errorDoc);
    }
  };

  // Import to Catalogue
  const handleImportToCatalogue = (doc: UploadedDocument) => {
    if (!doc.parsedSongMetadata) return;
    const meta = doc.parsedSongMetadata;

    const newSong: SongMetadata = {
      id: `song_${Date.now()}`,
      title: meta.title || doc.name.replace(/\.[^/.]+$/, ""),
      alternativeTitles: meta.alternativeTitles || [],
      primaryArtist: meta.primaryArtist || "",
      featuredArtists: meta.featuredArtists || [],
      isrc: meta.isrc || "",
      iswc: meta.iswc || "",
      upc: meta.upc || "",
      releaseDate: meta.releaseDate || new Date().toISOString().slice(0, 10),
      duration: meta.duration || "03:30",
      genre: meta.genre || "Indie",
      labelOrDistributor: meta.labelOrDistributor || "Independent",
      pLine: meta.pLine || `(P) ${new Date().getFullYear()} Independent`,
      cLine: meta.cLine || `(C) ${new Date().getFullYear()} Independent`,
      explicit: false,
      writers: meta.writers || [],
      streams: [],
      totalEarnings: meta.totalEarnings || 0,
      folderId: doc.folderId,
      notes: `Imported from screenshot document: ${doc.name}`,
      tags: ["From_Screenshot", "OCR_Verified"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onImportSongToCatalogue(newSong);
    setInspectDoc(null);

    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  return (
    <div id="file-manager-view" className="space-y-6 animate-fadeIn">
      {/* Top Action Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Folder className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                Custom File & Folder Manager
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-normal border border-indigo-500/30">
                  Dual-Mode OCR Engine
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Organize screenshots, split sheets, and royalty statements into custom folders. Upload to extract real ISRCs and streams.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowNewFolderModal(true)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium text-xs transition-colors flex items-center gap-1.5 border border-slate-700"
            >
              <FolderPlus className="w-4 h-4 text-indigo-400" />
              <span>New Folder</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium text-xs transition-all flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Screenshots / Docs</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              multiple
              accept="image/*,.pdf,.csv,.txt"
              className="hidden"
              onChange={(e) => handleFilesSelected(e.target.files)}
            />
          </div>
        </div>

        {/* Drag & Drop Upload Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            handleFilesSelected(e.dataTransfer.files);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`mt-6 border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
            isDragging
              ? "border-indigo-500 bg-indigo-500/10 scale-[0.99]"
              : "border-slate-800 hover:border-slate-700 bg-slate-950/40"
          }`}
        >
          <UploadCloud className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-200">
            Drag & drop Spotify for Artists, Apple Music, or Split Sheet screenshots here
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Supports PNG, JPEG, WebP, PDF, CSV • Auto-extracts song metadata, ISRC codes, and stream counts
          </p>
        </div>
      </div>

      {/* Main Two-Column Layout (Folders Sidebar + File Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: Folders Sidebar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Custom Folders</h3>
            <span className="text-[11px] text-slate-400 font-mono">{folders.length} folders</span>
          </div>

          <div className="space-y-1">
            {/* All Files View */}
            <button
              onClick={() => setSelectedFolderId("all")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                selectedFolderId === "all"
                  ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/40"
                  : "text-slate-300 hover:bg-slate-800/60"
              }`}
            >
              <div className="flex items-center gap-2">
                <Folder className="w-4 h-4 text-indigo-400" />
                <span>All Documents & Scans</span>
              </div>
              <span className="text-[10px] font-mono bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">
                {documents.length}
              </span>
            </button>

            {/* User Custom Folders */}
            {folders.map((folder) => {
              const count = documents.filter((d) => d.folderId === folder.id).length;
              const isSelected = selectedFolderId === folder.id;

              return (
                <div
                  key={folder.id}
                  className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                    isSelected
                      ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/40"
                      : "text-slate-300 hover:bg-slate-800/60"
                  }`}
                >
                  <button
                    onClick={() => setSelectedFolderId(folder.id)}
                    className="flex items-center gap-2 flex-1 text-left truncate"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: folder.color || "#6366f1" }}
                    />
                    {editingFolderId === folder.id ? (
                      <input
                        type="text"
                        autoFocus
                        value={editingFolderName}
                        onChange={(e) => setEditingFolderName(e.target.value)}
                        onBlur={() => {
                          if (editingFolderName.trim()) {
                            onRenameFolder(folder.id, editingFolderName.trim());
                          }
                          setEditingFolderId(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            if (editingFolderName.trim()) {
                              onRenameFolder(folder.id, editingFolderName.trim());
                            }
                            setEditingFolderId(null);
                          }
                        }}
                        className="bg-slate-800 px-1 py-0.5 rounded border border-indigo-500 text-xs w-full"
                      />
                    ) : (
                      <span className="truncate">{folder.name}</span>
                    )}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">
                      {count}
                    </span>
                    <button
                      onClick={() => {
                        setEditingFolderId(folder.id);
                        setEditingFolderName(folder.name);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-indigo-300 transition-opacity"
                      title="Rename folder"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    {folders.length > 1 && (
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete folder '${folder.name}'?`)) {
                            onDeleteFolder(folder.id);
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 transition-opacity"
                        title="Delete folder"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Files Grid & Filter Header */}
        <div className="lg:col-span-3 space-y-4">
          {/* Search & Status Filters */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search files or extracted text..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-[11px] text-slate-400">Filter:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none"
              >
                <option value="all">All Documents ({documents.length})</option>
                <option value="parsed">Parsed / OCR Verified</option>
                <option value="ready">Ready to Process</option>
                <option value="processing">Processing</option>
              </select>
            </div>
          </div>

          {/* Files Grid */}
          {filteredDocuments.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredDocuments.map((doc) => {
                const isImage = doc.mimeType.startsWith("image/");

                return (
                  <div
                    key={doc.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all group relative shadow-sm"
                  >
                    {/* Thumbnail / Preview Area */}
                    <div
                      onClick={() => setInspectDoc(doc)}
                      className="h-32 rounded-xl bg-slate-950/80 border border-slate-800/80 mb-3 overflow-hidden flex items-center justify-center cursor-pointer relative group/thumb"
                    >
                      {isImage ? (
                        <img
                          src={doc.fileDataUrl}
                          alt={doc.name}
                          className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform"
                        />
                      ) : (
                        <FileText className="w-10 h-10 text-indigo-400/60" />
                      )}

                      {/* Status Badge */}
                      <div className="absolute top-2 right-2">
                        {doc.status === "parsed" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold border border-emerald-500/40 backdrop-blur-md">
                            <CheckCircle className="w-2.5 h-2.5" /> Parsed
                          </span>
                        )}
                        {doc.status === "processing" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-semibold border border-amber-500/40 backdrop-blur-md animate-pulse">
                            <Clock className="w-2.5 h-2.5" /> OCR Scanning
                          </span>
                        )}
                        {doc.status === "ready" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-300 text-[10px] font-semibold border border-slate-700 backdrop-blur-md">
                            Ready
                          </span>
                        )}
                        {doc.status === "error" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-semibold border border-rose-500/40 backdrop-blur-md">
                            <AlertCircle className="w-2.5 h-2.5" /> Error
                          </span>
                        )}
                      </div>

                      {/* Hover view overlay */}
                      <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <span className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs font-medium flex items-center gap-1 shadow-lg">
                          <Eye className="w-3 h-3" /> Inspect OCR
                        </span>
                      </div>
                    </div>

                    {/* File Meta */}
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-slate-200 truncate" title={doc.name}>
                        {doc.name}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>{(doc.size / 1024).toFixed(1)} KB</span>
                        <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                      </div>

                      {/* Extracted song title pill if parsed */}
                      {doc.parsedSongMetadata?.title && (
                        <div className="pt-1.5">
                          <span className="inline-block px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-mono truncate max-w-full">
                            🎵 {doc.parsedSongMetadata.title}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Quick Action Footer */}
                    <div className="pt-3 mt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                      <button
                        onClick={() => processOCRForDocument(doc)}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded text-[11px] font-medium transition-colors flex items-center gap-1"
                        title="Re-run Multimodal OCR"
                      >
                        <ScanLine className="w-3 h-3" /> Scan OCR
                      </button>

                      <button
                        onClick={() => onDeleteDocument(doc.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                        title="Delete file"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-xs">
              <Folder className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="font-medium text-slate-400">No documents in this folder.</p>
              <p className="text-slate-500 mt-1">Upload screenshots or drag & drop files to organize your catalog assets.</p>
            </div>
          )}
        </div>
      </div>

      {/* CREATE NEW FOLDER MODAL */}
      {showNewFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <FolderPlus className="w-4 h-4 text-indigo-400" />
              Create Custom Folder
            </h3>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Folder Name *</label>
              <input
                type="text"
                autoFocus
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="e.g. Q1 Royalty Statements, Stems & Master WAVs"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1.5">Folder Color</label>
              <div className="flex gap-2">
                {FOLDER_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewFolderColor(c)}
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${
                      newFolderColor === c ? "scale-125 border-white" : "border-transparent"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Description (Optional)</label>
              <input
                type="text"
                value={newFolderDesc}
                onChange={(e) => setNewFolderDesc(e.target.value)}
                placeholder="e.g. Artwork deliverables and release masters"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewFolderModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (newFolderName.trim()) {
                    onAddFolder(newFolderName.trim(), newFolderColor, newFolderDesc.trim());
                    setNewFolderName("");
                    setNewFolderDesc("");
                    setShowNewFolderModal(false);
                  }
                }}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
              >
                Create Folder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OCR INSPECTOR MODAL */}
      {inspectDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-200 text-xs">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <ScanLine className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100 truncate max-w-md">{inspectDoc.name}</h3>
                  <p className="text-[11px] text-slate-400">
                    Status: <strong className="capitalize text-indigo-300">{inspectDoc.status}</strong> • Confidence: {inspectDoc.confidenceScore || 85}%
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {inspectDoc.status === "parsed" && (
                  <button
                    onClick={() => handleImportToCatalogue(inspectDoc)}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Import to Catalogue</span>
                  </button>
                )}
                <button
                  onClick={() => setInspectDoc(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* OCR Processing Banner if active */}
            {inspectDoc.status === "processing" && (
              <div className="p-4 bg-indigo-950/40 border-b border-indigo-900/50 space-y-2">
                <div className="flex items-center justify-between text-indigo-200">
                  <span className="font-semibold">{ocrProgressText || "Processing OCR..."}</span>
                  <span className="font-mono">{ocrProgressPct}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-indigo-500 h-2 transition-all duration-300"
                    style={{ width: `${ocrProgressPct}%` }}
                  />
                </div>
              </div>
            )}

            {/* Modal Body: Split view (Image Preview on Left, Extracted Data on Right) */}
            <div className="grid grid-cols-1 md:grid-cols-2 flex-1 overflow-y-auto divide-y md:divide-y-0 md:divide-x divide-slate-800">
              {/* Left: Original File Preview */}
              <div className="p-5 flex flex-col items-center justify-center bg-slate-950/40 min-h-[300px]">
                {inspectDoc.mimeType.startsWith("image/") ? (
                  <img
                    src={inspectDoc.fileDataUrl}
                    alt={inspectDoc.name}
                    className="max-h-[380px] w-auto rounded-xl object-contain border border-slate-800 shadow-md"
                  />
                ) : (
                  <div className="text-center p-8 text-slate-500">
                    <FileText className="w-16 h-16 mx-auto mb-2 text-slate-600" />
                    <p className="font-medium text-slate-400">PDF / Document File</p>
                    <p className="text-[11px] text-slate-500 mt-1">{inspectDoc.name}</p>
                  </div>
                )}
              </div>

              {/* Right: Extracted Structured Data */}
              <div className="p-5 space-y-4 overflow-y-auto">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Extracted Metadata & ISRC
                </h4>

                {inspectDoc.parsedSongMetadata ? (
                  <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Detected Song Title</span>
                      <p className="font-bold text-slate-100 text-sm">{inspectDoc.parsedSongMetadata.title || "Unknown Track"}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Primary Artist</span>
                        <p className="font-medium text-slate-200">{inspectDoc.parsedSongMetadata.primaryArtist || "N/A"}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">ISRC Code</span>
                        <p className="font-mono text-emerald-400 font-bold">{inspectDoc.parsedSongMetadata.isrc || "Not detected"}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">ISWC / Work ID</span>
                        <p className="font-mono text-indigo-300">{inspectDoc.parsedSongMetadata.iswc || "Not detected"}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">UPC Barcode</span>
                        <p className="font-mono text-slate-300">{inspectDoc.parsedSongMetadata.upc || "N/A"}</p>
                      </div>
                    </div>

                    {/* Writers / Splits */}
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Writers & Splits</span>
                      {inspectDoc.parsedSongMetadata.writers && inspectDoc.parsedSongMetadata.writers.length > 0 ? (
                        <div className="space-y-1 mt-1">
                          {inspectDoc.parsedSongMetadata.writers.map((w, idx) => (
                            <div key={idx} className="flex items-center justify-between p-1.5 rounded bg-slate-900 border border-slate-800 text-[11px]">
                              <span><strong>{w.name}</strong> ({w.role || "Writer"})</span>
                              <span className="font-mono text-emerald-400 font-bold">{w.writerSplitPercent}%</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-500 italic mt-0.5">No separate co-writers listed</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-500 italic">No structured data parsed yet. Click 'Scan OCR' above.</p>
                )}

                {/* Raw OCR Text snippet */}
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Extracted Raw Text Output</span>
                  <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 font-mono text-[10px] max-h-36 overflow-y-auto whitespace-pre-wrap">
                    {inspectDoc.ocrRawText || "No raw text extracted."}
                  </pre>
                </div>

                {/* Action button: Send to Assistant */}
                <button
                  type="button"
                  onClick={() => {
                    const prompt = `Here is the metadata extracted from my document '${inspectDoc.name}':\n${JSON.stringify(inspectDoc.parsedSongMetadata, null, 2)}\n\nPlease review this for accuracy, check if my ISRC/ISWC or splits conform to MLC & ASCAP requirements, and advise on next steps.`;
                    onSendToAssistant(prompt);
                    setInspectDoc(null);
                  }}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-lg font-medium text-xs transition-colors flex items-center justify-center gap-1.5 border border-slate-700"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Send to Career Assistant for Audit</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
