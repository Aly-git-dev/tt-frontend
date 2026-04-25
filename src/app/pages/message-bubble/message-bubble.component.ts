import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Message } from '../../core/models/chat.models';

@Component({
  selector: 'app-message-bubble',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './message-bubble.component.html',
  styleUrl: './message-bubble.component.scss'
})
export class MessageBubbleComponent {
  @Input() msg!: Message;

  meId(): string | null {
    return localStorage.getItem('userId'); // ajusta si tu auth lo maneja distinto
  }

  isMine(): boolean {
    const me = this.meId();
    return !!me && this.msg.senderId === me;
  }

  time(): string {
    const d = new Date(this.msg.createdAt);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  getFileIcon(mimeType?: string): string {
  if (!mimeType) return '📎';

  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType === 'application/pdf') return '📄';
  if (mimeType.includes('word')) return '📝';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
  if (mimeType.includes('zip') || mimeType.includes('rar')) return '🗜️';

  return '📎';
}

formatFileSize(bytes?: number): string {
  if (!bytes) return '0 KB';

  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;

  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}
}
