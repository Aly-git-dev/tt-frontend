import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { RegisterRequest } from '../../core/models/auth.models';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {

  form: FormGroup;
  loading = false;
  error: string | null = null;
  success: string | null = null;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(5)]],
      emailInst: [
        '',
        [
          Validators.required,
          Validators.email,
          Validators.pattern(/@((alumno|upiiz)\.ipn\.mx|ipn\.mx)$/i)
        ]
      ],
      password: ['', [Validators.required, Validators.minLength(8)]],
      role: ['ALUMNO', [Validators.required]]
    });
  }

  onSubmit(): void {
    this.error = null;
    this.success = null;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error = this.getValidationMessage();
      return;
    }

    const payload: RegisterRequest = this.form.value;
    const appBaseUrl = typeof window !== 'undefined' ? window.location.origin : undefined;

    this.loading = true;
    this.auth.register(payload, appBaseUrl).subscribe({
      next: res => {
        this.loading = false;
        if (res.estado === 1) {
          this.success = res.mensaje || 'Registro exitoso. Revisa tu correo para confirmar la cuenta.';
          setTimeout(() => this.router.navigate(['/login']), 2000);
        } else {
          this.error = res.mensaje || 'No se pudo completar el registro.';
        }
      },
      error: err => {
        this.loading = false;
        this.error = this.getRegisterErrorMessage(err);
      }
    });
  }

  getFieldError(controlName: 'fullName' | 'emailInst' | 'password' | 'role'): string | null {
    const control = this.form.get(controlName);
    if (!control || !control.touched || control.valid) return null;

    if (control.hasError('required')) {
      const labels: Record<string, string> = {
        fullName: 'El nombre completo es obligatorio.',
        emailInst: 'El correo institucional es obligatorio.',
        password: 'La contraseña es obligatoria.',
        role: 'Selecciona un rol.'
      };
      return labels[controlName];
    }

    if (controlName === 'fullName' && control.hasError('minlength')) {
      return 'Escribe nombre y apellidos con al menos 5 caracteres.';
    }

    if (controlName === 'emailInst' && control.hasError('email')) {
      return 'Escribe un correo válido.';
    }

    if (controlName === 'emailInst' && control.hasError('pattern')) {
      return 'Usa un correo @alumno.ipn.mx, @upiiz.ipn.mx o @ipn.mx.';
    }

    if (controlName === 'password' && control.hasError('minlength')) {
      return 'La contraseña debe tener al menos 8 caracteres.';
    }

    return null;
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  private getValidationMessage(): string {
    const fieldErrors = ['fullName', 'emailInst', 'password', 'role']
      .map(field => this.getFieldError(field as any))
      .filter(Boolean);

    return fieldErrors[0] || 'Por favor completa correctamente el formulario.';
  }

  private getRegisterErrorMessage(err: any): string {
    const apiMessage = err?.error?.mensaje || err?.error?.message || '';
    const normalized = String(apiMessage).toLowerCase();

    if (err?.status === 0) {
      return 'No se pudo conectar con el servidor. Verifica si la Raspberry/API está encendida o si hay conexión.';
    }

    if (err?.status === 400) {
      return apiMessage || 'Hay datos faltantes o con formato inválido.';
    }

    if (err?.status === 409) {
      return apiMessage || 'Ya existe un usuario registrado con ese correo.';
    }

    if (err?.status >= 500) {
      if (normalized.includes('mail') || normalized.includes('correo') || normalized.includes('gesco')) {
        return apiMessage;
      }

      return apiMessage || 'El servidor no pudo completar el registro. Puede ser un problema temporal de correo, GESCO o API.';
    }

    return apiMessage || 'Error al registrar usuario.';
  }
}
