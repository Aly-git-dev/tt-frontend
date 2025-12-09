import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MeService } from '../../core/services/me.service';
import { AuthService } from '../../core/services/auth.service';
import { UserDTO } from '../../core/models/user.models';

@Component({
  selector: 'app-main-layout',
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.css']
})
export class MainLayoutComponent implements OnInit {

  user: UserDTO | null = null;
  loadingUser = false;
  error: string | null = null;
  showUserMenu = false;

  constructor(
    private meService: MeService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUser();
  }

  loadUser(): void {
    this.loadingUser = true;
    this.error = null;

    this.meService.getProfile().subscribe({
      next: res => {
        this.loadingUser = false;
        if (res.estado === 1 && res.usuario) {
          this.user = res.usuario;
        } else {
          this.error = res.mensaje || 'No se pudo cargar el usuario';
        }
      },
      error: err => {
        this.loadingUser = false;
        this.error = err?.error?.mensaje || 'Error al cargar usuario';
      }
    });
  }

  // Header user menu
  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }

  closeUserMenu(): void {
    this.showUserMenu = false;
  }

  onLogout(): void {
    this.auth.logout();
    this.closeUserMenu();
    this.router.navigate(['/login']);
  }

  goToProfile(): void {
    this.closeUserMenu();
    this.router.navigate(['/profile']);
  }

  goToAdminApprovals(): void {
    this.closeUserMenu();
    this.router.navigate(['/admin/approvals']);
  }

  goToAdminResportList(): void {
    this.closeUserMenu();
    this.router.navigate(['/admin/report/list']);
  }
}
