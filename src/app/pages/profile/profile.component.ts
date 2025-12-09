import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';

import { MeService } from '../../core/services/me.service';
import { AuthService } from '../../core/services/auth.service';
import {
  UserDTO,
  UpdateProfileRequest,
  LinkDTO
} from '../../core/models/user.models';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {

  showUserMenu = false;

  user: UserDTO | null = null;
  loading = false;
  saving = false;
  error: string | null = null;

  form: FormGroup;

  uploadingAvatar = false;
  uploadingCover = false;

  // datos editables
  interests: string[] = [];
  links: LinkDTO[] = [];

  constructor(
    private meService: MeService,
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      fullName: [''],
      bio: [''],
      // campos extra
      newInterest: [''],
      avatarUrl: [''],
      coverUrl: [''],
      linkLabel: [''],
      linkUrl: ['']
    });
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  // ================= PERFIL =================

  loadProfile(): void {
    this.loading = true;
    this.error = null;

    this.meService.getProfile().subscribe({
      next: res => {
        this.loading = false;

        if (res.estado === 1 && res.usuario) {
          this.user = res.usuario;

          this.interests = [...(this.user.interests ?? [])];
          this.links = [...(this.user.links ?? [])];

          this.form.patchValue({
            fullName: this.user.fullName,
            bio: this.user.bio ?? '',
            avatarUrl: this.user.avatarUrl ?? '',
            coverUrl: this.user.coverUrl ?? ''
          });
        } else {
          this.error = res.mensaje ?? 'No se pudo cargar el perfil';
        }
      },
      error: err => {
        this.loading = false;
        this.error = err?.error?.mensaje || 'Error al obtener perfil';
      }
    });
  }

  onSave(): void {
    if (!this.user) { return; }

    const v = this.form.value;

    const payload: UpdateProfileRequest = {
      bio: v.bio ?? '',
      interests: this.interests,
      links: this.links,
      avatarUrl: v.avatarUrl || null,
      coverUrl: v.coverUrl || null
    };

    this.saving = true;
    this.error = null;

    this.meService.updateProfile(payload).subscribe({
      next: res => {
        this.saving = false;

        if (res.estado === 1 && res.usuario) {
          this.user = res.usuario;

          // refrescar datos locales por si el backend los normaliza
          this.interests = [...(this.user.interests ?? [])];
          this.links = [...(this.user.links ?? [])];

          this.form.patchValue({
            fullName: this.user.fullName,
            bio: this.user.bio ?? '',
            avatarUrl: this.user.avatarUrl ?? '',
            coverUrl: this.user.coverUrl ?? ''
          });
        } else {
          this.error = res.mensaje || 'No se pudo actualizar el perfil';
        }
      },
      error: err => {
        this.saving = false;
        this.error = err?.error?.mensaje || 'Error al actualizar perfil';
      }
    });
  }

  // ============ INTERESES (CHIPS) ============

  addInterestFromInput(): void {
    const raw: string = (this.form.value.newInterest || '').trim();
    if (!raw) { return; }

    raw.split(',')
      .map(v => v.trim())
      .filter(v => v.length > 0)
      .forEach(tag => {
        if (!this.interests.includes(tag)) {
          this.interests.push(tag);
        }
      });

    this.form.patchValue({ newInterest: '' });
  }

  removeInterest(idx: number): void {
    this.interests.splice(idx, 1);
  }

  // ================ LINKS ====================

  addLink(): void {
    const label: string = (this.form.value.linkLabel || '').trim();
    const url: string = (this.form.value.linkUrl || '').trim();

    if (!label || !url) { return; }

    this.links.push({ label, url });

    this.form.patchValue({
      linkLabel: '',
      linkUrl: ''
    });
  }

  removeLink(idx: number): void {
    this.links.splice(idx, 1);
  }

    // ============ AVATAR / COVER UPLOAD ============

  onAvatarFileSelected(event: Event): void {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) { return; }

  this.uploadingAvatar = true;
  this.error = null;

  this.meService.uploadAvatar(file).subscribe({
    next: res => {
      this.uploadingAvatar = false;
      if (res.estado === 1 && res.usuario) {
        const u = res.usuario;              // <--- aseguramos tipo
        this.user = u;

        this.interests = [...(u.interests ?? [])];
        this.links = [...(u.links ?? [])];

        this.form.patchValue({
          avatarUrl: u.avatarUrl ?? ''
        });
      } else {
        this.error = res.mensaje || 'No se pudo subir el avatar';
      }
    },
    error: err => {
      this.uploadingAvatar = false;
      this.error = err?.error?.mensaje || 'Error al subir avatar';
    }
  });
}

onCoverFileSelected(event: Event): void {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) { return; }

  this.uploadingCover = true;
  this.error = null;

  this.meService.uploadCover(file).subscribe({
    next: res => {
      this.uploadingCover = false;
      if (res.estado === 1 && res.usuario) {
        const u = res.usuario;             // <--- igual aquí
        this.user = u;

        this.interests = [...(u.interests ?? [])];
        this.links = [...(u.links ?? [])];

        this.form.patchValue({
          coverUrl: u.coverUrl ?? ''
        });
      } else {
        this.error = res.mensaje || 'No se pudo subir la portada';
      }
    },
    error: err => {
      this.uploadingCover = false;
      this.error = err?.error?.mensaje || 'Error al subir portada';
    }
  });
}

  // ============ MENÚ USUARIO / LOGOUT =========

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }

  closeUserMenu(): void {
    this.showUserMenu = false;
  }

  onLogout(): void {
    this.auth.logout();
    this.showUserMenu = false;
    this.router.navigate(['/login']);
  }
}
