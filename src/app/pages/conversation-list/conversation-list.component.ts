import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Conversation } from '../../core/models/chat.models';

@Component({
  selector: 'app-conversation-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './conversation-list.component.html',
  styleUrl: './conversation-list.component.css'
})
export class ConversationListComponent {
  @Input() items: Conversation[] = [];
  @Input() selectedId: number | null = null;

  @Output() select = new EventEmitter<Conversation>();
  @Output() newConversation = new EventEmitter<void>();

  searchTerm = '';

  trackById(_: number, c: Conversation): number {
    return c.id;
  }

  get filteredItems(): Conversation[] {
    const term = this.searchTerm.trim().toLowerCase();

    if (!term) return this.items;

    return this.items.filter(c => {
      const name = (c.otherName ?? '').toLowerCase();
      const uuid = (c.otherUserId ?? '').toLowerCase();
      const preview = (c.lastMessagePreview ?? '').toLowerCase();
      return name.includes(term) || uuid.includes(term) || preview.includes(term);
    });
  }

  getInitial(name?: string, uuid?: string): string {
    const source = (name || uuid || '?').trim();
    return source.charAt(0).toUpperCase();
  }

  getPreview(c: Conversation): string {
    return c.lastMessagePreview?.trim() || 'Sin mensajes todavía';
  }

  formatTime(value?: string): string {
    if (!value) return '';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    const now = new Date();

    const sameDay =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (sameDay) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    return date.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
  }
}