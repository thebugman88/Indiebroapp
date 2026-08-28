import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Vote,
  Layers,
  Users,
  MessageSquare,
  Sparkles,
  Share2,
  FileText,
  HelpCircle,
  Shield,
  Clock,
  Crown,
  Hand,
  CheckCircle2,
  Wifi,
  WifiOff,
  User,
  Plus,
} from 'lucide-react';
import type {
  MeetingRoomState,
  Attendee,
  Topic,
  Motion,
  VoteChoice,
  UserRole,
  WSClientMessage,
  WSServerMessage,
  ReactionEvent,
  TopicStatus,
} from './types';
import { loadUserPrefs, saveUserPrefs, getRandomColor } from './lib/storage';
import { Navbar } from './components/Navbar';
import { VotingArea } from './components/VotingArea';
import { TopicAgendaList } from './components/TopicAgendaList';
import { AttendeeList } from './components/AttendeeList';
import { MeetingChat } from './components/MeetingChat';
import { HostDialog } from './components/HostDialog';
import { MeetingMinutesModal } from './components/MeetingMinutesModal';
import { HelpModal, TermsModal, PrivacyModal } from './components/LegalModals';
import { Footer } from './components/Footer';

export default function App() {
  const prefs = loadUserPrefs();

  // URL room param override
  const urlParams = new URLSearchParams(window.location.search);
  const initialRoomId = urlParams.get('room') || prefs.roomId || 'general';

  const [roomId, setRoomId] = useState<string>(initialRoomId);
  const [userName, setUserName] = useState<string>(prefs.name);
  const [userRole, setUserRole] = useState<UserRole>(prefs.role);
  const [userColor, setUserColor] = useState<string>(prefs.color || getRandomColor());
  const [userId, setUserId] = useState<string>(() => `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`);

  const [connected, setConnected] = useState(false);
  const [roomState, setRoomState] = useState<MeetingRoomState>({
    roomId: initialRoomId,
    roomTitle: 'Assembly Meeting Room',
    meetingStatus: 'in_session',
    startedAt: Date.now(),
    moderatorId: '',
    topics: [],
    activeMotion: null,
    motionHistory: [],
    attendees: {},
    chatMessages: [],
    lastUpdated: Date.now(),
  });

  const [floatingReactions, setFloatingReactions] = useState<ReactionEvent[]>([]);

  // Dialog & Modal controls
  const [isHostDialogOpen, setIsHostDialogOpen] = useState(false);
  const [isMinutesModalOpen, setIsMinutesModalOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

  // Tab switcher for mobile
  const [mobileTab, setMobileTab] = useState<'voting' | 'agenda' | 'attendees' | 'chat'>('voting');

  const wsRef = useRef<WebSocket | null>(null);
  const pingIntervalRef = useRef<any>(null);

  // Send message over WebSocket
  const sendWS = useCallback((msg: WSClientMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  // Connect to WebSocket Server
  const connectWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      // Join Room
      const joinMsg: WSClientMessage = {
        type: 'JOIN_ROOM',
        roomId,
        attendee: {
          id: userId,
          name: userName.trim() || 'Attendee',
          role: userRole,
          status: 'active',
          hasHandRaised: false,
          avatarColor: userColor,
        },
      };
      ws.send(JSON.stringify(joinMsg));

      // Start keepalive ping
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'PING' }));
        }
      }, 25000);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as WSServerMessage;
        switch (msg.type) {
          case 'INIT_STATE':
          case 'STATE_UPDATE':
            setRoomState(msg.state);
            if (msg.type === 'INIT_STATE' && msg.yourId) {
              setUserId(msg.yourId);
            }
            break;

          case 'ATTENDEE_JOINED':
          case 'ATTENDEE_UPDATED':
            setRoomState((prev) => ({
              ...prev,
              attendees: {
                ...prev.attendees,
                [msg.attendee.id]: msg.attendee,
              },
            }));
            break;

          case 'ATTENDEE_LEFT':
            setRoomState((prev) => {
              const updated = { ...prev.attendees };
              delete updated[msg.attendeeId];
              return { ...prev, attendees: updated };
            });
            break;

          case 'TOPIC_ADDED':
            setRoomState((prev) => ({
              ...prev,
              topics: [...prev.topics, msg.topic],
            }));
            break;

          case 'TOPIC_UPDATED':
            setRoomState((prev) => ({
              ...prev,
              topics: prev.topics.map((t) => (t.id === msg.topic.id ? msg.topic : t)),
            }));
            break;

          case 'TOPIC_DELETED':
            setRoomState((prev) => ({
              ...prev,
              topics: prev.topics.filter((t) => t.id !== msg.topicId),
            }));
            break;

          case 'MOTION_STARTED':
            setRoomState((prev) => ({
              ...prev,
              activeMotion: msg.motion,
            }));
            break;

          case 'VOTE_RECORDED':
            setRoomState((prev) => {
              if (!prev.activeMotion || prev.activeMotion.id !== msg.motionId) return prev;
              return {
                ...prev,
                activeMotion: {
                  ...prev.activeMotion,
                  tally: msg.tally,
                },
              };
            });
            break;

          case 'MOTION_CLOSED':
            setRoomState((prev) => ({
              ...prev,
              activeMotion: null,
              motionHistory: [msg.motion, ...prev.motionHistory],
            }));
            break;

          case 'CHAT_MESSAGE':
            setRoomState((prev) => ({
              ...prev,
              chatMessages: [...prev.chatMessages, msg.message],
            }));
            break;

          case 'REACTION':
            setFloatingReactions((prev) => [...prev, msg.reaction]);
            setTimeout(() => {
              setFloatingReactions((current) => current.filter((r) => r.id !== msg.reaction.id));
            }, 3000);
            break;
        }
      } catch (err) {
        console.error('Error handling WebSocket message:', err);
      }
    };

    ws.onclose = () => {
      setConnected(false);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      // Auto reconnect after 3 seconds
      setTimeout(() => {
        if (wsRef.current === ws) {
          connectWebSocket();
        }
      }, 3000);
    };

    ws.onerror = (err) => {
      console.warn('WebSocket connection warning:', err);
    };
  }, [roomId, userId, userName, userRole, userColor]);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [connectWebSocket]);

  // Handlers for User Actions
  const handleUpdateUserName = (newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setUserName(trimmed);
    saveUserPrefs({ name: trimmed });
    const currentAttendee = roomState.attendees[userId];
    if (currentAttendee) {
      sendWS({
        type: 'JOIN_ROOM',
        roomId,
        attendee: {
          ...currentAttendee,
          name: trimmed,
        },
      });
    }
  };

  const handleUpdateRole = (newRole: UserRole) => {
    setUserRole(newRole);
    saveUserPrefs({ role: newRole });
    sendWS({ type: 'UPDATE_ROLE', role: newRole });
  };

  const handleToggleHandRaise = () => {
    const currentAtt = roomState.attendees[userId];
    const isRaised = !currentAtt?.hasHandRaised;
    sendWS({ type: 'TOGGLE_HAND_RAISE', raised: isRaised });
  };

  const handleCastVote = (choice: VoteChoice) => {
    if (!roomState.activeMotion) return;
    sendWS({
      type: 'CAST_VOTE',
      motionId: roomState.activeMotion.id,
      choice,
    });
  };

  const handleStartMotion = (motion: {
    title: string;
    description: string;
    proposedBy: string;
    topicId?: string;
    requiredMajority: 'simple' | 'two_thirds' | 'unanimous';
    durationSeconds?: number;
  }) => {
    sendWS({
      type: 'START_MOTION',
      motion,
    });
  };

  const handleCloseMotion = (motionId: string) => {
    sendWS({
      type: 'CLOSE_MOTION',
      motionId,
    });
  };

  const handleAddTopic = (topic: {
    title: string;
    description: string;
    presenter: string;
    status: TopicStatus;
    tags: string[];
  }) => {
    sendWS({
      type: 'ADD_TOPIC',
      topic,
    });
  };

  const handleUpdateTopic = (topicId: string, updates: Partial<Topic>) => {
    sendWS({
      type: 'UPDATE_TOPIC',
      topicId,
      updates,
    });
  };

  const handleDeleteTopic = (topicId: string) => {
    sendWS({
      type: 'DELETE_TOPIC',
      topicId,
    });
  };

  const handleUpdateMeetingStatus = (status: 'scheduled' | 'in_session' | 'adjourned') => {
    sendWS({
      type: 'UPDATE_MEETING_STATUS',
      status,
    });
  };

  const handleSendMessage = (text: string, isQuestion?: boolean) => {
    sendWS({
      type: 'SEND_CHAT',
      text,
      isQuestion,
    });
  };

  const handleSendReaction = (emoji: string) => {
    sendWS({
      type: 'SEND_REACTION',
      emoji,
    });
  };

  const handleChangeRoom = (newRoomId: string) => {
    const clean = newRoomId.trim().toLowerCase();
    if (clean && clean !== roomId) {
      setRoomId(clean);
      saveUserPrefs({ roomId: clean });
      const newUrl = `${window.location.pathname}?room=${clean}`;
      window.history.pushState({ path: newUrl }, '', newUrl);
    }
  };

  const currentAttendee = roomState.attendees[userId];
  const myVote = currentAttendee?.currentVote || roomState.activeMotion?.votes[userId]?.choice;
  const currentTopic = roomState.topics.find((t) => t.status === 'in_progress') || roomState.topics[0];
  const attendeeList: Attendee[] = Object.values(roomState.attendees);

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        roomId={roomId}
        roomTitle={roomState.roomTitle}
        userRole={userRole}
        userName={userName}
        attendeeCount={attendeeList.length}
        meetingStatus={roomState.meetingStatus}
        connected={connected}
        onOpenHostDialog={() => setIsHostDialogOpen(true)}
        onOpenMinutesModal={() => setIsMinutesModalOpen(true)}
        onChangeRoom={handleChangeRoom}
        onUpdateRole={handleUpdateRole}
      />

      {/* Main Assembly Arena */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* User Identity / Quick Setup Banner (if name is default/empty) */}
        {!userName && (
          <div className="bg-blue-600 text-white rounded-2xl p-4 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold">Welcome to Assembly Meeting Room #{roomId}</h3>
                <p className="text-xs text-blue-100">Set your participant name so the host and attendees can recognize your votes.</p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Enter your name"
                className="px-3 py-1.5 bg-white text-slate-800 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-300 w-full sm:w-48"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleUpdateUserName((e.target as HTMLInputElement).value);
                  }
                }}
                onBlur={(e) => {
                  if (e.target.value.trim()) {
                    handleUpdateUserName(e.target.value);
                  }
                }}
              />
            </div>
          </div>
        )}

        {/* Mobile Navigation Tabs */}
        <div className="lg:hidden flex border-b border-slate-200 bg-white rounded-xl shadow-xs p-1">
          <button
            type="button"
            onClick={() => setMobileTab('voting')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              mobileTab === 'voting' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Vote className="w-3.5 h-3.5" />
            <span>Voting</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('agenda')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              mobileTab === 'agenda' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Agenda</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('attendees')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              mobileTab === 'attendees' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Attendees ({attendeeList.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('chat')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              mobileTab === 'chat' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat</span>
          </button>
        </div>

        {/* Desktop Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left / Center Column (7 Cols on desktop): Voting Stage + Topics Agenda */}
          <div
            className={`lg:col-span-7 space-y-6 ${
              mobileTab === 'voting' || mobileTab === 'agenda' ? 'block' : 'hidden lg:block'
            }`}
          >
            {(mobileTab === 'voting' || typeof window !== 'undefined') && (
              <div className={mobileTab === 'agenda' ? 'hidden lg:block' : 'block'}>
                <VotingArea
                  activeMotion={roomState.activeMotion}
                  recentMotions={roomState.motionHistory}
                  currentTopic={currentTopic}
                  myVote={myVote}
                  userRole={userRole}
                  attendeeCount={attendeeList.length}
                  onCastVote={handleCastVote}
                  onCloseMotion={handleCloseMotion}
                  onOpenHostDialog={() => setIsHostDialogOpen(true)}
                />
              </div>
            )}

            {(mobileTab === 'agenda' || typeof window !== 'undefined') && (
              <div className={mobileTab === 'voting' ? 'hidden lg:block' : 'block'}>
                <TopicAgendaList
                  topics={roomState.topics}
                  userRole={userRole}
                  onOpenHostDialog={() => setIsHostDialogOpen(true)}
                  onUpdateTopicStatus={(topicId, status) => handleUpdateTopic(topicId, { status })}
                  onCallVoteOnTopic={(topic) => {
                    handleStartMotion({
                      title: `Approve: ${topic.title}`,
                      description: topic.description,
                      proposedBy: userName || 'Moderator',
                      topicId: topic.id,
                      requiredMajority: 'simple',
                    });
                  }}
                />
              </div>
            )}
          </div>

          {/* Right Column (5 Cols on desktop): Attendee Attendance Area + Public Chat & Q&A */}
          <div
            className={`lg:col-span-5 space-y-6 ${
              mobileTab === 'attendees' || mobileTab === 'chat' ? 'block' : 'hidden lg:block'
            }`}
          >
            {/* Area for all users as many as want to attend (voting / attendee status) */}
            <div className={mobileTab === 'chat' ? 'hidden lg:block' : 'block'}>
              <AttendeeList
                attendees={attendeeList}
                currentUserId={userId}
                userRole={userRole}
                isVoteActive={!!roomState.activeMotion}
                hasHandRaised={!!currentAttendee?.hasHandRaised}
                onToggleHandRaise={handleToggleHandRaise}
                onUpdateRole={handleUpdateRole}
              />
            </div>

            {/* Chat & Live Reactions */}
            <div className={mobileTab === 'attendees' ? 'hidden lg:block' : 'block'}>
              <MeetingChat
                messages={roomState.chatMessages}
                currentUserId={userId}
                onSendMessage={handleSendMessage}
                onSendReaction={handleSendReaction}
                floatingReactions={floatingReactions}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Host / Moderator Dialog */}
      <HostDialog
        isOpen={isHostDialogOpen}
        onClose={() => setIsHostDialogOpen(false)}
        topics={roomState.topics}
        activeMotion={roomState.activeMotion}
        onAddTopic={handleAddTopic}
        onUpdateTopic={handleUpdateTopic}
        onDeleteTopic={handleDeleteTopic}
        onStartMotion={handleStartMotion}
        onCloseMotion={handleCloseMotion}
        onUpdateMeetingStatus={handleUpdateMeetingStatus}
        meetingStatus={roomState.meetingStatus}
        userName={userName}
      />

      {/* Meeting Minutes Export Modal */}
      <MeetingMinutesModal
        isOpen={isMinutesModalOpen}
        onClose={() => setIsMinutesModalOpen(false)}
        roomState={roomState}
      />

      {/* Help, Terms & Privacy Modals */}
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      <TermsModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
      <PrivacyModal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />

      {/* Footer with 2026 indiebrotherhood, status, help, terms, privacy, and pro icons */}
      <Footer
        connected={connected}
        attendeeCount={attendeeList.length}
        onOpenHelp={() => setIsHelpOpen(true)}
        onOpenTerms={() => setIsTermsOpen(true)}
        onOpenPrivacy={() => setIsPrivacyOpen(true)}
      />
    </div>
  );
}
