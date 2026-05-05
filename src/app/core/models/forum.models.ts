export interface AttachmentDto {
  id?: number;
  kind: 'IMAGEN' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'LINK' | string;
  url: string;
}

export interface AttachmentCreateDto {
  kind: string;
  url: string;
}

export interface ThreadCreateDto {
  categoryId: number;
  subareaId?: number | null;
  title: string;
  body: string;
  type: 'PREGUNTA' | 'DISCUSSION' | 'ANUNCIO';
  attachments?: AttachmentCreateDto[];
}

export interface ThreadUpdateDto {
  categoryId?: number | null;
  subareaId?: number | null;
  title?: string;
  body?: string;
  type?: 'PREGUNTA' | 'DISCUSSION' | 'ANUNCIO' | string;
}

export interface PostCreateDto {
  body: string;
  parentPostId?: number | null;
  attachments?: AttachmentDto[];
}

export interface PostUpdateDto {
  body: string;
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
  createdAt: string;
  likedByMe?: boolean;

  // 👇 NUEVO
  authorAvatarUrl?: string | null;
}

export interface PostDto {
  id: number;
  body: string;
  status: string;
  score: number;
  acceptedAnswer: boolean;

  authorId: string;
  authorName: string;
  authorAvatarUrl?: string | null; // 👈 NUEVO

  parentPostId?: number | null;
  createdAt: string;
  updatedAt?: string;
  likedByMe?: boolean;

  attachments: AttachmentDto[];
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
  authorAvatarUrl?: string | null; // 👈 NUEVO

  createdAt: string;
  updatedAt?: string;
  likedByMe?: boolean;

  attachments: AttachmentDto[];
  posts: PostDto[];
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

export interface PublicUserProfileDto {
  id: string;
  fullName: string;
  emailInst?: string | null;
  carrera?: string | null;
  bio?: string | null;
  interests?: string | null;
  links?: string | null;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  threadsCount: number;
  postsCount: number;
}