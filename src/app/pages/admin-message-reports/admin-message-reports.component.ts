import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { catchError, forkJoin, of } from 'rxjs';
import {
  AdminMessageReportsService,
  ReportDetail,
  ReportContextItem,
  ReportSummary
} from '../../core/services/admin-message-reports.service';
import { AdminUsersService } from '../../core/services/admin-users.service';
import { UserDTO } from '../../core/models/user.models';

@Component({
  selector: 'app-admin-message-reports',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-message-reports.component.html',
  styleUrl: './admin-message-reports.component.css'
})
export class AdminMessageReportsComponent implements OnInit {
  reports: ReportSummary[] = [];
  selected: ReportDetail | null = null;

  loading = false;
  detailLoading = false;
  actionLoading = false;

  status = 'PENDIENTE';
  error = '';
  private userDirectory = new Map<string, UserDTO>();
  private usersLoaded = false;

  constructor(
    private reportsApi: AdminMessageReportsService,
    private adminUsersService: AdminUsersService
  ) {}

  ngOnInit(): void {
    this.loadReports();
  }

  loadReports(): void {
    this.loading = true;
    this.error = '';

    this.reportsApi.listReports(this.status).subscribe({
      next: reports => {
        this.reports = reports;
        this.selected = null;
      },
      error: err => {
        console.error(err);
        this.error = 'No se pudieron cargar los reportes.';
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  changeStatus(status: string): void {
    this.status = status;
    this.loadReports();
  }

  openReport(report: ReportSummary): void {
    this.detailLoading = true;
    this.error = '';

    forkJoin({
      detail: this.reportsApi.getReport(report.id),
      users: this.ensureUsersLoaded()
    }).subscribe({
      next: ({ detail, users }) => {
        this.cacheUsers(users);
        this.selected = detail;
      },
      error: err => {
        console.error(err);
        this.error = 'No se pudo cargar el detalle del reporte.';
      },
      complete: () => {
        this.detailLoading = false;
      }
    });
  }

  resolveSelected(): void {
    if (!this.selected) return;

    this.actionLoading = true;

    this.reportsApi.resolveReport(this.selected.id).subscribe({
      next: () => {
        alert('Reporte marcado como resuelto.');
        this.loadReports();
      },
      error: err => {
        console.error(err);
        alert('No se pudo resolver el reporte.');
      },
      complete: () => {
        this.actionLoading = false;
      }
    });
  }

  dismissSelected(): void {
    if (!this.selected) return;

    this.actionLoading = true;

    this.reportsApi.dismissReport(this.selected.id).subscribe({
      next: () => {
        alert('Reporte desestimado.');
        this.loadReports();
      },
      error: err => {
        console.error(err);
        alert('No se pudo desestimar el reporte.');
      },
      complete: () => {
        this.actionLoading = false;
      }
    });
  }

  formatDate(value?: string): string {
    if (!value) return '';
    return new Date(value).toLocaleString();
  }

  statusClass(status: string): string {
    return status.toLowerCase();
  }

  reporterLabel(report: ReportDetail): string {
    return this.userLabel(report.reporterId, report.reporterName, report.reporterEmail);
  }

  senderLabel(item: ReportContextItem): string {
    return this.userLabel(item.senderIdSnapshot, item.senderNameSnapshot, item.senderEmailSnapshot);
  }

  private ensureUsersLoaded() {
    if (this.usersLoaded) {
      return of([]);
    }

    return this.adminUsersService.getAllUsers('').pipe(
      catchError(err => {
        console.error('No se pudo cargar el directorio de usuarios para reportes', err);
        return of([]);
      })
    );
  }

  private userLabel(userId?: string, name?: string, email?: string): string {
    const user = userId ? this.userDirectory.get(userId) : null;
    const resolvedName = name || user?.fullName || '';
    const resolvedEmail = email || user?.emailInst || '';

    if (resolvedName && resolvedEmail) {
      return `${resolvedName} · ${resolvedEmail}`;
    }

    return resolvedName || resolvedEmail || 'Usuario no disponible';
  }

  private cacheUsers(users: UserDTO[]): void {
    users.forEach(user => this.userDirectory.set(user.id, user));
    this.usersLoaded = true;
  }
}
