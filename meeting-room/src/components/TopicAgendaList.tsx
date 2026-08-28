import React from 'react';
import {
  Layers,
  Vote,
  Clock,
  CheckCircle2,
  AlertCircle,
  User,
  Tag,
  Plus,
  ArrowRight,
  MoreVertical,
  Play,
} from 'lucide-react';
import type { Topic, UserRole, TopicStatus } from '../types';

interface TopicAgendaListProps {
  topics: Topic[];
  userRole: UserRole;
  onOpenHostDialog: () => void;
  onUpdateTopicStatus?: (topicId: string, status: TopicStatus) => void;
  onCallVoteOnTopic?: (topic: Topic) => void;
}

export function TopicAgendaList({
  topics,
  userRole,
  onOpenHostDialog,
  onUpdateTopicStatus,
  onCallVoteOnTopic,
}: TopicAgendaListProps) {
  const getStatusBadge = (status: TopicStatus) => {
    switch (status) {
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-800">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
            In Discussion
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Completed
          </span>
        );
      case 'tabled':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800">
            <Clock className="w-3 h-3 text-amber-600" />
            Tabled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
            Planned
          </span>
        );
    }
  };

  return (
    <div id="topic-agenda-container" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-purple-100 text-purple-700 rounded-lg">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Agenda & Topics</span>
              <span className="px-2 py-0.5 bg-slate-200 text-slate-700 text-[11px] font-semibold rounded-full">
                {topics.length}
              </span>
            </h3>
            <p className="text-[11px] text-slate-500">Order of business & discussion items</p>
          </div>
        </div>

        {userRole === 'host' && (
          <button
            id="add-topic-quick-btn"
            type="button"
            onClick={onOpenHostDialog}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Topic</span>
          </button>
        )}
      </div>

      {/* Topics List */}
      <div className="p-4 overflow-y-auto space-y-3 flex-1 max-h-[500px]">
        {topics.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 text-slate-500 text-xs space-y-2">
            <p className="font-medium text-slate-700">No agenda topics created yet.</p>
            {userRole === 'host' ? (
              <button
                type="button"
                onClick={onOpenHostDialog}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline"
              >
                Open Host Console to add topics
              </button>
            ) : (
              <p className="text-[11px] text-slate-400">The meeting host has not published agenda topics.</p>
            )}
          </div>
        ) : (
          topics.map((topic, index) => (
            <div
              key={topic.id}
              className="p-3.5 bg-slate-50/60 border border-slate-200/80 rounded-xl hover:border-slate-300 transition-all space-y-2.5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-400">#{index + 1}</span>
                    <h4 className="text-xs font-bold text-slate-900">{topic.title}</h4>
                    {getStatusBadge(topic.status)}
                  </div>
                  {topic.description && (
                    <p className="text-xs text-slate-600 leading-relaxed">{topic.description}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 text-[11px] text-slate-500 flex-wrap">
                <div className="flex items-center gap-3">
                  {topic.presenter && (
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      <span>{topic.presenter}</span>
                    </span>
                  )}
                  {topic.tags && topic.tags.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Tag className="w-3 h-3 text-slate-400" />
                      <span>{topic.tags.join(', ')}</span>
                    </div>
                  )}
                </div>

                {userRole === 'host' && (
                  <div className="flex items-center gap-2">
                    {topic.status !== 'in_progress' && onUpdateTopicStatus && (
                      <button
                        type="button"
                        onClick={() => onUpdateTopicStatus(topic.id, 'in_progress')}
                        className="text-[10px] font-semibold text-blue-600 hover:text-blue-800"
                      >
                        Set Active
                      </button>
                    )}
                    {topic.status !== 'completed' && onUpdateTopicStatus && (
                      <button
                        type="button"
                        onClick={() => onUpdateTopicStatus(topic.id, 'completed')}
                        className="text-[10px] font-semibold text-emerald-600 hover:text-emerald-800"
                      >
                        Mark Done
                      </button>
                    )}
                    {onCallVoteOnTopic && (
                      <button
                        type="button"
                        onClick={() => onCallVoteOnTopic(topic)}
                        className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-md border border-emerald-200 transition-colors flex items-center gap-1"
                      >
                        <Vote className="w-3 h-3" />
                        <span>Vote</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
