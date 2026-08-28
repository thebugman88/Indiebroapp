import React, { useState } from 'react';
import {
  X,
  PlusCircle,
  Vote,
  Layers,
  Settings,
  Clock,
  Trash2,
  Edit2,
  CheckCircle,
  Play,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  ArrowUpDown,
  Tag,
  User,
} from 'lucide-react';
import type { Topic, Motion, TopicStatus } from '../types';

interface HostDialogProps {
  isOpen: boolean;
  onClose: () => void;
  topics: Topic[];
  activeMotion: Motion | null;
  onAddTopic: (topic: { title: string; description: string; presenter: string; status: TopicStatus; tags: string[] }) => void;
  onUpdateTopic: (topicId: string, updates: Partial<Topic>) => void;
  onDeleteTopic: (topicId: string) => void;
  onStartMotion: (motion: {
    title: string;
    description: string;
    proposedBy: string;
    topicId?: string;
    requiredMajority: 'simple' | 'two_thirds' | 'unanimous';
    durationSeconds?: number;
  }) => void;
  onCloseMotion: (motionId: string) => void;
  onUpdateMeetingStatus: (status: 'scheduled' | 'in_session' | 'adjourned') => void;
  meetingStatus: 'scheduled' | 'in_session' | 'adjourned';
  userName: string;
}

export function HostDialog({
  isOpen,
  onClose,
  topics,
  activeMotion,
  onAddTopic,
  onUpdateTopic,
  onDeleteTopic,
  onStartMotion,
  onCloseMotion,
  onUpdateMeetingStatus,
  meetingStatus,
  userName,
}: HostDialogProps) {
  const [activeTab, setActiveTab] = useState<'topics' | 'motion' | 'session'>('topics');

  // Topic form state - initialized empty without custom text
  const [topicTitle, setTopicTitle] = useState('');
  const [topicDescription, setTopicDescription] = useState('');
  const [topicPresenter, setTopicPresenter] = useState('');
  const [topicTagInput, setTopicTagInput] = useState('');
  const [topicTags, setTopicTags] = useState<string[]>([]);
  const [topicStatus, setTopicStatus] = useState<TopicStatus>('planned');
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);

  // Motion form state - initialized empty without custom text
  const [motionTitle, setMotionTitle] = useState('');
  const [motionDescription, setMotionDescription] = useState('');
  const [motionProposedBy, setMotionProposedBy] = useState(userName || '');
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [requiredMajority, setRequiredMajority] = useState<'simple' | 'two_thirds' | 'unanimous'>('simple');
  const [votingDuration, setVotingDuration] = useState<number>(60); // default 60s

  if (!isOpen) return null;

  const handleAddOrEditTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicTitle.trim()) return;

    if (editingTopicId) {
      onUpdateTopic(editingTopicId, {
        title: topicTitle.trim(),
        description: topicDescription.trim(),
        presenter: topicPresenter.trim() || userName,
        status: topicStatus,
        tags: topicTags,
      });
      setEditingTopicId(null);
    } else {
      onAddTopic({
        title: topicTitle.trim(),
        description: topicDescription.trim(),
        presenter: topicPresenter.trim() || userName,
        status: topicStatus,
        tags: topicTags,
      });
    }

    // Reset topic form
    setTopicTitle('');
    setTopicDescription('');
    setTopicPresenter('');
    setTopicTags([]);
    setTopicTagInput('');
    setTopicStatus('planned');
  };

  const handleStartEditTopic = (topic: Topic) => {
    setEditingTopicId(topic.id);
    setTopicTitle(topic.title);
    setTopicDescription(topic.description);
    setTopicPresenter(topic.presenter || '');
    setTopicTags(topic.tags || []);
    setTopicStatus(topic.status);
    setActiveTab('topics');
  };

  const handleAddTag = () => {
    const trimmed = topicTagInput.trim();
    if (trimmed && !topicTags.includes(trimmed)) {
      setTopicTags([...topicTags, trimmed]);
      setTopicTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTopicTags(topicTags.filter((t) => t !== tagToRemove));
  };

  const handleLaunchMotion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!motionTitle.trim()) return;

    onStartMotion({
      title: motionTitle.trim(),
      description: motionDescription.trim(),
      proposedBy: motionProposedBy.trim() || userName || 'Moderator',
      topicId: selectedTopicId || undefined,
      requiredMajority,
      durationSeconds: votingDuration > 0 ? votingDuration : undefined,
    });

    // Reset form
    setMotionTitle('');
    setMotionDescription('');
    setSelectedTopicId('');
    onClose(); // Close dialog so host immediately sees live voting stage
  };

  const handlePrepareMotionFromTopic = (topic: Topic) => {
    setSelectedTopicId(topic.id);
    setMotionTitle(`Approve & Adopt: ${topic.title}`);
    setMotionDescription(topic.description || '');
    setActiveTab('motion');
  };

  return (
    <div id="host-dialog-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div id="host-dialog-container" className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden my-6">
        {/* Dialog Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-blue-600 rounded-lg">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-tight text-white">Moderator Assembly Console</h2>
              <p className="text-xs text-slate-400">Put up topics, configure voting motions, and oversee session quorum</p>
            </div>
          </div>
          <button
            id="close-host-dialog-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 px-6 pt-2">
          <button
            id="host-tab-topics-btn"
            type="button"
            onClick={() => setActiveTab('topics')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
              activeTab === 'topics'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Topics & Agenda ({topics.length})</span>
          </button>

          <button
            id="host-tab-motion-btn"
            type="button"
            onClick={() => setActiveTab('motion')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
              activeTab === 'motion'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Vote className="w-4 h-4" />
            <span>Launch Ya/Na Vote</span>
            {activeMotion && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            )}
          </button>

          <button
            id="host-tab-session-btn"
            type="button"
            onClick={() => setActiveTab('session')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
              activeTab === 'session'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Session Control</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {/* TOPICS MANAGEMENT TAB */}
          {activeTab === 'topics' && (
            <div className="space-y-6">
              {/* Add / Edit Topic Form */}
              <form onSubmit={handleAddOrEditTopic} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                    <PlusCircle className="w-4 h-4 text-blue-600" />
                    <span>{editingTopicId ? 'Edit Topic' : 'Add New Topic'}</span>
                  </h3>
                  {editingTopicId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTopicId(null);
                        setTopicTitle('');
                        setTopicDescription('');
                        setTopicPresenter('');
                        setTopicTags([]);
                      }}
                      className="text-xs text-slate-500 hover:text-slate-800"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Topic Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="topic-title-input"
                      type="text"
                      value={topicTitle}
                      onChange={(e) => setTopicTitle(e.target.value)}
                      placeholder="Enter topic title"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Description / Overview
                    </label>
                    <textarea
                      id="topic-desc-input"
                      rows={2}
                      value={topicDescription}
                      onChange={(e) => setTopicDescription(e.target.value)}
                      placeholder="Enter topic details, context, or key discussion points"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Presenter / Lead
                      </label>
                      <input
                        id="topic-presenter-input"
                        type="text"
                        value={topicPresenter}
                        onChange={(e) => setTopicPresenter(e.target.value)}
                        placeholder="Name of lead speaker"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Agenda Status
                      </label>
                      <select
                        id="topic-status-select"
                        value={topicStatus}
                        onChange={(e) => setTopicStatus(e.target.value as TopicStatus)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="planned">Planned (Upcoming)</option>
                        <option value="in_progress">In Progress (Active Discussion)</option>
                        <option value="completed">Completed</option>
                        <option value="tabled">Tabled (Deferred)</option>
                      </select>
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tags / Category
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={topicTagInput}
                        onChange={(e) => setTopicTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTag();
                          }
                        }}
                        placeholder="Add tag (e.g. Budget, Policy, Operations)"
                        className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddTag}
                        className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-medium rounded-lg transition-colors"
                      >
                        Add Tag
                      </button>
                    </div>
                    {topicTags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {topicTags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 text-[11px] font-medium rounded-md"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(tag)}
                              className="hover:text-blue-950"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    id="save-topic-btn"
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>{editingTopicId ? 'Update Topic' : 'Add to Agenda'}</span>
                  </button>
                </div>
              </form>

              {/* Existing Topics List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Current Agenda Items ({topics.length})
                  </h4>
                </div>

                {topics.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 text-slate-500 text-xs">
                    No topics currently added. Use the form above to add your first meeting topic.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {topics.map((t, idx) => (
                      <div
                        key={t.id}
                        className="p-3.5 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs"
                      >
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-slate-400">#{idx + 1}</span>
                            <span className="font-semibold text-slate-900 text-sm truncate">{t.title}</span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                                t.status === 'in_progress'
                                  ? 'bg-blue-100 text-blue-800'
                                  : t.status === 'completed'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : t.status === 'tabled'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {t.status.replace('_', ' ')}
                            </span>
                          </div>

                          {t.description && (
                            <p className="text-xs text-slate-600 line-clamp-2">{t.description}</p>
                          )}

                          <div className="flex items-center gap-3 text-[11px] text-slate-500">
                            {t.presenter && (
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3 text-slate-400" />
                                <span>{t.presenter}</span>
                              </span>
                            )}
                            {t.tags && t.tags.length > 0 && (
                              <div className="flex items-center gap-1">
                                <Tag className="w-3 h-3 text-slate-400" />
                                <span>{t.tags.join(', ')}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Topic Action Buttons */}
                        <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                          <button
                            type="button"
                            onClick={() => handlePrepareMotionFromTopic(t)}
                            title="Call a Ya/Na vote on this topic"
                            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-200 flex items-center gap-1 transition-colors"
                          >
                            <Vote className="w-3.5 h-3.5" />
                            <span>Call Vote</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStartEditTopic(t)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit Topic"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteTopic(t.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Topic"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* LAUNCH MOTION / YA-NA VOTE TAB */}
          {activeTab === 'motion' && (
            <div className="space-y-6">
              {activeMotion ? (
                <div className="border border-amber-200 bg-amber-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></span>
                      <h3 className="font-semibold text-amber-900 text-sm">Active Motion in Progress</h3>
                    </div>
                    <button
                      id="close-active-motion-btn"
                      type="button"
                      onClick={() => onCloseMotion(activeMotion.id)}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
                    >
                      Conclude Vote Now
                    </button>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{activeMotion.title}</h4>
                    {activeMotion.description && (
                      <p className="text-xs text-slate-600 mt-0.5">{activeMotion.description}</p>
                    )}
                  </div>
                  <div className="text-xs text-amber-800 bg-white/70 p-2 rounded-lg border border-amber-200 flex items-center justify-between">
                    <span>Cast Votes: {activeMotion.tally.total}</span>
                    <span>Ya: {activeMotion.tally.ya} | Na: {activeMotion.tally.na} | Abstain: {activeMotion.tally.abstain}</span>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleLaunchMotion} className="space-y-4">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-semibold text-slate-900">Initiate Ya / Na Voting Ballot</h3>
                    <p className="text-xs text-slate-500">Put up a change, resolution, or proposal for all attendees to vote on in real-time.</p>
                  </div>

                  {topics.length > 0 && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Link to Agenda Topic (Optional)
                      </label>
                      <select
                        id="motion-topic-select"
                        value={selectedTopicId}
                        onChange={(e) => {
                          const topicId = e.target.value;
                          setSelectedTopicId(topicId);
                          const matched = topics.find((t) => t.id === topicId);
                          if (matched) {
                            setMotionTitle(`Approve: ${matched.title}`);
                            setMotionDescription(matched.description || '');
                          }
                        }}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">-- General Motion (No specific topic) --</option>
                        {topics.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Motion Title / Resolution Statement <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="motion-title-input"
                      type="text"
                      value={motionTitle}
                      onChange={(e) => setMotionTitle(e.target.value)}
                      placeholder="Enter the motion title or change proposal"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Motion Text & Details
                    </label>
                    <textarea
                      id="motion-desc-input"
                      rows={3}
                      value={motionDescription}
                      onChange={(e) => setMotionDescription(e.target.value)}
                      placeholder="Specify the exact wording of the resolution or change"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Required Majority Threshold
                      </label>
                      <select
                        id="motion-majority-select"
                        value={requiredMajority}
                        onChange={(e) => setRequiredMajority(e.target.value as any)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="simple">Simple Majority (&gt; 50% Ya)</option>
                        <option value="two_thirds">Two-Thirds Supermajority (≥ 66.7% Ya)</option>
                        <option value="unanimous">Unanimous Consent (100% Ya, 0 Na)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Voting Window Duration
                      </label>
                      <select
                        id="motion-duration-select"
                        value={votingDuration}
                        onChange={(e) => setVotingDuration(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value={30}>30 Seconds</option>
                        <option value={60}>60 Seconds (1 Minute)</option>
                        <option value={120}>2 Minutes</option>
                        <option value={300}>5 Minutes</option>
                        <option value={0}>Manual Close by Host</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Proposed By
                    </label>
                    <input
                      id="motion-proposer-input"
                      type="text"
                      value={motionProposedBy}
                      onChange={(e) => setMotionProposedBy(e.target.value)}
                      placeholder="Proposer name"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      id="start-motion-submit-btn"
                      type="submit"
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-2"
                    >
                      <Vote className="w-4 h-4" />
                      <span>Start Voting on Live Stage</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* SESSION CONTROL TAB */}
          {activeTab === 'session' && (
            <div className="space-y-6">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-900">Meeting Session State</h3>
                <p className="text-xs text-slate-500">Update the assembly status to signal attendees whether the floor is in open session, paused, or formally adjourned.</p>

                <div className="grid sm:grid-cols-3 gap-3 pt-2">
                  <button
                    id="status-scheduled-btn"
                    type="button"
                    onClick={() => onUpdateMeetingStatus('scheduled')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      meetingStatus === 'scheduled'
                        ? 'border-blue-600 bg-blue-50/70 ring-1 ring-blue-500'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <span className="block text-xs font-semibold text-slate-900">Scheduled / Pre-Meeting</span>
                    <span className="block text-[11px] text-slate-500 mt-1">Waiting for quorum before starting</span>
                  </button>

                  <button
                    id="status-in-session-btn"
                    type="button"
                    onClick={() => onUpdateMeetingStatus('in_session')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      meetingStatus === 'in_session'
                        ? 'border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-500'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <span className="block text-xs font-semibold text-slate-900">In Session (Active)</span>
                    <span className="block text-[11px] text-slate-500 mt-1">Official meeting floor is open</span>
                  </button>

                  <button
                    id="status-adjourned-btn"
                    type="button"
                    onClick={() => onUpdateMeetingStatus('adjourned')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      meetingStatus === 'adjourned'
                        ? 'border-slate-700 bg-slate-100 ring-1 ring-slate-600'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <span className="block text-xs font-semibold text-slate-900">Adjourned (Closed)</span>
                    <span className="block text-[11px] text-slate-500 mt-1">Conclude official deliberations</span>
                  </button>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4 space-y-2">
                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Parliamentary Guidelines</h4>
                <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                  <li>Motions require a second or direct moderator sponsorship before putting to a vote.</li>
                  <li>Attendees holding the floor may debate before the voting window opens.</li>
                  <li>Any attendee can submit a chat question or raise their hand to request speaking privileges.</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
