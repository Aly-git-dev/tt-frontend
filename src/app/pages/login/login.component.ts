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
      username: ['', [Validators.required]],
    password: ['', [Validators.required]]
    });
  }

  onSubmit(): void {
    this.error = null;

    // 1) Validación en front: campos vacíos
    if (this.form.invalid) {
      this.form.markAllAsTouched(); // marca los campos para que se vean como "tocados"
      this.error = 'Por favor ingresa usuario y contraseña.';
      return;
    }

    this.loading = true;

    this.auth.login(this.form.value).subscribe({
      next: res => {
        this.loading = false;

        if (res.estado === 1) {
          this.router.navigate(['/profile']);
        } else {
          this.error = res.mensaje || 'Error al iniciar sesión (estado 0)';
        }
      },
      error: err => {
        this.loading = false;
        this.error = 'Error al iniciar sesión';
      }
    });
  }

goToRegister(): void {
  this.router.navigate(['/register']);
}
}
