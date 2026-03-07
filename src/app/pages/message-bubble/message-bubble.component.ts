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
}
