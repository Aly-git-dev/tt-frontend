import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Conversation } from '../../core/models/chat.models';

@Component({
  selector: 'app-conversation-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './conversation-list.component.html',
  styleUrl: './conversation-list.component.scss'
})
export class ConversationListComponent {
  @Input() items: Conversation[] = [];
  @Input() selectedId: number | null = null;
  @Output() select = new EventEmitter<Conversation>();

  trackById(_: number, c: Conversation) { return c.id; }
}
