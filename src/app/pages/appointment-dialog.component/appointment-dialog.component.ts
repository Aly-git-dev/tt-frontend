import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';

import { AgendaApiService, Appointment, Modality } from '../../core/services/agenda-api.service';

type Mode = 'create' | 'details';

@Component({
  standalone: true,
  selector: 'app-appointment-dialog',
  imports: [
    CommonModule,
    MatDialogModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
  ],
  templateUrl: './appointment-dialog.component.html',
  styleUrls: ['./appointment-dialog.component.css'],
})
export class AppointmentDialogComponent {
  private api = inject(AgendaApiService);
  private fb = inject(FormBuilder);
  private ref = inject(MatDialogRef<AppointmentDialogComponent>);

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: { mode: Mode; dateISO?: string; appt?: Appointment }
  ) {}

  form = this.fb.group({
    title: this.fb.nonNullable.control('', {
      validators: [Validators.required, Validators.maxLength(120)],
    }),
    description: this.fb.nonNullable.control(''),
    modality: this.fb.nonNullable.control<Modality>('ONLINE', {
      validators: [Validators.required],
    }),
    startsAt: this.fb.nonNullable.control(this.defaultStart(), {
      validators: [Validators.required],
    }),
    endsAt: this.fb.nonNullable.control(this.defaultEnd(), {
      validators: [Validators.required],
    }),
  });

  private defaultStart() {
    if (this.data?.dateISO) return `${this.data.dateISO}T10:00:00`;
    return '';
  }

  private defaultEnd() {
    if (this.data?.dateISO) return `${this.data.dateISO}T11:00:00`;
    return '';
  }

  create() {
    const v = this.form.getRawValue();

    this.api.create({
      title: v.title,
      description: v.description,
      modality: v.modality,
      startsAt: v.startsAt,
      endsAt: v.endsAt,
      inviteeUserIds: [],
    }).subscribe({
      next: () => this.close(true),
      error: () => this.close(false),
    });
  }

  cancel() {
    const appt = this.data.appt;
    if (!appt) return;

    this.api.cancel(appt.id, 'Cancelado desde calendario').subscribe({
      next: () => this.close(true),
      error: () => this.close(false),
    });
  }

  close(changed: boolean) {
    this.ref.close(changed);
  }
}
