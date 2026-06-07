export interface NotificationResponse {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  details?: string | null;
  detail?: string | null;
  data?: Record<string, unknown> | null;
  targetType: string;
  targetId: string;
  read: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationPage {
  content: NotificationResponse[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
