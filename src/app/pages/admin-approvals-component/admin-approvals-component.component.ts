import { Component, OnInit } from '@angular/core';
import { AdminUsersService } from '../../core/services/admin-users.service';
import { UserDTO } from '../../core/models/user.models';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-approvals',
  templateUrl: './admin-approvals-component.component.html',
  styleUrls: ['./admin-approvals-component.component.css']
})
export class AdminApprovalsComponent implements OnInit {

  pendingUsers: UserDTO[] = [];
  loading = false;
  error: string | null = null;
  success: string | null = null;

  // para el menú de usuario en el header
  currentUserName = 'Administrador';
  currentUserEmail = '';
  showUserMenu = false;

  constructor(
    private adminService: AdminUsersService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadPendingUsers();
  }

  loadPendingUsers(): void {
    this.loading = true;
    this.error = null;
    this.success = null;

    this.loadPendingUsersFallback();
  }

  private loadPendingUsersFallback(): void {
    this.adminService.getAllUsers('').subscribe({
      next: users => {
        this.loading = false;
        this.pendingUsers = (users ?? []).filter((u: any) => {
          const approved = this.toBoolean(u?.approved ?? u?.aprobado);
          const active = this.toBoolean(u?.active ?? u?.activo);

          return approved !== true && active !== false;
        }) as UserDTO[];

        if (this.pendingUsers.length === 0) {
          this.error = null;
        }
      },
      error: fallbackErr => {
        this.loading = false;
        console.error('Error cargando fallback de usuarios pendientes', fallbackErr);
        this.error = fallbackErr?.error?.mensaje || 'Error al obtener solicitudes pendientes';
      }
    });
  }

  private toBoolean(value: any): boolean | null {
    if (value === true || value === false) return value;
    if (value === 1 || value === '1') return true;
    if (value === 0 || value === '0') return false;

    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (['true', 't', 'yes', 'si', 'sí'].includes(normalized)) return true;
      if (['false', 'f', 'no'].includes(normalized)) return false;
    }

    return null;
  }

  approve(u: UserDTO): void {
    this.error = null;
    this.success = null;

    this.adminService.approve(u.id as any).subscribe({
      next: res => {
        if (res.estado === 1) {
          this.pendingUsers = this.pendingUsers.filter(x => x.id !== u.id);
          this.success = `Usuario ${u.emailInst} aprobado correctamente`;
        } else {
          this.error = res.mensaje;
        }
      },
      error: err => {
        this.error = err?.error?.mensaje || 'Error al aprobar usuario';
      }
    });
  }

  reject(u: UserDTO): void {
    this.error = null;
    this.success = null;

    this.adminService.reject(u.id as any).subscribe({
      next: res => {
        if (res.estado === 1) {
          this.pendingUsers = this.pendingUsers.filter(x => x.id !== u.id);
          this.success = `Solicitud de ${u.emailInst} rechazada`;
        } else {
          this.error = res.mensaje;
        }
      },
      error: err => {
        this.error = err?.error?.mensaje || 'Error al rechazar usuario';
      }
    });
  }

  // Header user menu
  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }

  onLogout(): void {
    this.auth.logout();
    this.showUserMenu = false;
    this.router.navigate(['/login']);
  }

  goToProfile(): void {
    this.router.navigate(['/profile']);
  }
}
