import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import {
  ThreadSummaryDto,
  ThreadDetailDto,
  ThreadCreateDto,
  PostCreateDto,
  PostDto,
  ReportCreateDto,
  ForumSummaryDto,
  AdminReportDto,
  ReportAdminActionDto
} from '../models/forum.models';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ForumService {

  private readonly baseUrl = `${environment.apiUrl}/upiiz/public/v1/forums`;
  // Base admin
  private readonly adminBaseUrl = `${environment.apiUrl}/upiiz/admin/v1/forums`;

  constructor(private http: HttpClient) {}

  /**
   * Obtener hilos recomendados para el dashboard.
   * GET /api/forums/recommended
   */
  getRecommendedThreads(): Observable<ThreadSummaryDto[]> {
    return this.http.get<ThreadSummaryDto[]>(`${this.baseUrl}/recommended`);
  }

  /**
   * Obtener detalle de un hilo (con sus posts).
   * GET /api/forums/threads/{id}
   */
  getThread(id: number): Observable<ThreadDetailDto> {
    return this.http.get<ThreadDetailDto>(`${this.baseUrl}/threads/${id}`);
  }

  /**
   * Crear un nuevo hilo.
   * POST /api/forums/threads
   */
  createThread(payload: ThreadCreateDto): Observable<ThreadDetailDto> {
    return this.http.post<ThreadDetailDto>(`${this.baseUrl}/threads`, payload);
  }

  /**
   * Crear una respuesta / comentario en un hilo.
   * POST /api/forums/threads/{id}/posts
   */
  createPost(threadId: number, payload: PostCreateDto): Observable<PostDto> {
    return this.http.post<PostDto>(
      `${this.baseUrl}/threads/${threadId}/posts`,
      payload
    );
  }

  /**
   * Reportar contenido (hilo o post).
   * POST /api/forums/reports
   */
  reportContent(payload: ReportCreateDto): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/reports`, payload);
  }
  /**
   * Obtener el resumen.
   * GET /upiiz/public/v1/forums/me/summary
   */
  getMySummary(): Observable<ForumSummaryDto> {
    return this.http.get<ForumSummaryDto>(`${this.baseUrl}/me/summary`);
  }

  // ========== ADMIN ==========

  getAdminReports(): Observable<AdminReportDto[]> {
    return this.http.get<AdminReportDto[]>(`${this.adminBaseUrl}/reports`);
  }

  getAllAdminReports(): Observable<AdminReportDto[]> {
    return this.http.get<AdminReportDto[]>(`${this.adminBaseUrl}/reports/all`);
  }

  resolveReport(id: number, payload: ReportAdminActionDto): Observable<void> {
    return this.http.post<void>(`${this.adminBaseUrl}/reports/${id}/resolve`, payload);
  }
}
