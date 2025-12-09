import { Injectable } from '@angular/core';
import {
  CanActivate,
  Router,
  UrlTree
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { MeService } from '../services/me.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {

  constructor(
    private meService: MeService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean | UrlTree> {
    // Preguntamos al backend quién soy y qué roles tengo
    return this.meService.getProfile().pipe(
      map(res => {
        if (res.estado === 1 && res.usuario) {
          const roles: string[] = res.usuario.roles ?? [];
          if (roles.includes('ADMIN')) {
            return true;
          }
        }
        // Si no es admin → lo mandamos a /profile
        return this.router.parseUrl('/profile');
      }),
      catchError(() => of(this.router.parseUrl('/login')))
    );
  }
}
