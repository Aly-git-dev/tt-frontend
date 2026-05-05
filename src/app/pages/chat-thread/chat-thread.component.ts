import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Conversation, Message, SendMessagePayload } from '../../core/models/chat.models';
import { MessageBubbleComponent } from '../message-bubble/message-bubble.component';
import { MessageComposerComponent } from '../message-composer/message-composer.component';

@Component({
  selector: 'app-chat-thread',
  standalone: true,
  imports: [CommonModule, MessageBubbleComponent, MessageComposerComponent],
  templateUrl: './chat-thread.component.html',
  styleUrl: './chat-thread.component.scss'
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

  trackByMessage(index: number, message: Message): string | number {
    return (message as any).id ?? index;
  }

  onReportMessage(message: Message): void {
    this.reportMessage.emit(message);
  }
}