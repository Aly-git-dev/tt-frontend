import { Component, OnDestroy } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormArray
} from '@angular/forms';
import { Router } from '@angular/router';

import { ForumService } from '../../core/services/forum.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import { ThreadCreateDto } from '../../core/models/forum.models';
import { ChatApiService } from '../../core/services/chat-api.service';
import { UserSearchResult } from '../../core/models/chat.models';

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
  readonly teacherEvaluationCategoryId = 9;

  teacherSearchTerm = '';
  teacherSearchLoading = false;
  teacherSearchError: string | null = null;
  teacherSearchResults: UserSearchResult[] = [];
  selectedTeacher: UserSearchResult | null = null;
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
    private chatApi: ChatApiService,
    private router: Router
  ) {
    this.form = this.fb.group({
      categoryId: [null, [Validators.required]],
      subareaId: [null],
      type: ['PREGUNTA', [Validators.required]],
      difficultyLevel: [3],
      title: ['', [Validators.required, Validators.minLength(5)]],
      body: ['', [Validators.required, Validators.minLength(10)]],
      attachments: this.fb.array([])
    });

    this.form.get('categoryId')?.valueChanges.subscribe(categoryId => {
      if (categoryId !== this.teacherEvaluationCategoryId) {
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
      this.chatApi.searchUsers(query).subscribe({
        next: results => {
          this.teacherSearchResults = results ?? [];
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

  selectTeacher(teacher: UserSearchResult): void {
    this.selectedTeacher = teacher;
    this.teacherSearchTerm = teacher.name || teacher.email;
    this.teacherSearchResults = [];
    this.teacherSearchError = null;
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

    if (this.attachments.length === 0) {
      this.addLinkAttachment();
    }
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

    if (this.attachments.length === 0) {
      this.showAttachmentPanel = false;
    }
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

    const payload: ThreadCreateDto = {
      categoryId: raw.categoryId,
      subareaId: raw.subareaId || null,
      type: raw.type,
      title: raw.title.trim(),
      body: raw.body.trim(),
      attachments: (raw.attachments || [])
        .filter((a: any) => a && (a.url || '').trim().length > 0)
        .map((a: any) => ({
          kind: a.kind,
          url: a.url.trim()
        }))
    };

    this.forumService.createThread(payload).subscribe({
      next: (created) => {
        const isQuestion = raw.type === 'PREGUNTA';
        const shouldCreateDifficultyEvent = isQuestion || this.isTeacherEvaluationThread;

        if (!shouldCreateDifficultyEvent) {
          this.resetForm();
          this.router.navigate(['/forums', created.id]);
          return;
        }

        this.analyticsService.createTopicDifficultyEvent({
          userId: null,
          teacherId: this.isTeacherEvaluationThread ? this.selectedTeacher?.id ?? null : null,
          categoryId: raw.categoryId,
          subareaId: raw.subareaId || null,
          threadId: created.id,
          appointmentId: null,
          videoMeetingId: null,
          sourceType: isQuestion ? 'FORUM_QUESTION' : 'TEACHER_OBSERVATION',
          difficultyLevel: raw.difficultyLevel || 3,
          notes: this.isTeacherEvaluationThread && this.selectedTeacher
            ? `Evaluación docente desde foro para ${this.selectedTeacher.name || this.selectedTeacher.email}: ${raw.title.trim()}`
            : `Dificultad registrada desde foro: ${raw.title.trim()}`
        }).subscribe({
          next: () => {
            this.resetForm();
            this.router.navigate(['/forums', created.id]);
          },
          error: (err) => {
            console.error('No se pudo registrar la dificultad del tema', err);
            this.resetForm();
            this.router.navigate(['/forums', created.id]);
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
    this.clearSelectedTeacher();

    while (this.attachments.length > 0) {
      this.attachments.removeAt(0);
    }

    this.form.reset({
      categoryId: null,
      subareaId: null,
      type: 'PREGUNTA',
      difficultyLevel: 3,
      title: '',
      body: ''
    });
  }
}
