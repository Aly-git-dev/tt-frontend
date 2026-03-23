import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { JitsiLoaderService } from '../../core/services/jitsi-loader.service';
import {
  JoinVideoMeetingResponse,
  VideoMeetingApiService
} from '../../core/services/video-meeting-api.service.js';

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

@Component({
  selector: 'app-video-meeting-room',
  templateUrl: './video-meeting-room.component.component.html'
})
export class VideoMeetingRoomComponent implements AfterViewInit, OnDestroy {
  @ViewChild('jitsiContainer', { static: true }) jitsiContainer!: ElementRef<HTMLDivElement>;

  api: any;
  loading = true;
  error = '';
  meetingId = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private videoMeetingApi: VideoMeetingApiService,
    private jitsiLoader: JitsiLoaderService
  ) {}

  async ngAfterViewInit(): Promise<void> {
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

      await this.jitsiLoader.load(joinData.domain);
      this.createJitsiApi(joinData);
      this.loading = false;
    } catch (err: any) {
      this.error = err?.message || 'No se pudo abrir la videoconferencia';
      this.loading = false;
    }
  }

  ngOnDestroy(): void {
    this.safeLeaveMeeting();
    if (this.api) {
      this.api.dispose();
    }
  }

  private createJitsiApi(joinData: JoinVideoMeetingResponse): void {
    const options = {
      roomName: joinData.roomName,
      parentNode: this.jitsiContainer.nativeElement,
      width: '100%',
      height: 700,
      userInfo: {
        displayName: joinData.displayName
      },
      configOverwrite: {
        prejoinPageEnabled: false,
        startWithAudioMuted: true,
        startWithVideoMuted: false
      },
      interfaceConfigOverwrite: {
        TILE_VIEW_MAX_COLUMNS: 3
      }
    };

    this.api = new window.JitsiMeetExternalAPI(joinData.domain, options);

    this.api.addListener('videoConferenceJoined', () => {
      console.log('Usuario unido a la videoconferencia');
    });

    this.api.addListener('readyToClose', async () => {
      await this.safeLeaveMeeting();
      await this.router.navigate(['/agenda']);
    });

    this.api.addListener('videoConferenceLeft', async () => {
      await this.safeLeaveMeeting();
    });
  }

  private async safeLeaveMeeting(): Promise<void> {
    if (!this.meetingId) return;

    try {
      await firstValueFrom(this.videoMeetingApi.leave(this.meetingId));
    } catch (e) {
      console.warn('No se pudo registrar salida de la videoconferencia', e);
    }
  }

  private getDisplayName(): string {
    return localStorage.getItem('full_name') || 'Usuario UPIIZ';
  }
}