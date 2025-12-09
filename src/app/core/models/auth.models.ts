export interface RegisterRequest {
  emailInst: string;
  password: string;
  fullName: string;
  role: 'PROFESOR' | 'ADMIN' | 'ALUMNO' | 'ASESOR' | string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface TokensResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Forma general de la respuesta del backend:
 * {
 *   "estado": 1 | 0,
 *   "mensaje": "texto",
 *   "tokens"?: { ... },
 *   "usuario"?: { ... },
 *   ...
 * }
 */
export interface ApiResponse<T = any> {
  estado: number;
  mensaje: string;
  tokens?: TokensResponse;
  usuario?: T;
  error?: string;
  [key: string]: any;
}
