import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Conversation, Message, SendMessagePayload } from '../../core/models/chat.models';
import { MessageBubbleComponent } from '../message-bubble/message-bubble.component';
import { MessageComposerComponent } from '../message-composer/message-composer.component';

type MessageDayItem = {
  type: 'day';
  key: string;
  label: string;
};

type MessageBubbleItem = {
  type: 'message';
  key: string | number;
  message: Message;
};

type MessageListItem = MessageDayItem | MessageBubbleItem;

@Component({
  selector: 'app-chat-thread',
  standalone: true,
  imports: [CommonModule, MessageBubbleComponent, MessageComposerComponent],
  templateUrl: './chat-thread.component.html',
  styleUrl: './chat-thread.component.css'
})
export class ChatThreadComponent {
  @Input() conversation: Conversation | null = null;
  @Input() messages: Message[] = [];
  @Input() loading = false;

  @Output() send = new EventEmitter<SendMessagePayload>();
  @Output() backMobile = new EventEmitter<void>();

  @Output() reportMessage = new EventEmitter<Message>();

  get displayName(): string {
    return this.conversation?.otherName?.trim()
      || this.conversation?.otherUserId?.trim()
      || 'Usuario';
  }

  get subtitle(): string {
    if (this.loading) return 'Cargando conversación...';
    if (!this.messages.length) return 'Aún no hay mensajes';
    return 'Conversación activa';
  }

  get avatarText(): string {
    const source = this.displayName.trim();
    return source.charAt(0).toUpperCase();
  }

  get messageItems(): MessageListItem[] {
    const items: MessageListItem[] = [];
    let lastDayKey = '';

    for (const message of this.messages) {
      const dayKey = this.getDayKey(message.createdAt);

      if (dayKey && dayKey !== lastDayKey) {
        items.push({
          type: 'day',
          key: `day-${dayKey}`,
          label: this.formatDayLabel(message.createdAt)
        });
        lastDayKey = dayKey;
      }

      items.push({
        type: 'message',
        key: message.id ?? `${message.senderId}-${message.createdAt}`,
        message
      });
    }

    return items;
  }

  trackByMessage(index: number, message: Message): string | number {
    return (message as any).id ?? index;
  }

  trackByMessageItem(index: number, item: MessageListItem): string | number {
    return item.key ?? index;
  }

  onReportMessage(message: Message): void {
    this.reportMessage.emit(message);
  }

  private getDayKey(value?: string): string {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().slice(0, 10);
  }

  private formatDayLabel(value?: string): string {
    if (!value) return '';

    const date = new Date(value);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (this.isSameLocalDay(date, today)) return 'Hoy';
    if (this.isSameLocalDay(date, yesterday)) return 'Ayer';

    return date.toLocaleDateString('es-MX', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: date.getFullYear() === today.getFullYear() ? undefined : 'numeric'
    });
  }

  private isSameLocalDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear()
      && a.getMonth() === b.getMonth()
      && a.getDate() === b.getDate();
  }
}
