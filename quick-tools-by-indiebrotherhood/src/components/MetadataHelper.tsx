import { usePrivateStorage } from '../../../shared/PrivateWorkspaceGate';
import React, { useState } from 'react';
import { 
  Music, 
  Copy, 
  Check, 
  Download, 
  Sparkles, 
  RotateCcw, 
  FileCode, 
  FileText,
  Sliders,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { TrackMetadata } from '../types';

interface MetadataHelperProps {
  isAutoSaveOn: boolean;
  lastSaved: Date | null;
}

const INITIAL_METADATA: TrackMetadata = {
  songTitle: '',
  mainArtist: '',
  featuredArtists: '',
  producers: '',
  songwriters: '',
  publishers: '',
  genre: '',
  subGenre: '',
  isrc: '',
  iswc: '',
  releaseDate: '',
  bpm: '',
  keySignature: '',
  explicit: false,
  notes: '',
};

export const MetadataHelper: React.FC<MetadataHelperProps> = ({ isAutoSaveOn }) => {
  const localStorage = usePrivateStorage();
  const [metadata, setMetadata] = useState<TrackMetadata>(() => {
    try {
      const saved = localStorage.getItem('indie_track_metadata');
      return saved ? JSON.parse(saved) : INITIAL_METADATA;
    } catch {
      return INITIAL_METADATA;
    }
  });

  const [copiedType, setCopiedType] = useState<'json' | 'id3' | 'sheet' | null>(null);

  const updateField = (field: keyof TrackMetadata, value: any) => {
    setMetadata((prev) => {
      const next = { ...prev, [field]: value };
      if (isAutoSaveOn) {
        try {
          localStorage.setItem('indie_track_metadata', JSON.stringify(next));
        } catch (e) {
          console.error(e);
        }
      }
      return next;
    });
  };

  // Generate ID3 Tag Text
  const generateId3Text = () => {
    return `TIT2 (Title): ${metadata.songTitle}
TPE1 (Lead Artist): ${metadata.mainArtist}
TPE2 (Band/Featured): ${metadata.featuredArtists || 'N/A'}
TCOM (Composer/Writers): ${metadata.songwriters}
TCON (Genre): ${metadata.genre}
TDRC (Release Date): ${metadata.releaseDate}
TBPM (BPM): ${metadata.bpm}
TKEY (Key): ${metadata.keySignature}
TSRC (ISRC): ${metadata.isrc}
TPUB (Publisher): ${metadata.publishers}
COMM (Comments): ${metadata.notes}`;
  };

  // Generate Registration Text Summary
  const generateRegistrationSummary = () => {
    return `=====================================================
SONG METADATA & REGISTRATION SUMMARY
quick tools by indiebrotherhood
=====================================================
Song Title:        ${metadata.songTitle}
Main Artist:       ${metadata.mainArtist}
Featured Artists:  ${metadata.featuredArtists || 'None'}
Producers:         ${metadata.producers}
Songwriters:       ${metadata.songwriters}
Publishers:        ${metadata.publishers}
Genre / Sub-Genre: ${metadata.genre} / ${metadata.subGenre}
ISRC Code:         ${metadata.isrc}
ISWC Code:         ${metadata.iswc}
Release Date:      ${metadata.releaseDate}
Tempo & Key:       ${metadata.bpm} BPM | ${metadata.keySignature}
Explicit Content:  ${metadata.explicit ? 'YES [Explicit]' : 'NO [Clean]'}
Additional Notes:  ${metadata.notes}
=====================================================`;
  };

  const handleCopy = (type: 'json' | 'id3' | 'sheet') => {
    let content = '';
    if (type === 'json') {
      content = JSON.stringify(metadata, null, 2);
    } else if (type === 'id3') {
      content = generateId3Text();
    } else {
      content = generateRegistrationSummary();
    }

    navigator.clipboard.writeText(content);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 1800);
  };

  const handleDownloadJson = () => {
    const jsonStr = JSON.stringify(metadata, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${metadata.songTitle.replace(/\s+/g, '_')}_metadata.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadTxt = () => {
    const text = generateRegistrationSummary();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${metadata.songTitle.replace(/\s+/g, '_')}_registration.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ISRC format validation
  const isIsrcValid = /^[A-Z]{2}-?[A-Z0-9]{3}-?[0-9]{2}-?[0-9]{5}$/i.test(metadata.isrc.trim());

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24">
      {/* Top Header Controls */}
      <div className="bg-[#111] border border-white/5 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3 text-xs font-mono text-white/40">
          <div className="flex items-center gap-2 text-white font-bold uppercase tracking-wider text-[11px]">
            <Music className="w-4 h-4 text-emerald-400" />
            <span>track metadata & distributor tagging</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCopy('json')}
              className="px-2.5 py-1.5 rounded-lg bg-[#050505] hover:bg-white/5 text-white/70 hover:text-white border border-white/5 flex items-center gap-1.5 transition-colors cursor-pointer text-xs uppercase tracking-wider font-bold"
            >
              {copiedType === 'json' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <FileCode className="w-3.5 h-3.5" />}
              <span>{copiedType === 'json' ? 'copied!' : 'copy json'}</span>
            </button>

            <button
              onClick={() => handleCopy('id3')}
              className="px-2.5 py-1.5 rounded-lg bg-[#050505] hover:bg-white/5 text-white/70 hover:text-white border border-white/5 flex items-center gap-1.5 transition-colors cursor-pointer text-xs uppercase tracking-wider font-bold"
            >
              {copiedType === 'id3' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedType === 'id3' ? 'copied!' : 'copy id3'}</span>
            </button>

            <button
              onClick={handleDownloadJson}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm text-xs uppercase tracking-wider"
            >
              <Download className="w-3.5 h-3.5" />
              <span>download .json</span>
            </button>

            <button
              onClick={handleDownloadTxt}
              className="p-1.5 rounded-lg bg-[#050505] hover:bg-white/5 text-white/40 hover:text-white border border-white/5"
              title="Download registration text"
            >
              <FileText className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Input Form Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          {/* Song Title */}
          <div className="space-y-1.5">
            <label className="text-white/40 flex items-center justify-between">
              <span>song title *</span>
              <span className="text-[10px] text-white/20">TIT2</span>
            </label>
            <input
              id="meta-song-title-input"
              type="text"
              value={metadata.songTitle}
              onChange={(e) => updateField('songTitle', e.target.value)}
              placeholder="e.g. Midnight Drive"
              className="w-full bg-[#050505] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          {/* Main Artist */}
          <div className="space-y-1.5">
            <label className="text-white/40 flex items-center justify-between">
              <span>primary artist *</span>
              <span className="text-[10px] text-white/20">TPE1</span>
            </label>
            <input
              id="meta-main-artist-input"
              type="text"
              value={metadata.mainArtist}
              onChange={(e) => updateField('mainArtist', e.target.value)}
              placeholder="e.g. Neon Horizon"
              className="w-full bg-[#050505] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          {/* Featured Artists */}
          <div className="space-y-1.5">
            <label className="text-white/40 flex items-center justify-between">
              <span>featured artist(s)</span>
              <span className="text-[10px] text-white/20">comma-separated</span>
            </label>
            <input
              id="meta-featured-artists-input"
              type="text"
              value={metadata.featuredArtists}
              onChange={(e) => updateField('featuredArtists', e.target.value)}
              placeholder="e.g. Echo Youth, Nova"
              className="w-full bg-[#050505] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          {/* Producers */}
          <div className="space-y-1.5">
            <label className="text-white/40 flex items-center justify-between">
              <span>producer(s)</span>
              <span className="text-[10px] text-white/20">track production</span>
            </label>
            <input
              id="meta-producers-input"
              type="text"
              value={metadata.producers}
              onChange={(e) => updateField('producers', e.target.value)}
              placeholder="e.g. Alex River"
              className="w-full bg-[#050505] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          {/* Songwriters */}
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-white/40 flex items-center justify-between">
              <span>songwriters / composers *</span>
              <span className="text-[10px] text-white/20">legal full names for PRO registration</span>
            </label>
            <input
              id="meta-songwriters-input"
              type="text"
              value={metadata.songwriters}
              onChange={(e) => updateField('songwriters', e.target.value)}
              placeholder="e.g. Alex River, Jordan Lee"
              className="w-full bg-[#050505] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          {/* Publishers */}
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-white/40 flex items-center justify-between">
              <span>publishing entities</span>
              <span className="text-[10px] text-white/20">BMI / ASCAP / Self-Published</span>
            </label>
            <input
              id="meta-publishers-input"
              type="text"
              value={metadata.publishers}
              onChange={(e) => updateField('publishers', e.target.value)}
              placeholder="e.g. Indie Brotherhood Publishing (BMI)"
              className="w-full bg-[#050505] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          {/* ISRC Code */}
          <div className="space-y-1.5">
            <label className="text-white/40 flex items-center justify-between">
              <span>isrc code</span>
              <span className={`text-[10px] flex items-center gap-1 ${isIsrcValid ? 'text-emerald-400' : 'text-amber-400'}`}>
                {isIsrcValid ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                <span>format: CC-XXX-YY-NNNNN</span>
              </span>
            </label>
            <input
              id="meta-isrc-input"
              type="text"
              value={metadata.isrc}
              onChange={(e) => updateField('isrc', e.target.value.toUpperCase())}
              placeholder="e.g. US-IB1-26-00101"
              className="w-full bg-[#050505] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          {/* ISWC Code */}
          <div className="space-y-1.5">
            <label className="text-white/40 flex items-center justify-between">
              <span>iswc code</span>
              <span className="text-[10px] text-white/20">musical work id</span>
            </label>
            <input
              id="meta-iswc-input"
              type="text"
              value={metadata.iswc}
              onChange={(e) => updateField('iswc', e.target.value.toUpperCase())}
              placeholder="e.g. T-345.678.901-2"
              className="w-full bg-[#050505] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          {/* Genre & Subgenre */}
          <div className="space-y-1.5">
            <label className="text-white/40">genre *</label>
            <input
              id="meta-genre-input"
              type="text"
              value={metadata.genre}
              onChange={(e) => updateField('genre', e.target.value)}
              placeholder="e.g. Indie Pop / Synthwave"
              className="w-full bg-[#050505] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-white/40">sub-genre</label>
            <input
              id="meta-subgenre-input"
              type="text"
              value={metadata.subGenre}
              onChange={(e) => updateField('subGenre', e.target.value)}
              placeholder="e.g. Dream Pop"
              className="w-full bg-[#050505] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          {/* Release Date, BPM, Key */}
          <div className="space-y-1.5">
            <label className="text-white/40">release date</label>
            <input
              id="meta-release-date-input"
              type="date"
              value={metadata.releaseDate}
              onChange={(e) => updateField('releaseDate', e.target.value)}
              className="w-full bg-[#050505] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <label className="text-white/40">bpm</label>
              <input
                id="meta-bpm-input"
                type="text"
                value={metadata.bpm}
                onChange={(e) => updateField('bpm', e.target.value)}
                placeholder="124"
                className="w-full bg-[#050505] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500/50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-white/40">musical key</label>
              <input
                id="meta-key-input"
                type="text"
                value={metadata.keySignature}
                onChange={(e) => updateField('keySignature', e.target.value)}
                placeholder="F# Minor"
                className="w-full bg-[#050505] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>

          {/* Explicit & Notes */}
          <div className="space-y-1.5 sm:col-span-2">
            <div className="flex items-center justify-between">
              <label className="text-white/40">parental advisory (explicit)</label>
              <button
                type="button"
                onClick={() => updateField('explicit', !metadata.explicit)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer ${
                  metadata.explicit
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold'
                    : 'bg-[#050505] text-white/40 border border-white/5'
                }`}
              >
                {metadata.explicit ? '● Explicit Master' : '○ Clean / Radio Edit'}
              </button>
            </div>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-white/40">production & mastering notes</label>
            <textarea
              id="meta-notes-input"
              value={metadata.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder="e.g. Mastered by Sterling Sound, -14 LUFS target..."
              rows={2}
              className="w-full bg-[#050505] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500/50 resize-y"
            />
          </div>
        </div>
      </div>

      {/* Live Registration Preview Card */}
      <div className="bg-[#111] border border-white/5 rounded-2xl p-5 space-y-3 font-mono text-xs text-white/40 shadow-xl">
        <div className="flex items-center justify-between text-white border-b border-white/5 pb-2">
          <span className="font-bold text-emerald-400 uppercase tracking-wider text-[11px]">track registration preview</span>
          <button
            onClick={() => handleCopy('sheet')}
            className="text-xs text-white/40 hover:text-emerald-400 flex items-center gap-1 cursor-pointer"
          >
            {copiedType === 'sheet' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>copy summary</span>
          </button>
        </div>
        <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-[11px] text-white/80 leading-relaxed bg-[#050505] p-3.5 rounded-xl border border-white/5">
          {generateRegistrationSummary()}
        </pre>
      </div>
    </div>
  );
};
