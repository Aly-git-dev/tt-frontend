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

  // helper: ¿estamos en el navegador?
  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  // REGISTRO 
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

  // CONFIRMAR EMAIL
  confirmEmail(token: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(
      `${this.baseUrl}/confirm`,
      { params: { token } }
    );
  }

  // APROBAR USUARIO
  approveUser(userId: string): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(
      `${this.baseUrl}/approve/${userId}`,
      {}
    );
  }

  // LOGIN 
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

  // REFRESH 
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

  // LOGOUT
  logout(): void {
    this.clearTokens();
  }

  // Manejo de tokens (browser-safe)
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
    if (!this.isBrowser()) return false;
    return !!this.getAccessToken();
  }
}
