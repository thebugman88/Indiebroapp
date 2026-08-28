import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  Trash2, 
  Play, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  FolderInput, 
  CheckSquare, 
  Square,
  ArrowUpDown,
  Filter,
  Grid,
  List as ListIcon
} from 'lucide-react';
import { MediaFile, Folder } from '../types';

interface FileManagerProps {
  files: MediaFile[];
  folders: Folder[];
  currentFolderId: string | null;
  onUploadFiles: (files: File[]) => Promise<void>;
  onRunOcr: (fileId: string) => Promise<void>;
  onRunBatchOcr: (fileIds: string[]) => Promise<void>;
  onDeleteFile: (fileId: string) => Promise<void>;
  onDeleteBatchFiles: (fileIds: string[]) => Promise<void>;
  onMoveFileToFolder: (fileId: string, folderId: string | null) => Promise<void>;
  onMoveBatchToFolder: (fileIds: string[], folderId: string | null) => Promise<void>;
  onInspectFile: (file: MediaFile) => void;
  isProcessing: boolean;
}

type SortField = 'name' | 'createdAt' | 'size' | 'status' | 'trackCount';

export const FileManager: React.FC<FileManagerProps> = ({
  files,
  folders,
  currentFolderId,
  onUploadFiles,
  onRunOcr,
  onRunBatchOcr,
  onDeleteFile,
  onDeleteBatchFiles,
  onMoveFileToFolder,
  onMoveBatchToFolder,
  onInspectFile,
  isProcessing,
}) => {
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortAsc, setSortAsc] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files).filter((f: File) => f.type.startsWith('image/'));
      if (droppedFiles.length > 0) {
        await onUploadFiles(droppedFiles);
      }
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files);
      await onUploadFiles(selected);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedFileIds.length === files.length) {
      setSelectedFileIds([]);
    } else {
      setSelectedFileIds(files.map(f => f.id));
    }
  };

  const toggleSelectFile = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFileIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Sort files
  const sortedFiles = [...files].sort((a, b) => {
    let result = 0;
    if (sortField === 'name') {
      result = a.name.localeCompare(b.name);
    } else if (sortField === 'createdAt') {
      result = a.createdAt - b.createdAt;
    } else if (sortField === 'size') {
      result = a.size - b.size;
    } else if (sortField === 'status') {
      result = a.status.localeCompare(b.status);
    } else if (sortField === 'trackCount') {
      result = (a.trackCount || 0) - (b.trackCount || 0);
    }
    return sortAsc ? result : -result;
  });

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0b0f1a] overflow-y-auto">
      <div className="p-3 sm:p-5 lg:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto w-full">
        {/* Top Split Section: Upload Statement & Engine Pipeline */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 shrink-0">
          {/* Upload Statement Box */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`col-span-1 border-2 border-dashed rounded-xl bg-slate-900/30 flex flex-col items-center justify-center p-6 transition-colors group cursor-pointer ${
              isDragging ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-800 hover:border-indigo-500/50'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              multiple
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
            />
            <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mb-3 group-hover:bg-indigo-600/20 transition-colors">
              <Upload className="w-6 h-6 text-indigo-400" />
            </div>
            <p className="text-sm font-semibold text-slate-100">Upload Statement</p>
            <p className="text-[10px] text-slate-500 mt-1 uppercase font-mono tracking-wider">
              Supports PNG, JPG, WebP
            </p>
          </div>

          {/* Engine Pipeline Card */}
          <div className="col-span-1 lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                Engine Pipeline
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-mono uppercase">
                {files.find(f => f.status === 'processing') 
                  ? `Processing: ${files.find(f => f.status === 'processing')?.name}` 
                  : `${files.filter(f => f.status === 'completed').length} items indexed`}
              </span>
            </div>

            <div className="space-y-3 mt-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                  {files.find(f => f.status === 'processing')?.dataUrl ? (
                    <img src={files.find(f => f.status === 'processing')!.dataUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-indigo-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1 font-mono">
                    <span className="text-slate-300 font-medium truncate max-w-xs">
                      OCR Extraction: {files.find(f => f.status === 'processing')?.name || (files[0]?.name || 'Standing by')}
                    </span>
                    <span className="text-indigo-400 italic">
                      {files.find(f => f.status === 'processing') ? `${files.find(f => f.status === 'processing')?.ocrProgress}%` : (files.length > 0 ? '100%' : 'Idle')}
                    </span>
                  </div>
                  <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 transition-all duration-200"
                      style={{ width: `${files.find(f => f.status === 'processing') ? files.find(f => f.status === 'processing')?.ocrProgress : (files.length > 0 ? 100 : 0)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Micro Tags */}
              <div className="flex flex-wrap gap-2">
                <div className="bg-slate-800/50 px-2 py-1 rounded text-[10px] font-mono text-slate-400 border border-slate-700">
                  ISRC Detached
                </div>
                <div className="bg-slate-800/50 px-2 py-1 rounded text-[10px] font-mono text-slate-400 border border-slate-700">
                  Streams Indexed
                </div>
                <div className={`px-2 py-1 rounded text-[10px] font-mono border ${
                  files.find(f => f.status === 'processing') 
                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30 animate-pulse' 
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                }`}>
                  {files.find(f => f.status === 'processing') ? 'Extracting Text...' : 'Review Extracted Fields'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar & Batch Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-2 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleSelectAll}
              className="flex items-center space-x-1.5 text-xs text-slate-300 hover:text-white px-2.5 py-1 rounded bg-slate-900 border border-slate-800"
            >
              {selectedFileIds.length === files.length && files.length > 0 ? (
                <CheckSquare className="w-4 h-4 text-indigo-400" />
              ) : (
                <Square className="w-4 h-4 text-slate-500" />
              )}
              <span className="font-mono text-xs">{selectedFileIds.length > 0 ? `${selectedFileIds.length} Selected` : 'Select All'}</span>
            </button>

            {selectedFileIds.length > 0 && (
              <div className="flex items-center space-x-2">
                <button
                  id="batch-run-ocr-btn"
                  onClick={() => onRunBatchOcr(selectedFileIds)}
                  disabled={isProcessing}
                  className="flex items-center space-x-1.5 px-3 py-1 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Run OCR ({selectedFileIds.length})</span>
                </button>

                {/* Move to folder dropdown */}
                <div className="relative group">
                  <button className="flex items-center space-x-1.5 px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-800 border border-slate-700 rounded transition-colors font-mono">
                    <FolderInput className="w-3.5 h-3.5 text-slate-400" />
                    <span>Move to Folder</span>
                  </button>
                  <div className="absolute left-0 mt-1 w-48 bg-slate-900 border border-slate-700 rounded-lg shadow-xl py-1 hidden group-hover:block z-20">
                    <button
                      onClick={() => onMoveBatchToFolder(selectedFileIds, null)}
                      className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
                    >
                      Unsorted Uploads
                    </button>
                    {folders.map(f => (
                      <button
                        key={f.id}
                        onClick={() => onMoveBatchToFolder(selectedFileIds, f.id)}
                        className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 flex items-center space-x-2 font-mono"
                      >
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: f.color }} />
                        <span className="truncate">{f.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (window.confirm(`Delete ${selectedFileIds.length} selected files?`)) {
                      onDeleteBatchFiles(selectedFileIds);
                      setSelectedFileIds([]);
                    }
                  }}
                  className="flex items-center space-x-1 px-2.5 py-1 text-xs font-mono text-rose-400 hover:text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>

          {/* Sorting & Layout controls */}
          <div className="flex items-center space-x-3 text-xs font-mono">
            <div className="flex items-center space-x-1 text-slate-400">
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Sort:</span>
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value as SortField)}
                className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 focus:outline-none"
              >
                <option value="createdAt">Date Added</option>
                <option value="name">File Name</option>
                <option value="size">Size</option>
                <option value="status">Status</option>
                <option value="trackCount">Extracted Tracks</option>
              </select>
              <button
                onClick={() => setSortAsc(!sortAsc)}
                className="p-1 hover:text-slate-200 text-slate-400"
                title="Toggle Sort Order"
              >
                {sortAsc ? '↑' : '↓'}
              </button>
            </div>

            <div className="flex items-center space-x-1 border-l border-slate-800 pl-3">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-slate-800 text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
                title="Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-slate-800 text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
                title="List View"
              >
                <ListIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {files.length === 0 && (
          <div className="text-center py-16 px-4 bg-slate-900/40 rounded-xl border border-slate-800">
            <ImageIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-300">No documents or statements uploaded yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              Drag and drop screenshots from Spotify for Artists, Apple Music, DistroKid, or SoundExchange to parse ISRCs.
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors shadow-lg shadow-indigo-600/20"
            >
              Upload Statement
            </button>
          </div>
        )}

        {/* Files Grid / List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {sortedFiles.map((file) => {
              const isSelected = selectedFileIds.includes(file.id);
              const folder = folders.find(f => f.id === file.folderId);

              return (
                <div
                  key={file.id}
                  onClick={() => onInspectFile(file)}
                  className={`group relative bg-slate-900 border rounded-xl overflow-hidden transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? 'border-indigo-500 ring-1 ring-indigo-500 shadow-md shadow-indigo-500/10'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Select Checkbox */}
                  <div 
                    onClick={(e) => toggleSelectFile(file.id, e)}
                    className="absolute top-2.5 left-2.5 z-10 p-1 rounded bg-[#0b0f1a]/80 backdrop-blur hover:bg-slate-800 transition-colors"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-indigo-400" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 group-hover:text-slate-200" />
                    )}
                  </div>

                  {/* Thumbnail Preview */}
                  <div className="h-40 bg-[#070b14] flex items-center justify-center overflow-hidden relative">
                    {file.dataUrl ? (
                      <img
                        src={file.dataUrl}
                        alt={file.name}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <FileText className="w-10 h-10 text-slate-600" />
                    )}

                    {/* OCR Status Badge */}
                    <div className="absolute top-2.5 right-2.5">
                      {file.status === 'completed' && (
                        <span className="flex items-center space-x-1 px-2 py-0.5 text-[10px] font-mono font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded backdrop-blur">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{file.trackCount} Tracks</span>
                        </span>
                      )}
                      {file.status === 'processing' && (
                        <span className="flex items-center space-x-1 px-2 py-0.5 text-[10px] font-mono font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 rounded backdrop-blur animate-pulse">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>{file.ocrProgress}%</span>
                        </span>
                      )}
                      {file.status === 'pending' && (
                        <span className="px-2 py-0.5 text-[10px] font-mono font-medium bg-slate-800 text-slate-400 border border-slate-700 rounded backdrop-blur">
                          Unprocessed
                        </span>
                      )}
                      {file.status === 'error' && (
                        <span className="flex items-center space-x-1 px-2 py-0.5 text-[10px] font-mono font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded backdrop-blur">
                          <AlertCircle className="w-3 h-3" />
                          <span>Error</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Info Footer */}
                  <div className="p-3 bg-slate-900 border-t border-slate-800">
                    <p className="text-xs font-semibold text-slate-200 truncate font-mono" title={file.name}>
                      {file.name}
                    </p>

                    <div className="flex items-center justify-between mt-1.5 text-[10px] font-mono text-slate-400">
                      <span>{formatFileSize(file.size)}</span>
                      {folder && (
                        <div className="flex items-center space-x-1 max-w-[100px] truncate">
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: folder.color }} />
                          <span className="truncate">{folder.name}</span>
                        </div>
                      )}
                    </div>

                    {/* Quick action buttons */}
                    <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-800">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onInspectFile(file);
                        }}
                        className="flex items-center space-x-1 text-[10px] font-mono text-slate-400 hover:text-indigo-300"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Inspect</span>
                      </button>

                      <div className="flex items-center space-x-1">
                        {file.status !== 'processing' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onRunOcr(file.id);
                            }}
                            className="p-1 text-slate-400 hover:text-indigo-400"
                            title="Re-run OCR Engine"
                          >
                            <Play className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Delete file "${file.name}" and extracted tracks?`)) {
                              onDeleteFile(file.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-rose-400"
                          title="Delete File"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View */
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <table className="w-full text-left text-xs text-slate-300 font-mono">
              <thead className="bg-[#0f172a] border-b border-slate-800 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                <tr>
                  <th className="p-3 w-8">
                    <input
                      type="checkbox"
                      checked={selectedFileIds.length === files.length && files.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
                    />
                  </th>
                  <th className="p-3">File Name</th>
                  <th className="p-3">Folder</th>
                  <th className="p-3">File Size</th>
                  <th className="p-3">Date Added</th>
                  <th className="p-3">OCR Status</th>
                  <th className="p-3">Extracted Tracks</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {sortedFiles.map((file) => {
                  const isSelected = selectedFileIds.includes(file.id);
                  const folder = folders.find(f => f.id === file.folderId);

                  return (
                    <tr
                      key={file.id}
                      onClick={() => onInspectFile(file)}
                      className={`hover:bg-slate-800/30 group transition-colors cursor-pointer ${
                        isSelected ? 'bg-indigo-950/20' : ''
                      }`}
                    >
                      <td className="p-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => toggleSelectFile(file.id, e as any)}
                          className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
                        />
                      </td>
                      <td className="p-3 font-semibold text-slate-200 group-hover:text-indigo-400">
                        {file.name}
                      </td>
                      <td className="p-3 text-slate-400">
                        {folder ? (
                          <div className="flex items-center space-x-1.5">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: folder.color }} />
                            <span>{folder.name}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500">Unsorted</span>
                        )}
                      </td>
                      <td className="p-3 text-slate-400">{formatFileSize(file.size)}</td>
                      <td className="p-3 text-slate-500">{new Date(file.createdAt).toLocaleDateString()}</td>
                      <td className="p-3">
                        {file.status === 'completed' && (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px]">
                            Completed
                          </span>
                        )}
                        {file.status === 'processing' && (
                          <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-[10px] animate-pulse">
                            Processing ({file.ocrProgress}%)
                          </span>
                        )}
                        {file.status === 'pending' && (
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">
                            Pending
                          </span>
                        )}
                        {file.status === 'error' && (
                          <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 text-[10px]">
                            Error
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-semibold text-slate-200">{file.trackCount || 0}</td>
                      <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => onInspectFile(file)}
                            className="p-1 text-slate-400 hover:text-indigo-400"
                            title="Inspect File"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onRunOcr(file.id)}
                            className="p-1 text-slate-400 hover:text-emerald-400"
                            title="Run OCR"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteFile(file.id)}
                            className="p-1 text-slate-400 hover:text-rose-400"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
