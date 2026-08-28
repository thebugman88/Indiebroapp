import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileAudio,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Music2,
  Sparkles,
  Layers,
  FileText,
  Clock,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ArtistTrack, TrackGenre } from '../types';
import { audioEngine } from '../utils/audioEngine';

interface TrackSubmissionModalProps {
  onTrackSubmitted: (newTrack: ArtistTrack) => void;
  onNavigateToDossier: () => void;
}

const GENRE_OPTIONS: TrackGenre[] = [
  'Hip-Hop / BoomBap',
  'Trap / Drill',
  'R&B / Neo-Soul',
  'Indie Rock / Alt',
  'Synthwave / Retro',
  'Afrobeats / Dancehall',
  'Pop / Electronic',
  'Lo-Fi / Chillhop',
  'Punk / Grunge',
  'Experimental / Ambient'
];

export const TrackSubmissionModal: React.FC<TrackSubmissionModalProps> = ({
  onTrackSubmitted,
  onNavigateToDossier
}) => {
  // Form State
  const [title, setTitle] = useState('');
  const [artistName, setArtistName] = useState('');
  const [genre, setGenre] = useState<TrackGenre>('Hip-Hop / BoomBap');
  const [subGenre, setSubGenre] = useState('');
  const [mood, setMood] = useState('Energetic & Gritty');
  const [bpm, setBpm] = useState<number | undefined>(120);
  const [keySignature, setKeySignature] = useState('C Minor');
  const [lyricsText, setLyricsText] = useState('');
  const [coverArtUrl, setCoverArtUrl] = useState('');

  // Audio Upload & Duration State
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const [durationSeconds, setDurationSeconds] = useState<number>(75);
  const [audioPreviewPlaying, setAudioPreviewPlaying] = useState(false);

  // Legal & Warranty Certification
  const [rightsCertified, setRightsCertified] = useState(false);
  const [noThirdPartyAgreed, setNoThirdPartyAgreed] = useState(false);
  const [signatureName, setSignatureName] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedTrackData, setSubmittedTrackData] = useState<ArtistTrack | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|ogg|m4a|flac)$/i)) {
      setErrorMsg('Please upload a valid audio master file (.mp3, .wav, .m4a, .ogg).');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setAudioFile(file);
    setAudioBlobUrl(objectUrl);
    setErrorMsg(null);

    // Read duration using an HTMLAudioElement
    const tempAudio = new Audio();
    tempAudio.src = objectUrl;
    tempAudio.onloadedmetadata = () => {
      if (tempAudio.duration && isFinite(tempAudio.duration)) {
        setDurationSeconds(Math.round(tempAudio.duration));
      }
    };
  };

  const handleCoverArtChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setCoverArtUrl(objectUrl);
  };

  const handleToggleAudioPreview = () => {
    if (!audioBlobUrl) return;
    if (audioPreviewPlaying) {
      audioEngine.pause();
      setAudioPreviewPlaying(false);
    } else {
      audioEngine.loadTrack(audioBlobUrl, durationSeconds);
      audioEngine.play();
      setAudioPreviewPlaying(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !artistName.trim()) {
      setErrorMsg('Track title and artist/stage name are required.');
      return;
    }

    if (!lyricsText.trim()) {
      setErrorMsg('Please paste the lyrical manuscript / track breakdown.');
      return;
    }

    if (!rightsCertified || !noThirdPartyAgreed || !signatureName.trim()) {
      setErrorMsg('You must certify 100% master ownership and sign with your legal author name.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    setTimeout(() => {
      const trackId = `track-user-${Date.now()}`;
      const defaultCover =
        coverArtUrl ||
        'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80';

      const initialReviews: ArtistTrack['reviews'] = [];
      const aggregatedScores: ArtistTrack['aggregatedScores'] = {
        overall: 0,
        lyrics: 0,
        vocals: 0,
        instrumentation: 0,
        vibe: 0,
        totalReviews: 0,
        fullListenRate: 0
      };

      const newTrack: ArtistTrack = {
        id: trackId,
        title: title.trim(),
        artistName: artistName.trim(),
        genre,
        subGenre: subGenre.trim() || 'Indie Original',
        mood: mood.trim(),
        bpm: bpm || 120,
        keySignature: keySignature.trim() || 'C Minor',
        durationSeconds: durationSeconds || 75,
        lyricsText: lyricsText.trim(),
        coverArt: defaultCover,
        audioBlobUrl: audioBlobUrl || undefined,
        uploadedAt: new Date().toISOString(),
        isUserSubmission: true,
        ownershipConfirmed: true,
        rightsHolderSignature: signatureName.trim(),
        status: 'evaluating',
        targetJudges: 10,
        reviews: initialReviews,
        aggregatedScores
      };

      onTrackSubmitted(newTrack);
      setSubmittedTrackData(newTrack);
      setIsSuccess(true);
      setIsSubmitting(false);

      audioEngine.playXPChime();
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 }
      });
    }, 800);
  };

  if (isSuccess && submittedTrackData) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 animate-fadeIn text-center">
        <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-black text-white">Track Queued in Judgement Chamber!</h2>
        <p className="text-zinc-400 text-sm mt-2 max-w-lg mx-auto">
          Your original master <strong>"{submittedTrackData.title}"</strong> has officially entered the 10-Judge Blind Chamber.
        </p>

        <div className="mt-6 p-5 rounded-2xl bg-zinc-900 border border-zinc-800 text-left max-w-md mx-auto space-y-2 text-xs font-mono">
          <div className="flex justify-between text-zinc-400">
            <span>Blind Submission ID:</span>
            <span className="text-amber-400">{submittedTrackData.id}</span>
          </div>
          <div className="flex justify-between text-zinc-400">
            <span>Genre & Vibe:</span>
            <span className="text-white">{submittedTrackData.genre}</span>
          </div>
          <div className="flex justify-between text-zinc-400">
            <span>Auditors Assigned:</span>
            <span className="text-emerald-400">10 Peer Judges (Anonymous)</span>
          </div>
          <div className="flex justify-between text-zinc-400">
            <span>Rights Signature:</span>
            <span className="text-zinc-300">{submittedTrackData.rightsHolderSignature}</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 mt-8">
          <button
            onClick={onNavigateToDossier}
            type="button"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-amber-950 font-bold text-sm shadow-xl hover:from-amber-400 hover:to-yellow-400 transition"
          >
            View Live Artist Dossier
          </button>
          <button
            onClick={() => {
              setIsSuccess(false);
              setTitle('');
              setLyricsText('');
              setAudioFile(null);
              setAudioBlobUrl(null);
            }}
            type="button"
            className="px-6 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 font-bold text-sm hover:bg-zinc-800 transition"
          >
            Submit Another Track
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id="track-submission-form-root" className="max-w-4xl mx-auto px-4 sm:px-6 py-6 animate-fadeIn space-y-6">
      {/* Header Banner */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono mb-2">
          <ShieldCheck className="w-3.5 h-3.5" /> DIRECT ARTIST ENTRY POINT • INDIEBROTHERHOOD 2026
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Submit Original Master to Judgement Chamber
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl">
          Enter your original recording into the anonymous peer randomizer. 10 qualified peer judges matching your sonic profile will evaluate your track without knowing your identity or song title.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500 text-rose-200 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Submission Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: Direct Ownership Warranty */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Step 1: Direct Master Rights & Ownership Warranty
          </h3>
          <p className="text-xs text-zinc-400">
            Judgement Zone strictly forbids 3rd party songs, covers, or uncleared commercial samples. Only 100% original artist master submissions are accepted.
          </p>

          <div className="space-y-3 pt-2">
            <label className="flex items-start gap-3 p-3 rounded-xl bg-zinc-900 border border-zinc-800 cursor-pointer">
              <input
                type="checkbox"
                id="submit-rights-confirm"
                checked={rightsCertified}
                onChange={(e) => setRightsCertified(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-amber-500 bg-zinc-800 border-zinc-700 focus:ring-amber-500"
              />
              <span className="text-xs text-zinc-200">
                <strong>100% Direct Rights Certification:</strong> I represent and warrant that I am the sole author/producer and own 100% of the intellectual property and master recording rights for this song.
              </span>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-xl bg-zinc-900 border border-zinc-800 cursor-pointer">
              <input
                type="checkbox"
                id="submit-no-third-party"
                checked={noThirdPartyAgreed}
                onChange={(e) => setNoThirdPartyAgreed(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-amber-500 bg-zinc-800 border-zinc-700 focus:ring-amber-500"
              />
              <span className="text-xs text-zinc-200">
                <strong>No Third-Party Music Clause:</strong> I confirm this is NOT a third-party upload, pirated recording, or unauthorized remix.
              </span>
            </label>

            <div className="pt-1">
              <label htmlFor="submit-author-signature" className="block text-xs font-mono text-zinc-400 mb-1">
                Legal Author / Producer Signature (Full Name):
              </label>
              <input
                type="text"
                id="submit-author-signature"
                value={signatureName}
                onChange={(e) => setSignatureName(e.target.value)}
                placeholder="e.g. Christopher Ray (Indie Creator)"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: Audio File Upload & Stems */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <FileAudio className="w-4 h-4 text-amber-400" />
            Step 2: Upload Master Audio Recording
          </h3>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-zinc-800 hover:border-amber-500/60 rounded-2xl p-6 sm:p-8 text-center cursor-pointer bg-zinc-900/40 hover:bg-zinc-900/80 transition group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleAudioFileChange}
              className="hidden"
              id="audio-upload-input"
            />
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-3 text-amber-400 group-hover:scale-110 transition">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div className="text-sm font-bold text-white">
              {audioFile ? audioFile.name : 'Click to Upload Master Audio (.mp3, .wav, .m4a)'}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              {audioFile
                ? `File size: ${(audioFile.size / 1024 / 1024).toFixed(2)} MB • Duration: ~${durationSeconds}s`
                : 'Or drag & drop your master audio here (Web Audio Engine will synthesize procedural demo stems if none attached)'}
            </p>
          </div>

          {/* Audio preview playback bar */}
          {audioBlobUrl && (
            <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-zinc-300 font-mono">
                <FileAudio className="w-4 h-4 text-emerald-400" />
                <span>Audio Preview Ready ({durationSeconds}s)</span>
              </div>
              <button
                type="button"
                onClick={handleToggleAudioPreview}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-amber-950 font-bold text-xs"
              >
                {audioPreviewPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{audioPreviewPlaying ? 'Pause Test' : 'Play Test'}</span>
              </button>
            </div>
          )}
        </div>

        {/* SECTION 3: Metadata & Lyric Manuscript */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-400" />
            Step 3: Track Metadata & Lyrical Manuscript
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="submit-track-title" className="block text-xs font-mono text-zinc-400 mb-1">Track Title</label>
              <input
                type="text"
                id="submit-track-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Midnight Reverie"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label htmlFor="submit-artist-name" className="block text-xs font-mono text-zinc-400 mb-1">Artist / Stage Name</label>
              <input
                type="text"
                id="submit-artist-name"
                value={artistName}
                onChange={(e) => setArtistName(e.target.value)}
                placeholder="e.g. Apex Rebel"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label htmlFor="submit-genre-select" className="block text-xs font-mono text-zinc-400 mb-1">Primary Genre</label>
              <select
                id="submit-genre-select"
                value={genre}
                onChange={(e) => setGenre(e.target.value as TrackGenre)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                {GENRE_OPTIONS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="submit-subgenre-input" className="block text-xs font-mono text-zinc-400 mb-1">Sub-Genre / Style</label>
              <input
                type="text"
                id="submit-subgenre-input"
                value={subGenre}
                onChange={(e) => setSubGenre(e.target.value)}
                placeholder="e.g. Conscious BoomBap / Jazz"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label htmlFor="submit-mood-input" className="block text-xs font-mono text-zinc-400 mb-1">Mood / Vibe</label>
              <input
                type="text"
                id="submit-mood-input"
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                placeholder="e.g. Late-night Introspective"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label htmlFor="submit-bpm-input" className="block text-xs font-mono text-zinc-400 mb-1">BPM / Key Signature</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  id="submit-bpm-input"
                  value={bpm || ''}
                  onChange={(e) => setBpm(parseInt(e.target.value) || undefined)}
                  placeholder="BPM (e.g. 96)"
                  className="w-1/2 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                />
                <input
                  type="text"
                  id="submit-key-input"
                  value={keySignature}
                  onChange={(e) => setKeySignature(e.target.value)}
                  placeholder="Key (e.g. D Min)"
                  className="w-1/2 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Lyrical Manuscript textarea */}
          <div className="pt-2">
            <label htmlFor="submit-lyrics-textarea" className="block text-xs font-mono text-zinc-400 mb-1">
              Full Lyric Manuscript / Vocal Arrangement:
            </label>
            <textarea
              id="submit-lyrics-textarea"
              value={lyricsText}
              onChange={(e) => setLyricsText(e.target.value)}
              placeholder="Paste full lyrics with verse / chorus indicators so judges can evaluate lyrical depth..."
              rows={4}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500 font-sans leading-relaxed resize-none"
              required
            />
          </div>
        </div>

        {/* Submit Action */}
        <div className="pt-2">
          <button
            id="submit-track-final-btn"
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-amber-950 font-black text-base flex items-center justify-center gap-2 shadow-2xl shadow-amber-500/20 cursor-pointer transition active:scale-[0.99]"
          >
            <Sparkles className="w-5 h-5" />
            <span>{isSubmitting ? 'Verifying & Queuing Master...' : 'Queue Master into 10-Judge Chamber'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
