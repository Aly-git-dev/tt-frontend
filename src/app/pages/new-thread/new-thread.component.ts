import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormArray
} from '@angular/forms';
import { ForumService } from '../../core/services/forum.service';
import { ThreadCreateDto } from '../../core/models/forum.models';
import { Router } from '@angular/router';

@Component({
  selector: 'app-new-thread',
  templateUrl: './new-thread.component.html',
  styleUrls: ['./new-thread.component.css']
})
export class NewThreadComponent {

  form: FormGroup;
  submitting = false;
  error: string | null = null;

  showAttachmentPanel = false;

  // Opciones de tipo
  threadTypes = [
    { value: 'PREGUNTA',  label: 'Pregunta' },
    { value: 'DISCUSSION', label: 'Discusión' },
    { value: 'ANUNCIO',   label: 'Anuncio' }
  ];

  // Catálogo local de categorías (placeholder)
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

  subareas = [
    // { id: 101, label: 'Cálculo Diferencial' },
    // { id: 102, label: 'Programación I' },
  ];

  constructor(
    private fb: FormBuilder,
    private forumService: ForumService,
    private router: Router
  ) {
    this.form = this.fb.group({
      categoryId: [null, [Validators.required]],
      subareaId: [null],
      type: ['PREGUNTA', [Validators.required]],
      title: ['', [Validators.required, Validators.minLength(5)]],
      body: ['', [Validators.required, Validators.minLength(10)]],
      attachments: this.fb.array([])
    });
  }

  // ======= Getters =======

  get attachments(): FormArray {
    return this.form.get('attachments') as FormArray;
  }

  get bodyCtrl() {
    return this.form.get('body');
  }

  // ======= Panel de enlaces =======

  openAttachmentPanel(): void {
    this.showAttachmentPanel = true;

    // Si no hay ninguno, creamos un primer renglón
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

  // ======= Helpers para insertar bloques de código / LaTeX =======

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
    if (!ctrl) { return; }

    const current = ctrl.value || '';
    ctrl.setValue(current + fragment);
    ctrl.markAsDirty();
  }

  // ======= Enviar formulario =======

  onSubmit(): void {
    this.error = null;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
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
        this.submitting = false;
        this.form.reset({
          categoryId: null,
          subareaId: null,
          type: 'PREGUNTA',
          title: '',
          body: '',
          attachments: []
        });
        this.showAttachmentPanel = false;
        this.router.navigate(['/forums', created.id]);
      },
      error: () => {
        this.submitting = false;
        this.error = 'No se pudo crear el hilo. Intenta de nuevo más tarde.';
      }
    });
  }
}
