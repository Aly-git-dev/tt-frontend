import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { ForumService } from '../../core/services/forum.service';
import { ThreadSummaryDto, ForumSummaryDto } from '../../core/models/forum.models';
import { UserProfileService } from '../../core/services/user-profile.service';
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
  pageSize = 2;
  totalPages = 0;
  totalElements = 0;
  searching = false;

  constructor(
    private forumService: ForumService,
    private userProfileService: UserProfileService,
    private router: Router
  ) {}

  get pagedThreads(): ThreadSummaryDto[] {
    if (this.allThreads.length <= this.pageSize) {
      return this.allThreads;
    }

    const start = this.currentPage * this.pageSize;
    return this.allThreads.slice(start, start + this.pageSize);
  }

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

    this.forumService.getRecommendedThreads().pipe(
      switchMap(threads => this.enrichThreadSummaries(threads))
    ).subscribe({
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

    this.forumService.searchThreads('', this.currentPage, this.pageSize).pipe(
      switchMap(response => this.enrichThreadSummaries(response.threads).pipe(
        map(threads => ({ ...response, threads }))
      ))
    ).subscribe({
      next: (response) => {
        this.allThreads = response.threads;
        this.totalElements = response.totalElements || response.threads.length;
        this.totalPages = response.totalPages || Math.ceil(this.totalElements / this.pageSize) || 1;
        this.loadingFeed = false;
      },
      error: (err) => {
        console.error('Error cargando feed de foros', err);
        this.loadAllThreadsFallback();
      }
    });
  }

  private loadAllThreadsFallback(): void {
    this.forumService.getAllThreads().pipe(
      switchMap(threads => this.enrichThreadSummaries(threads))
    ).subscribe({
      next: (threads) => {
        this.totalElements = threads.length;
        this.totalPages = Math.ceil(this.totalElements / this.pageSize) || 1;
        const start = this.currentPage * this.pageSize;
        this.allThreads = threads.slice(start, start + this.pageSize);
        this.loadingFeed = false;
      },
      error: (err) => {
        console.error('Error cargando fallback de foros', err);
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
      this.forumService.searchThreads(this.searchQuery, this.currentPage, this.pageSize).pipe(
        switchMap(response => this.enrichThreadSummaries(response.threads).pipe(
          map(threads => ({ ...response, threads }))
        ))
      ).subscribe({
        next: (response) => {
          this.allThreads = response.threads;
          this.totalElements = response.totalElements || response.threads.length;
          this.totalPages = response.totalPages || Math.ceil(this.totalElements / this.pageSize) || 1;
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
      this.loadAllThreads();
      this.searching = false;
    }
  }

  // Filtro local de threads cuando el backend no está disponible
  private filterThreadsLocally(query: string): void {
    const lowerQuery = query.toLowerCase();
    this.forumService.getAllThreads().pipe(
      switchMap(threads => this.enrichThreadSummaries(threads))
    ).subscribe({
      next: (allThreads) => {
        this.allThreads = allThreads.filter(thread =>
          thread.title.toLowerCase().includes(lowerQuery) ||
          (thread.authorName?.toLowerCase().includes(lowerQuery) || false) ||
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
    this.searchThreads();
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

  isAnonymousTeacherEvaluation(thread: ThreadSummaryDto | null | undefined): boolean {
    return thread?.anonymousTeacherEvaluation === true;
  }

  getThreadAuthorInitial(thread: ThreadSummaryDto): string {
    return this.isAnonymousTeacherEvaluation(thread)
      ? 'E'
      : this.getInitial(thread.authorName || thread.title);
  }

  private enrichThreadSummaries(threads: ThreadSummaryDto[]): Observable<ThreadSummaryDto[]> {
    if (!threads.length) {
      return of([]);
    }

    return forkJoin(threads.map(thread => this.enrichThreadSummary(thread)));
  }

  private enrichThreadSummary(thread: ThreadSummaryDto): Observable<ThreadSummaryDto> {
    if (thread.authorName && thread.authorAvatarUrl && !this.mightBeTeacherEvaluation(thread)) {
      return of(thread);
    }

    return this.forumService.getThread(thread.id).pipe(
      switchMap(detail => {
        const isAnonymousTeacherEvaluation = this.isAnonymousTeacherEvaluationDetail(detail);

        const enriched: ThreadSummaryDto = {
          ...thread,
          authorId: thread.authorId || detail.authorId,
          authorName: isAnonymousTeacherEvaluation ? 'Anónimo' : thread.authorName || detail.authorName,
          authorAvatarUrl: isAnonymousTeacherEvaluation ? null : thread.authorAvatarUrl || detail.authorAvatarUrl || null,
          anonymousTeacherEvaluation: isAnonymousTeacherEvaluation
        };

        if (enriched.anonymousTeacherEvaluation || enriched.authorAvatarUrl || !enriched.authorId) {
          return of(enriched);
        }

        return this.userProfileService.getPublicProfile(enriched.authorId).pipe(
          map(profile => ({
            ...enriched,
            authorName: enriched.authorName || profile.fullName,
            authorAvatarUrl: profile.avatarUrl || null
          })),
          catchError(() => of(enriched))
        );
      }),
      catchError(() => of(thread))
    );
  }

  private mightBeTeacherEvaluation(thread: ThreadSummaryDto): boolean {
    return this.normalizeForPrivacyCheck(thread.categoryName || '').includes('evaluacion');
  }

  private isAnonymousTeacherEvaluationDetail(detail: { categoryId?: number; categoryName?: string | null; body?: string | null }): boolean {
    const category = this.normalizeForPrivacyCheck(detail.categoryName || '');
    const body = this.normalizeForPrivacyCheck(detail.body || '');
    const isTeacherEvaluationCategory = detail.categoryId === 9 || category.includes('evaluacion');

    return isTeacherEvaluationCategory
      && body.includes('modalidad:')
      && (body.includes('anonima') || body.includes('anonimo'));
  }

  private normalizeForPrivacyCheck(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/Ã³/g, 'o')
      .replace(/Ã¡/g, 'a')
      .replace(/Ã©/g, 'e')
      .replace(/Ã­/g, 'i')
      .replace(/Ãº/g, 'u')
      .replace(/Ã±/g, 'n');
  }
}
