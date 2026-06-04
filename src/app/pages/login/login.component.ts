import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {

  form: FormGroup;
  error: string | null = null;
  loading = false;

  constructor(
    fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.form = fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  onSubmit(): void {
    this.error = null;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error = this.getValidationMessage();
      return;
    }

    this.loading = true;

    this.auth.login(this.form.value).subscribe({
      next: res => {
        this.loading = false;

        if (res.estado === 1) {
          this.router.navigate(['/profile']);
        } else {
          this.error = res.mensaje || 'Usuario inválido o contraseña incorrecta.';
        }
      },
      error: err => {
        this.loading = false;
        this.error = this.getLoginErrorMessage(err);
      }
    });
  }

  getValidationMessage(): string {
    const username = this.form.get('username');
    const password = this.form.get('password');

    if (username?.hasError('required') || password?.hasError('required')) {
      return 'Ingresa usuario y contraseña.';
    }

    if (username?.hasError('minlength')) {
      return 'El usuario debe tener al menos 3 caracteres.';
    }

    if (password?.hasError('minlength')) {
      return 'La contraseña debe tener al menos 8 caracteres.';
    }

    return 'Revisa los datos antes de continuar.';
  }

  getFieldError(controlName: 'username' | 'password'): string | null {
    const control = this.form.get(controlName);
    if (!control || !control.touched || control.valid) return null;

    if (control.hasError('required')) {
      return controlName === 'username'
        ? 'El usuario es obligatorio.'
        : 'La contraseña es obligatoria.';
    }

    if (control.hasError('minlength')) {
      return controlName === 'username'
        ? 'Escribe al menos 3 caracteres.'
        : 'Escribe al menos 8 caracteres.';
    }

    return null;
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }

  goToForgotPassword(): void {
    this.router.navigate(['/forgot-password']);
  }

  goToResendVerification(): void {
    this.router.navigate(['/resend-verification']);
  }

  private getLoginErrorMessage(err: any): string {
    const apiMessage = err?.error?.mensaje || err?.error?.message || '';
    const normalized = String(apiMessage).toLowerCase();

    if (err?.status === 0) {
      return 'No se pudo conectar con el servidor. Verifica si la Raspberry/API está encendida o si hay conexión.';
    }

    if (err?.status === 401) {
      return apiMessage || 'Usuario inválido o contraseña incorrecta.';
    }

    if (err?.status === 403) {
      return apiMessage || 'Tu cuenta no tiene permiso para entrar. Verifica correo, aprobación o estado de la cuenta.';
    }

    if (err?.status === 400) {
      return apiMessage || 'Usuario o contraseña con formato inválido.';
    }

    if (err?.status >= 500) {
      return apiMessage || 'El servidor no respondió correctamente. Puede ser un problema temporal de GESCO/API.';
    }

    if (normalized.includes('incorrect') || normalized.includes('invalid') || normalized.includes('inválid')) {
      return apiMessage;
    }

    return apiMessage || 'Error al iniciar sesión.';
  }
}
