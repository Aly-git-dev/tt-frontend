import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Conversation, Message } from '../../core/models/chat.models';
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

  @Output() send = new EventEmitter<string>();
  @Output() backMobile = new EventEmitter<void>();
}
