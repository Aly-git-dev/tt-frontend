import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';

import { UserProfileService } from '../../core/services/user-profile.service';
import { PublicUserProfileDto } from '../../core/models/forum.models';

@Component({
  selector: 'app-public-user-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './public-user-profile.component.html',
  styleUrls: ['./public-user-profile.component.css']
})
export class PublicUserProfileComponent implements OnInit {

  profile: PublicUserProfileDto | null = null;
  loading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private userService: UserProfileService
  ) {}

  ngOnInit(): void {
    const userId = this.route.snapshot.paramMap.get('id');

    if (!userId) {
      this.error = 'Usuario inválido';
      this.loading = false;
      return;
    }

    this.userService.getPublicProfile(userId).subscribe({
      next: (data: PublicUserProfileDto) => {
        this.profile = data;
        this.loading = false;
      },
      error: (err: unknown) => {
        console.error(err);
        this.error = 'No se pudo cargar el perfil';
        this.loading = false;
      }
    });
  }

  getInitial(name?: string | null): string {
    if (!name) return '?';
    return name.trim().charAt(0).toUpperCase();
  }

  getParsedInterests(): string[] {
  try {
    return this.profile?.interests
      ? JSON.parse(this.profile.interests)
      : [];
  } catch {
    return [];
  }
}

getParsedLinks(): { label: string; url: string }[] {
  try {
    return this.profile?.links
      ? JSON.parse(this.profile.links)
      : [];
  } catch {
    return [];
  }
}
}