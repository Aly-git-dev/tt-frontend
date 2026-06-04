import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-resend-verification',
  templateUrl: './resend-verification.component.html',
  styleUrls: ['./resend-verification.component.css']
})
export class ResendVerificationComponent {

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
      emailInst: [
        '',
        [
          Validators.required,
          Validators.email,
          Validators.pattern(/@(upiiz|alumno)\.ipn\.mx$/i)
        ]
      ]
    });
  }

  onSubmit(): void {
    this.error = null;
    this.success = null;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error = 'Por favor ingresa un correo institucional valido.';
      return;
    }

    const emailInst = this.form.value.emailInst;
    const appBaseUrl = typeof window !== 'undefined' ? window.location.origin : undefined;

    this.loading = true;

    this.auth.resendVerification(emailInst, appBaseUrl).subscribe({
      next: res => {
        this.loading = false;

        const requestSucceeded = res.estado === 1 || (res.estado === undefined && !!(res.mensaje || res['message']));

        if (requestSucceeded) {
          this.success = res.mensaje || res['message'] || 'Se envio un nuevo correo de verificacion.';
          this.form.reset();
        } else {
          this.error = res.mensaje || res['message'] || 'No se pudo reenviar el correo de verificacion.';
        }
      },
      error: err => {
        this.loading = false;
        this.error =
          err?.error?.mensaje ||
          err?.error?.message ||
          'No se pudo reenviar el correo de verificacion.';
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
