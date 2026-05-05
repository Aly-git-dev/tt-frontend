import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AdminMessageReportsService,
  ReportDetail,
  ReportSummary
} from '../../core/services/admin-message-reports.service';

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

  constructor(private reportsApi: AdminMessageReportsService) {}

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

    this.reportsApi.getReport(report.id).subscribe({
      next: detail => {
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
}