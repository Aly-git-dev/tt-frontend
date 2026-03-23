import { Component, Inject, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';

import { Router } from '@angular/router';

import { AgendaApiService, Appointment, Modality } from '../../core/services/agenda-api.service';
import { VideoMeeting, VideoMeetingApiService } from '../../core/services/video-meeting-api.service';

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
export class AppointmentDialogComponent implements OnInit {
  private api = inject(AgendaApiService);
  private videoMeetingApi = inject(VideoMeetingApiService);
  private fb = inject(FormBuilder);
  private ref = inject(MatDialogRef<AppointmentDialogComponent>);
  private router = inject(Router);

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: { mode: Mode; dateISO?: string; appt?: Appointment }
  ) {}

  videoMeeting: VideoMeeting | null = null;
  vmLoading = false;
  vmActionLoading = false;
  vmError = '';

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

  ngOnInit(): void {
    if (this.data.mode === 'details' && this.data.appt?.modality === 'ONLINE') {
      this.loadVideoMeeting();
    }
  }

  private defaultStart() {
    if (this.data?.dateISO) return `${this.data.dateISO}T10:00:00`;
    return '';
  }

  private defaultEnd() {
    if (this.data?.dateISO) return `${this.data.dateISO}T11:00:00`;
    return '';
  }

  get canUseVideoMeeting(): boolean {
    return this.data.mode === 'details'
      && !!this.data.appt
      && this.data.appt.modality === 'ONLINE'
      && this.data.appt.status !== 'CANCELLED';
  }

  get canCreateVideoMeeting(): boolean {
    return this.canUseVideoMeeting && !this.videoMeeting && !this.vmLoading;
  }

  get canJoinVideoMeeting(): boolean {
    return !!this.videoMeeting && this.videoMeeting.status !== 'CANCELLED' && this.videoMeeting.status !== 'ENDED';
  }

  private loadVideoMeeting(): void {
    const appt = this.data.appt;
    if (!appt) return;

    this.vmLoading = true;
    this.vmError = '';

    this.videoMeetingApi.getByAppointment(appt.id).subscribe({
      next: (meeting) => {
        this.videoMeeting = meeting;
        this.vmLoading = false;
      },
      error: () => {
        this.videoMeeting = null;
        this.vmLoading = false;
      }
    });
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

  createVideoMeeting() {
    const appt = this.data.appt;
    if (!appt) return;

    this.vmActionLoading = true;
    this.vmError = '';

    const currentUserId = localStorage.getItem('user_id') || '';

    if (!currentUserId) {
      this.vmActionLoading = false;
      this.vmError = 'No se encontró el usuario actual para crear la videollamada.';
      return;
    }

    this.videoMeetingApi.create({
      appointmentId: appt.id,
      hostUserId: currentUserId
    }).subscribe({
      next: (meeting) => {
        this.videoMeeting = meeting;
        this.vmActionLoading = false;
      },
      error: (err) => {
        this.vmActionLoading = false;
        this.vmError = err?.error?.message || 'No se pudo crear la videollamada.';
      }
    });
  }

  openVideoMeeting() {
    if (!this.videoMeeting) return;

    this.ref.close(false);
    this.router.navigate(['/video-meetings', this.videoMeeting.id]);
  }

  cancelVideoMeeting() {
    if (!this.videoMeeting) return;

    this.vmActionLoading = true;
    this.vmError = '';

    this.videoMeetingApi.cancel(this.videoMeeting.id, 'Cancelada desde detalles de la cita').subscribe({
      next: (meeting) => {
        this.videoMeeting = meeting;
        this.vmActionLoading = false;
      },
      error: (err) => {
        this.vmActionLoading = false;
        this.vmError = err?.error?.message || 'No se pudo cancelar la videollamada.';
      }
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