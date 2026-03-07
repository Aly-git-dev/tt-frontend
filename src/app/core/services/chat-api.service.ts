import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Conversation, CreateDirectRequest, Message, SendMessageRequest } from '../models/chat.models';

@Injectable({ providedIn: 'root' })
export class ChatApiService {
  private base = `${environment.apiUrl}/upiiz/admin/v1/chats`;

  constructor(private http: HttpClient) {}

  // Ajusta rutas si las tuyas cambian:
  listConversations() {
    return this.http.get<Conversation[]>(`${this.base}/conversations`);
  }

  createOrGetDirect(req: CreateDirectRequest) {
    return this.http.post<Conversation>(`${this.base}/conversations/direct`, req);
  }

  listMessages(conversationId: number, limit = 50) {
    return this.http.get<Message[]>(`${this.base}/conversations/${conversationId}/messages`, {
      params: { limit }
    });
  }

  sendMessage(conversationId: number, body: SendMessageRequest) {
    return this.http.post<Message>(`${this.base}/conversations/${conversationId}/messages`, body);
  }
}
