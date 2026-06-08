import { Component, OnDestroy } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormArray
} from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import { ForumService } from '../../core/services/forum.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import { ThreadCreateDto } from '../../core/models/forum.models';
import { UserDTO } from '../../core/models/user.models';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-new-thread',
  templateUrl: './new-thread.component.html',
  styleUrls: ['./new-thread.component.css']
})
export class NewThreadComponent implements OnDestroy {
  form: FormGroup;
  submitting = false;
  error: string | null = null;

  showAttachmentPanel = false;
  selectedFiles: File[] = [];
  isDraggingFiles = false;
  readonly teacherEvaluationCategoryId = 9;
  readonly ratingOptions = [1, 2, 3, 4, 5];

  teacherSearchTerm = '';
  teacherSearchLoading = false;
  teacherSearchError: string | null = null;
  teacherSearchResults: UserDTO[] = [];
  selectedTeacher: UserDTO | null = null;
  private teacherSearchDebounce?: ReturnType<typeof setTimeout>;

  threadTypes = [
    { value: 'PREGUNTA', label: 'Pregunta' },
    { value: 'DISCUSSION', label: 'Discusión' },
    { value: 'ANUNCIO', label: 'Anuncio' }
  ];

  categories = [
    { id: 1, label: 'Inteligencia Artificial' },
    { id: 2, label: 'Sistemas Computacionales' },
    { id: 3, label: 'Mecatrónica' },
    { id: 4, label: 'Alimentos' },
    { id: 5, label: 'Ambiental' },
    { id: 6, label: 'Metalúrgica' },
    { id: 7, label: 'Eventos y actividades' },
    { id: 8, label: 'Clubes' },
    { id: 9, label: 'Evaluación docente' }
  ];

  subareas: { id: number; label: string }[] = [
  // { id: 101, label: 'Cálculo Diferencial' },
  // { id: 102, label: 'Programación I' },
];

  constructor(
    private fb: FormBuilder,
    private forumService: ForumService,
    private analyticsService: AnalyticsService,
    private authService: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      categoryId: [null, [Validators.required]],
      subareaId: [null],
      type: ['PREGUNTA', [Validators.required]],
      difficultyLevel: [3],
      title: ['', [Validators.required, Validators.minLength(5)]],
      body: ['', [Validators.required, Validators.minLength(10)]],
      ratingClarity: [5, [Validators.required]],
      ratingKnowledge: [5, [Validators.required]],
      ratingSupport: [5, [Validators.required]],
      ratingPunctuality: [5, [Validators.required]],
      evaluationComment: [''],
      anonymous: [false],
      attachments: this.fb.array([])
    });

    this.form.get('categoryId')?.valueChanges.subscribe(categoryId => {
      const isTeacherEvaluation = categoryId === this.teacherEvaluationCategoryId;
      this.updateThreadFieldsForCategory(isTeacherEvaluation);

      if (!isTeacherEvaluation) {
        this.clearSelectedTeacher();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.teacherSearchDebounce) {
      clearTimeout(this.teacherSearchDebounce);
    }
  }

  get attachments(): FormArray {
    return this.form.get('attachments') as FormArray;
  }

  get bodyCtrl() {
    return this.form.get('body');
  }

  get isTeacherEvaluationThread(): boolean {
    return this.form.get('categoryId')?.value === this.teacherEvaluationCategoryId;
  }

  onTeacherSearchInput(): void {
    const query = this.teacherSearchTerm.trim();
    this.teacherSearchError = null;

    if (this.teacherSearchDebounce) {
      clearTimeout(this.teacherSearchDebounce);
    }

    if (!query) {
      this.teacherSearchResults = [];
      this.teacherSearchLoading = false;
      return;
    }

    this.teacherSearchLoading = true;

    this.teacherSearchDebounce = setTimeout(() => {
      this.analyticsService.searchTeachers(query).subscribe({
        next: users => {
          this.teacherSearchResults = (users ?? []).filter(user => this.isEvaluableTeacher(user));
        },
        error: err => {
          console.error('Error buscando docentes', err);
          this.teacherSearchResults = [];
          this.teacherSearchError = 'No se pudo buscar docentes.';
        },
        complete: () => {
          this.teacherSearchLoading = false;
        }
      });
    }, 300);
  }

  selectTeacher(teacher: UserDTO): void {
    if (!this.isEvaluableTeacher(teacher)) {
      this.selectedTeacher = null;
      this.teacherSearchError = 'Sólo se pueden evaluar usuarios con rol PROFESOR.';
      return;
    }

    this.selectedTeacher = teacher;
    this.teacherSearchTerm = teacher.fullName || teacher.emailInst;
    this.teacherSearchResults = [];
    this.teacherSearchError = null;
  }

  isEvaluableTeacher(user: UserDTO | null): boolean {
    const roles = (user?.roles ?? []).map(role => role.toUpperCase().replace(/^ROLE_/, ''));

    return user?.active !== false
      && roles.includes('PROFESOR')
      && !roles.includes('ALUMNO')
      && !roles.includes('ADMIN');
  }

  clearSelectedTeacher(): void {
    this.selectedTeacher = null;
    this.teacherSearchTerm = '';
    this.teacherSearchResults = [];
    this.teacherSearchError = null;
    this.teacherSearchLoading = false;
  }

  openAttachmentPanel(): void {
    this.showAttachmentPanel = true;
  }

  closeAttachmentPanel(): void {
    this.showAttachmentPanel = false;
  }

  addLinkAttachment(): void {
    this.attachments.push(
      this.fb.group({
        kind: ['LINK', Validators.required],
        url: ['', [Validators.required, Validators.minLength(5)]]
      })
    );
  }

  removeLinkAttachment(index: number): void {
    this.attachments.removeAt(index);

    if (this.attachments.length === 0 && this.selectedFiles.length === 0) {
      this.showAttachmentPanel = false;
    }
  }

  onFileInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.addSelectedFiles(input.files);
    input.value = '';
  }

  onFileDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingFiles = true;
  }

  onFileDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingFiles = false;
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingFiles = false;
    this.addSelectedFiles(event.dataTransfer?.files ?? null);
  }

  removeSelectedFile(index: number): void {
    this.selectedFiles.splice(index, 1);

    if (this.attachments.length === 0 && this.selectedFiles.length === 0) {
      this.showAttachmentPanel = false;
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  private addSelectedFiles(files: FileList | null): void {
    if (!files?.length) return;

    const existing = new Set(this.selectedFiles.map(file => this.getFileKey(file)));
    const incoming = Array.from(files).filter(file => !existing.has(this.getFileKey(file)));

    this.selectedFiles = [...this.selectedFiles, ...incoming];
    this.showAttachmentPanel = true;
  }

  private getFileKey(file: File): string {
    return `${file.name}-${file.size}-${file.lastModified}`;
  }

  insertCodeTemplate(): void {
    const template = '\n\n```cpp\n// Escribe tu código aquí\n```\n';
    this.appendToBody(template);
  }

  insertLatexTemplate(): void {
    const template = '\n\n$$\n% Escribe tu expresión LaTeX aquí\n$$\n';
    this.appendToBody(template);
  }

  private appendToBody(fragment: string): void {
    const ctrl = this.bodyCtrl;
    if (!ctrl) return;

    const current = ctrl.value || '';
    ctrl.setValue(current + fragment);
    ctrl.markAsDirty();
  }

  onSubmit(): void {
    this.error = null;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.isTeacherEvaluationThread && !this.selectedTeacher) {
      this.error = 'Selecciona el profesor relacionado con la evaluación docente.';
      return;
    }

    this.submitting = true;
    const raw = this.form.value;
    const teacherName = this.selectedTeacher?.fullName || this.selectedTeacher?.emailInst || 'Docente seleccionado';
    const body = this.isTeacherEvaluationThread
      ? this.buildTeacherEvaluationThreadBody(raw)
      : raw.body.trim();

    const payload: ThreadCreateDto = {
      categoryId: raw.categoryId,
      subareaId: this.isTeacherEvaluationThread ? null : raw.subareaId || null,
      type: this.isTeacherEvaluationThread ? 'DISCUSSION' : raw.type,
      title: this.isTeacherEvaluationThread ? `Evaluación docente: ${teacherName}` : raw.title.trim(),
      body,
      attachments: this.isTeacherEvaluationThread ? [] : (raw.attachments || [])
        .filter((a: any) => a && (a.url || '').trim().length > 0)
        .map((a: any) => ({
          kind: a.kind,
          url: a.url.trim()
        }))
    };

    this.forumService.createThread(payload).subscribe({
      next: (created) => {
        if (this.selectedFiles.length) {
          this.forumService.addThreadAttachments(created.id, this.selectedFiles).subscribe({
            error: err => console.error('Error subiendo adjuntos del hilo', err)
          });
        }

        const isQuestion = raw.type === 'PREGUNTA';
        const shouldCreateDifficultyEvent = !this.isTeacherEvaluationThread && isQuestion;
        const currentUserId = this.authService.getCurrentUserId();
        const analyticsRequests: any[] = [];

        if (currentUserId) {
          analyticsRequests.push(
            this.analyticsService.createTopicInterestEvent({
              userId: currentUserId,
              categoryId: raw.categoryId,
              subareaId: raw.subareaId || null,
              threadId: created.id,
              appointmentId: null,
              videoMeetingId: null,
              sourceType: 'THREAD_CREATE',
              weight: this.isTeacherEvaluationThread ? 3 : 2
            })
          );
        }

        if (this.isTeacherEvaluationThread && this.selectedTeacher) {
          analyticsRequests.push(
            this.analyticsService.createTeacherEvaluation({
              teacherId: this.selectedTeacher.id,
              evaluatorId: raw.anonymous ? null : currentUserId,
              appointmentId: null,
              ratingClarity: Number(raw.ratingClarity || 5),
              ratingKnowledge: Number(raw.ratingKnowledge || 5),
              ratingSupport: Number(raw.ratingSupport || 5),
              ratingPunctuality: Number(raw.ratingPunctuality || 5),
              comment: raw.evaluationComment?.trim() || null,
              anonymous: !!raw.anonymous
            })
          );
        }

        if (shouldCreateDifficultyEvent) {
          analyticsRequests.push(this.analyticsService.createTopicDifficultyEvent({
            userId: currentUserId || null,
            teacherId: this.isTeacherEvaluationThread ? this.selectedTeacher?.id ?? null : null,
            categoryId: raw.categoryId,
            subareaId: raw.subareaId || null,
            threadId: created.id,
            appointmentId: null,
            videoMeetingId: null,
            sourceType: isQuestion ? 'FORUM_QUESTION' : 'TEACHER_OBSERVATION',
            difficultyLevel: raw.difficultyLevel || 3,
            notes: this.isTeacherEvaluationThread && this.selectedTeacher
              ? `Evaluación docente desde foro para ${this.selectedTeacher.fullName || this.selectedTeacher.emailInst}: ${raw.title.trim()}`
              : `Dificultad registrada desde foro: ${raw.title.trim()}`
          }));
        }

        if (analyticsRequests.length === 0) {
          this.resetForm();
          this.router.navigate(['/forums', created.id]);
          return;
        }

        forkJoin(analyticsRequests).subscribe({
          next: () => {
            this.resetForm();
            this.router.navigate(['/forums', created.id]);
          },
          error: (err) => {
            console.error('No se pudieron registrar los datos de analítica', err);
            this.submitting = false;
            this.error = this.isTeacherEvaluationThread
              ? 'El hilo se creó, pero no se pudo registrar la evaluación docente. Revisa conexión/API e intenta registrar la evaluación desde Analítica.'
              : 'El hilo se creó, pero no se pudieron registrar los datos de analítica.';
          }
        });
      },
      error: (err) => {
        console.error('Error al crear el hilo', err);
        this.submitting = false;
        this.error = 'No se pudo crear el hilo. Intenta de nuevo más tarde.';
      }
    });
  }

  private resetForm(): void {
    this.submitting = false;
    this.error = null;
    this.showAttachmentPanel = false;
    this.selectedFiles = [];
    this.isDraggingFiles = false;
    this.clearSelectedTeacher();

    while (this.attachments.length > 0) {
      this.attachments.removeAt(0);
    }

    this.form.reset({
      categoryId: null,
      subareaId: null,
      type: 'PREGUNTA',
      difficultyLevel: 3,
      ratingClarity: 5,
      ratingKnowledge: 5,
      ratingSupport: 5,
      ratingPunctuality: 5,
      evaluationComment: '',
      anonymous: false,
      title: '',
      body: ''
    });
    this.updateThreadFieldsForCategory(false);
  }

  private buildTeacherEvaluationThreadBody(raw: any): string {
    const teacherName = this.selectedTeacher?.fullName || this.selectedTeacher?.emailInst || 'Docente seleccionado';
    const anonymousLabel = raw.anonymous ? 'Anónima' : 'Con nombre visible';
    const comment = raw.evaluationComment?.trim();

    return [
      '',
      '### Evaluación docente',
      '',
      `- Docente evaluado: ${teacherName}`,
      `- Modalidad: ${anonymousLabel}`,
      `- Claridad: ${Number(raw.ratingClarity || 5)} / 5`,
      `- Conocimiento: ${Number(raw.ratingKnowledge || 5)} / 5`,
      `- Apoyo: ${Number(raw.ratingSupport || 5)} / 5`,
      `- Puntualidad: ${Number(raw.ratingPunctuality || 5)} / 5`,
      '',
      comment ? `Comentario para analítica: ${comment}` : ''
    ].filter(line => line !== '').join('\n');
  }

  private updateThreadFieldsForCategory(isTeacherEvaluation: boolean): void {
    const titleCtrl = this.form.get('title');
    const bodyCtrl = this.form.get('body');

    if (isTeacherEvaluation) {
      titleCtrl?.clearValidators();
      bodyCtrl?.clearValidators();
      this.form.patchValue({
        subareaId: null,
        type: 'DISCUSSION',
        difficultyLevel: 3,
        title: '',
        body: ''
      }, { emitEvent: false });
      this.showAttachmentPanel = false;

      while (this.attachments.length > 0) {
        this.attachments.removeAt(0);
      }

      this.selectedFiles = [];
      this.isDraggingFiles = false;
    } else {
      titleCtrl?.setValidators([Validators.required, Validators.minLength(5)]);
      bodyCtrl?.setValidators([Validators.required, Validators.minLength(10)]);
    }

    titleCtrl?.updateValueAndValidity({ emitEvent: false });
    bodyCtrl?.updateValueAndValidity({ emitEvent: false });
  }
}
