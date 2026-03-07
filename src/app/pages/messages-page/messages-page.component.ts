import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConversationListComponent } from '../conversation-list/conversation-list.component';
import { ChatThreadComponent } from '../chat-thread/chat-thread.component';
import { ChatApiService } from '../../core/services/chat-api.service';
import { Conversation, Message } from '../../core/models/chat.models';

@Component({
  selector: 'app-messages-page',
  standalone: true,
  imports: [CommonModule, ConversationListComponent, ChatThreadComponent],
  templateUrl: './messages-page.component.html',
  styleUrl: './messages-page.component.scss'
})
export class MessagesPageComponent implements OnInit {
  conversations: Conversation[] = [];
  selected: Conversation | null = null;
  messages: Message[] = [];
  loading = false;

  constructor(private chatApi: ChatApiService) {}

  ngOnInit() {
    this.loadConversations();
  }

  loadConversations() {
    this.chatApi.listConversations().subscribe({
      next: (c) => {
        this.conversations = c;
        if (!this.selected && c.length) {
          this.selectConversation(c[0]);
        }
      }
    });
  }

  selectConversation(c: Conversation) {
    this.selected = c;
    this.loadMessages(c.id);
  }

  loadMessages(conversationId: number) {
    this.loading = true;
    this.chatApi.listMessages(conversationId, 50).subscribe({
      next: (msgs) => this.messages = msgs,
      complete: () => this.loading = false
    });
  }

  onSend(text: string) {
    if (!this.selected) return;
    const content = text.trim();
    if (!content) return;

    this.chatApi.sendMessage(this.selected.id, { content }).subscribe({
      next: (m) => {
        this.messages = [...this.messages, m];
      }
    });
  }

  backToListMobile() {
    // para mobile: “cerrar chat” y volver a lista
    this.selected = null;
  }
}
