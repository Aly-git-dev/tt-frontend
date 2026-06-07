import { Injectable } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

interface PushNotificationPayload {
  title?: string;
  body?: string;
  details?: string;
  detail?: string;
  type?: string;
  targetType?: string;
  targetId?: string;
  notification?: {
    title?: string;
    body?: string;
    icon?: string;
    badge?: string;
    data?: Record<string, unknown>;
  };
  data?: Record<string, unknown>;
}

@Injectable({
  providedIn: 'root'
})
export class PushService {
  private readonly baseUrl = `${environment.apiUrl}/upiiz/public/v1/push`;
  private readonly notificationIcon = '/assets/logo.png';
  private listeningToMessages = false;

  constructor(
    private swPush: SwPush,
    private http: HttpClient
  ) {}

  async subscribeToPush(): Promise<void> {
    try {
      if (!this.swPush.isEnabled) {
        console.warn('Service Worker / Push no esta habilitado.');
        return;
      }

      this.listenToPushMessages();

      const existingSub = await firstValueFrom(this.swPush.subscription);

      if (existingSub) {
        console.log('Ya existe una suscripcion push.');
        return;
      }

      const response = await firstValueFrom(
        this.http.get<{ publicKey: string }>(`${this.baseUrl}/public-key`)
      );

      const subscription = await this.swPush.requestSubscription({
        serverPublicKey: response.publicKey
      });

      await firstValueFrom(
        this.http.post(`${this.baseUrl}/subscribe`, subscription)
      );

      console.log('Suscripcion push guardada:', subscription);
    } catch (err) {
      console.error('Error en push:', err);
    }
  }

  private listenToPushMessages(): void {
    if (this.listeningToMessages || typeof window === 'undefined') {
      return;
    }

    this.listeningToMessages = true;

    this.swPush.messages.subscribe({
      next: payload => this.showBrowserNotification(payload as PushNotificationPayload),
      error: err => console.error('Error recibiendo notificacion push:', err)
    });
  }

  private async showBrowserNotification(payload: PushNotificationPayload): Promise<void> {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
      return;
    }

    const registration = await navigator.serviceWorker?.ready;

    if (!registration) {
      return;
    }

    const notification = this.buildBrowserNotification(payload);
    await registration.showNotification(notification.title, notification.options);
  }

  private buildBrowserNotification(payload: PushNotificationPayload): {
    title: string;
    options: NotificationOptions;
  } {
    const data = payload.notification?.data ?? payload.data ?? {};
    const title = payload.notification?.title || payload.title || 'CoLaB';
    const body = payload.notification?.body || payload.body || this.asString(data['body']);
    const details = payload.details
      || payload.detail
      || this.asString(data['details'])
      || this.asString(data['detail'])
      || this.buildTargetDetails(payload, data);

    return {
      title,
      options: {
        body: [body, details].filter(Boolean).join('\n'),
        icon: payload.notification?.icon || this.notificationIcon,
        badge: payload.notification?.badge || this.notificationIcon,
        data
      }
    };
  }

  private buildTargetDetails(
    payload: PushNotificationPayload,
    data: Record<string, unknown>
  ): string {
    const type = payload.type || this.asString(data['type']);
    const targetType = payload.targetType || this.asString(data['targetType']);
    const targetId = payload.targetId || this.asString(data['targetId']);
    const target = targetType && targetId ? `${targetType}: ${targetId}` : targetType || targetId;

    return [type, target].filter(Boolean).join(' - ');
  }

  private asString(value: unknown): string {
    return typeof value === 'string' ? value : '';
  }
}
