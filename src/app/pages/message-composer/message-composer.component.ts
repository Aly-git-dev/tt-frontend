import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-message-composer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './message-composer.component.html',
  styleUrl: './message-composer.component.scss'
})
export class MessageComposerComponent {
  @Output() send = new EventEmitter<string>();
  text = '';

  submit() {
    const v = this.text.trim();
    if (!v) return;
    this.send.emit(v);
    this.text = '';
  }
}
