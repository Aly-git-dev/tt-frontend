export interface NotificationResponse {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
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