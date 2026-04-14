import { Component, Inject, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';

import { Router } from '@angular/router';

import { AgendaApiService, Appointment, Modality } from '../../core/services/agenda-api.service';
import { VideoMeeting, VideoMeetingApiService } from '../../core/services/video-meeting-api.service';
import { ChatApiService } from '../../core/services/chat-api.service';
import { UserSearchResult } from '../../core/models/chat.models';

type Mode = 'create' | 'details';

@Component({
  standalone: true,
  selector: 'app-appointment-dialog',
  imports: [
    CommonModule,
    FormsModule,
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
  private chatApi = inject(ChatApiService);
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

  userQuery = '';
  userResults: UserSearchResult[] = [];
  selectedUser: UserSearchResult | null = null;
  searchingUsers = false;
  userSearchError = '';

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

  private defaultStart(): string {
    if (this.data?.dateISO) return `${this.data.dateISO}T10:00`;
    return '';
  }

  private defaultEnd(): string {
    if (this.data?.dateISO) return `${this.data.dateISO}T11:00`;
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
    return !!this.videoMeeting
      && this.videoMeeting.status !== 'CANCELLED'
      && this.videoMeeting.status !== 'ENDED';
  }

  searchUsers(): void {
    const q = this.userQuery.trim();

    this.userSearchError = '';

    if (q.length < 2) {
      this.userResults = [];
      return;
    }

    this.searchingUsers = true;

    this.chatApi.searchUsers(q).subscribe({
      next: (results) => {
        this.userResults = results ?? [];
        this.searchingUsers = false;

        if (!this.userResults.length) {
          this.userSearchError = 'No se encontraron usuarios.';
        }
      },
      error: () => {
        this.userResults = [];
        this.userSearchError = 'No se pudieron buscar usuarios.';
        this.searchingUsers = false;
      }
    });
  }

  selectUser(user: UserSearchResult): void {
    this.selectedUser = user;
    this.userQuery = user.name?.trim() ? `${user.name} (${user.email})` : user.email;
    this.userResults = [];
    this.userSearchError = '';
  }

  clearSelectedUser(): void {
    this.selectedUser = null;
    this.userQuery = '';
    this.userResults = [];
    this.userSearchError = '';
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

  create(): void {
    const v = this.form.getRawValue();

    if (!this.selectedUser?.id) {
      this.userSearchError = 'Debes seleccionar un invitado.';
      return;
    }

    this.api.create({
      title: v.title,
      description: v.description,
      modality: v.modality,
      startsAt: v.startsAt,
      endsAt: v.endsAt,
      inviteeUserIds: [this.selectedUser.id],
    }).subscribe({
      next: () => this.close(true),
      error: () => this.close(false),
    });
  }

  private getCurrentUserId(): string {
    const possibleKeys = [
      'userId',
      'user_id',
      'auth_user_id',
      'currentUserId',
      'uuid',
    ];

    for (const key of possibleKeys) {
      const value = localStorage.getItem(key);
      if (value && value.trim()) return value.trim();
    }

    try {
      const rawUser = localStorage.getItem('user');
      if (rawUser) {
        const parsed = JSON.parse(rawUser);
        const candidate = parsed?.id ?? parsed?.userId ?? parsed?.uuid;
        if (candidate && String(candidate).trim()) {
          return String(candidate).trim();
        }
      }
    } catch {
      // ignore JSON parse error
    }

    return '';
  }

  createVideoMeeting() {
  const appt = this.data.appt;
  if (!appt) return;

  this.vmActionLoading = true;
  this.vmError = '';

  this.videoMeetingApi.create({
      appointmentId: appt.id
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

  openVideoMeeting(): void {
    if (!this.videoMeeting) return;

    this.ref.close(false);
    this.router.navigate(['/video-meetings', this.videoMeeting.id]);
  }

  cancelVideoMeeting(): void {
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

  cancel(): void {
    const appt = this.data.appt;
    if (!appt) return;

    this.api.cancel(appt.id, 'Cancelado desde calendario').subscribe({
      next: () => this.close(true),
      error: () => this.close(false),
    });
  }

  close(changed: boolean): void {
    this.ref.close(changed);
  }
}