import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { NotificationApiService } from '../../../../core/services/notification-api.service';
import { NotificationResponse } from '../../../../core/models/notification.models';

@Component({
  selector: 'app-notification-bell',
  templateUrl: './notification-bell.component.html',
  styleUrls: ['./notification-bell.component.css']
})
export class NotificationBellComponent implements OnInit, OnDestroy {

  readonly colabLogo = 'assets/logo.svg';

  notifications: NotificationResponse[] = [];
  unreadCount = 0;
  loading = false;
  opened = false;

  private destroy$ = new Subject<void>();

  constructor(private notificationApi: NotificationApiService) {}

  ngOnInit(): void {
    this.loadNotifications();

    this.notificationApi.pollUnreadCount(30000)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => this.unreadCount = res.count,
        error: err => console.error('Error al consultar contador de notificaciones', err)
      });
  }

  togglePanel(): void {
    this.opened = !this.opened;

    if (this.opened) {
      this.loadNotifications();
    }
  }

  loadNotifications(): void {
    this.loading = true;

    this.notificationApi.listMine(false, 0, 8)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: page => {
          this.notifications = page.content;
          this.loading = false;
        },
        error: err => {
          console.error('Error al cargar notificaciones', err);
          this.loading = false;
        }
      });
  }

  markAsRead(notification: NotificationResponse): void {
    if (notification.read) return;

    this.notificationApi.markAsRead(notification.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: updated => {
          notification.read = true;
          notification.readAt = updated.readAt;
          this.unreadCount = Math.max(0, this.unreadCount - 1);
        },
        error: err => console.error('Error al marcar notificación como leída', err)
      });
  }

  markAllAsRead(): void {
    this.notificationApi.markAllAsRead()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notifications = this.notifications.map(n => ({
            ...n,
            read: true,
            readAt: new Date().toISOString()
          }));
          this.unreadCount = 0;
        },
        error: err => console.error('Error al marcar todas como leídas', err)
      });
  }

  getNotificationBody(notification: NotificationResponse): string {
    return notification.body || 'Tienes una nueva notificación.';
  }

  getNotificationDetails(notification: NotificationResponse): string {
    const parts = [
      notification.details || notification.detail || '',
      this.getTypeLabel(notification.type),
      this.getTargetLabel(notification)
    ].filter(Boolean);

    return parts.join(' · ');
  }

  private getTypeLabel(type: string): string {
    switch (type) {
      case 'INVITE':
        return 'Invitación';
      case 'RESCHEDULED':
        return 'Reprogramada';
      case 'CANCELLED':
        return 'Cancelada';
      case 'REMINDER':
        return 'Recordatorio';
      default:
        return type || 'Notificación';
    }
  }

  private getTargetLabel(notification: NotificationResponse): string {
    if (!notification.targetType && !notification.targetId) {
      return '';
    }

    if (!notification.targetId) {
      return notification.targetType;
    }

    return `${notification.targetType}: ${notification.targetId}`;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
