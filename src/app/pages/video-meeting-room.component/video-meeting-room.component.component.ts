import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, firstValueFrom } from 'rxjs';
import {
  JoinVideoMeetingResponse,
  VideoMeeting,
  VideoMeetingApiService
} from '../../core/services/video-meeting-api.service';
import { JitsiLoaderService } from '../../core/services/jitsi-loader.service';
import { MeService } from '../../core/services/me.service';
import { AuthService } from '../../core/services/auth.service';
import { UserDTO } from '../../core/models/user.models';

@Component({
  selector: 'app-video-meeting-room',
  templateUrl: './video-meeting-room.component.component.html',
  styleUrls: ['./video-meeting-room.component.component.css']
})
export class VideoMeetingRoomComponent implements AfterViewInit, OnDestroy {
  @ViewChild('jitsiContainer') jitsiContainer?: ElementRef<HTMLDivElement>;

  loading = true;
  leaving = false;
  error = '';
  meetingId = '';
  meeting: VideoMeeting | null = null;
  currentUser: UserDTO | null = null;
  joinData: JoinVideoMeetingResponse | null = null;

  private jitsiApi: any;
  private viewReady = false;
  private leaveRegistered = false;
  private returnUrl = '/calendar';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private videoMeetingApi: VideoMeetingApiService,
    private jitsiLoader: JitsiLoaderService,
    private meService: MeService,
    private authService: AuthService
  ) {}

  ngAfterViewInit(): void {
    this.viewReady = true;
    void this.initializeRoom();
  }

  ngOnDestroy(): void {
    this.disposeJitsi();
    void this.registerLeave();
  }

  get isHost(): boolean {
    const currentUserId = this.authService.getCurrentUserId();
    return !!currentUserId && currentUserId === this.meeting?.hostUserId;
  }

  get displayName(): string {
    return this.currentUser?.fullName
      || this.joinData?.displayName
      || this.authService.getCurrentUserEmail()
      || 'Usuario UPIIZ';
  }

  get avatarUrl(): string | null {
    return this.currentUser?.avatarUrl || null;
  }

  async leaveRoom(): Promise<void> {
    if (this.leaving) return;

    this.leaving = true;
    this.disposeJitsi();
    await this.registerLeave();
    this.router.navigateByUrl(this.returnUrl);
  }

  goBack(): void {
    void this.leaveRoom();
  }

  private async initializeRoom(): Promise<void> {
    try {
      if (!this.viewReady) return;

      this.meetingId = this.route.snapshot.paramMap.get('id') ?? '';
      this.returnUrl = history.state?.returnUrl
        || this.route.snapshot.queryParamMap.get('returnUrl')
        || '/calendar';

      if (!this.meetingId) {
        throw new Error('No se recibió el id de la videoconferencia');
      }

      const initialData = await firstValueFrom(
        forkJoin({
          meeting: this.videoMeetingApi.getById(this.meetingId),
          profile: this.meService.getProfile()
        })
      );

      this.meeting = initialData.meeting;
      this.currentUser = initialData.profile.usuario ?? initialData.profile['data'] ?? null;

      if (this.meeting.status === 'CANCELLED' || this.meeting.status === 'ENDED') {
        throw new Error('Esta videoconferencia ya no está disponible.');
      }

      this.joinData = await firstValueFrom(
        this.videoMeetingApi.join(this.meetingId, this.displayName, navigator.userAgent)
      );

      await this.jitsiLoader.load(this.joinData.domain);
      this.mountJitsi(this.joinData);
      this.loading = false;
    } catch (err: any) {
      this.error = err?.error?.message || err?.message || 'No se pudo abrir la videoconferencia';
      this.loading = false;
    }
  }

  private mountJitsi(joinData: JoinVideoMeetingResponse): void {
    if (!this.jitsiContainer?.nativeElement || !window.JitsiMeetExternalAPI) {
      throw new Error('No se pudo preparar el contenedor de la videoconferencia');
    }

    this.disposeJitsi();

    this.jitsiApi = new window.JitsiMeetExternalAPI(joinData.domain, {
      roomName: joinData.roomName,
      parentNode: this.jitsiContainer.nativeElement,
      width: '100%',
      height: '100%',
      userInfo: {
        displayName: this.displayName,
        email: this.currentUser?.emailInst || this.authService.getCurrentUserEmail() || undefined,
        avatarURL: this.avatarUrl || undefined
      },
      configOverwrite: {
        prejoinPageEnabled: false,
        startWithAudioMuted: false,
        startWithVideoMuted: false
      },
      interfaceConfigOverwrite: {
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false
      }
    });

    this.jitsiApi.addListener('videoConferenceLeft', () => void this.leaveRoom());
    this.jitsiApi.addListener('readyToClose', () => void this.leaveRoom());

    if (this.isHost) {
      this.jitsiApi.addListener('participantRoleChanged', (event: { role?: string }) => {
        if (event?.role === 'moderator') {
          this.jitsiApi.executeCommand('subject', this.meeting?.appointmentId
            ? 'Videoconferencia de agenda'
            : 'Videoconferencia de foro');
        }
      });
    }
  }

  private disposeJitsi(): void {
    if (!this.jitsiApi) return;

    const api = this.jitsiApi;
    this.jitsiApi = null;
    api.dispose();
  }

  private async registerLeave(): Promise<void> {
    if (!this.meetingId || this.leaveRegistered) {
      return;
    }

    this.leaveRegistered = true;

    try {
      await firstValueFrom(this.videoMeetingApi.leave(this.meetingId));
    } catch (err) {
      console.error('No se pudo registrar la salida de la videoconferencia', err);
    }
  }
}
