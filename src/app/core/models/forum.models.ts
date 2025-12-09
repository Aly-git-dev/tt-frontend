export interface ThreadCreateDto {
  categoryId: number;
  subareaId?: number | null;
  title: string;
  body: string;
  type: 'PREGUNTA' | 'DISCUSSION' | 'ANUNCIO';
  attachments: AttachmentCreateDto[];
}

export interface ThreadSummaryDto {
  id: number;
  title: string;
  categoryName: string;
  subareaName?: string | null;
  type: string;
  score: number;
  answersCount: number;
  views: number;
  status: string;
  createdAt: string; // viene como ISO string
}

export interface AttachmentDto {
  id?: number;
  kind: 'IMAGEN' | 'VIDEO' | 'AUDIO' | 'LINK' | string;
  url: string;
}

export interface AttachmentCreateDto {
  kind: string;
  url: string;
}

export interface PostDto {
  id: number;
  body: string;
  status: string;
  score: number;
  acceptedAnswer: boolean;
  authorId: string;
  authorName: string;
  parentPostId?: number | null;
  createdAt: string;
  attachments: AttachmentCreateDto[];
}

export interface ThreadDetailDto {
  id: number;
  title: string;
  body: string;
  type: string;
  status: string;
  score: number;
  answersCount: number;
  views: number;

  categoryId: number;
  categoryName: string;
  subareaId?: number | null;
  subareaName?: string | null;

  authorId: string;
  authorName: string;

  createdAt: string;
  updatedAt: string;

  attachments: AttachmentDto[];
  posts: PostDto[];
}

export interface PostCreateDto {
  body: string;
  parentPostId?: number | null;
  attachments?: AttachmentDto[];
}

export interface ReportCreateDto {
  threadId?: number | null;
  postId?: number | null;
  reasonCode: string;
  description?: string | null;
}
export interface ForumSummaryDto {
  threadsCreated: number;
  postsCreated: number;
  interestsCount: number;
}
export interface ReportCreateDto {
  threadId?: number | null;
  postId?: number | null;
  reasonCode: string;     // p.ej. 'SPAM', 'OFENSIVO', 'OTRO'
  description?: string | null;   // opcional
}
export interface AdminReportDto {
  id: number;

  reporterId: string;
  reporterName: string;

  threadId?: number;
  threadTitle?: string;
  postId?: number;

  reportedUserId?: string;
  reportedUserName?: string;

  reasonCode: string;
  description?: string;
  status: string;

  createdAt: string;
  handledAt?: string;
  handledByName?: string;
}

export interface ReportAdminActionDto {
  deleteContent: boolean;
  banUser: boolean;
  adminNote?: string;
}
