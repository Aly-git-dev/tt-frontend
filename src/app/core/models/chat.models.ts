export type AllowedPair = 'PROFESOR-ALUMNO' | 'PROFESOR-ASESOR' | 'ALUMNO-ASESOR';

export interface Conversation {
  id: number;
  otherUserId: string;        // UUID
  otherName?: string;
  otherAvatarUrl?: string;
  allowedPair?: AllowedPair;
  lastMessageAt?: string;     // ISO
  unreadCount?: number;
}

export interface Message {
  id: number;
  conversationId: number;
  senderId: string;           // UUID
  content: string | null;
  contentType: 'TEXT' | 'FILE' | 'SYSTEM';
  createdAt: string;          // ISO
}

export interface SendMessageRequest {
  content: string;
}

export interface CreateDirectRequest {
  userId: string; // UUID del receptor
}
