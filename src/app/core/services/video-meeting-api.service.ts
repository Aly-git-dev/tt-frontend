import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface JoinVideoMeetingResponse {
  meetingId: string;
  provider: string;
  domain: string;
  roomName: string;
  meetingUrl: string;
  displayName: string;
}

export interface VideoMeeting {
  id: string;
  appointmentId: string;
  provider: string;
  roomName: string;
  meetingUrl: string;
  hostUserId: string;
  status: 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED';
  createdBy: string;
  cancelledBy?: string;
  cancelReason?: string;
  startedAt?: string;
  endedAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class VideoMeetingApiService {
  private readonly baseUrl = `${environment.apiUrl}/api/video-meetings`;

  constructor(private http: HttpClient) {}

  create(data: { appointmentId: string; hostUserId: string }): Observable<VideoMeeting> {
    return this.http.post<VideoMeeting>(this.baseUrl, data);
  }

  getById(id: string): Observable<VideoMeeting> {
    return this.http.get<VideoMeeting>(`${this.baseUrl}/${id}`);
  }

  getByAppointment(appointmentId: string): Observable<VideoMeeting> {
    return this.http.get<VideoMeeting>(`${this.baseUrl}/by-appointment/${appointmentId}`);
  }

  join(id: string, displayName: string, deviceInfo?: string): Observable<JoinVideoMeetingResponse> {
    let params = new HttpParams().set('displayName', displayName);

    if (deviceInfo) {
      params = params.set('deviceInfo', deviceInfo);
    }

    return this.http.post<JoinVideoMeetingResponse>(`${this.baseUrl}/${id}/join`, {}, { params });
  }

  leave(id: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${id}/leave`, {});
  }

  cancel(id: string, reason: string): Observable<VideoMeeting> {
    return this.http.patch<VideoMeeting>(`${this.baseUrl}/${id}/cancel`, { reason });
  }
}