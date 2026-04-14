export interface ApiResponse<T> {
  ok: boolean;
  message: string;
  data: T;
}

export interface AdminTopicInterest {
  categoryId: number;
  categoryCode: string;
  categoryName: string;
  subareaId: number | null;
  subareaName: string | null;
  totalEvents: number;
  weightedScore: number;
  uniqueUsers: number;
  lastEventAt: string | null;
}

export interface AdminTopicDifficulty {
  categoryId: number;
  categoryCode: string;
  categoryName: string;
  subareaId: number | null;
  subareaName: string | null;
  totalReports: number;
  avgDifficulty: number;
  affectedStudents: number;
  lastReportAt: string | null;
}

export interface TeacherPerformance {
  teacherId: string;
  fullName: string;
  emailInst: string;

  totalEvaluations: number;
  avgClarity: number;
  avgKnowledge: number;
  avgSupport: number;
  avgPunctuality: number;
  avgGlobalScore: number;

  totalForumPosts: number;
  totalForumThreads: number;
  totalAppointmentsCreated: number;
  completedAppointments: number;
  totalVideoMeetings: number;
  endedVideoMeetings: number;
}

export interface TeacherImprovementArea {
  teacherId: string;
  teacherName: string;
  categoryId: number;
  categoryCode: string;
  categoryName: string;
  subareaId: number | null;
  subareaName: string | null;
  totalDifficultyEvents: number;
  avgDifficulty: number;
  lastEventAt: string | null;
}

export interface AdminAnalyticsDashboard {
  topicInterest: AdminTopicInterest[];
  topicDifficulty: AdminTopicDifficulty[];
  teacherPerformance: TeacherPerformance[];
}

export interface CreateTeacherEvaluationRequest {
  teacherId: string;
  evaluatorId?: string | null;
  appointmentId?: string | null;
  ratingClarity: number;
  ratingKnowledge: number;
  ratingSupport: number;
  ratingPunctuality: number;
  comment?: string | null;
  anonymous: boolean;
}

export interface CreateTopicInterestEventRequest {
  userId: string;
  categoryId: number;
  subareaId?: number | null;
  threadId?: number | null;
  appointmentId?: string | null;
  videoMeetingId?: string | null;
  sourceType:
    | 'THREAD_VIEW'
    | 'THREAD_CREATE'
    | 'POST_CREATE'
    | 'APPOINTMENT_JOIN'
    | 'VIDEO_JOIN'
    | 'MANUAL';
  weight: number;
}

export interface CreateTopicDifficultyEventRequest {
  userId?: string | null;
  teacherId?: string | null;
  categoryId: number;
  subareaId?: number | null;
  threadId?: number | null;
  appointmentId?: string | null;
  videoMeetingId?: string | null;
  sourceType:
    | 'SELF_REPORT'
    | 'FORUM_QUESTION'
    | 'LOW_PERFORMANCE'
    | 'TEACHER_OBSERVATION'
    | 'MANUAL';
  difficultyLevel: number;
  notes?: string | null;
}