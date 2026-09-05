import React, { useState } from "react";
import {
  X,
  Settings,
  User,
  Key,
  Bell,
  Database,
  Download,
  Upload,
  Trash2,
  Check,
  Sparkles,
  ShieldAlert,
} from "lucide-react";
import { ArtistProfile, SettingsState, ProType } from "../types";
import { requestNotificationPermission } from "../lib/notificationEngine";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: ArtistProfile;
  settings: SettingsState;
  onSaveProfile: (profile: ArtistProfile) => void;
  onSaveSettings: (settings: SettingsState) => void;
  onResetData: () => void;
  onExportBackup: () => string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  profile,
  settings,
  onSaveProfile,
  onSaveSettings,
  onResetData,
  onExportBackup,
}) => {
  const [activeTab, setActiveTab] = useState<"profile" | "ai" | "notifications" | "data">("profile");
  const [localProfile, setLocalProfile] = useState<ArtistProfile>({ ...profile });
  const [localSettings, setLocalSettings] = useState<SettingsState>({ ...settings });
  const [exportError, setExportError] = useState("");
  const [savedNotice, setSavedNotice] = useState(false);
  const [newGoalInput, setNewGoalInput] = useState("");

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveProfile(localProfile);
    onSaveSettings(localSettings);
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      onClose();
    }, 800);
  };

  const handleAddGoal = () => {
    if (!newGoalInput.trim()) return;
    setLocalProfile({
      ...localProfile,
      careerGoals: [...(localProfile.careerGoals || []), newGoalInput.trim()],
    });
    setNewGoalInput("");
  };

  const handleRemoveGoal = (idx: number) => {
    setLocalProfile({
      ...localProfile,
      careerGoals: (localProfile.careerGoals || []).filter((_, i) => i !== idx),
    });
  };

  const handleExportBackup = async () => {
    let jsonStr: string;
    try { jsonStr = onExportBackup(); setExportError(''); }
    catch { setExportError('Export failed or the account changed. Reopen this workspace.'); return; }
    const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `IndieArtist_Vault_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleRequestNotif = async () => {
    const granted = await requestNotificationPermission();
    setLocalSettings({ ...localSettings, desktopNotificationsEnabled: granted });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      {exportError && <p role="alert" className="text-amber-300">{exportError}</p>}
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden text-slate-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Artist Profile & System Preferences</h2>
              <p className="text-xs text-slate-400">Configure your artist identifiers, Gemini AI features, and local vault</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/30 px-6 gap-2 text-xs font-medium">
          <button
            onClick={() => setActiveTab("profile")}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "profile"
                ? "border-indigo-500 text-indigo-300 font-semibold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Artist Identity & PRO</span>
          </button>

          <button
            onClick={() => setActiveTab("ai")}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "ai"
                ? "border-indigo-500 text-indigo-300 font-semibold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Gemini AI & Web Search</span>
          </button>

          <button
            onClick={() => setActiveTab("notifications")}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "notifications"
                ? "border-indigo-500 text-indigo-300 font-semibold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Alerts & Chimes</span>
          </button>

          <button
            onClick={() => setActiveTab("data")}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "data"
                ? "border-indigo-500 text-indigo-300 font-semibold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Data Vault & Backup</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* PROFILE TAB */}
          {activeTab === "profile" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Artist / Project Name *</label>
                  <input
                    type="text"
                    value={localProfile.artistName}
                    onChange={(e) => setLocalProfile({ ...localProfile, artistName: e.target.value })}
                    placeholder="e.g. Luna & The Waves"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Primary Music Genre</label>
                  <input
                    type="text"
                    value={localProfile.genre}
                    onChange={(e) => setLocalProfile({ ...localProfile, genre: e.target.value })}
                    placeholder="e.g. Indie Pop / Dream Pop / Alternative"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Career Stage</label>
                  <select
                    value={localProfile.stage}
                    onChange={(e) => setLocalProfile({ ...localProfile, stage: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Emerging / Demo Phase">Emerging / Demo Phase</option>
                    <option value="Actively Releasing">Actively Releasing Singles/EPs</option>
                    <option value="Touring Independent">Touring Independent</option>
                    <option value="Established Indie">Established Indie / Catalog Owner</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">PRO Affiliation (Performance Rights)</label>
                  <select
                    value={localProfile.pro}
                    onChange={(e) => setLocalProfile({ ...localProfile, pro: e.target.value as ProType })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="ASCAP">ASCAP (USA)</option>
                    <option value="BMI">BMI (USA)</option>
                    <option value="SESAC">SESAC (USA)</option>
                    <option value="PRS">PRS for Music (UK)</option>
                    <option value="SOCAN">SOCAN (Canada)</option>
                    <option value="GEMA">GEMA (Germany)</option>
                    <option value="SACEM">SACEM (France)</option>
                    <option value="Other">Other / International</option>
                    <option value="Unregistered">Not Yet Registered</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Songwriter IPI / CAE Number</label>
                  <input
                    type="text"
                    value={localProfile.ipi}
                    onChange={(e) => setLocalProfile({ ...localProfile, ipi: e.target.value })}
                    placeholder="e.g. 00845920194 (from ASCAP/BMI portal)"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Distributor</label>
                  <input
                    type="text"
                    value={localProfile.distributor}
                    onChange={(e) => setLocalProfile({ ...localProfile, distributor: e.target.value })}
                    placeholder="e.g. DistroKid, TuneCore, CD Baby, Symphonic"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Publishing Entity</label>
                  <input
                    type="text"
                    value={localProfile.publisher}
                    onChange={(e) => setLocalProfile({ ...localProfile, publisher: e.target.value })}
                    placeholder="e.g. Self-Published / Moon River Songs"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">SoundExchange Member ID (Optional)</label>
                  <input
                    type="text"
                    value={localProfile.soundExchangeId || ""}
                    onChange={(e) => setLocalProfile({ ...localProfile, soundExchangeId: e.target.value })}
                    placeholder="e.g. SX-998822"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Artist Bio & Sonic Description</label>
                <textarea
                  rows={3}
                  value={localProfile.bio}
                  onChange={(e) => setLocalProfile({ ...localProfile, bio: e.target.value })}
                  placeholder="Tell the career assistant about your artistic vision, influences, and upcoming projects..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Career Goals */}
              <div>
                <label className="block text-slate-300 font-medium mb-1">Active Career Goals</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newGoalInput}
                    onChange={(e) => setNewGoalInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddGoal()}
                    placeholder="e.g. Reach 50,000 monthly Spotify listeners, secure 2 sync placements..."
                    className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddGoal}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors"
                  >
                    Add Goal
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {(localProfile.careerGoals || []).map((goal, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-full text-indigo-200"
                    >
                      <span>{goal}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveGoal(idx)}
                        className="text-slate-400 hover:text-rose-400 ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* AI TAB */}
          {activeTab === "ai" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-slate-100">Live Google Search Grounding</h4>
                    <p className="text-slate-400">Enables the career assistant to search current music blogs, playlist trends, and festival opportunities.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localSettings.enableWebSearch}
                      onChange={(e) => setLocalSettings({ ...localSettings, enableWebSearch: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Model Selection</label>
                <select
                  value={localSettings.preferredModel}
                  onChange={(e) => setLocalSettings({ ...localSettings, preferredModel: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500 font-mono text-xs"
                >
                  <option value="gemini-3.7-flash">gemini-3.7-flash (Recommended: Low Latency & High Precision)</option>
                  <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview (Deep Music Legal Reasoning)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1 flex items-center justify-between">
                  <span>Custom Gemini API Key (Optional)</span>
                  <span className="text-slate-400 text-[10px]">Defaults to server GEMINI_API_KEY</span>
                </label>
                <input
                  type="password"
                  value={localSettings.customApiKey}
                  onChange={(e) => setLocalSettings({ ...localSettings, customApiKey: e.target.value })}
                  placeholder="AIzaSy... (leave blank to use platform default key)"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Custom keys are not saved. The unified suite uses authenticated platform AI and its displayed Coin prices; custom-key mode is only supported by the separate prototype server and is not a quota bypass.
                </p>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === "notifications" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-slate-100">Browser Desktop Notifications</h4>
                  <p className="text-slate-400">Receive active alerts for Spotify pitch deadlines and release checklist milestones.</p>
                </div>
                <button
                  type="button"
                  onClick={handleRequestNotif}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    localSettings.desktopNotificationsEnabled
                      ? "bg-emerald-600/20 text-emerald-300 border border-emerald-500/40"
                      : "bg-indigo-600 hover:bg-indigo-500 text-white"
                  }`}
                >
                  {localSettings.desktopNotificationsEnabled ? "Permission Active ✓" : "Enable Alerts"}
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-slate-100">Harmonic Audio Chimes</h4>
                  <p className="text-slate-400">Play an indie synth chime when important deadlines or OCR parses finish.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localSettings.enableSoundAlerts}
                    onChange={(e) => setLocalSettings({ ...localSettings, enableSoundAlerts: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>
          )}

          {/* DATA TAB */}
          {activeTab === "data" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-slate-100">Export Career Vault (JSON Backup)</h4>
                  <p className="text-slate-400">Export this account’s current metadata, profile, preferences, catalog, schedule and chat. Original uploaded files are not included; automatic restore is not yet supported.</p>
                </div>
                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg flex items-center gap-1.5 transition-colors font-medium"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Backup</span>
                </button>
              </div>

              <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/40 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-rose-200">Reset Local Vault</h4>
                  <p className="text-rose-300/80">Clear this account’s catalog, document metadata, schedule and chat. Profile and preferences are retained; default folders are restored.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("Reset this account’s browser workspace? Catalog, document metadata, schedule and chat will be cleared. Profile and preferences stay.")) {
                      onResetData();
                      onClose();
                    }
                  }}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg flex items-center gap-1.5 transition-colors font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Reset Vault</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="text-[11px] text-slate-400">
            {savedNotice ? (
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Changes applied. Check the workspace save status.
              </span>
            ) : (
              <span>Preferences persist across page sessions</span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save & Apply</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
