export type AllowedPair = 'PROFESOR-ALUMNO' | 'PROFESOR-ASESOR' | 'ALUMNO-ASESOR';

export interface Conversation {
  id: number;
  otherUserId: string;
  otherName?: string;
  otherAvatarUrl?: string;
  allowedPair?: AllowedPair;
  lastMessageAt?: string;
  lastMessagePreview?: string;
  lastMessageSenderId?: string;
  unreadCount?: number;
}

export interface Attachment {
  id: number;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
}

export interface Message {
  id: number;
  conversationId: number;
  senderId: string;
  content: string | null;
  contentType: 'TEXT' | 'FILE' | 'MIXED' | 'SYSTEM';
  clientMessageId?: string | null;
  status?: 'SENT' | 'DELIVERED' | 'READ';
  createdAt: string;
  attachments?: Attachment[];
}

export interface SendMessageRequest {
  content: string;
  clientMessageId?: string;
}

export interface CreateDirectRequest {
  userId: string;
}

export interface UserSearchResult {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string | null;
}