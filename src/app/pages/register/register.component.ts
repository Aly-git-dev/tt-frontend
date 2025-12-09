// src/app/pages/register/register.component.ts
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
      fullName: ['', [Validators.required]],
      emailInst: [
        '',
        [
          Validators.required,
          Validators.email,
          Validators.pattern(/ipn\.mx$/i)
        ]
      ],
      password: ['', [Validators.required, Validators.minLength(8)]],
      role: ['PROFESOR', [Validators.required]]
    });
  }

  onSubmit(): void {
  this.error = null;
  this.success = null;

  if (this.form.invalid) {
    this.form.markAllAsTouched();
    this.error = 'Por favor completa correctamente el formulario.';
    return;
  }

  const payload: RegisterRequest = this.form.value;
  console.log('[RegisterComponent] payload que se manda:', payload);

  let appBaseUrl: string | undefined;
  if (typeof window !== 'undefined') {
    appBaseUrl = window.location.origin;
  }

  this.loading = true;
  this.auth.register(payload, appBaseUrl).subscribe({
    next: res => {
      console.log('[RegisterComponent] respuesta OK:', res);
      this.loading = false;
      if (res.estado === 1) {
        this.success = res.mensaje || 'Registro exitoso. Revisa tu correo.';
        setTimeout(() => this.router.navigate(['/login']), 2000);
      } else {
        this.error = res.mensaje || 'No se pudo completar el registro.';
      }
    },
    error: err => {
      this.loading = false;
      console.error('[RegisterComponent] error HTTP:', err);
      this.error =
        err?.error?.mensaje ||
        err?.message ||
        'Error al registrar usuario.';
    }
  });
}


  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
