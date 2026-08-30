import { addNotification } from '../../src/services/notificationService';
import { getCurrentAuthUser } from '../../src/services/authService';
import React, { useState, useEffect } from 'react';
import { UserProfile, RoomId, SubRoomTier, GenreType, ChatMessage, BattleState } from './types';
import { wsService } from './services/websocket';
import { Header } from './components/Header';
import { RapBattleLobby } from './components/RapBattle/RapBattleLobby';
import { CollaborationRoom } from './components/Collaboration/CollaborationRoom';
import { LoungeRoom } from './components/Lounge/LoungeRoom';
import { MarketingRoom } from './components/Marketing/MarketingRoom';
import { ShowcaseRoom } from './components/Showcase/ShowcaseRoom';
import { NicknameModal } from './components/NicknameModal';
import { HelpModal } from './components/HelpModal';
import { TermsModal } from './components/TermsModal';
import { Footer } from './components/Footer';

export default function App() {
  const readUser = (): UserProfile | null => {
    const u=getCurrentAuthUser(); return u.id==='guest'?null:{id:u.id,nickname:u.displayName,role:u.isAdmin?'Master Admin':'Artist',avatarUrl:u.avatarUrl};
  };
  const [currentUser,setCurrentUser]=useState<UserProfile|null>(readUser);
  const [connectionError,setConnectionError]=useState('');
  useEffect(()=>{const refresh=()=>{wsService.disconnect();setCurrentUser(readUser());};window.addEventListener('ib_auth_changed',refresh);return()=>window.removeEventListener('ib_auth_changed',refresh);},[]);

  const [activeRoom, setActiveRoom] = useState<RoomId>('rap-battle');
  const [currentGenre, setCurrentGenre] = useState<GenreType>('Hip-Hop');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sharedPad, setSharedPad] = useState<string>('');
  const [activeBattles, setActiveBattles] = useState<BattleState[]>([]);
  const [roomUsers, setRoomUsers] = useState<UserProfile[]>([]);
  const [onlineCount, setOnlineCount] = useState<number>(0);

  // Modals state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);

  // Initialize WebSocket
  useEffect(() => {
    wsService.connect(currentUser);

    const unsubscribe = wsService.subscribe((data) => {
      switch (data.type) {
        case 'ADMIN_BROADCAST':addNotification({category:'broadcast',type:'admin',priority:'high',title:data.title,message:data.message,sender:data.senderName});break;
        case 'ERROR': setConnectionError(data.message); break;
        case 'ROOM_JOINED': {
          setConnectionError('');
          setMessages(data.history || []);
          setSharedPad(data.sharedPad || '');
          setRoomUsers(data.roomUsers || []);
          if (data.activeBattles) {
            setActiveBattles(data.activeBattles);
          }
          break;
        }

        case 'NEW_CHAT_MESSAGE': {
          setMessages((prev) => [...prev, data.message]);
          break;
        }

        case 'SHARED_PAD_UPDATED': {
          setSharedPad(data.content);
          break;
        }

        case 'USER_JOINED_ROOM':
        case 'USER_LEFT_ROOM': {
          setRoomUsers(data.roomUsers || []);
          break;
        }

        case 'BATTLE_MATCHED':
        case 'BATTLE_UPDATED': {
          setActiveBattles((prev) => {
            const idx = prev.findIndex((b) => b.id === data.battle.id);
            if (idx !== -1) {
              const updated = [...prev];
              updated[idx] = data.battle;
              return updated;
            }
            return [...prev, data.battle];
          });
          break;
        }

        case 'ONLINE_COUNT_UPDATE': {
          setOnlineCount(data.count);
          break;
        }

        default:
          break;
      }
    });

    // Join default room
    const targetRoomId = activeRoom === 'collaboration' ? `collaboration-${currentGenre}` : activeRoom === 'rap-battle' ? 'rap-battle-lobby' : activeRoom;
    wsService.joinRoom(targetRoomId, currentUser);

    return () => {
      unsubscribe(); wsService.disconnect();
    };
  }, [currentUser?.id]);

  // Handle Room Switching
  const handleSelectRoom = (roomId: RoomId) => {
    setActiveRoom(roomId);
    const targetRoomId = roomId === 'collaboration' ? `collaboration-${currentGenre}` : roomId === 'rap-battle' ? 'rap-battle-lobby' : roomId;
    wsService.joinRoom(targetRoomId, currentUser);
  };

  const handleSelectGenreRoom = (genre: GenreType) => {
    setCurrentGenre(genre);
    wsService.joinRoom(`collaboration-${genre}`, currentUser);
  };

  const handleSaveProfile = (_profile: UserProfile) => {
    setConnectionError('Sign in and update your profile in the suite account settings.');
  };

  const handleSendMessage = (roomId: string, message: Partial<ChatMessage>) => {
    if (!currentUser) {
      setIsProfileModalOpen(true);
      return;
    }
    wsService.sendChatMessage(roomId, message);
  };

  const handleUpdateSharedPad = (roomId: string, content: string) => {
    if (currentUser) {
      wsService.updateSharedPad(roomId, content, currentUser);
    }
  };

  const handleEnterMatchmaking = (tier: SubRoomTier) => {
    if (!currentUser) {
      setIsProfileModalOpen(true);
      return;
    }
    wsService.enterMatchmaking(tier, currentUser);
  };

  const handleCancelMatchmaking = (tier: SubRoomTier) => {
    if (currentUser) {
      wsService.cancelMatchmaking(tier, currentUser.id);
    }
  };

  const handleSubmitVerse = (battleId: string, verseText: string, audioUrl?: string) => {
    if (!currentUser) {
      setIsProfileModalOpen(true);
      return;
    }
    wsService.submitBattleVerse(battleId, verseText, currentUser, audioUrl);
  };

  const handleVote = (battleId: string, voteForPlayerId: string) => {
    if (!currentUser) {
      setIsProfileModalOpen(true);
      return;
    }
    wsService.spectatorVote(battleId, voteForPlayerId, currentUser.id);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950 flex flex-col">
      {/* App Header */}
      {connectionError && <p role="status" className="p-3 text-amber-300">{connectionError}</p>}
      {!currentUser && <p className="p-3 text-amber-300">Sign in to the suite to join conversations.</p>}
      <Header
        activeRoom={activeRoom}
        onSelectRoom={handleSelectRoom}
        currentUser={currentUser}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenHelp={() => setIsHelpModalOpen(true)}
        onOpenTerms={() => setIsTermsModalOpen(true)}
        onlineCount={onlineCount}
      />

      {/* Main Content View Container */}
      <main className="flex-1 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 w-full">
        {activeRoom.startsWith('rap-battle') && (
          <RapBattleLobby
            currentUser={currentUser}
            activeBattles={activeBattles}
            onEnterMatchmaking={handleEnterMatchmaking}
            onCancelMatchmaking={handleCancelMatchmaking}
            onSubmitVerse={handleSubmitVerse}
            onVote={handleVote}
            onRequireNickname={() => setIsProfileModalOpen(true)}
          />
        )}

        {activeRoom === 'collaboration' && (
          <CollaborationRoom
            currentUser={currentUser}
            messages={messages}
            sharedPadContent={sharedPad}
            roomUsers={roomUsers}
            onSendMessage={handleSendMessage}
            onUpdateSharedPad={handleUpdateSharedPad}
            onSelectGenreRoom={handleSelectGenreRoom}
            currentGenre={currentGenre}
            onRequireNickname={() => setIsProfileModalOpen(true)}
          />
        )}

        {activeRoom === 'lounge' && (
          <LoungeRoom
            currentUser={currentUser}
            messages={messages}
            roomUsers={roomUsers}
            onSendMessage={handleSendMessage}
            onRequireNickname={() => setIsProfileModalOpen(true)}
          />
        )}

        {activeRoom === 'marketing' && (
          <MarketingRoom
            currentUser={currentUser}
            messages={messages}
            onSendMessage={handleSendMessage}
            onRequireNickname={() => setIsProfileModalOpen(true)}
          />
        )}

        {activeRoom === 'beat-showcase' && (
          <ShowcaseRoom
            currentUser={currentUser}
            messages={messages}
            onSendMessage={handleSendMessage}
            onRequireNickname={() => setIsProfileModalOpen(true)}
          />
        )}
      </main>

      {/* Footer */}
      <Footer
        onOpenHelp={() => setIsHelpModalOpen(true)}
        onOpenTerms={() => setIsTermsModalOpen(true)}
      />

      {/* Modals */}
      <NicknameModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onSave={handleSaveProfile}
        currentProfile={currentUser}
      />

      <HelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />

      <TermsModal
        isOpen={isTermsModalOpen}
        onClose={() => setIsTermsModalOpen(false)}
      />
    </div>
  );
}
