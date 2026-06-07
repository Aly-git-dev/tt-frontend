import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminUsersService } from '../../core/services/admin-users.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.css'
})
export class AdminUsersComponent implements OnInit {
  users: any[] = [];
  searchTerm = '';
  loading = false;
  savingId: string | null = null;
  error = '';

  roles = ['ADMIN', 'PROFESOR', 'ALUMNO', 'ASESOR'];

  constructor(
    private adminUsersService: AdminUsersService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.error = '';

    this.adminUsersService.getAllUsers(this.searchTerm).subscribe({
      next: users => this.users = (users ?? []).filter(user => user.active !== false),
      error: err => {
        console.error(err);
        this.error = 'No se pudieron cargar los usuarios.';
      },
      complete: () => this.loading = false
    });
  }

  hasRole(user: any, role: string): boolean {
    return user.roles?.includes(role);
  }

  toggleRole(user: any, role: string): void {
    const currentRoles = new Set<string>(user.roles || []);

    if (currentRoles.has(role)) {
      currentRoles.delete(role);
    } else {
      currentRoles.add(role);
    }

    const newRoles = Array.from(currentRoles);

    if (!newRoles.length) {
      alert('El usuario debe tener al menos un rol.');
      return;
    }

    this.savingId = user.id;

    this.adminUsersService.updateRoles(user.id, newRoles).subscribe({
      next: updated => {
        user.roles = updated.roles;
      },
      error: err => {
        console.error(err);
        alert('No se pudieron actualizar los roles.');
      },
      complete: () => this.savingId = null
    });
  }

  ban(user: any): void {
    if (!confirm(`¿Banear a ${user.fullName || user.emailInst}?`)) return;

    this.savingId = user.id;

    this.adminUsersService.banUserGlobal(user.id).subscribe({
      next: () => {
        this.users = this.users.filter(item => item.id !== user.id);
      },
      error: err => {
        console.error(err);
        alert('No se pudo banear al usuario.');
      },
      complete: () => this.savingId = null
    });
  }

  unban(user: any): void {
    this.savingId = user.id;

    this.adminUsersService.unbanUserGlobal(user.id).subscribe({
      next: updated => user.active = updated.active,
      error: err => {
        console.error(err);
        alert('No se pudo reactivar al usuario.');
      },
      complete: () => this.savingId = null
    });
  }

  viewProfile(user: any): void {
    if (!user?.id) return;
    this.router.navigate(['/users', user.id, 'profile']);
  }
}
