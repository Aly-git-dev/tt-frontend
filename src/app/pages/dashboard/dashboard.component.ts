import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ForumService } from '../../core/services/forum.service';
import { ThreadSummaryDto, ForumSummaryDto } from '../../core/models/forum.models';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  recommendedThreads: ThreadSummaryDto[] = [];
  allThreads: ThreadSummaryDto[] = [];

  loadingForums = false;
  loadingFeed = false;

  forumsError: string | null = null;
  feedError: string | null = null;

  summary: ForumSummaryDto | null = null;
  summaryLoading = false;
  summaryError: string | null = null;

  // Búsqueda y paginación
  searchQuery = '';
  currentPage = 0;
  pageSize = 10;
  totalPages = 0;
  totalElements = 0;
  searching = false;

  constructor(
    private forumService: ForumService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadRecommendedThreads();
    this.loadAllThreads(); // Cargar todos los threads al inicio
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
      next: (threads) => {
        this.recommendedThreads = threads;
        this.loadingForums = false;
      },
      error: (err) => {
        console.error('Error cargando recomendados', err);
        this.forumsError = 'No se pudieron cargar los foros recomendados.';
        this.loadingForums = false;
      }
    });
  }

  private loadAllThreads(): void {
    this.loadingFeed = true;
    this.feedError = null;
    this.totalPages = 0;
    this.totalElements = 0;

    this.forumService.getAllThreads().subscribe({
      next: (threads) => {
        this.allThreads = threads;
        this.loadingFeed = false;
      },
      error: (err) => {
        console.error('Error cargando feed de foros', err);
        this.feedError = 'No se pudo cargar el feed de foros.';
        this.loadingFeed = false;
      }
    });
  }

  // Método para búsqueda con paginación
  searchThreads(): void {
    this.searching = true;
    this.feedError = null;

    // Si hay un query, intentar búsqueda; si no, cargar todos
    if (this.searchQuery.trim().length > 0) {
      this.forumService.searchThreads(this.searchQuery, this.currentPage, this.pageSize).subscribe({
        next: (response) => {
          this.allThreads = response.threads;
          this.totalPages = response.totalPages;
          this.totalElements = response.totalElements;
          this.searching = false;
        },
        error: (err) => {
          console.error('Error buscando threads', err);
          // Si el endpoint de búsqueda no existe, filtrar localmente
          this.filterThreadsLocally(this.searchQuery);
          this.searching = false;
        }
      });
    } else {
      // Si el query está vacío, cargar todos los threads
      this.currentPage = 0;
      this.loadAllThreads();
      this.searching = false;
    }
  }

  // Filtro local de threads cuando el backend no está disponible
  private filterThreadsLocally(query: string): void {
    const lowerQuery = query.toLowerCase();
    this.forumService.getAllThreads().subscribe({
      next: (allThreads) => {
        this.allThreads = allThreads.filter(thread =>
          thread.title.toLowerCase().includes(lowerQuery) ||
          (thread.categoryName?.toLowerCase().includes(lowerQuery) || false) ||
          (thread.subareaName?.toLowerCase().includes(lowerQuery) || false)
        );
        this.totalElements = this.allThreads.length;
        this.totalPages = Math.ceil(this.totalElements / this.pageSize) || 1;
      },
      error: (err) => {
        console.error('Error filtrando threads', err);
        this.feedError = 'No se pudo procesar la búsqueda.';
      }
    });
  }

  onSearch(): void {
    this.currentPage = 0; // Reset to first page
    this.searchThreads();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    if (this.searchQuery.trim().length > 0) {
      this.searchThreads();
    }
  }

  goToThread(thread: ThreadSummaryDto): void {
    this.router.navigate(['/forums', thread.id]);
  }

  goToNewThread(): void {
    this.router.navigate(['/forums', 'new']);
  }

  getThreadIcon(type: string): string {
    switch (type) {
      case 'PREGUNTA':
        return '❔';
      case 'DISCUSSION':
        return '💬';
      case 'ANUNCIO':
        return '📢';
      default:
        return '🧵';
    }
  }

  getInitial(title?: string | null): string {
    if (!title) return '?';
    return title.trim().charAt(0).toUpperCase();
  }
}
