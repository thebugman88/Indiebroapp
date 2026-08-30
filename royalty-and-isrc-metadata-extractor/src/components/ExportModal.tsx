import React, { useState } from 'react';
import { 
  X, 
  Download, 
  FileSpreadsheet, 
  CheckCircle2, 
  FileText, 
  Layers, 
  Sparkles,
  Table,
  Info
} from 'lucide-react';
import { ParsedTrack, ExportPlatform } from '../types';
import { PLATFORM_SPECS, generatePlatformCSV, exportTracks } from '../services/exportEngine';

interface ExportModalProps {
  isCurrent: () => boolean;
  tracks: ParsedTrack[];
  selectedTrackIds: string[];
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isCurrent,
  tracks,
  selectedTrackIds,
  onClose,
}) => {
  const [platform, setPlatform] = useState<ExportPlatform>('ASCAP');
  const [exportScope, setExportScope] = useState<'selected' | 'all'>(
    selectedTrackIds.length > 0 ? 'selected' : 'all'
  );
  const [customFileName, setCustomFileName] = useState('');
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  const activeTracks = exportScope === 'selected' && selectedTrackIds.length > 0
    ? tracks.filter(t => selectedTrackIds.includes(t.id))
    : tracks;

  const currentSpec = PLATFORM_SPECS[platform];
  const previewCsv = generatePlatformCSV(activeTracks.slice(0, 5), platform);

  const handleDownload = () => {
    if (!isCurrent()) return;
    exportTracks(activeTracks, platform, customFileName.trim() || undefined);
    onClose();
  };

  const handleCopyClipboard = async () => {
    if (!isCurrent()) return;
    const fullCsv = generatePlatformCSV(activeTracks, platform);
    await navigator.clipboard.writeText(fullCsv);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0b0f1a] border border-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0f172a]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Platform Export Engine</h2>
              <p className="text-xs text-slate-500 font-mono">
                Transform extracted metadata into standardized PRO & distributor registration layouts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Target Platform Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-2.5">
              Select Destination Platform
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {(Object.keys(PLATFORM_SPECS) as ExportPlatform[]).map((pKey) => {
                const spec = PLATFORM_SPECS[pKey];
                const isSelected = platform === pKey;

                return (
                  <button
                    key={pKey}
                    type="button"
                    onClick={() => setPlatform(pKey)}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-indigo-600/15 border-indigo-500 text-white ring-1 ring-indigo-500 shadow-lg shadow-indigo-600/10'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-slate-100">{spec.name}</span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2">{spec.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Export Scope & Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800 font-mono">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Export Scope
              </label>
              <div className="flex space-x-3 mt-2">
                <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="scope"
                    checked={exportScope === 'all'}
                    onChange={() => setExportScope('all')}
                    className="text-indigo-600 bg-slate-800 border-slate-700 focus:ring-0"
                  />
                  <span>All Tracks ({tracks.length})</span>
                </label>

                {selectedTrackIds.length > 0 && (
                  <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="scope"
                      checked={exportScope === 'selected'}
                      onChange={() => setExportScope('selected')}
                      className="text-indigo-600 bg-slate-800 border-slate-700 focus:ring-0"
                    />
                    <span>Selected Only ({selectedTrackIds.length})</span>
                  </label>
                )}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Custom Output File Name (Optional)
              </label>
              <input
                type="text"
                value={customFileName}
                onChange={(e) => setCustomFileName(e.target.value)}
                placeholder={`${currentSpec.filenamePrefix}_${new Date().toISOString().split('T')[0]}`}
                className="w-full text-xs px-3 py-1.5 bg-[#0b0f1a] border border-slate-800 rounded-lg text-slate-200 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Live Tabular Preview */}
          <div className="space-y-2 font-mono">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-400 text-[11px] uppercase tracking-wider flex items-center space-x-1.5">
                <Table className="w-3.5 h-3.5 text-indigo-400" />
                <span>Format Preview ({platform === 'JSON' ? 'JSON Structure' : 'CSV Headers & Rows'})</span>
              </span>
              <button
                type="button"
                onClick={handleCopyClipboard}
                className="text-indigo-400 hover:text-indigo-300 text-xs font-semibold"
              >
                {copiedSuccess ? '✓ Copied to Clipboard!' : 'Copy to Clipboard'}
              </button>
            </div>

            <div className="bg-[#070b14] p-3 rounded-xl border border-slate-800 overflow-x-auto max-h-48">
              <pre className="text-[11px] font-mono text-slate-300 leading-relaxed whitespace-pre">
                {previewCsv || '// No tracks to display'}
              </pre>
            </div>
            {activeTracks.length > 5 && (
              <p className="text-[10px] text-slate-500 text-right">
                Showing preview of 5 of {activeTracks.length} tracks. All records will be included in exported file.
              </p>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-[#0f172a] font-mono">
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <Info className="w-4 h-4 text-slate-500" />
            <span>Ready to generate {activeTracks.length} records in {platform} format</span>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              id="export-download-confirm-btn"
              onClick={handleDownload}
              disabled={activeTracks.length === 0}
              className="flex items-center space-x-2 px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>Download {platform === 'JSON' ? '.JSON' : '.CSV'} File</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
