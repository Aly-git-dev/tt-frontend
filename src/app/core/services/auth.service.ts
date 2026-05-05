import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, tap } from 'rxjs';
import {
  ApiResponse,
  LoginRequest,
  RegisterRequest,
  TokensResponse
} from '../models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly baseUrl = `${environment.apiUrl}/upiiz/public/v1/auth`;

  private readonly ACCESS_TOKEN_KEY = 'platform_access_token';
  private readonly REFRESH_TOKEN_KEY = 'platform_refresh_token';
  private readonly EXPIRES_KEY = 'platform_expires_in';

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  register(body: RegisterRequest, appBaseUrl?: string): Observable<ApiResponse> {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    if (appBaseUrl) {
      headers = headers.set('X-App-BaseUrl', appBaseUrl);
    }

    return this.http.post<ApiResponse>(
      `${this.baseUrl}/registro`,
      body,
      { headers }
    );
  }

  confirmEmail(token: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(
      `${this.baseUrl}/confirm`,
      { params: { token } }
    );
  }

  approveUser(userId: string): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(
      `${this.baseUrl}/approve/${userId}`,
      {}
    );
  }

  login(body: LoginRequest): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(
      `${this.baseUrl}/login`,
      body
    ).pipe(
      tap(res => {
        if (res.estado === 1 && res.tokens) {
          this.storeTokens(res.tokens);
        }
      })
    );
  }

  refresh(): Observable<ApiResponse> {
    const tokens = this.getTokens();

    if (!tokens) {
      throw new Error('No hay refreshToken guardado');
    }

    const body: TokensResponse = {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn
    };

    return this.http.post<ApiResponse>(
      `${this.baseUrl}/refresh`,
      body
    ).pipe(
      tap(res => {
        if (res.estado === 1 && res.tokens) {
          this.storeTokens(res.tokens);
        } else {
          this.clearTokens();
        }
      })
    );
  }

  logout(): void {
    this.clearTokens();
  }

  private storeTokens(tokens: TokensResponse): void {
    if (!this.isBrowser()) return;

    localStorage.setItem(this.ACCESS_TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, tokens.refreshToken);
    localStorage.setItem(this.EXPIRES_KEY, String(tokens.expiresIn));
  }

  getAccessToken(): string | null {
    if (!this.isBrowser()) return null;
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    if (!this.isBrowser()) return null;
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  private getTokens(): TokensResponse | null {
    if (!this.isBrowser()) return null;

    const accessToken = this.getAccessToken();
    const refreshToken = this.getRefreshToken();
    const expiresIn = Number(localStorage.getItem(this.EXPIRES_KEY) ?? '0');

    if (!accessToken || !refreshToken) {
      return null;
    }

    return { accessToken, refreshToken, expiresIn };
  }

  private clearTokens(): void {
    if (!this.isBrowser()) return;

    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.EXPIRES_KEY);
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  forgotPassword(email: string): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(
      `${this.baseUrl}/forgot-password`,
      { email }
    );
  }

  resetPassword(token: string, newPassword: string, confirmPassword: string): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(
      `${this.baseUrl}/reset-password`,
      {
        token,
        newPassword,
        confirmPassword
      }
    );
  }

  // =====================================================
  // USUARIO ACTUAL DESDE JWT
  // =====================================================

  private decodeAccessToken(): any | null {
    const token = this.getAccessToken();

    if (!token) return null;

    try {
      const payload = token.split('.')[1];
      if (!payload) return null;

      const normalizedPayload = payload
        .replace(/-/g, '+')
        .replace(/_/g, '/');

      const decoded = atob(normalizedPayload);
      return JSON.parse(decoded);
    } catch (error) {
      console.error('No se pudo decodificar el token JWT', error);
      return null;
    }
  }

  getCurrentUserId(): string | null {
    const payload = this.decodeAccessToken();

    return (
      payload?.userId ||
      payload?.id ||
      payload?.uid ||
      payload?.user_id ||
      payload?.user?.id ||
      null
    );
  }

  getCurrentUserEmail(): string | null {
    const payload = this.decodeAccessToken();

    return (
      payload?.sub ||
      payload?.email ||
      payload?.email_inst ||
      payload?.username ||
      null
    );
  }

  getCurrentUserRoles(): string[] {
    const payload = this.decodeAccessToken();

    const roles =
      payload?.roles ||
      payload?.authorities ||
      payload?.role ||
      payload?.scope ||
      [];

    if (Array.isArray(roles)) {
      return roles.map((r: any) => {
        if (typeof r === 'string') {
          return r.replace('ROLE_', '');
        }

        if (r?.authority) {
          return String(r.authority).replace('ROLE_', '');
        }

        if (r?.name) {
          return String(r.name).replace('ROLE_', '');
        }

        return String(r).replace('ROLE_', '');
      });
    }

    if (typeof roles === 'string') {
      return roles
        .split(/[,\s]+/)
        .map(r => r.replace('ROLE_', '').trim())
        .filter(Boolean);
    }

    return [];
  }

  isAdmin(): boolean {
    return this.getCurrentUserRoles()
      .some(role => role.toUpperCase() === 'ADMIN');
  }

  debugToken(): void {
    console.log('JWT payload:', this.decodeAccessToken());
    console.log('currentUserId:', this.getCurrentUserId());
    console.log('currentUserEmail:', this.getCurrentUserEmail());
    console.log('roles:', this.getCurrentUserRoles());
  }
}