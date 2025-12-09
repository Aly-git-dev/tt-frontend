import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import {
  AdminReportDto,
  ReportAdminActionDto
} from '../../core/models/forum.models';
import { ForumService } from '../../core/services/forum.service';

@Component({
  selector: 'app-admin-report-list',
  templateUrl: './admin-report-list.component.html',
  styleUrls: ['./admin-report-list.component.css']
})
export class AdminReportListComponent implements OnInit {

  reports: AdminReportDto[] = [];
  loading = false;
  error: string | null = null;

  // Modal "bonito"
  showResolveModal = false;
  selectedReport: AdminReportDto | null = null;
  resolveForm!: FormGroup;
  submitting = false;
  globalMessage: string | null = null;

  constructor(
    private forumService: ForumService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.buildResolveForm();
    this.loadReports();
  }

  private buildResolveForm(): void {
    this.resolveForm = this.fb.group({
      deleteContent: [true],  // por default: sí eliminar/ocultar contenido
      banUser: [false],
      adminNote: ['']
    });
  }

  loadReports(): void {
    this.loading = true;
    this.error = null;

    this.forumService.getAdminReports().subscribe({
      next: (data) => {
        this.reports = data;
        this.loading = false;
      },
      error: () => {
        this.error = 'No se pudieron cargar los reportes.';
        this.loading = false;
      }
    });
  }

  // Abrir modal de resolución
  openResolveModal(report: AdminReportDto): void {
    this.selectedReport = report;
    this.showResolveModal = true;
    this.globalMessage = null;

    // valores por defecto cada vez que abras
    this.resolveForm.setValue({
      deleteContent: true,
      banUser: false,
      adminNote: ''
    });
  }

  // Cerrar modal
  closeResolveModal(): void {
    this.showResolveModal = false;
    this.selectedReport = null;
    this.resolveForm.reset({
      deleteContent: true,
      banUser: false,
      adminNote: ''
    });
  }

  // Enviar acción del admin
  submitResolve(): void {
    if (!this.selectedReport) {
      return;
    }

    const formValue = this.resolveForm.value as ReportAdminActionDto;

    // Si no marcó ninguna acción, no tiene sentido enviar
    if (!formValue.deleteContent && !formValue.banUser) {
      this.globalMessage = 'Marca al menos una acción (eliminar contenido o banear usuario).';
      return;
    }

    // Aquí el modal mismo actúa como confirmación explícita del admin:
    // marcó checkboxes y dio clic en "Aplicar acciones".
    this.submitting = true;
    this.globalMessage = null;

    this.forumService.resolveReport(this.selectedReport.id, formValue).subscribe({
      next: () => {
        // Quitamos el reporte de la lista
        this.reports = this.reports.filter(r => r.id !== this.selectedReport!.id);
        this.submitting = false;
        this.closeResolveModal();
      },
      error: () => {
        this.submitting = false;
        this.globalMessage = 'No se pudo resolver el reporte. Intenta de nuevo.';
      }
    });
  }
}
