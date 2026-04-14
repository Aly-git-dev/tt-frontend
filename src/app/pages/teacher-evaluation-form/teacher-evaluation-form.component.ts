import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { AnalyticsService } from '../../core/services/analytics.service';
import { ChatApiService } from '../../core/services/chat-api.service';

@Component({
  selector: 'app-teacher-evaluation-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './teacher-evaluation-form.component.html',
  styleUrls: ['./teacher-evaluation-form.component.css']
})
export class TeacherEvaluationFormComponent implements OnDestroy {
  teacherId = '';
  evaluatorId = '';
  appointmentId = '';

  loading = false;
  successMessage = '';
  errorMessage = '';

  readonly ratingOptions = [1, 2, 3, 4, 5];

  showTeacherSearchModal = false;
  teacherSearchTerm = '';
  teacherSearchLoading = false;
  teacherSearchError = '';
  teacherSearchResults: any[] = [];
  selectedTeacher: any = null;

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
    private chatApi: ChatApiService
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
      this.chatApi.searchUsers(query).subscribe({
        next: (results) => {
          this.teacherSearchResults = results ?? [];
        },
        error: (err) => {
          console.error('Error searching teachers', err);
          this.teacherSearchResults = [];
          this.teacherSearchError = 'No se pudo buscar docentes.';
        },
        complete: () => {
          this.teacherSearchLoading = false;
        }
      });
    }, 300);
  }

  selectTeacher(user: any): void {
    this.selectedTeacher = user;
    this.teacherId = user.id;
    this.showTeacherSearchModal = false;
    this.successMessage = '';
    this.errorMessage = '';
  }

  getUserInitial(user: any): string {
    const source = user?.name || user?.email || '?';
    return source.charAt(0).toUpperCase();
  }

  submit(): void {
    if (this.form.invalid || !this.teacherId) {
      this.form.markAllAsTouched();
      this.errorMessage = 'Completa los campos requeridos y selecciona un docente.';
      return;
    }

    this.loading = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.analyticsService.createTeacherEvaluation({
      teacherId: this.teacherId,
      evaluatorId: this.evaluatorId || null,
      appointmentId: this.appointmentId || null,
      ratingClarity: this.form.value.ratingClarity as number,
      ratingKnowledge: this.form.value.ratingKnowledge as number,
      ratingSupport: this.form.value.ratingSupport as number,
      ratingPunctuality: this.form.value.ratingPunctuality as number,
      comment: this.form.value.comment || null,
      anonymous: !!this.form.value.anonymous
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
        this.errorMessage = err?.error?.message || 'No se pudo registrar la evaluación.';
        this.loading = false;
      }
    });
  }
}