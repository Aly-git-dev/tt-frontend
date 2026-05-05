// src/app/core/services/user-profile.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { PublicUserProfileDto } from '../models/forum.models';

@Injectable({
  providedIn: 'root'
})
export class UserProfileService {

  private readonly baseUrl = `${environment.apiUrl}/upiiz/public/v1/users`;

  constructor(private http: HttpClient) {}

  getPublicProfile(id: string): Observable<PublicUserProfileDto> {
    return this.http.get<PublicUserProfileDto>(`${this.baseUrl}/${id}/profile`);
  }
}