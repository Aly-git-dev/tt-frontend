import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type Modality = 'ONLINE' | 'PRESENCIAL';
export type AppointmentStatus = 'SCHEDULED' | 'CANCELLED' | 'COMPLETED';

export interface Appointment {
  id: string;
  title: string;
  description?: string;
  modality: Modality;
  startsAt: string; // ISO
  endsAt: string;   // ISO
  status: AppointmentStatus;
}

export interface CreateAppointmentDTO {
  title: string;
  description?: string;
  modality: Modality;
  startsAt: string;
  endsAt: string;
  inviteeUserIds?: string[];
}

export interface RescheduleDTO {
  startsAt: string;
  endsAt: string;
}

@Injectable({ providedIn: 'root' })
export class AgendaApiService {
  private baseUrl = `${environment.apiUrl}/upiiz/public/v1/agenda`;

  constructor(private http: HttpClient) {}

  getAgenda(fromISO: string, toISO: string): Observable<Appointment[]> {
    const params = new HttpParams().set('from', fromISO).set('to', toISO);
    return this.http.get<Appointment[]>(this.baseUrl, { params });
  }

  create(dto: CreateAppointmentDTO): Observable<Appointment> {
    return this.http.post<Appointment>(`${this.baseUrl}/appointments`, dto);
  }

  reschedule(id: string, dto: RescheduleDTO): Observable<Appointment> {
    return this.http.put<Appointment>(`${this.baseUrl}/appointments/${id}`, dto);
  }

  cancel(id: string, reason?: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/appointments/${id}/cancel`, { reason });
  }
}
