import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {

  form: FormGroup;
  token = '';
  loading = false;
  error: string | null = null;
  success: string | null = null;

  constructor(
    fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService
  ) {
    this.form = fb.group({
      newPassword: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._-]).+$/)
      ]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordsMatchValidator });
  }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      this.token = params.get('token') ?? '';
    });
  }

  passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;

    if (newPassword !== confirmPassword) {
      return { passwordsMismatch: true };
    }

    return null;
  }

  onSubmit(): void {
    this.error = null;
    this.success = null;

    if (!this.token) {
      this.error = 'El enlace de recuperación no es válido.';
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error = 'Verifica los datos capturados.';
      return;
    }

    this.loading = true;

    const { newPassword, confirmPassword } = this.form.value;

    this.auth.resetPassword(this.token, newPassword, confirmPassword).subscribe({
      next: (res) => {
        this.loading = false;
        this.success = res.mensaje || res['message'] || 'Contraseña actualizada correctamente.';
        this.form.reset();

        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1800);
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.mensaje || err?.error?.message || 'No se pudo restablecer la contraseña.';
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}