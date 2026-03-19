import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Conversation,
  CreateDirectRequest,
  Message,
  SendMessageRequest,
  UserSearchResult
} from '../models/chat.models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ChatApiService {
  private http = inject(HttpClient);

  private readonly baseUrl = `${environment.apiUrl}/upiiz/admin/v1/chats`;

  listConversations(): Observable<Conversation[]> {
    return this.http.get<Conversation[]>(`${this.baseUrl}/conversations`);
  }

  startDirectConversation(body: CreateDirectRequest): Observable<Conversation> {
    return this.http.post<Conversation>(`${this.baseUrl}/conversations/direct`, body);
  }

  searchUsers(query: string): Observable<UserSearchResult[]> {
    const params = new HttpParams().set('q', query);
    return this.http.get<UserSearchResult[]>(`${this.baseUrl}/users/search`, { params });
  }

  listMessages(conversationId: number, limit = 30, before?: string): Observable<Message[]> {
    let params = new HttpParams().set('limit', limit);

    if (before) {
      params = params.set('before', before);
    }

    return this.http.get<Message[]>(
      `${this.baseUrl}/conversations/${conversationId}/messages`,
      { params }
    );
  }

  sendMessage(conversationId: number, body: SendMessageRequest): Observable<Message> {
    return this.http.post<Message>(
      `${this.baseUrl}/conversations/${conversationId}/messages`,
      body
    );
  }
}