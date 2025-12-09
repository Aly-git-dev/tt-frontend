import { Component, OnInit } from '@angular/core';
import { ForumService } from '../../core/services/forum.service';
import { ThreadSummaryDto, ForumSummaryDto } from '../../core/models/forum.models';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'] // o .css
})
export class DashboardComponent implements OnInit {

  recommendedThreads: ThreadSummaryDto[] = [];
  loadingForums = false;
  forumsError: string | null = null;
  summary: ForumSummaryDto | null = null;
  summaryLoading = false;
  summaryError: string | null = null;

  constructor(
    private forumService: ForumService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadRecommendedThreads();
    this.loadSummary();
  }

  private loadSummary(): void {
    this.summaryLoading = true;
    this.summaryError = null;

    this.forumService.getMySummary().subscribe({
      next: (dto) => {
        this.summary = dto;
        this.summaryLoading = false;
      },
      error: (err) => {
        console.error('Error cargando resumen rápido', err);
        this.summaryError = 'No se pudo cargar el resumen rápido.';
        this.summaryLoading = false;
      }
    });
  }

  private loadRecommendedThreads(): void {
    this.loadingForums = true;
    this.forumsError = null;

    this.forumService.getRecommendedThreads().subscribe({
      next: threads => {
        this.recommendedThreads = threads;
        this.loadingForums = false;
      },
      error: err => {
        console.error('Error cargando recomendados', err);
        this.forumsError = 'No se pudieron cargar los foros recomendados.';
        this.loadingForums = false;
      }
    });
  }

  goToThread(thread: ThreadSummaryDto): void {
    this.router.navigate(['/forums', thread.id]);
  }

  goToNewThread(): void {
    this.router.navigate(['/forums', 'new']);
  }
}
