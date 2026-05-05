import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-report-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './report-modal.component.html',
  styleUrl: './report-modal.component.scss'
})
export class ReportModalComponent {
  @Output() close = new EventEmitter<void>();
  @Output() submit = new EventEmitter<{ reasonCode: string; description?: string | null }>();

  reasonCode = '';
  description = '';

  submitReport(): void {
    if (!this.reasonCode.trim()) return;

    this.submit.emit({
      reasonCode: this.reasonCode.trim(),
      description: this.description.trim() || null
    });
  }
}