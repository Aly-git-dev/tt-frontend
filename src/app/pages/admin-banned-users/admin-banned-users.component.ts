import { Component, OnInit } from '@angular/core';
import { AdminUsersService } from '../../core/services/admin-users.service';
import { UserDTO } from '../../core/models/user.models';

@Component({
  selector: 'app-admin-banned-users',
  templateUrl: './admin-banned-users.component.html',
  styleUrls: ['./admin-banned-users.component.css']
})
export class AdminBannedUsersComponent implements OnInit {

  users: UserDTO[] = [];
  loading = false;
  error: string | null = null;
  success: string | null = null;
  unbanningId: string | null = null;
  
  constructor(private adminUserService: AdminUsersService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = null;
    this.success = null;

    this.adminUserService.getBannedUsers().subscribe({
      next: users => {
        this.users = users;
        this.loading = false;
      },
      error: () => {
        this.error = 'No se pudieron cargar los usuarios baneados.';
        this.loading = false;
      }
    });
  }

  confirmUnban(user: UserDTO): void {
    if (!confirm(`¿Reactivar la cuenta de ${user.fullName}?`)) {
      return;
    }

    this.unbanningId = user.id;
    this.error = null;
    this.success = null;

    this.adminUserService.unbanUser(user.id).subscribe({
      next: () => {
        this.unbanningId = null;
        this.success = `La cuenta de ${user.fullName} ha sido reactivada.`;
        this.load();
      },
      error: () => {
        this.unbanningId = null;
        this.error = 'No se pudo reactivar el usuario. Intenta de nuevo.';
      }
    });
  }
}
