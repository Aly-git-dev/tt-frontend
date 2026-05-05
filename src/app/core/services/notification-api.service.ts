import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, timer, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  NotificationPage,
  NotificationResponse
} from '../models/notification.models';

@Injectable({
  providedIn: 'root'
})
export class NotificationApiService {

  private readonly baseUrl = `${environment.apiUrl}/upiiz/public/v1/notifications`;

  constructor(private http: HttpClient) {}

  listMine(unreadOnly = false, page = 0, size = 10): Observable<NotificationPage> {
    const params = new HttpParams()
      .set('unreadOnly', unreadOnly)
      .set('page', page)
      .set('size', size)
      .set('sort', 'createdAt,desc');

    return this.http.get<NotificationPage>(this.baseUrl, { params });
  }

  unreadCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.baseUrl}/unread-count`);
  }

  markAsRead(id: string): Observable<NotificationResponse> {
    return this.http.patch<NotificationResponse>(`${this.baseUrl}/${id}/read`, {});
  }

  markAllAsRead(): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.baseUrl}/read-all`, {});
  }

  pollUnreadCount(intervalMs = 30000): Observable<{ count: number }> {
    return timer(0, intervalMs).pipe(
      switchMap(() => this.unreadCount())
    );
  }
}