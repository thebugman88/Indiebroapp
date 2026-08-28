import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Send,
  Globe,
  Bot,
  User,
  Trash2,
  Copy,
  Check,
  Zap,
  HelpCircle,
  TrendingUp,
  FileSpreadsheet,
  Calendar,
  ExternalLink,
} from "lucide-react";
import Markdown from "react-markdown";
import {
  ArtistProfile,
  ChatMessage,
  SettingsState,
  SongMetadata,
  ScheduledEvent,
} from "../types";
import { playNotificationChime } from "../lib/notificationEngine";

interface AssistantChatProps {
  messages: ChatMessage[];
  profile: ArtistProfile;
  songs: SongMetadata[];
  settings: SettingsState;
  onSendMessage: (msg: ChatMessage) => void;
  onClearHistory: () => void;
  onAddSongFromAssistant?: (song: SongMetadata) => void;
  onAddEventFromAssistant?: (evt: ScheduledEvent) => void;
  initialPrompt?: string;
  onClearInitialPrompt?: () => void;
}

export const AssistantChat: React.FC<AssistantChatProps> = ({
  messages,
  profile,
  songs,
  settings,
  onSendMessage,
  onClearHistory,
  onAddSongFromAssistant,
  onAddEventFromAssistant,
  initialPrompt,
  onClearInitialPrompt,
}) => {
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [useSearch, setUseSearch] = useState<boolean>(settings.enableWebSearch);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Handle incoming initial prompt from other views (e.g. OCR inspection or song card)
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      setInputText(initialPrompt);
      onClearInitialPrompt?.();
      inputRef.current?.focus();
    }
  }, [initialPrompt]);

  const QUICK_PROMPTS = [
    {
      title: "Spotify Editorial Pitch",
      prompt: "Draft a high-impact 500-character Spotify for Artists editorial pitch for my upcoming single. Include genre tags, mood, instruments, and the key marketing narrative.",
    },
    {
      title: "Audit Split Percentages",
      prompt: "Audit my current song catalog splits to verify they conform to ASCAP and The MLC registration requirements without any uncollected shares.",
    },
    {
      title: "Search Music Blogs & Playlists",
      prompt: "Search the web for active indie music blogs, hypemachine curators, and independent Spotify playlist submitters currently accepting submissions for my genre.",
    },
    {
      title: "Sync Licensing Pitch Email",
      prompt: "Write a professional cold pitch email to music supervisors for TV/film sync placement, highlighting clean stems and 100% one-stop master/publishing ownership.",
    },
  ];

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_user`,
      role: "user",
      content: text.trim(),
      timestamp: new Date().toISOString(),
    };

    onSendMessage(userMessage);
    setInputText("");
    setIsLoading(true);

    try {
      // Prepare conversation history for backend
      const formattedHistory = messages.map((m) => ({
        role: (m.role || m.sender) === "assistant" ? "model" : "user",
        parts: [{ text: m.content || m.text || "" }],
      }));

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text.trim(),
          history: formattedHistory,
          artistProfile: profile,
          songCatalog: songs,
          enableSearch: useSearch,
          customApiKey: settings.customApiKey,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const data = await res.json();

      const assistantMessage: ChatMessage = {
        id: `msg_${Date.now()}_assistant`,
        role: "assistant",
        content: data.reply || "I encountered an issue generating a response. Please try again.",
        timestamp: new Date().toISOString(),
        groundingMetadata: data.groundingMetadata,
      };

      onSendMessage(assistantMessage);

      if (settings.enableSoundAlerts) {
        playNotificationChime();
      }
    } catch (err: any) {
      console.error("AI Chat error:", err);
      const errorMessage: ChatMessage = {
        id: `msg_${Date.now()}_err`,
        role: "assistant",
        content: `**Error connecting to Gemini Career Assistant:** ${err.message || "Unknown error"}.\n\nPlease check your network connection or provide a custom Gemini API key in Settings.`,
        timestamp: new Date().toISOString(),
      };
      onSendMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div id="assistant-chat-view" className="flex flex-col h-[calc(100vh-210px)] min-h-[580px] bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm animate-fadeIn">
      {/* Top Chat Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              Gemini Music Career Assistant & Legal Advisor
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-normal border border-emerald-500/30">
                Live & Grounded
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Personalized for <strong className="text-slate-200">{profile.artistName || "Independent Artist"}</strong> ({profile.genre || "Indie"} • {profile.pro || "ASCAP"})
            </p>
          </div>
        </div>

        {/* Right Header Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setUseSearch(!useSearch)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 border ${
              useSearch
                ? "bg-indigo-600/20 text-indigo-300 border-indigo-500/40"
                : "bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200"
            }`}
            title="Toggle Google Search Grounding for live web info"
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Web Search</span>
            <span className="text-[10px] font-mono">{useSearch ? "ON" : "OFF"}</span>
          </button>

          {messages.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Clear chat history?")) {
                  onClearHistory();
                }
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
              title="Clear conversation"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 max-w-xl mx-auto">
            <div className="p-4 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Bot className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-200">
                Welcome to your Indie Artist Career Strategist
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                I have full contextual awareness of your <strong>{songs.length} catalog tracks</strong>, PRO affiliation ({profile.pro}), and IPI identifiers. Ask me about copyright filings, Spotify pitches, marketing rollouts, or uncollected mechanical royalties.
              </p>
            </div>

            {/* Quick Action Prompt Chips */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full pt-2">
              {QUICK_PROMPTS.map((qp, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(qp.prompt)}
                  className="p-3 text-left bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-indigo-500/50 rounded-xl transition-all group"
                >
                  <p className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300 flex items-center justify-between">
                    <span>{qp.title}</span>
                    <Zap className="w-3 h-3 text-amber-400 opacity-70 group-hover:opacity-100" />
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-tight">
                    {qp.prompt}
                  </p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isAssistant = (msg.role || msg.sender) === "assistant";
            const textContent = msg.content || msg.text || "";

            return (
              <div
                key={msg.id}
                className={`flex gap-3 text-xs ${
                  isAssistant ? "items-start" : "items-start justify-end"
                }`}
              >
                {/* Assistant Avatar */}
                {isAssistant && (
                  <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  className={`max-w-[85%] rounded-2xl p-4 space-y-2 relative group shadow-sm ${
                    isAssistant
                      ? "bg-slate-950 border border-slate-800 text-slate-200"
                      : "bg-indigo-600 text-white rounded-br-sm"
                  }`}
                >
                  {/* Content with Markdown */}
                  <div className={`prose prose-invert prose-xs max-w-none leading-relaxed ${isAssistant ? "text-slate-200" : "text-white"}`}>
                    <Markdown>{textContent}</Markdown>
                  </div>

                  {/* Web search citations if present */}
                  {msg.groundingMetadata?.groundingChunks && msg.groundingMetadata.groundingChunks.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
                      <span className="font-semibold text-indigo-300 flex items-center gap-1">
                        <Globe className="w-3 h-3" /> Grounded Web Sources:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.groundingMetadata.groundingChunks.map((chunk: any, cIdx: number) => {
                          if (!chunk.web?.uri) return null;
                          return (
                            <a
                              key={cIdx}
                              href={chunk.web.uri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-[10px] truncate max-w-[200px]"
                            >
                              <ExternalLink className="w-2.5 h-2.5" />
                              <span>{chunk.web.title || new URL(chunk.web.uri).hostname}</span>
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Timestamp and Copy button */}
                  <div className="flex items-center justify-between text-[10px] opacity-70 pt-1">
                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    {isAssistant && (
                      <button
                        onClick={() => handleCopy(msg.id, textContent)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-slate-200 ml-2"
                        title="Copy message"
                      >
                        {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    )}
                  </div>
                </div>

                {/* User Avatar */}
                {!isAssistant && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex gap-3 text-xs items-start animate-fadeIn">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Sparkles className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-slate-300 space-y-1.5">
              <p className="font-semibold text-indigo-300 flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                Analyzing music career strategy...
              </p>
              <p className="text-[11px] text-slate-500">Cross-referencing catalog metadata, DSP pitching guidelines, and legal requirements.</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form Bar */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/80">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-end gap-2"
        >
          <textarea
            ref={inputRef}
            rows={2}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask anything about music law, marketing, splits, Spotify pitches, or festival submissions..."
            className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="p-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl transition-all shadow-md shadow-indigo-600/20 cursor-pointer shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
