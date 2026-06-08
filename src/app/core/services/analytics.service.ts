import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  AdminAnalyticsDashboard,
  AdminTopicDifficulty,
  AdminTopicInterest,
  ApiResponse,
  CreateTeacherEvaluationRequest,
  CreateTopicDifficultyEventRequest,
  CreateTopicInterestEventRequest,
  TeacherImprovementArea,
  TeacherPerformance
} from '../models/analytics.models';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserDTO } from '../models/user.models';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private readonly adminBase = `${environment.apiUrl}/upiiz/admin/v1/analytics`;
  private readonly privateBase = `${environment.apiUrl}/upiiz/private/v1/analytics`;

  constructor(private http: HttpClient) {}

  getDashboard(): Observable<AdminAnalyticsDashboard> {
    return this.http
      .get<ApiResponse<AdminAnalyticsDashboard>>(`${this.adminBase}/dashboard`)
      .pipe(map(res => res.data));
  }

  getGeneralInterest(): Observable<AdminTopicInterest[]> {
    return this.http
      .get<ApiResponse<AdminTopicInterest[]>>(`${this.adminBase}/general/interest`)
      .pipe(map(res => res.data));
  }

  getGeneralDifficulty(): Observable<AdminTopicDifficulty[]> {
    return this.http
      .get<ApiResponse<AdminTopicDifficulty[]>>(`${this.adminBase}/general/difficulty`)
      .pipe(map(res => res.data));
  }

  getTeacherPerformance(): Observable<TeacherPerformance[]> {
    return this.http
      .get<ApiResponse<TeacherPerformance[]>>(`${this.adminBase}/teachers/performance`)
      .pipe(map(res => res.data));
  }

  getTeacherPerformanceById(teacherId: string): Observable<TeacherPerformance> {
    return this.http
      .get<ApiResponse<TeacherPerformance>>(`${this.adminBase}/teachers/${teacherId}/performance`)
      .pipe(map(res => res.data));
  }

  getTeacherImprovementAreas(): Observable<TeacherImprovementArea[]> {
    return this.http
      .get<ApiResponse<TeacherImprovementArea[]>>(`${this.adminBase}/teachers/improvement-areas`)
      .pipe(map(res => res.data));
  }

  getTeacherImprovementAreasByTeacher(teacherId: string): Observable<TeacherImprovementArea[]> {
    return this.http
      .get<ApiResponse<TeacherImprovementArea[]>>(
        `${this.adminBase}/teachers/${teacherId}/improvement-areas`
      )
      .pipe(map(res => res.data));
  }

  searchTeachers(query: string): Observable<UserDTO[]> {
    const params = new HttpParams().set('q', query);

    return this.http
      .get<UserDTO[] | ApiResponse<UserDTO[]>>(`${this.privateBase}/teachers/search`, { params })
      .pipe(
        map(response => this.normalizeTeacherSearchResponse(response)),
        catchError(err => {
          const canFallbackToAdminSearch = [401, 403, 404].includes(err?.status);

          if (!canFallbackToAdminSearch) {
            return throwError(() => err);
          }

          return this.http.get<UserDTO[]>(`${environment.apiUrl}/upiiz/admin/v1/admin/users`, { params });
        }),
        map(users => this.filterEvaluableTeachers(users))
      );
  }

  createTeacherEvaluation(payload: CreateTeacherEvaluationRequest): Observable<any> {
    return this.http
      .post<ApiResponse<any>>(`${this.privateBase}/teacher-evaluations`, payload)
      .pipe(map(res => res.data));
  }

  createTopicInterestEvent(payload: CreateTopicInterestEventRequest): Observable<any> {
    return this.http
      .post<ApiResponse<any>>(`${this.privateBase}/topic-interest-events`, payload)
      .pipe(map(res => res.data));
  }

  createTopicDifficultyEvent(payload: CreateTopicDifficultyEventRequest): Observable<any> {
    return this.http
      .post<ApiResponse<any>>(`${this.privateBase}/topic-difficulty-events`, payload)
      .pipe(map(res => res.data));
  }

  private normalizeTeacherSearchResponse(response: UserDTO[] | ApiResponse<UserDTO[]>): UserDTO[] {
    return Array.isArray(response) ? response : response?.data ?? [];
  }

  private filterEvaluableTeachers(users: UserDTO[] | null | undefined): UserDTO[] {
    return (users ?? []).filter(user => {
      const roles = (user?.roles ?? []).map(role => role.toUpperCase().replace(/^ROLE_/, ''));

      return user?.active !== false
        && roles.includes('PROFESOR')
        && !roles.includes('ALUMNO')
        && !roles.includes('ADMIN');
    });
  }
}
