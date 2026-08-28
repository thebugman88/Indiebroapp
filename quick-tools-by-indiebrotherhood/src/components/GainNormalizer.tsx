import React, { useState } from 'react';
import {
  Volume2,
  Upload,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Download,
  Copy,
  Check,
  Sliders,
  Activity,
  Radio,
  FileAudio,
  Zap,
  ArrowRight
} from 'lucide-react';
import { analyzeAudioFile, STREAMING_TARGETS } from '../utils/audioAnalyzer';
import { AudioAnalysisResult } from '../types';

export const GainNormalizer: React.FC = () => {
  const [selectedTarget, setSelectedTarget] = useState<number>(-14.0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AudioAnalysisResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    setErrorMsg(null);
    setAnalysisResult(null);

    try {
      const result = await analyzeAudioFile(file, selectedTarget);
      setAnalysisResult(result);
    } catch (err: any) {
      console.error('Audio analysis error:', err);
      setErrorMsg(err.message || 'Failed to analyze audio track. Make sure it is a valid audio file.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleTargetChange = (targetVal: number) => {
    setSelectedTarget(targetVal);
    if (analysisResult) {
      const gainAdjustmentDb = Math.round((targetVal - analysisResult.estimatedLufs) * 10) / 10;
      setAnalysisResult({
        ...analysisResult,
        targetLufs: targetVal,
        gainAdjustmentDb,
      });
    }
  };

  const generateReportText = () => {
    if (!analysisResult) return '';
    return `=====================================================
GAIN & INTEGRATED LUFS AUDIO ANALYSIS REPORT
quick tools by indiebrotherhood
=====================================================
File Name:              ${analysisResult.fileName}
Duration:               ${analysisResult.duration}s
Sample Rate:            ${analysisResult.sampleRate} Hz
Channels:               ${analysisResult.numberOfChannels === 2 ? 'Stereo (2ch)' : 'Mono (1ch)'}

LOUDNESS METRICS:
Estimated Integrated:   ${analysisResult.estimatedLufs} LUFS
Target Loudness:        ${analysisResult.targetLufs} LUFS
Recommended Gain Trim:  ${analysisResult.gainAdjustmentDb > 0 ? `+${analysisResult.gainAdjustmentDb}` : analysisResult.gainAdjustmentDb} dB
Peak Amplitude (dBFS):  ${analysisResult.peakDbfs} dBFS
RMS Loudness (dBFS):    ${analysisResult.rmsDbfs} dBFS
Clipping Status:        ${analysisResult.isClipping ? 'WARNING: Inter-sample Peak / Clipping Detected (>= -0.1 dBFS)' : 'PASSED: No Hard Clipping (< -0.1 dBFS)'}

STREAMING NORMALIZATION ADVICE:
${analysisResult.gainAdjustmentDb < 0
        ? `This master is currently ${Math.abs(analysisResult.gainAdjustmentDb)} dB louder than the ${analysisResult.targetLufs} LUFS target. Streaming platforms will automatically turn down this track by ${Math.abs(analysisResult.gainAdjustmentDb)} dB.`
        : `This master is currently ${analysisResult.gainAdjustmentDb} dB quieter than the ${analysisResult.targetLufs} LUFS target. Consider increasing your limiter/gain by +${analysisResult.gainAdjustmentDb} dB if headroom permits.`}
=====================================================`;
  };

  const handleCopyReport = () => {
    navigator.clipboard.writeText(generateReportText());
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDownloadReport = () => {
    const text = generateReportText();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `loudness_report_${analysisResult?.fileName.replace(/\.[^/.]+$/, '')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24">
      {/* Top Header Card */}
      <div className="bg-[#111] border border-white/5 rounded-2xl p-6 sm:p-7 space-y-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3 text-xs font-mono text-white/40">
          <div className="flex items-center gap-2 text-white font-bold uppercase tracking-wider text-[11px]">
            <Volume2 className="w-4 h-4 text-emerald-400" />
            <span>gain / peak normalizer & lufs checker</span>
          </div>
          <span className="text-white/40">client-side estimated loudness analysis</span>
        </div>

        {/* Target Standard Selector */}
        <div className="space-y-2">
          <label className="text-xs font-mono text-white/40 flex items-center gap-1.5 uppercase tracking-wider">
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            <span>select streaming loudness standard / reference:</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {STREAMING_TARGETS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => handleTargetChange(t.targetLufs)}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer font-mono ${selectedTarget === t.targetLufs
                    ? 'bg-[#050505] border-emerald-500/50 text-white shadow-sm ring-1 ring-emerald-500/30'
                    : 'bg-[#050505] border-white/5 text-white/40 hover:text-white hover:border-white/10'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{t.targetLufs} LUFS</span>
                  {selectedTarget === t.targetLufs && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  )}
                </div>
                <span className="text-[11px] text-white/80 block truncate mt-1">{t.name}</span>
                <span className="text-[10px] text-white/30 block truncate">{t.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Dropzone Upload */}
        <label className="border-2 border-dashed border-white/10 hover:border-emerald-500/50 bg-[#050505] hover:bg-white/5 p-8 rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all">
          <Upload className="w-8 h-8 text-emerald-400" />
          <div className="text-center font-mono text-xs space-y-1">
            <span className="text-white font-bold block text-sm">
              {analysisResult ? analysisResult.fileName : 'choose audio track to analyze'}
            </span>
            <span className="text-white/40 block">
              supports WAV, MP3, AAC, FLAC, M4A, OGG • analyzed 100% locally in browser
            </span>
          </div>
          <input
            id="gain-normalizer-audio-file-input"
            type="file"
            accept="audio/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>

        {isAnalyzing && (
          <div className="text-center py-6 text-xs font-mono text-white/40 flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            <span>decoding audio waveform and calculating integrated LUFS...</span>
          </div>
        )}

        {errorMsg && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs px-4 py-2.5 rounded-xl font-mono flex items-center justify-between">
            <span>{errorMsg}</span>
            <button onClick={() => setErrorMsg(null)} className="text-rose-400 hover:text-rose-200">✕</button>
          </div>
        )}
      </div>

      {/* Analysis Results Display */}
      {analysisResult && (
        <div className="bg-[#111] border border-white/5 rounded-2xl p-6 sm:p-7 space-y-6 shadow-xl">
          {/* Top Results Metrics Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
            <div>
              <span className="text-xs font-mono text-white/40 uppercase tracking-wider">analyzed file:</span>
              <h3 className="text-base font-bold font-mono text-white">{analysisResult.fileName}</h3>
              <p className="text-xs font-mono text-white/40">
                {analysisResult.duration}s duration • {analysisResult.sampleRate} Hz • {analysisResult.numberOfChannels === 2 ? 'Stereo' : 'Mono'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyReport}
                className="px-3 py-1.5 rounded-lg bg-[#050505] hover:bg-white/5 text-white/70 hover:text-white border border-white/5 text-xs font-mono uppercase tracking-wider font-bold flex items-center gap-1.5 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'copied!' : 'copy report'}</span>
              </button>

              <button
                onClick={handleDownloadReport}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>download report</span>
              </button>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Integrated LUFS */}
            <div className="bg-[#050505] border border-white/5 p-4 rounded-xl space-y-1">
              <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider">Estimated LUFS</span>
              <p className="text-2xl font-black font-mono text-white">
                {analysisResult.estimatedLufs} <span className="text-xs font-normal text-white/40">LUFS</span>
              </p>
              <span className="text-[10px] font-mono text-white/40">
                Target: {analysisResult.targetLufs} LUFS
              </span>
            </div>

            {/* Recommended Gain Trim */}
            <div className="bg-[#050505] border border-white/5 p-4 rounded-xl space-y-1">
              <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider">Gain Recommendation</span>
              <p className={`text-2xl font-black font-mono ${analysisResult.gainAdjustmentDb === 0
                  ? 'text-emerald-400'
                  : analysisResult.gainAdjustmentDb > 0
                    ? 'text-cyan-400'
                    : 'text-amber-400'
                }`}>
                {analysisResult.gainAdjustmentDb > 0 ? `+${analysisResult.gainAdjustmentDb}` : analysisResult.gainAdjustmentDb} <span className="text-xs font-normal text-white/40">dB</span>
              </p>
              <span className="text-[10px] font-mono text-white/40">
                to match {analysisResult.targetLufs} LUFS
              </span>
            </div>

            {/* Peak dBFS */}
            <div className="bg-[#050505] border border-white/5 p-4 rounded-xl space-y-1">
              <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider">Sample Peak Amplitude</span>
              <p className={`text-2xl font-black font-mono ${analysisResult.isClipping ? 'text-rose-400' : 'text-white'}`}>
                {analysisResult.peakDbfs} <span className="text-xs font-normal text-white/40">dBFS</span>
              </p>
              <span className="text-[10px] font-mono text-white/40">
                {analysisResult.isClipping ? 'Clipping Risk (>= -0.1 dBFS)' : 'Headroom OK (< -0.1 dBFS)'}
              </span>
            </div>

            {/* RMS dBFS */}
            <div className="bg-[#050505] border border-white/5 p-4 rounded-xl space-y-1">
              <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider">RMS Average Level</span>
              <p className="text-2xl font-black font-mono text-white">
                {analysisResult.rmsDbfs} <span className="text-xs font-normal text-white/40">dBFS</span>
              </p>
              <span className="text-[10px] font-mono text-white/40">
                Dynamic: {Math.round((analysisResult.peakDbfs - analysisResult.rmsDbfs) * 10) / 10} dB
              </span>
            </div>
          </div>

          {/* Waveform Visualization */}
          <div className="bg-[#050505] border border-white/5 p-4 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-white/40">
              <span>track peak waveform energy:</span>
              <span>{analysisResult.duration}s</span>
            </div>
            <div className="h-20 flex items-center gap-0.5 pt-2">
              {analysisResult.peakWaveform.map((p, idx) => (
                <div
                  key={idx}
                  className={`flex-1 rounded-sm transition-all ${p >= 0.99 ? 'bg-rose-500' : p >= 0.7 ? 'bg-amber-400' : 'bg-emerald-400/80 hover:bg-emerald-300'
                    }`}
                  style={{ height: `${Math.max(6, p * 100)}%` }}
                  title={`Sample peak: ${(p * 100).toFixed(1)}%`}
                />
              ))}
            </div>
          </div>

          {/* Practical Advice Banner */}
          <div className="bg-[#050505] border border-white/5 p-4 rounded-xl text-xs font-mono text-white space-y-1.5">
            <span className="text-emerald-400 font-bold flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
              <Zap className="w-3.5 h-3.5" />
              <span>normalization insight:</span>
            </span>
            <p className="font-sans text-white/70 leading-relaxed text-xs">
              {analysisResult.gainAdjustmentDb < 0 ? (
                <>
                  Your master is <strong className="text-white">{Math.abs(analysisResult.gainAdjustmentDb)} dB louder</strong> than the {analysisResult.targetLufs} LUFS target. When uploaded to Spotify, Apple Music, or YouTube, automated streaming loudness normalization will attenuate your track by {Math.abs(analysisResult.gainAdjustmentDb)} dB to match standard listening levels.
                </>
              ) : analysisResult.gainAdjustmentDb > 0 ? (
                <>
                  Your master is <strong className="text-white">{analysisResult.gainAdjustmentDb} dB quieter</strong> than the {analysisResult.targetLufs} LUFS target. If you desire commercial competitive volume, you can raise your limiter threshold or master output gain by up to +{analysisResult.gainAdjustmentDb} dB.
                </>
              ) : (
                <>
                  Your track hits the <strong className="text-emerald-400">{analysisResult.targetLufs} LUFS target perfectly</strong> without needing platform volume adjustments.
                </>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
