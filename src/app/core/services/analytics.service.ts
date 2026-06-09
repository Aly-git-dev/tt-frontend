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

interface TeacherSearchDto {
  id: string;
  email: string;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private readonly adminBase = `${environment.apiUrl}/upiiz/admin/v1/analytics`;
  private readonly privateBase = `${environment.apiUrl}/upiiz/private/v1/analytics`;
  private readonly privateApiBase = `${environment.apiUrl}/upiiz/private/v1`;

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
      .get<TeacherSearchDto[] | ApiResponse<TeacherSearchDto[]>>(
        `${this.privateApiBase}/teacher-evaluations/teachers/search`,
        { params }
      )
      .pipe(
        map(response => this.mapTeacherSearchResults(this.normalizeTeacherDedicatedSearchResponse(response))),
        catchError(err => {
          const canFallbackToLegacySearch = [401, 403, 404].includes(err?.status);

          if (!canFallbackToLegacySearch) {
            return throwError(() => err);
          }

          return this.http
            .get<UserDTO[] | ApiResponse<UserDTO[]>>(`${this.privateBase}/teachers/search`, { params })
            .pipe(
              map(response => this.normalizeTeacherSearchResponse(response)),
              catchError(fallbackErr => {
                const canFallbackToLegacyAlias = [401, 403, 404].includes(fallbackErr?.status);

                if (!canFallbackToLegacyAlias) {
                  return throwError(() => fallbackErr);
                }

                return this.http
                  .get<UserDTO[] | ApiResponse<UserDTO[]>>(`${this.privateBase}/teacher-evaluations/teachers/search`, { params })
                  .pipe(
                    map(response => this.normalizeTeacherSearchResponse(response)),
                    catchError(aliasErr => {
                      const canFallbackToAdminSearch = [401, 403, 404].includes(aliasErr?.status);

                      if (!canFallbackToAdminSearch) {
                        return throwError(() => aliasErr);
                      }

                      return this.http.get<UserDTO[]>(`${environment.apiUrl}/upiiz/admin/v1/admin/users`, { params });
                    })
                  );
              })
            );
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

  private normalizeTeacherDedicatedSearchResponse(response: TeacherSearchDto[] | ApiResponse<TeacherSearchDto[]>): TeacherSearchDto[] {
    return Array.isArray(response) ? response : response?.data ?? [];
  }

  private mapTeacherSearchResults(teachers: TeacherSearchDto[]): UserDTO[] {
    return (teachers ?? []).map(teacher => ({
      id: teacher.id,
      emailInst: teacher.email,
      fullName: teacher.name,
      active: true,
      bio: null,
      interests: [],
      links: [],
      avatarUrl: null,
      coverUrl: null,
      roles: ['PROFESOR'],
      approved: true,
      emailVerified: true
    }));
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
