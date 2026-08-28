import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  HelpCircle, 
  CheckCircle2, 
  AlertCircle, 
  FileSpreadsheet, 
  Sliders, 
  Key, 
  ChevronRight, 
  Music, 
  DollarSign, 
  Loader2,
  Trash2,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { ParsedTrack, Folder, MediaFile, AppSettings, AssistantMessage } from '../types';
import { buildCatalogContext, askAssistant, CatalogContext } from '../services/aiAssistant';

interface AiAssistantModalProps {
  tracks: ParsedTrack[];
  folders: Folder[];
  files: MediaFile[];
  settings: AppSettings;
  onClose: () => void;
  onNavigateToView: (view: 'all' | 'tracks' | 'unverified' | 'folder') => void;
  onOpenExport: () => void;
  onOpenSettings: () => void;
}

const PRESET_PROMPTS = [
  '🔍 Audit my catalog for missing splits & ISRCs',
  '🏛️ Explain The MLC (mechanical) vs ASCAP (performance)',
  '📻 How do I claim sound recording royalties on SoundExchange?',
  '🔑 Where do I get free API keys for AI OCR & Spotify?',
  '📁 What is the best way to organize my quarterly statements?',
];

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  tracks,
  folders,
  files,
  settings,
  onClose,
  onNavigateToView,
  onOpenExport,
  onOpenSettings,
}) => {
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const catalogContext: CatalogContext = buildCatalogContext(
    tracks,
    folders,
    files,
    settings.defaultCurrency
  );

  // Initialize with personalized welcome message
  useEffect(() => {
    if (messages.length === 0) {
      let welcome = `👋 **Welcome! I'm your IndieBrotherhood Artist & Royalty Assistant.**\n\n`;
      welcome += `I've analyzed your current workspace: **${catalogContext.totalTracks} tracks**, **${catalogContext.unverifiedCount} needing review**, and **${catalogContext.currency === 'USD' ? '$' : catalogContext.currency} ${catalogContext.totalRevenue.toFixed(2)}** in gross earnings.\n\n`;
      welcome += `How can I help you optimize your royalty collections, audit split sheets, or configure integrations today?`;

      setMessages([
        {
          id: `msg-welcome`,
          role: 'assistant',
          text: welcome,
          timestamp: Date.now(),
          suggestedAction: catalogContext.unverifiedCount > 0 
            ? { type: 'view_unverified', label: `Review ${catalogContext.unverifiedCount} Unverified Tracks` } 
            : undefined,
        },
      ]);
    }
  }, [catalogContext.totalTracks, catalogContext.unverifiedCount]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputQuery).trim();
    if (!text || isLoading) return;

    const userMsg: AssistantMessage = {
      id: `msg-${Date.now()}-u`,
      role: 'user',
      text,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const response = await askAssistant(text, messages, catalogContext, settings);
      setMessages(prev => [...prev, response]);
    } catch (err) {
      console.error('Assistant error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionClick = (action: NonNullable<AssistantMessage['suggestedAction']>) => {
    if (action.type === 'view_unverified') {
      onNavigateToView('unverified');
      onClose();
    } else if (action.type === 'open_export') {
      onOpenExport();
      onClose();
    } else if (action.type === 'open_settings') {
      onOpenSettings();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end p-2 sm:p-4 bg-black/60 backdrop-blur-xs pointer-events-auto">
      <div 
        className={`bg-[#0b0f1a] border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${
          isExpanded 
            ? 'w-full max-w-4xl h-[92vh]' 
            : 'w-full sm:w-[480px] md:w-[520px] h-[85vh] max-h-[750px]'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-[#0f172a] shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                <span>IndieBrotherhood AI Assistant</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  {settings.geminiApiKey ? 'Gemini 2.5 Active' : 'Offline Advisor'}
                </span>
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">
                Catalog: {catalogContext.totalTracks} Tracks • {catalogContext.unverifiedCount} Unreviewed
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800"
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Catalog Metrics Bar */}
        <div className="px-5 py-2 bg-slate-900/90 border-b border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400 shrink-0">
          <div className="flex items-center space-x-3">
            <span className="flex items-center gap-1">
              <Music className="w-3 h-3 text-indigo-400" />
              <span>{catalogContext.totalTracks} Songs</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-emerald-400">
              <DollarSign className="w-3 h-3" />
              <span>{catalogContext.currency} {catalogContext.totalRevenue.toFixed(2)}</span>
            </span>
          </div>

          {catalogContext.unverifiedCount > 0 && (
            <button
              onClick={() => {
                onNavigateToView('unverified');
                onClose();
              }}
              className="text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold"
            >
              <AlertCircle className="w-3 h-3" />
              <span>{catalogContext.unverifiedCount} Review Needed</span>
            </button>
          )}
        </div>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 font-sans text-xs">
          {messages.map((msg) => {
            const isBot = msg.role === 'assistant';
            return (
              <div 
                key={msg.id} 
                className={`flex gap-2.5 ${isBot ? 'items-start' : 'items-end flex-row-reverse'}`}
              >
                <div 
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    isBot 
                      ? 'bg-indigo-600/20 border border-indigo-500/30 text-indigo-400' 
                      : 'bg-slate-800 border border-slate-700 text-slate-300'
                  }`}
                >
                  {isBot ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                </div>

                <div 
                  className={`max-w-[85%] rounded-xl p-3.5 space-y-2 leading-relaxed ${
                    isBot 
                      ? 'bg-slate-900 border border-slate-800 text-slate-200' 
                      : 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  }`}
                >
                  <div className="whitespace-pre-wrap font-sans text-xs leading-relaxed">
                    {msg.text}
                  </div>

                  {msg.suggestedAction && (
                    <div className="pt-2 border-t border-slate-800/80">
                      <button
                        onClick={() => handleActionClick(msg.suggestedAction!)}
                        className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold font-mono bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 rounded-lg transition-colors"
                      >
                        <span>{msg.suggestedAction.label}</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  <div className="text-[10px] text-slate-500 font-mono text-right">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center space-x-2 text-slate-400 font-mono text-xs">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                <span>Auditing catalog & generating advice...</span>
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 border-t border-slate-800/80 bg-[#0f172a]/60 overflow-x-auto flex gap-1.5 shrink-0 no-scrollbar">
          {PRESET_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-slate-900 hover:bg-indigo-600/20 text-slate-300 hover:text-indigo-300 border border-slate-800 hover:border-indigo-500/30 whitespace-nowrap transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-[#0f172a] border-t border-slate-800 shrink-0">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask about ASCAP, The MLC, ISRC lookups, splits, or your catalog..."
              className="flex-1 text-xs px-3.5 py-2.5 bg-[#0b0f1a] border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
            />
            <button
              type="submit"
              disabled={isLoading || !inputQuery.trim()}
              className="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl transition-all shadow-md shadow-indigo-600/20 shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
