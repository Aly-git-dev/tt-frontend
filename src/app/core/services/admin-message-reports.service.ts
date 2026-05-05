import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface ReportSummary {
  id: number;
  status: string;
  reasonCode: string;
  createdAt: string;
  conversationId: number;
  reportedMessageId: number;
}

export interface ReportContextItem {
  index: number;
  messageId: number;
  senderIdSnapshot: string;
  senderRoleSnapshot: string;
  contentTypeSnapshot: string;
  contentSnapshot: string;
  createdAtSnapshot: string;
}

export interface ReportDetail extends ReportSummary {
  reporterId: string;
  handledBy?: string;
  handledAt?: string;
  context: ReportContextItem[];
}

@Injectable({
  providedIn: 'root'
})
export class AdminMessageReportsService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/upiiz/admin/v1/admin`;

  listReports(status = 'PENDIENTE') {
    return this.http.get<ReportSummary[]>(`${this.baseUrl}/reports`, {
      params: { status }
    });
  }

  getReport(id: number) {
    return this.http.get<ReportDetail>(`${this.baseUrl}/reports/${id}`);
  }

  resolveReport(id: number) {
    return this.http.post<ReportSummary>(`${this.baseUrl}/reports/${id}/resolve`, {});
  }

  dismissReport(id: number) {
    return this.http.post<ReportSummary>(`${this.baseUrl}/reports/${id}/dismiss`, {});
  }
}