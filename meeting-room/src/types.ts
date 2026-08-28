export type UserRole = 'host' | 'attendee';

export type UserStatus = 'active' | 'away' | 'hand_raised' | 'speaking';

export type VoteChoice = 'ya' | 'na' | 'abstain';

export interface Attendee {
  id: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  joinedAt: number;
  lastSeen: number;
  currentVote?: VoteChoice;
  hasHandRaised: boolean;
  avatarColor: string;
}

export type TopicStatus = 'planned' | 'in_progress' | 'completed' | 'tabled';

export interface Topic {
  id: string;
  title: string;
  description: string;
  presenter?: string;
  status: TopicStatus;
  createdAt: number;
  updatedAt: number;
  tags: string[];
}

export type MotionStatus = 'draft' | 'active' | 'passed' | 'rejected' | 'closed';

export interface MotionVote {
  attendeeId: string;
  attendeeName: string;
  choice: VoteChoice;
  timestamp: number;
}

export interface Motion {
  id: string;
  topicId?: string;
  title: string;
  description: string;
  proposedBy: string;
  status: MotionStatus;
  requiredMajority: 'simple' | 'two_thirds' | 'unanimous';
  startedAt?: number;
  durationSeconds?: number;
  expiresAt?: number;
  closedAt?: number;
  votes: Record<string, MotionVote>;
  tally: {
    ya: number;
    na: number;
    abstain: number;
    total: number;
  };
  resultSummary?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  text: string;
  timestamp: number;
  isQuestion?: boolean;
}

export interface ReactionEvent {
  id: string;
  emoji: string;
  senderName: string;
  timestamp: number;
}

export interface MeetingRoomState {
  roomId: string;
  roomTitle: string;
  meetingStatus: 'scheduled' | 'in_session' | 'adjourned';
  startedAt: number;
  moderatorId: string;
  topics: Topic[];
  activeMotion: Motion | null;
  motionHistory: Motion[];
  attendees: Record<string, Attendee>;
  chatMessages: ChatMessage[];
  lastUpdated: number;
}

export type WSClientMessage =
  | { type: 'JOIN_ROOM'; roomId: string; attendee: Omit<Attendee, 'joinedAt' | 'lastSeen'> }
  | { type: 'UPDATE_ROLE'; role: UserRole }
  | { type: 'UPDATE_STATUS'; status: UserStatus }
  | { type: 'TOGGLE_HAND_RAISE'; raised: boolean }
  | { type: 'ADD_TOPIC'; topic: Omit<Topic, 'id' | 'createdAt' | 'updatedAt'> }
  | { type: 'UPDATE_TOPIC'; topicId: string; updates: Partial<Topic> }
  | { type: 'DELETE_TOPIC'; topicId: string }
  | { type: 'REORDER_TOPICS'; topicIds: string[] }
  | { type: 'START_MOTION'; motion: Omit<Motion, 'id' | 'votes' | 'tally' | 'status'> }
  | { type: 'CAST_VOTE'; motionId: string; choice: VoteChoice }
  | { type: 'CLOSE_MOTION'; motionId: string }
  | { type: 'UPDATE_MEETING_STATUS'; status: 'scheduled' | 'in_session' | 'adjourned' }
  | { type: 'UPDATE_ROOM_TITLE'; title: string }
  | { type: 'SEND_CHAT'; text: string; isQuestion?: boolean }
  | { type: 'SEND_REACTION'; emoji: string }
  | { type: 'RESET_MEETING' }
  | { type: 'KICK_ATTENDEE'; attendeeId: string }
  | { type: 'PING' };

export type WSServerMessage =
  | { type: 'INIT_STATE'; state: MeetingRoomState; yourId: string }
  | { type: 'STATE_UPDATE'; state: MeetingRoomState }
  | { type: 'ATTENDEE_JOINED'; attendee: Attendee }
  | { type: 'ATTENDEE_LEFT'; attendeeId: string }
  | { type: 'ATTENDEE_UPDATED'; attendee: Attendee }
  | { type: 'TOPIC_ADDED'; topic: Topic }
  | { type: 'TOPIC_UPDATED'; topic: Topic }
  | { type: 'TOPIC_DELETED'; topicId: string }
  | { type: 'MOTION_STARTED'; motion: Motion }
  | { type: 'VOTE_RECORDED'; motionId: string; tally: Motion['tally']; voteCount: number }
  | { type: 'MOTION_CLOSED'; motion: Motion }
  | { type: 'CHAT_MESSAGE'; message: ChatMessage }
  | { type: 'REACTION'; reaction: ReactionEvent }
  | { type: 'ERROR'; message: string }
  | { type: 'PONG' };
