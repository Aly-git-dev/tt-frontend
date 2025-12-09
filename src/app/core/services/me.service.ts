import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/auth.models';
import { UpdateProfileRequest, UserDTO } from '../models/user.models';

@Injectable({
  providedIn: 'root'
})
export class MeService {

  private readonly baseUrl = `${environment.apiUrl}/upiiz/public/v1/me`;

  constructor(private http: HttpClient) {}

  getProfile(): Observable<ApiResponse<UserDTO>> {
    return this.http.get<ApiResponse<UserDTO>>(this.baseUrl);
  }

  updateProfile(body: UpdateProfileRequest): Observable<ApiResponse<UserDTO>> {
    return this.http.put<ApiResponse<UserDTO>>(this.baseUrl, body);
  }

  uploadAvatar(file: File): Observable<ApiResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<ApiResponse>(
      `${this.baseUrl}/avatar`,
      formData
    );
  }

  uploadCover(file: File): Observable<ApiResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<ApiResponse>(
      `${this.baseUrl}/cover`,
      formData
    );
  }
}
