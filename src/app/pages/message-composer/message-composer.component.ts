import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SendMessagePayload } from '../../core/models/chat.models';

@Component({
  selector: 'app-message-composer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './message-composer.component.html',
  styleUrl: './message-composer.component.scss'
})
export class MessageComposerComponent {
  @Output() send = new EventEmitter<SendMessagePayload>();

  messageText = '';
  selectedFile: File | null = null;
  showEmojiPicker = false;

  emojis: string[] = ['😊', '😂', '❤️', '👍', '🙏', '😮', '😢', '🔥', '✨', '✅'];

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    this.selectedFile = input.files[0];
    input.value = '';
  }

  removeFile(): void {
    this.selectedFile = null;
  }

  toggleEmojiPicker(): void {
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  addEmoji(emoji: string): void {
    this.messageText += emoji;
    this.showEmojiPicker = false;
  }

  sendMessage(): void {
    const content = this.messageText.trim();

    if (!content && !this.selectedFile) {
      return;
    }

    this.send.emit({
      content,
      file: this.selectedFile
    });

    this.messageText = '';
    this.selectedFile = null;
    this.showEmojiPicker = false;
  }
}