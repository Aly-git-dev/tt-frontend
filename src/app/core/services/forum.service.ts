import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, map } from 'rxjs';

import {
  ThreadSummaryDto,
  ThreadDetailDto,
  ThreadCreateDto,
  ThreadUpdateDto,
  PostCreateDto,
  PostUpdateDto,
  PostDto,
  ReportCreateDto,
  ForumSummaryDto,
  AdminReportDto,
  ReportAdminActionDto
} from '../models/forum.models';

@Injectable({
  providedIn: 'root'
})
export class ForumService {

  private readonly baseUrl = `${environment.apiUrl}/upiiz/public/v1/forums`;
  private readonly adminBaseUrl = `${environment.apiUrl}/upiiz/admin/v1/forums`;

  constructor(private http: HttpClient) {}

  // ========== HILOS ==========

  getRecommendedThreads(): Observable<ThreadSummaryDto[]> {
    return this.http.get<ThreadSummaryDto[]>(`${this.baseUrl}/recommended`);
  }

  getThread(id: number): Observable<ThreadDetailDto> {
    return this.http.get<ThreadDetailDto>(`${this.baseUrl}/threads/${id}`);
  }

  createThread(payload: ThreadCreateDto): Observable<ThreadDetailDto> {
    return this.http.post<ThreadDetailDto>(`${this.baseUrl}/threads`, payload);
  }

  updateThread(id: number, payload: ThreadUpdateDto): Observable<ThreadDetailDto> {
    return this.http.put<ThreadDetailDto>(`${this.baseUrl}/threads/${id}`, payload);
  }

  deleteThread(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/threads/${id}`);
  }

  likeThread(id: number): Observable<ThreadDetailDto> {
    return this.http.post<ThreadDetailDto>(`${this.baseUrl}/threads/${id}/like`, {});
  }

  unlikeThread(id: number): Observable<ThreadDetailDto> {
    return this.http.delete<ThreadDetailDto>(`${this.baseUrl}/threads/${id}/like`);
  }

  // ========== RESPUESTAS / POSTS ==========

  createPost(threadId: number, payload: PostCreateDto): Observable<PostDto> {
    return this.http.post<PostDto>(
      `${this.baseUrl}/threads/${threadId}/posts`,
      payload
    );
  }

  updatePost(postId: number, payload: PostUpdateDto): Observable<PostDto> {
    return this.http.put<PostDto>(`${this.baseUrl}/posts/${postId}`, payload);
  }

  deletePost(postId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/posts/${postId}`);
  }

  likePost(postId: number): Observable<PostDto> {
    return this.http.post<PostDto>(`${this.baseUrl}/posts/${postId}/like`, {});
  }

  unlikePost(postId: number): Observable<PostDto> {
    return this.http.delete<PostDto>(`${this.baseUrl}/posts/${postId}/like`);
  }

  // ========== REPORTES ==========

  reportContent(payload: ReportCreateDto): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/reports`, payload);
  }

  // ========== RESUMEN ==========

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
    return this.http.post<void>(
      `${this.adminBaseUrl}/reports/${id}/resolve`,
      payload
    );
  }

  getAllThreads(): Observable<ThreadSummaryDto[]> {
    return this.http.get<ThreadSummaryDto[]>(`${this.baseUrl}/threads`);
  }

  // Búsqueda de threads con paginación
  searchThreads(query: string = '', page: number = 0, size: number = 10): Observable<{ threads: ThreadSummaryDto[], totalPages: number, totalElements: number }> {
    const params: any = { page, size };
    if (query) params.q = query;
    return this.http.get<any>(`${this.baseUrl}/threads/search`, { params }).pipe(
      map(response => {
        const threads = Array.isArray(response)
          ? response
          : response?.threads ?? response?.content ?? [];

        return {
          threads,
          totalPages: response?.totalPages ?? Math.ceil(threads.length / size) ?? 0,
          totalElements: response?.totalElements ?? threads.length
        };
      })
    );
  }
}
