import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AnalyticsService } from '../../core/services/analytics.service';
import {
  AdminAnalyticsDashboard,
  AdminTopicDifficulty,
  AdminTopicInterest,
  TeacherPerformance
} from '../../core/models/analytics.models';
import { AdminUsersService } from '../../core/services/admin-users.service';
import { ForumService } from '../../core/services/forum.service';
import { AdminMessageReportsService } from '../../core/services/admin-message-reports.service';

@Component({
  selector: 'app-admin-analytics-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-analytics-dashboard.component.html',
  styleUrls: ['./admin-analytics-dashboard.component.css']
})
export class AdminAnalyticsDashboardComponent implements OnInit {
  loading = false;
  error = '';

  dashboard: AdminAnalyticsDashboard | null = null;

  topicInterest: AdminTopicInterest[] = [];
  topicDifficulty: AdminTopicDifficulty[] = [];
  teacherPerformance: TeacherPerformance[] = [];
  activeTeacherIds = new Set<string>();
  activeTeacherEmails = new Set<string>();

  moderationStats = {
    bannedUsers: 0,
    activeUsers: 0,
    forumReports: 0,
    forumResolved: 0,
    forumDismissed: 0,
    messageReports: 0,
    messageResolved: 0,
    messageDismissed: 0,
    messagePending: 0
  };

  searchTeacher = '';

  constructor(
    private analyticsService: AnalyticsService,
    private adminUsersService: AdminUsersService,
    private forumService: ForumService,
    private messageReportsService: AdminMessageReportsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading = true;
    this.error = '';

    let completed = 0;

    const finish = () => {
      completed++;
      if (completed === 4) {
        this.loading = false;
      }
    };

    // 🔹 Temas de interés
    this.analyticsService.getGeneralInterest().subscribe({
      next: (data) => {
        this.topicInterest = data ?? [];
        finish();
      },
      error: (err) => {
        console.error('Interest error:', err);
        this.error = 'Error cargando temas de interés';
        finish();
      }
    });

    // 🔹 Áreas de dificultad
    this.analyticsService.getGeneralDifficulty().subscribe({
      next: (data) => {
        this.topicDifficulty = data ?? [];
        finish();
      },
      error: (err) => {
        console.error('Difficulty error:', err);
        this.error = 'Error cargando áreas de dificultad';
        finish();
      }
    });

    // 🔹 Desempeño docente
    this.analyticsService.getTeacherPerformance().subscribe({
      next: (data) => {
        this.teacherPerformance = data ?? [];
        finish();
      },
      error: (err) => {
        console.error('Teacher error:', err);
        this.error = 'Error cargando desempeño docente';
        finish();
      }
    });

    this.loadModerationStats(finish);
  }

  get filteredTeachers(): TeacherPerformance[] {
    const term = this.searchTeacher.trim().toLowerCase();

    if (!term) return this.activeTeacherPerformance;

    return this.activeTeacherPerformance.filter(t =>
      (t.fullName ?? '').toLowerCase().includes(term) ||
      (t.emailInst ?? '').toLowerCase().includes(term)
    );
  }

  get activeTeacherPerformance(): TeacherPerformance[] {
    if (!this.activeTeacherIds.size && !this.activeTeacherEmails.size) {
      return this.teacherPerformance;
    }

    return this.teacherPerformance.filter(teacher => {
      const email = (teacher.emailInst || '').toLowerCase();
      return this.activeTeacherIds.has(teacher.teacherId) || this.activeTeacherEmails.has(email);
    });
  }

  goToTeacherDetail(teacherId: string): void {
    this.router.navigate(['/admin/analytics/teachers', teacherId]);
  }

  formatDate(value: string | null): string {
    if (!value) return '—';
    return new Date(value).toLocaleString();
  }

  scoreClass(score: number): string {
    if (score >= 4.5) return 'excellent';
    if (score >= 3.5) return 'good';
    if (score >= 2.5) return 'regular';
    return 'bad';
  }

  topTeachers(): TeacherPerformance[] {
    return [...this.activeTeacherPerformance]
      .sort((a, b) => (b.avgGlobalScore || 0) - (a.avgGlobalScore || 0))
      .slice(0, 3);
  }

  totalEvaluations(): number {
    return this.activeTeacherPerformance.reduce((acc, t) => acc + (t.totalEvaluations || 0), 0);
  }

  totalAppointments(): number {
    return this.activeTeacherPerformance.reduce((acc, t) => acc + (t.totalAppointmentsCreated || 0), 0);
  }

  totalVideoMeetings(): number {
    return this.activeTeacherPerformance.reduce((acc, t) => acc + (t.totalVideoMeetings || 0), 0);
  }

  totalForumActivity(): number {
    return this.activeTeacherPerformance.reduce(
      (acc, t) => acc + (t.totalForumPosts || 0) + (t.totalForumThreads || 0),
      0
    );
  }

  averageTeacherScore(): number {
    const teachers = this.activeTeacherPerformance.filter(t => Number(t.avgGlobalScore) > 0);
    if (!teachers.length) return 0;

    const total = teachers.reduce((acc, t) => acc + (Number(t.avgGlobalScore) || 0), 0);
    return total / teachers.length;
  }

  appointmentCompletionRate(): number {
    const total = this.activeTeacherPerformance.reduce((acc, t) => acc + (t.totalAppointmentsCreated || 0), 0);
    const completed = this.activeTeacherPerformance.reduce((acc, t) => acc + (t.completedAppointments || 0), 0);

    if (!total) return 0;
    return (completed / total) * 100;
  }

  topInterestItems(limit = 6): AdminTopicInterest[] {
    return [...this.topicInterest]
      .sort((a, b) => (b.weightedScore || 0) - (a.weightedScore || 0))
      .slice(0, limit);
  }

  topDifficultyItems(limit = 6): AdminTopicDifficulty[] {
    return [...this.topicDifficulty]
      .sort((a, b) => (b.avgDifficulty || 0) - (a.avgDifficulty || 0))
      .slice(0, limit);
  }

  maxInterestScore(): number {
    return Math.max(...this.topInterestItems().map(item => item.weightedScore || 0), 1);
  }

  maxDifficultyScore(): number {
    return Math.max(...this.topDifficultyItems().map(item => item.avgDifficulty || 0), 1);
  }

  barWidth(value: number, max: number): string {
    if (!max) return '0%';
    return `${Math.max(4, Math.min(100, (value / max) * 100))}%`;
  }

  teacherScoreDistribution(): { label: string; count: number; className: string }[] {
    const teachers = this.activeTeacherPerformance;

    return [
      {
        label: 'Excelente',
        count: teachers.filter(t => (t.avgGlobalScore || 0) >= 4.5).length,
        className: 'excellent'
      },
      {
        label: 'Bueno',
        count: teachers.filter(t => (t.avgGlobalScore || 0) >= 3.5 && (t.avgGlobalScore || 0) < 4.5).length,
        className: 'good'
      },
      {
        label: 'Regular',
        count: teachers.filter(t => (t.avgGlobalScore || 0) >= 2.5 && (t.avgGlobalScore || 0) < 3.5).length,
        className: 'regular'
      },
      {
        label: 'Atencion',
        count: teachers.filter(t => (t.avgGlobalScore || 0) > 0 && (t.avgGlobalScore || 0) < 2.5).length,
        className: 'bad'
      }
    ];
  }

  maxTeacherDistributionCount(): number {
    return Math.max(...this.teacherScoreDistribution().map(item => item.count), 1);
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat('es-MX', { maximumFractionDigits: 1 }).format(value || 0);
  }

  private loadModerationStats(finish: () => void): void {
    forkJoin({
      users: this.adminUsersService.getAllUsers(''),
      forumReports: this.forumService.getAllAdminReports(),
      messagePending: this.messageReportsService.listReports('PENDIENTE'),
      messageResolved: this.messageReportsService.listReports('RESUELTO'),
      messageDismissed: this.messageReportsService.listReports('DESESTIMADO')
    }).subscribe({
      next: ({ users, forumReports, messagePending, messageResolved, messageDismissed }) => {
        const activeUsers = (users ?? []).filter(user => user.active !== false);
        const bannedUsers = (users ?? []).filter(user => user.active === false);

        this.activeTeacherIds = new Set(activeUsers.map(user => user.id));
        this.activeTeacherEmails = new Set(
          activeUsers
            .map(user => (user.emailInst || '').toLowerCase())
            .filter(Boolean)
        );

        this.moderationStats = {
          bannedUsers: bannedUsers.length,
          activeUsers: activeUsers.length,
          forumReports: forumReports?.length ?? 0,
          forumResolved: (forumReports ?? []).filter(report => report.status === 'RESUELTO').length,
          forumDismissed: (forumReports ?? []).filter(report => report.status === 'DESESTIMADO').length,
          messageReports: (messagePending?.length ?? 0) + (messageResolved?.length ?? 0) + (messageDismissed?.length ?? 0),
          messageResolved: messageResolved?.length ?? 0,
          messageDismissed: messageDismissed?.length ?? 0,
          messagePending: messagePending?.length ?? 0
        };
      },
      error: err => {
        console.error('Moderation analytics error:', err);
        finish();
      },
      complete: finish
    });
  }
}
