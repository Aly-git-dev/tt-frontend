import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { AnalyticsService } from '../../core/services/analytics.service';
import { AuthService } from '../../core/services/auth.service';
import { UserDTO } from '../../core/models/user.models';

@Component({
  selector: 'app-teacher-evaluation-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './teacher-evaluation-form.component.html',
  styleUrls: ['./teacher-evaluation-form.component.css']
})
export class TeacherEvaluationFormComponent implements OnDestroy {
  teacherId = '';
  appointmentId = '';

  loading = false;
  successMessage = '';
  errorMessage = '';

  readonly ratingOptions = [1, 2, 3, 4, 5];

  showTeacherSearchModal = false;
  teacherSearchTerm = '';
  teacherSearchLoading = false;
  teacherSearchError = '';
  teacherSearchResults: UserDTO[] = [];
  selectedTeacher: UserDTO | null = null;

  private userSearchDebounce?: ReturnType<typeof setTimeout>;

  form = this.fb.group({
    ratingClarity: [5, Validators.required],
    ratingKnowledge: [5, Validators.required],
    ratingSupport: [5, Validators.required],
    ratingPunctuality: [5, Validators.required],
    comment: [''],
    anonymous: [false]
  });

  constructor(
    private fb: FormBuilder,
    private analyticsService: AnalyticsService,
    private authService: AuthService
  ) {}

  ngOnDestroy(): void {
    if (this.userSearchDebounce) {
      clearTimeout(this.userSearchDebounce);
    }
  }

  openTeacherSearchModal(): void {
    this.showTeacherSearchModal = true;
    this.teacherSearchError = '';
  }

  closeTeacherSearchModal(): void {
    this.showTeacherSearchModal = false;
  }

  onTeacherSearchInput(): void {
    const query = this.teacherSearchTerm.trim();

    this.teacherSearchError = '';

    if (this.userSearchDebounce) {
      clearTimeout(this.userSearchDebounce);
    }

    if (!query) {
      this.teacherSearchResults = [];
      this.teacherSearchLoading = false;
      return;
    }

    this.teacherSearchLoading = true;

    this.userSearchDebounce = setTimeout(() => {
      this.analyticsService.searchTeachers(query).subscribe({
        next: (results) => {
          this.teacherSearchResults = (results ?? []).filter(user => this.isEvaluableTeacher(user));
        },
        error: (err) => {
          console.error('Error searching teachers', err);
          this.teacherSearchResults = [];
          this.teacherSearchError = 'No se pudo buscar docentes con rol PROFESOR.';
        },
        complete: () => {
          this.teacherSearchLoading = false;
        }
      });
    }, 300);
  }

  selectTeacher(user: UserDTO): void {
    if (!this.isEvaluableTeacher(user)) {
      this.selectedTeacher = null;
      this.teacherId = '';
      this.errorMessage = 'Sólo se pueden evaluar usuarios con rol PROFESOR. No se permiten alumnos ni administradores.';
      return;
    }

    this.selectedTeacher = user;
    this.teacherId = user.id;
    this.showTeacherSearchModal = false;
    this.successMessage = '';
    this.errorMessage = '';
  }

  getUserInitial(user: UserDTO | null): string {
    const source = user?.fullName || user?.emailInst || '?';
    return source.charAt(0).toUpperCase();
  }

  isEvaluableTeacher(user: UserDTO | null): boolean {
    const roles = (user?.roles ?? []).map(role => role.toUpperCase().replace(/^ROLE_/, ''));

    return user?.active !== false
      && roles.includes('PROFESOR')
      && !roles.includes('ALUMNO')
      && !roles.includes('ADMIN');
  }

  get averageRating(): number {
    const values = [
      Number(this.form.value.ratingClarity || 0),
      Number(this.form.value.ratingKnowledge || 0),
      Number(this.form.value.ratingSupport || 0),
      Number(this.form.value.ratingPunctuality || 0)
    ];

    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  get visibilityLabel(): string {
    return this.form.value.anonymous ? 'Anónima' : 'Con nombre visible';
  }

  submit(): void {
    if (this.form.invalid || !this.teacherId || !this.isEvaluableTeacher(this.selectedTeacher)) {
      this.form.markAllAsTouched();
      this.errorMessage = 'Completa los campos requeridos y selecciona un docente con rol PROFESOR.';
      return;
    }

    this.loading = true;
    this.successMessage = '';
    this.errorMessage = '';

    const anonymous = !!this.form.value.anonymous;

    this.analyticsService.createTeacherEvaluation({
      teacherId: this.teacherId,
      evaluatorId: anonymous ? null : this.authService.getCurrentUserId(),
      appointmentId: this.appointmentId || null,
      ratingClarity: this.form.value.ratingClarity as number,
      ratingKnowledge: this.form.value.ratingKnowledge as number,
      ratingSupport: this.form.value.ratingSupport as number,
      ratingPunctuality: this.form.value.ratingPunctuality as number,
      comment: this.form.value.comment || null,
      anonymous
    }).subscribe({
      next: () => {
        this.successMessage = 'Evaluación enviada correctamente.';
        this.form.reset({
          ratingClarity: 5,
          ratingKnowledge: 5,
          ratingSupport: 5,
          ratingPunctuality: 5,
          comment: '',
          anonymous: false
        });
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = err?.error?.mensaje || err?.error?.message || 'No se pudo registrar la evaluación.';
        this.loading = false;
      }
    });
  }
}
