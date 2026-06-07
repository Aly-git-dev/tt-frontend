import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { UserDTO, UserListResponse } from '../models/user.models';

export interface SimpleApiResponse {
  estado: number;
  mensaje: string;
  detalle?: any;
}

@Injectable({
  providedIn: 'root'
})
export class AdminUsersService {

  private readonly baseUrl = `${environment.apiUrl}/upiiz/admin/v1`;

  constructor(private http: HttpClient) {}

  // Obtener usuarios pendientes de aprobación
  getPendingUsers(): Observable<UserListResponse> {
    return this.http.get<UserListResponse>(`${this.baseUrl}/pending-users`);
  }

  // Aprobar usuario
  approve(userId: string): Observable<SimpleApiResponse> {
    return this.http.patch<SimpleApiResponse>(
      `${this.baseUrl}/pending-users/${userId}/approve`,
      {}
    );
  }

  // Rechazar usuario
  reject(userId: string): Observable<SimpleApiResponse> {
    return this.http.patch<SimpleApiResponse>(
      `${this.baseUrl}/pending-users/${userId}/reject`,
      {}
    );
  }

  getBannedUsers() {
    return this.http.get<UserDTO[]>(`${this.baseUrl}/forums/banned`);
  }

  unbanUser(id: string) {
    return this.http.post<void>(`${this.baseUrl}/forums/${id}/unban`, {});
  }
  // 🔥 NUEVO: listar todos los usuarios (admin panel)
getAllUsers(q: string = ''): Observable<UserDTO[]> {
  return this.http.get<UserDTO[]>(
    `${this.baseUrl}/admin/users`,
    { params: { q } }
  );
}

// 🔥 NUEVO: actualizar roles
updateRoles(id: string, roles: string[]) {
  return this.http.patch<any>(
    `${this.baseUrl}/admin/users/${id}/roles`,
    { roles }
  );
}

// 🔥 NUEVO: banear usuario (global)
banUser(id: string) {
  return this.http.patch<any>(
    `${this.baseUrl}/admin/users/${id}/ban`,
    {}
  );
}

// 🔥 NUEVO: desbanear usuario (global)
unbanUserGlobal(id: string) {
  return this.http.patch<any>(
    `${this.baseUrl}/admin/users/${id}/unban`,
    {}
  );
}

banUserGlobal(id: string): Observable<any> {
  return this.http.patch<any>(
    `${this.baseUrl}/admin/users/${id}/ban`,
    {}
  );
}

}
