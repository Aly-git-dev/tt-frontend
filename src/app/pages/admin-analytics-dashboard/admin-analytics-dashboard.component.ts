import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AnalyticsService } from '../../core/services/analytics.service';
import {
  AdminAnalyticsDashboard,
  AdminTopicDifficulty,
  AdminTopicInterest,
  TeacherPerformance
} from '../../core/models/analytics.models';

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

  searchTeacher = '';

  constructor(
    private analyticsService: AnalyticsService,
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
      if (completed === 3) {
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
  }

  get filteredTeachers(): TeacherPerformance[] {
    const term = this.searchTeacher.trim().toLowerCase();

    if (!term) return this.teacherPerformance;

    return this.teacherPerformance.filter(t =>
      (t.fullName ?? '').toLowerCase().includes(term) ||
      (t.emailInst ?? '').toLowerCase().includes(term)
    );
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
    return [...this.teacherPerformance]
      .sort((a, b) => (b.avgGlobalScore || 0) - (a.avgGlobalScore || 0))
      .slice(0, 3);
  }

  totalEvaluations(): number {
    return this.teacherPerformance.reduce((acc, t) => acc + (t.totalEvaluations || 0), 0);
  }

  totalAppointments(): number {
    return this.teacherPerformance.reduce((acc, t) => acc + (t.totalAppointmentsCreated || 0), 0);
  }

  totalVideoMeetings(): number {
    return this.teacherPerformance.reduce((acc, t) => acc + (t.totalVideoMeetings || 0), 0);
  }
}