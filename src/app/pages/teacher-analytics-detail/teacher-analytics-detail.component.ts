import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AnalyticsService } from '../../core/services/analytics.service';
import {
  TeacherImprovementArea,
  TeacherPerformance
} from '../../core/models/analytics.models';

@Component({
  selector: 'app-teacher-analytics-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './teacher-analytics-detail.component.html',
  styleUrls: ['./teacher-analytics-detail.component.css']
})
export class TeacherAnalyticsDetailComponent implements OnInit {
  teacherId = '';
  loading = false;
  error = '';

  teacher: TeacherPerformance | null = null;
  areas: TeacherImprovementArea[] = [];

  constructor(
    private route: ActivatedRoute,
    private analyticsService: AnalyticsService
  ) {}

  ngOnInit(): void {
    this.teacherId = this.route.snapshot.paramMap.get('teacherId') || '';

    if (!this.teacherId) {
      this.error = 'No se encontró el identificador del docente.';
      return;
    }

    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.error = '';

    this.analyticsService.getTeacherPerformanceById(this.teacherId).subscribe({
      next: (teacher) => {
        this.teacher = teacher;

        this.analyticsService.getTeacherImprovementAreasByTeacher(this.teacherId).subscribe({
          next: (areas) => {
            this.areas = areas;
            this.loading = false;
          },
          error: (err) => {
            this.error = err?.error?.message || 'No se pudieron cargar las áreas de mejora.';
            this.loading = false;
          }
        });
      },
      error: (err) => {
        this.error = err?.error?.message || 'No se pudo cargar el detalle del docente.';
        this.loading = false;
      }
    });
  }

  formatDate(value: string | null): string {
    if (!value) return '—';
    return new Date(value).toLocaleString();
  }

  averageMetrics(): { label: string; value: number }[] {
    if (!this.teacher) return [];

    return [
      { label: 'Claridad', value: this.teacher.avgClarity || 0 },
      { label: 'Conocimiento', value: this.teacher.avgKnowledge || 0 },
      { label: 'Apoyo', value: this.teacher.avgSupport || 0 },
      { label: 'Puntualidad', value: this.teacher.avgPunctuality || 0 }
    ];
  }

  trackValue(value: number): string {
    return `${(Math.max(0, Math.min(5, value)) / 5) * 100}%`;
  }
}