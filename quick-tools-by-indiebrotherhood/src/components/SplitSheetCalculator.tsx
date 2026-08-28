import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  Plus,
  Trash2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Download,
  Copy,
  Check,
  FileText,
  Percent,
  Printer,
  ShieldCheck,
  Building2
} from 'lucide-react';
import { Collaborator } from '../types';

interface SplitSheetCalculatorProps {
  isAutoSaveOn: boolean;
  lastSaved: Date | null;
}

const INITIAL_COLLABORATORS: Collaborator[] = [
  {
    id: 'collab-1',
    name: '',
    email: '',
    role: '',
    pro: 'BMI',
    ipi: '',
    publishingPercentage: 0,
    masterPercentage: 0,
  },
];

export const SplitSheetCalculator: React.FC<SplitSheetCalculatorProps> = ({ isAutoSaveOn }) => {
  const [songTitle, setSongTitle] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('indie_split_sheet_meta') || '{}').songTitle || '';
    } catch {
      return '';
    }
  });
  const [agreementDate, setAgreementDate] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('indie_split_sheet_meta') || '{}').agreementDate || new Date().toISOString().slice(0, 10);
    } catch {
      return new Date().toISOString().slice(0, 10);
    }
  });
  const [collaborators, setCollaborators] = useState<Collaborator[]>(() => {
    try {
      const saved = localStorage.getItem('indie_split_sheet_collabs');
      return saved ? JSON.parse(saved) : INITIAL_COLLABORATORS;
    } catch {
      return INITIAL_COLLABORATORS;
    }
  });

  const [copiedAgreement, setCopiedAgreement] = useState(false);
  const [showAgreementModal, setShowAgreementModal] = useState(false);

  useEffect(() => {
    if (!isAutoSaveOn) return;
    try {
      localStorage.setItem('indie_split_sheet_meta', JSON.stringify({ songTitle, agreementDate }));
    } catch (e) {
      console.error(e);
    }
  }, [agreementDate, isAutoSaveOn, songTitle]);

  const saveCollabs = (list: Collaborator[]) => {
    setCollaborators(list);
    if (isAutoSaveOn) {
      try {
        localStorage.setItem('indie_split_sheet_collabs', JSON.stringify(list));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleAddCollaborator = () => {
    const newCollab: Collaborator = {
      id: `collab-${Date.now()}`,
      name: '',
      email: '',
      role: 'Lyricist / Songwriter',
      pro: 'BMI',
      ipi: '',
      publishingPercentage: 0,
      masterPercentage: 0,
    };
    saveCollabs([...collaborators, newCollab]);
  };

  const handleRemoveCollaborator = (id: string) => {
    if (collaborators.length <= 1) return;
    saveCollabs(collaborators.filter((c) => c.id !== id));
  };

  const handleUpdateCollaborator = (id: string, field: keyof Collaborator, value: any) => {
    const updated = collaborators.map((c) => {
      if (c.id === id) {
        return { ...c, [field]: value };
      }
      return c;
    });
    saveCollabs(updated);
  };

  // Equalize splits equally
  const handleEqualSplit = () => {
    const count = collaborators.length;
    if (count === 0) return;
    const base = Math.floor((100 / count) * 100) / 100;
    const remainder = Math.round((100 - base * count) * 100) / 100;

    const updated = collaborators.map((c, idx) => ({
      ...c,
      publishingPercentage: idx === 0 ? Number((base + remainder).toFixed(2)) : base,
      masterPercentage: idx === 0 ? Number((base + remainder).toFixed(2)) : base,
    }));
    saveCollabs(updated);
  };

  // Calculate totals
  const totalPublishing = useMemo(() => {
    return Math.round(collaborators.reduce((acc, c) => acc + (Number(c.publishingPercentage) || 0), 0) * 100) / 100;
  }, [collaborators]);

  const totalMaster = useMemo(() => {
    return Math.round(collaborators.reduce((acc, c) => acc + (Number(c.masterPercentage) || 0), 0) * 100) / 100;
  }, [collaborators]);

  const isPublishingValid = Math.abs(totalPublishing - 100) < 0.01;
  const isMasterValid = Math.abs(totalMaster - 100) < 0.01;

  // Generate legal agreement text
  const generateAgreementText = () => {
    const collabRows = collaborators.map((c, i) => {
      return `[${i + 1}] COLLABORATOR: ${c.name || 'Untitled'}
    Role: ${c.role || 'Contributor'}
    Email: ${c.email || 'N/A'}
    PRO: ${c.pro || 'N/A'} | IPI / CAE #: ${c.ipi || 'N/A'}
    Publishing Ownership: ${c.publishingPercentage}%
    Master Recording Share: ${c.masterPercentage}%
    Signature: ___________________________ Date: ______________
`;
    }).join('\n');

    return `========================================================================
MUSIC COMPOSITION & MASTER RECORDING SPLIT SHEET AGREEMENT
Generated via quick tools by indiebrotherhood
========================================================================

Date of Agreement: ${agreementDate}
Song / Composition Title: "${songTitle}"

1. UNDERSTANDING:
The undersigned parties ("Collaborators") agree that this split sheet establishes
the agreed-upon shares of ownership, publishing royalties, mechanical royalties,
and master sound recording rights in connection with the musical work titled "${songTitle}".

2. OWNERSHIP BREAKDOWN & SIGNATURES:

${collabRows}

3. TERMS & ACKNOWLEDGMENTS:
- All collaborators represent and warrant that their contributions are original.
- Publishing royalties shall be collected and distributed in accordance with the stated percentages.
- Master recording revenue and licensing shall adhere strictly to the master share percentages.
- Any future synchronization or third-party license requires mutual consent.

Agreed and Accepted:

${collaborators.map((c) => `Print Name: ${c.name || 'Collaborator'}  |  Sign: ___________________`).join('\n\n')}
========================================================================`;
  };

  const handleCopyAgreement = () => {
    navigator.clipboard.writeText(generateAgreementText());
    setCopiedAgreement(true);
    setTimeout(() => setCopiedAgreement(false), 2000);
  };

  const handleDownloadAgreement = () => {
    const content = generateAgreementText();
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `split_sheet_${songTitle.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24">
      {/* Top Banner & Validation Meters */}
      <div className="bg-[#111] border border-white/5 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3 text-xs font-mono text-white/40">
          <div className="flex items-center gap-2 text-white font-bold uppercase tracking-wider text-[11px]">
            <Users className="w-4 h-4 text-emerald-400" />
            <span>collaborator split sheet calculator</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleEqualSplit}
              className="px-2.5 py-1.5 rounded-lg bg-[#050505] hover:bg-white/5 text-white/70 hover:text-white border border-white/5 flex items-center gap-1.5 transition-colors cursor-pointer text-xs uppercase tracking-wider font-bold"
            >
              <Percent className="w-3.5 h-3.5 text-emerald-400" />
              <span>auto equal split</span>
            </button>
            <button
              id="generate-split-agreement-btn"
              onClick={() => setShowAgreementModal(true)}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm text-xs uppercase tracking-wider"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>generate agreement</span>
            </button>
          </div>
        </div>

        {/* Basic Song Info Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
          <div className="space-y-1">
            <label className="text-white/40">song / project title</label>
            <input
              id="split-song-title-input"
              type="text"
              value={songTitle}
              onChange={(e) => setSongTitle(e.target.value)}
              placeholder="e.g. Midnight Drive"
              className="w-full bg-[#050505] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500/60"
            />
          </div>

          <div className="space-y-1">
            <label className="text-white/40">agreement date</label>
            <input
              id="split-agreement-date-input"
              type="date"
              value={agreementDate}
              onChange={(e) => setAgreementDate(e.target.value)}
              className="w-full bg-[#050505] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500/60"
            />
          </div>
        </div>

        {/* Live 100% Validation Bars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {/* Publishing Split Meter */}
          <div className="bg-[#050505] border border-white/5 p-3.5 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-white/40">Publishing Split:</span>
              <span className={`font-bold flex items-center gap-1 ${isPublishingValid ? 'text-emerald-400' : 'text-amber-400'}`}>
                {isPublishingValid ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                <span>{totalPublishing}% / 100%</span>
              </span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-200 ${isPublishingValid ? 'bg-emerald-400' : totalPublishing > 100 ? 'bg-rose-500' : 'bg-amber-400'
                  }`}
                style={{ width: `${Math.min(100, totalPublishing)}%` }}
              />
            </div>
            {!isPublishingValid && (
              <p className="text-[10px] font-mono text-amber-400/90">
                {totalPublishing < 100 ? `${(100 - totalPublishing).toFixed(2)}% remaining` : `${(totalPublishing - 100).toFixed(2)}% over allocated!`}
              </p>
            )}
          </div>

          {/* Master Split Meter */}
          <div className="bg-[#050505] border border-white/5 p-3.5 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-white/40">Master Rights Split:</span>
              <span className={`font-bold flex items-center gap-1 ${isMasterValid ? 'text-emerald-400' : 'text-amber-400'}`}>
                {isMasterValid ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                <span>{totalMaster}% / 100%</span>
              </span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-200 ${isMasterValid ? 'bg-emerald-400' : totalMaster > 100 ? 'bg-rose-500' : 'bg-amber-400'
                  }`}
                style={{ width: `${Math.min(100, totalMaster)}%` }}
              />
            </div>
            {!isMasterValid && (
              <p className="text-[10px] font-mono text-amber-400/90">
                {totalMaster < 100 ? `${(100 - totalMaster).toFixed(2)}% remaining` : `${(totalMaster - 100).toFixed(2)}% over allocated!`}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Collaborator Cards List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-mono text-white/40 px-1">
          <span className="uppercase tracking-wider font-bold text-[11px]">collaborators & ownership breakdown ({collaborators.length})</span>
          <button
            id="add-collaborator-btn"
            onClick={handleAddCollaborator}
            className="px-2.5 py-1.5 rounded-lg bg-[#111] hover:bg-white/5 text-emerald-400 border border-white/5 flex items-center gap-1 cursor-pointer transition-colors text-xs font-bold uppercase tracking-wider"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>add collaborator</span>
          </button>
        </div>

        {collaborators.map((c, index) => (
          <div
            key={c.id}
            className="bg-[#111] border border-white/5 rounded-2xl p-5 space-y-4 shadow-xl transition-all"
          >
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                <span>#{index + 1}</span>
                <span>{c.name || 'Collaborator'}</span>
              </span>

              {collaborators.length > 1 && (
                <button
                  onClick={() => handleRemoveCollaborator(c.id)}
                  className="p-1.5 rounded-lg text-white/30 hover:text-rose-400 hover:bg-white/5 cursor-pointer"
                  title="Remove collaborator"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
              {/* Name */}
              <div className="space-y-1">
                <label className="text-white/40">full legal name *</label>
                <input
                  type="text"
                  value={c.name}
                  onChange={(e) => handleUpdateCollaborator(c.id, 'name', e.target.value)}
                  placeholder="e.g. Alex River"
                  className="w-full bg-[#050505] border border-white/10 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-emerald-500/60"
                />
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-white/40">email</label>
                <input
                  type="email"
                  value={c.email}
                  onChange={(e) => handleUpdateCollaborator(c.id, 'email', e.target.value)}
                  placeholder="alex@domain.com"
                  className="w-full bg-[#050505] border border-white/10 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-emerald-500/60"
                />
              </div>

              {/* Role */}
              <div className="space-y-1">
                <label className="text-white/40">role / contribution</label>
                <input
                  type="text"
                  value={c.role}
                  onChange={(e) => handleUpdateCollaborator(c.id, 'role', e.target.value)}
                  placeholder="e.g. Producer, Topliner"
                  className="w-full bg-[#050505] border border-white/10 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-emerald-500/60"
                />
              </div>

              {/* PRO */}
              <div className="space-y-1">
                <label className="text-white/40">pro (ascap, bmi, sesac, etc.)</label>
                <input
                  type="text"
                  value={c.pro}
                  onChange={(e) => handleUpdateCollaborator(c.id, 'pro', e.target.value)}
                  placeholder="BMI / ASCAP / SOCAN"
                  className="w-full bg-[#050505] border border-white/10 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-emerald-500/60"
                />
              </div>

              {/* IPI / CAE # */}
              <div className="space-y-1">
                <label className="text-white/40">ipi / cae number</label>
                <input
                  type="text"
                  value={c.ipi}
                  onChange={(e) => handleUpdateCollaborator(c.id, 'ipi', e.target.value)}
                  placeholder="e.g. 102938475"
                  className="w-full bg-[#050505] border border-white/10 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-emerald-500/60"
                />
              </div>

              {/* Percentages: Publishing & Master */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-white/40">publishing %</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={c.publishingPercentage}
                    onChange={(e) => handleUpdateCollaborator(c.id, 'publishingPercentage', parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#050505] border border-white/10 rounded-lg px-2.5 py-1.5 text-white font-bold focus:outline-none focus:border-emerald-500/60 text-right"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-white/40">master %</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={c.masterPercentage}
                    onChange={(e) => handleUpdateCollaborator(c.id, 'masterPercentage', parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#050505] border border-white/10 rounded-lg px-2.5 py-1.5 text-white font-bold focus:outline-none focus:border-emerald-500/60 text-right"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Agreement Modal / Full Screen View */}
      {showAgreementModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-white/5 bg-[#050505] flex items-center justify-between text-xs font-mono text-white">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="font-bold uppercase tracking-wider text-[11px]">legal split sheet agreement summary</span>
              </div>
              <button
                onClick={() => setShowAgreementModal(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-white/40 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto font-mono text-xs text-white/80 leading-relaxed space-y-4">
              <pre className="whitespace-pre-wrap bg-[#050505] p-4 rounded-xl border border-white/5 text-[11px] text-white/80">
                {generateAgreementText()}
              </pre>
            </div>

            {/* Modal Actions */}
            <div className="px-6 py-4 border-t border-white/5 bg-[#050505] flex items-center justify-between text-xs font-mono">
              <span className="text-white/40">ready for signatures & distribution</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyAgreement}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white border border-white/10 flex items-center gap-1.5 cursor-pointer uppercase tracking-wider font-bold text-xs"
                >
                  {copiedAgreement ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedAgreement ? 'copied!' : 'copy agreement'}</span>
                </button>

                <button
                  onClick={handleDownloadAgreement}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold flex items-center gap-1.5 cursor-pointer shadow-md uppercase tracking-wider text-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>download .txt</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
