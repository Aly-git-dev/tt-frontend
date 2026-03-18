import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent {

  form: FormGroup;
  error: string | null = null;
  success: string | null = null;
  loading = false;

  constructor(
    fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.form = fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void {
    this.error = null;
    this.success = null;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error = 'Por favor ingresa un correo institucional válido.';
      return;
    }

    this.loading = true;

    const email = this.form.value.email;

    this.auth.forgotPassword(email).subscribe({
      next: (res) => {
        this.loading = false;
        this.success = res.mensaje || res['message'] || 'Si el correo es válido, se enviaron instrucciones.';
        this.form.reset();
      },
      error: () => {
        this.loading = false;
        this.error = 'No se pudo procesar la solicitud.';
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}