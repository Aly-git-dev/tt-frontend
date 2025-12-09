export interface LinkDTO {
  label: string;
  url: string;
}

export interface UserDTO {
  id: string;
  emailInst: string;
  fullName: string;
  active: boolean;
  bio: string | null;
  interests: string[];
  links: LinkDTO[];
  avatarUrl: string | null;
  coverUrl: string | null;
  roles: string[];
  boleta?: string;
  programa?: string;
}

export interface UpdateProfileRequest {
  bio?: string;
  interests?: string[];
  links?: LinkDTO[];
  avatarUrl?: string;
  coverUrl?: string;
}

export interface UserListResponse {
  estado: number;     // 1 = ok, 0 = error
  mensaje: string;    // mensaje del backend
  usuarios: UserDTO[]; // arreglo de usuarios (pendientes, en este caso)
}

