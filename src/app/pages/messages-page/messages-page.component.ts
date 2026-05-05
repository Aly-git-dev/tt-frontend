import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { interval, Subscription } from 'rxjs';

import { ConversationListComponent } from '../conversation-list/conversation-list.component';
import { ChatThreadComponent } from '../chat-thread/chat-thread.component';
import { ChatApiService } from '../../core/services/chat-api.service';
import { Conversation, Message, UserSearchResult } from '../../core/models/chat.models';
import { SendMessagePayload } from '../../core/models/chat.models';

import { ReportModalComponent } from '../report-modal/report-modal.component';

@Component({
  selector: 'app-messages-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ConversationListComponent, ChatThreadComponent, ReportModalComponent],
  templateUrl: './messages-page.component.html',
  styleUrl: './messages-page.component.css'
})
export class MessagesPageComponent implements OnInit, OnDestroy {
  conversations: Conversation[] = [];
  selected: Conversation | null = null;
  messages: Message[] = [];
  loading = false;

  showNewConversationModal = false;
  userSearchTerm = '';
  userSearchResults: UserSearchResult[] = [];
  userSearchLoading = false;
  creatingConversation = false;
  createConversationError = '';

  private refreshSub?: Subscription;
  private userSearchDebounce?: ReturnType<typeof setTimeout>;

      selectedMessage: Message | null = null;
    showReportModal = false;

  constructor(private chatApi: ChatApiService) {}

  ngOnInit(): void {
    this.loadConversations();
  }

  ngOnDestroy(): void {
    this.stopAutoRefresh();

    if (this.userSearchDebounce) {
      clearTimeout(this.userSearchDebounce);
    }
  }

  loadConversations(selectFirst = true): void {
    this.chatApi.listConversations().subscribe({
      next: (items) => {
        this.conversations = items;

        if (this.selected) {
          const updatedSelected = items.find(c => c.id === this.selected?.id);
          if (updatedSelected) {
            this.selected = updatedSelected;
          }
        }

        if (!this.selected && selectFirst && items.length) {
          this.selectConversation(items[0]);
        }
      },
      error: (err) => {
        console.error('Error loading conversations', err);
      }
    });
  }

  selectConversation(c: Conversation): void {
    this.selected = c;
    this.loadMessages(c.id);
    this.startAutoRefresh();
  }

  loadMessages(conversationId: number): void {
    this.loading = true;

    this.chatApi.listMessages(conversationId, 30).subscribe({
      next: (msgs) => {
        this.messages = msgs;

        const target = this.conversations.find(x => x.id === conversationId);
        if (target) {
          target.unreadCount = 0;
        }
      },
      error: (err) => {
        console.error('Error loading messages', err);
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  onSend(payload: SendMessagePayload): void {
    if (!this.selected) return;

    const content = (payload.content || '').trim();

    // Si no hay texto ni archivo, no enviar
    if (!content && !payload.file) return;

    // ID único para evitar duplicados (como ya tenías)
    const clientMessageId =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    // 🔥 CASO 1: ENVÍO CON ARCHIVO
    if (payload.file) {
      const formData = new FormData();
      formData.append('content', content);
      formData.append('files', payload.file);
      formData.append('clientMessageId', clientMessageId);

      this.chatApi.sendMessageWithAttachment(this.selected.id, formData).subscribe({
        next: () => {
          this.loadMessages(this.selected!.id);
        },
        error: (err) => {
          console.error('Error enviando archivo', err);
        }
      });

      return;
    }

    // 🔥 CASO 2: SOLO TEXTO (tu lógica original)
    this.chatApi.sendMessage(this.selected.id, { content, clientMessageId }).subscribe({
      next: (m) => {
        this.messages = [...this.messages, m];

        this.conversations = this.conversations.map(c =>
          c.id === this.selected?.id
            ? {
                ...c,
                lastMessageAt: m.createdAt,
                lastMessagePreview: m.content ?? '',
                lastMessageSenderId: m.senderId,
                unreadCount: 0
              }
            : c
        );

        this.sortConversations();
      },
      error: (err) => {
        console.error('Error sending message', err);
      }
    });
  }

  backToListMobile(): void {
    this.selected = null;
    this.stopAutoRefresh();
  }

  openNewConversationModal(): void {
    this.showNewConversationModal = true;
    this.userSearchTerm = '';
    this.userSearchResults = [];
    this.createConversationError = '';
  }

  closeNewConversationModal(): void {
    this.showNewConversationModal = false;
    this.userSearchTerm = '';
    this.userSearchResults = [];
    this.createConversationError = '';
  }

  onUserSearchInput(): void {
    const query = this.userSearchTerm.trim();

    this.createConversationError = '';

    if (this.userSearchDebounce) {
      clearTimeout(this.userSearchDebounce);
    }

    if (!query) {
      this.userSearchResults = [];
      this.userSearchLoading = false;
      return;
    }

    this.userSearchLoading = true;

    this.userSearchDebounce = setTimeout(() => {
      this.chatApi.searchUsers(query).subscribe({
        next: (results) => {
          this.userSearchResults = results ?? [];
        },
        error: (err) => {
          console.error('Error searching users', err);
          this.userSearchResults = [];
          this.createConversationError = 'No se pudo buscar usuarios.';
        },
        complete: () => {
          this.userSearchLoading = false;
        }
      });
    }, 300);
  }

  createDirectConversation(user: UserSearchResult): void {
    if (!user?.id) return;

    this.creatingConversation = true;
    this.createConversationError = '';

    this.chatApi.startDirectConversation({ userId: user.id }).subscribe({
      next: (conversation) => {
        const exists = this.conversations.some(c => c.id === conversation.id);

        if (!exists) {
          this.conversations = [conversation, ...this.conversations];
        } else {
          this.conversations = this.conversations.map(c =>
            c.id === conversation.id ? conversation : c
          );
        }

        this.closeNewConversationModal();
        this.selectConversation(conversation);
        this.sortConversations();
      },
      error: (err) => {
        console.error('Error creating direct conversation', err);
        this.createConversationError =
          err?.error?.message || 'No se pudo crear la conversación.';
      },
      complete: () => {
        this.creatingConversation = false;
      }
    });
  }

  getUserInitial(user: UserSearchResult): string {
    const base = (user.name || user.email || '?').trim();
    return base.charAt(0).toUpperCase();
  }

  private startAutoRefresh(): void {
    this.stopAutoRefresh();

    this.refreshSub = interval(5000).subscribe(() => {
      if (!this.selected) return;

      this.chatApi.listMessages(this.selected.id, 30).subscribe({
        next: (msgs) => {
          this.messages = msgs;
        },
        error: (err) => {
          console.error('Error refreshing messages', err);
        }
      });

      this.chatApi.listConversations().subscribe({
        next: (items) => {
          this.conversations = items;
          const updatedSelected = items.find(c => c.id === this.selected?.id);
          if (updatedSelected) {
            this.selected = updatedSelected;
          }
        },
        error: (err) => {
          console.error('Error refreshing conversations', err);
        }
      });
    });
  }

  private stopAutoRefresh(): void {
    if (this.refreshSub) {
      this.refreshSub.unsubscribe();
      this.refreshSub = undefined;
    }
  }

  private sortConversations(): void {
    this.conversations = [...this.conversations].sort((a, b) => {
      const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return bTime - aTime;
    });
  }



    onReportMessage(message: Message) {
      this.selectedMessage = message;
      this.showReportModal = true;
    }

    submitReport(data: any) {
  if (!this.selectedMessage) return;

  this.chatApi.reportMessage(this.selectedMessage.id, data).subscribe({
    next: () => {
      alert('Reporte enviado');
      this.closeReportModal(); // 👈 usa el método
    },
    error: () => alert('Error al reportar')
  });
}

    closeReportModal(): void {
      this.showReportModal = false;
      this.selectedMessage = null;
    }
}