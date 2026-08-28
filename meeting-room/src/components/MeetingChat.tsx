import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  HelpCircle,
  Sparkles,
  Smile,
  ThumbsUp,
  Hand,
  Lightbulb,
  Target,
  User,
} from 'lucide-react';
import type { ChatMessage, ReactionEvent, UserRole } from '../types';

interface MeetingChatProps {
  messages: ChatMessage[];
  currentUserId: string;
  onSendMessage: (text: string, isQuestion?: boolean) => void;
  onSendReaction: (emoji: string) => void;
  floatingReactions: ReactionEvent[];
}

const REACTION_EMOJIS = ['👍', '👏', '✋', '💡', '🎯', '❤️'];

export function MeetingChat({
  messages,
  currentUserId,
  onSendMessage,
  onSendReaction,
  floatingReactions,
}: MeetingChatProps) {
  const [inputText, setInputText] = useState('');
  const [isQuestion, setIsQuestion] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim(), isQuestion);
    setInputText('');
    setIsQuestion(false);
  };

  return (
    <div id="meeting-chat-container" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full relative">
      {/* Floating live reactions display */}
      <div className="absolute bottom-20 right-4 pointer-events-none z-30 flex flex-col items-end gap-2">
        {floatingReactions.map((rx) => (
          <div
            key={rx.id}
            className="animate-bounce bg-white/90 shadow-lg border border-slate-200 rounded-full px-3 py-1 text-sm flex items-center gap-1.5 backdrop-blur-xs"
          >
            <span className="text-lg">{rx.emoji}</span>
            <span className="text-[10px] font-bold text-slate-700">{rx.senderName}</span>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Meeting Chat & Q&A</h3>
            <p className="text-[11px] text-slate-500">Live questions, feedback & reactions</p>
          </div>
        </div>

        {/* Quick Reaction Bar */}
        <div className="flex items-center gap-1">
          {REACTION_EMOJIS.slice(0, 4).map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => onSendReaction(emoji)}
              className="p-1 hover:bg-slate-200/70 rounded text-base transition-transform active:scale-125"
              title={`React with ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Message Stream */}
      <div className="p-4 overflow-y-auto space-y-3 flex-1 max-h-[400px]">
        {messages.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            <MessageSquare className="w-6 h-6 mx-auto mb-2 opacity-40" />
            <p>No messages yet. Send a note or question to the room.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isSelf = msg.senderId === currentUserId;
            return (
              <div
                key={msg.id}
                className={`space-y-1 ${isSelf ? 'ml-auto max-w-[85%]' : 'mr-auto max-w-[85%]'}`}
              >
                <div className={`flex items-center gap-1.5 text-[10px] ${isSelf ? 'justify-end' : ''}`}>
                  <span className="font-bold text-slate-700">{msg.senderName}</span>
                  {msg.senderRole === 'host' && (
                    <span className="px-1 py-0.2 bg-amber-100 text-amber-800 rounded font-semibold text-[9px]">
                      HOST
                    </span>
                  )}
                  {msg.isQuestion && (
                    <span className="px-1.5 py-0.2 bg-purple-100 text-purple-800 rounded font-bold text-[9px] flex items-center gap-0.5">
                      <HelpCircle className="w-2.5 h-2.5" /> QUESTION
                    </span>
                  )}
                  <span className="text-slate-400 text-[9px]">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div
                  className={`p-2.5 rounded-xl text-xs leading-relaxed ${
                    msg.isQuestion
                      ? 'bg-purple-50 text-purple-950 border border-purple-200 font-medium'
                      : isSelf
                      ? 'bg-blue-600 text-white rounded-br-xs'
                      : 'bg-slate-100 text-slate-800 rounded-bl-xs'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-slate-100 bg-slate-50 space-y-2">
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <label className="flex items-center gap-1.5 cursor-pointer hover:text-slate-700">
            <input
              type="checkbox"
              checked={isQuestion}
              onChange={(e) => setIsQuestion(e.target.checked)}
              className="rounded text-purple-600 focus:ring-purple-500"
            />
            <span className={isQuestion ? 'font-bold text-purple-700' : ''}>Flag as Question for Speaker</span>
          </label>
        </div>

        <div className="flex gap-2">
          <input
            id="chat-message-input"
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message or question..."
            className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            id="send-chat-btn"
            type="submit"
            disabled={!inputText.trim()}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
}
