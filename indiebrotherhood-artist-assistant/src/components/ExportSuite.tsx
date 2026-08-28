import React, { useState } from "react";
import {
  Download,
  FileSpreadsheet,
  FileText,
  ShieldCheck,
  CheckCircle,
  Music,
  Printer,
  Sparkles,
} from "lucide-react";
import { ArtistProfile, ExportPlatform, SongMetadata } from "../types";
import {
  exportPlatformData,
  generateASCAPRegistrationCSV,
  generateMLCRegistrationCSV,
  generateSoundExchangeRegistrationCSV,
  generateBMIRegistrationCSV,
  generateFullCatalogueCSV,
} from "../lib/exportEngine";
import Papa from "papaparse";

interface ExportSuiteProps {
  songs: SongMetadata[];
  profile: ArtistProfile;
  onSelectSongToEdit?: (song: SongMetadata) => void;
}

export const ExportSuite: React.FC<ExportSuiteProps> = ({
  songs,
  profile,
  onSelectSongToEdit,
}) => {
  const [selectedPlatform, setSelectedPlatform] = useState<ExportPlatform>("ASCAP");
  const [selectedSongId, setSelectedSongId] = useState<string>("all");

  const filteredSongs =
    selectedSongId === "all"
      ? songs
      : songs.filter((s) => s.id === selectedSongId);

  // Generate preview parsed data for preview table
  const getPreviewData = () => {
    if (filteredSongs.length === 0) return { fields: [], data: [] };

    let csv = "";
    switch (selectedPlatform) {
      case "ASCAP":
        csv = generateASCAPRegistrationCSV(filteredSongs, profile);
        break;
      case "MLC":
        csv = generateMLCRegistrationCSV(filteredSongs, profile);
        break;
      case "SOUNDEXCHANGE":
        csv = generateSoundExchangeRegistrationCSV(filteredSongs, profile);
        break;
      case "BMI":
        csv = generateBMIRegistrationCSV(filteredSongs, profile);
        break;
      case "FULL_CATALOGUE_CSV":
      default:
        csv = generateFullCatalogueCSV(filteredSongs);
        break;
    }

    const parsed = Papa.parse(csv, { header: true });
    return {
      fields: parsed.meta.fields || [],
      data: parsed.data || [],
    };
  };

  const preview = getPreviewData();

  const handleDownload = () => {
    exportPlatformData(selectedPlatform, filteredSongs, profile);
  };

  const getPlatformDescription = () => {
    switch (selectedPlatform) {
      case "ASCAP":
        return "Formats composition work registrations, split percentages, writer IPIs, and publisher shares according to ASCAP's repertoire intake standards.";
      case "MLC":
        return "Generates The Mechanical Licensing Collective bulk work registration CSV with writer mechanical share % and sound recording ISRC links for 100% US streaming mechanical collection.";
      case "SOUNDEXCHANGE":
        return "Generates SoundExchange ISRC sound recording registration CSV with featured artist splits, P-Line master owner info, and duration for non-interactive digital radio royalties.";
      case "BMI":
        return "Standard BMI work registration template mapping title, CAE/IPI numbers, and composer/publisher splits.";
      case "SONGSPLIT":
        return "Generates an official, printable HTML Songwriter Split Sheet Agreement with legal warranties, percentage allocations, and signature lines.";
      case "FULL_CATALOGUE_CSV":
      default:
        return "Complete master CSV export of all song metadata, stream counts, earnings, writers, and dates in your local vault.";
    }
  };

  return (
    <div id="export-suite-view" className="space-y-6 animate-fadeIn">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                Dynamic Metadata Export Engine
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-normal border border-emerald-500/30">
                  2026 Spec Compliant
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Convert your catalog and extracted split sheets into official platform-compliant .csv and legal documents.
              </p>
            </div>
          </div>

          {/* Action Download Button */}
          <button
            onClick={handleDownload}
            disabled={filteredSongs.length === 0}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download {selectedPlatform} File</span>
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-800">
          {/* Platform Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Target Society / Export Format
            </label>
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value as ExportPlatform)}
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 font-medium text-xs focus:outline-none focus:border-indigo-500"
            >
              <option value="ASCAP">ASCAP (Work Registration .CSV)</option>
              <option value="MLC">The MLC (Bulk Work Registration .CSV)</option>
              <option value="SOUNDEXCHANGE">SoundExchange (ISRC Recording .CSV)</option>
              <option value="BMI">BMI (Work Registration .CSV)</option>
              <option value="SONGSPLIT">Songwriter Split Sheet Agreement (Printable HTML)</option>
              <option value="FULL_CATALOGUE_CSV">Master Catalogue (Full Metadata .CSV)</option>
            </select>
          </div>

          {/* Song Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Catalog Selection
            </label>
            <select
              value={selectedSongId}
              onChange={(e) => setSelectedSongId(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 font-medium text-xs focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Songs in Catalogue ({songs.length} tracks)</option>
              {songs.map((song) => (
                <option key={song.id} value={song.id}>
                  {song.title} {song.isrc ? `(${song.isrc})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Submitter Info Preview */}
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-center text-xs">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Registered Submitter</span>
            <p className="font-medium text-slate-200 truncate">
              {profile.artistName || "Independent Artist"} {profile.ipi ? `(IPI: ${profile.ipi})` : ""}
            </p>
            <p className="text-[11px] text-slate-400 truncate">
              PRO: {profile.pro} • Pub: {profile.publisher || "Self-Published"}
            </p>
          </div>
        </div>

        {/* Platform description banner */}
        <div className="mt-4 p-3 rounded-xl bg-indigo-950/30 border border-indigo-900/40 text-xs text-indigo-300 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-indigo-200">Format Guide: </strong>
            <span>{getPlatformDescription()}</span>
          </div>
        </div>
      </div>

      {/* Live Preview Table / Agreement View */}
      {selectedPlatform === "SONGSPLIT" ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              Songwriter Split Sheet Preview
            </h3>
            <button
              onClick={handleDownload}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-700"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Export Printable Agreement</span>
            </button>
          </div>

          {filteredSongs.length > 0 ? (
            <div className="p-6 bg-slate-950 rounded-xl border border-slate-800 font-sans text-xs space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h4 className="text-base font-bold text-slate-100">{filteredSongs[0].title}</h4>
                <p className="text-slate-400 text-[11px]">Primary Artist: {filteredSongs[0].primaryArtist || profile.artistName || "Independent Artist"}</p>
                <p className="text-slate-400 text-[11px]">ISRC: {filteredSongs[0].isrc || "Pending"} | ISWC: {filteredSongs[0].iswc || "Pending"}</p>
              </div>

              <div>
                <h5 className="font-semibold text-slate-300 mb-2">Writers & Percentage Allocations:</h5>
                <div className="space-y-2">
                  {(filteredSongs[0].writers || []).map((w, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <div>
                        <span className="font-semibold text-slate-200">{w.name}</span> ({w.role})
                        <span className="text-slate-400 ml-2">PRO: {w.pro} {w.ipi ? `(IPI: ${w.ipi})` : ""}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-slate-400 text-[11px]">Pub: {w.publisherName || "Self-Pub"} ({w.publisherSplitPercent}%)</span>
                        <span className="font-bold text-emerald-400 font-mono text-sm">{w.writerSplitPercent}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-center py-8 text-slate-500 text-xs">No song selected to preview split sheet.</p>
          )}
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
              Live Generated Table Preview ({preview.data.length} records ready)
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">
              Columns: {preview.fields.length}
            </span>
          </div>

          {preview.data.length > 0 ? (
            <div className="overflow-x-auto border border-slate-800 rounded-xl max-h-[420px] overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-950 text-slate-400 font-semibold sticky top-0 border-b border-slate-800">
                  <tr>
                    {preview.fields.map((col, idx) => (
                      <th key={idx} className="p-3 whitespace-nowrap bg-slate-950/95 font-medium border-r border-slate-800/60 last:border-r-0">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 text-slate-300 font-mono text-[11px]">
                  {preview.data.map((row: any, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-800/40 transition-colors">
                      {preview.fields.map((col, cIdx) => (
                        <td key={cIdx} className="p-2.5 whitespace-nowrap border-r border-slate-800/40 last:border-r-0 max-w-[240px] truncate">
                          {row[col] || <span className="text-slate-600 italic">-</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 text-xs">
              <Music className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="font-medium text-slate-400">No songs currently in catalog to export.</p>
              <p className="text-slate-500 mt-1">Add tracks in the Catalogue Manager or upload statements via the File Manager.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
