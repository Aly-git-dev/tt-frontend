import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { VideoMeetingApiService } from '../../core/services/video-meeting-api.service';

@Component({
  selector: 'app-video-meeting-room',
  templateUrl: './video-meeting-room.component.component.html',
  styleUrls: ['./video-meeting-room.component.component.css']
})
export class VideoMeetingRoomComponent implements OnInit {
  loading = true;
  error = '';
  meetingId = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private videoMeetingApi: VideoMeetingApiService
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      this.meetingId = this.route.snapshot.paramMap.get('id') ?? '';

      if (!this.meetingId) {
        throw new Error('No se recibió el id de la videoconferencia');
      }

      const displayName = this.getDisplayName();
      const deviceInfo = navigator.userAgent;

      const joinData = await firstValueFrom(
        this.videoMeetingApi.join(this.meetingId, displayName, deviceInfo)
      );

      if (!joinData?.meetingUrl) {
        throw new Error('No se recibió la URL de la videoconferencia');
      }

      window.open(joinData.meetingUrl, '_blank', 'noopener');
      this.router.navigate(['/calendar']);
    } catch (err: any) {
      this.error = err?.error?.message || err?.message || 'No se pudo abrir la videoconferencia';
      this.loading = false;
    }
  }

  goBack(): void {
    this.router.navigate(['/calendar']);
  }

  private getDisplayName(): string {
    return localStorage.getItem('full_name') || 'Usuario UPIIZ';
  }
}