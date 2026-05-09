import {
  Component,
  OnInit,
  ElementRef,
  ViewChild,
  AfterViewInit,
  AfterViewChecked
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';

import { ForumService } from '../../core/services/forum.service';
import { MarkdownService } from '../../core/services/markdown.service';

import {
  ThreadDetailDto,
  PostDto,
  PostCreateDto,
  AttachmentDto,
  ReportCreateDto,
  ThreadUpdateDto,
  PostUpdateDto
} from '../../core/models/forum.models';

import { AuthService } from '../../core/services/auth.service';

declare const hljs: any;
declare const mermaid: any;
declare const MathJax: any;

type PostVm = PostDto & { renderedBody?: string };

@Component({
  selector: 'app-thread-detail',
  templateUrl: './thread-detail.component.html',
  styleUrls: ['./thread-detail.component.css']
})
export class ThreadDetailComponent implements OnInit, AfterViewInit, AfterViewChecked {

  @ViewChild('threadContainer') threadContainer!: ElementRef<HTMLElement>;

  threadId!: number;
  thread: ThreadDetailDto | null = null;

  threadRenderedBody = '';
  private postsVmInternal: PostVm[] = [];

  loading = false;
  error: string | null = null;

  replyForm!: FormGroup;
  submittingReply = false;
  replyError: string | null = null;

  editThreadMode = false;
  editThreadForm!: FormGroup;
  savingThread = false;

  editingPostId: number | null = null;
  editPostForm!: FormGroup;
  savingPost = false;

  actionError: string | null = null;

  private viewInitialized = false;
  private needsEnhance = false;

  attachmentKinds = [
    { value: 'LINK', label: 'Enlace' },
    { value: 'IMAGEN', label: 'Imagen (URL)' },
    { value: 'VIDEO', label: 'Video (URL)' },
    { value: 'AUDIO', label: 'Audio (URL)' }
  ];

  showReportModal = false;
  reportingTarget: { threadId?: number | null; postId?: number | null } | null = null;
  reportForm!: FormGroup;
  reportSending = false;
  reportSuccess: string | null = null;
  reportError: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private forumService: ForumService,
    private markdownService: MarkdownService,
    private fb: FormBuilder,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.threadId = Number(this.route.snapshot.paramMap.get('id'));
    this.buildForm();
    this.buildReportForm();
    this.buildEditForms();
    this.loadThread();
  }

  ngAfterViewInit(): void {
    this.viewInitialized = true;

    if (this.needsEnhance) {
      this.enhanceContent();
      this.needsEnhance = false;
    }
  }

  ngAfterViewChecked(): void {
    if (this.viewInitialized && this.needsEnhance) {
      this.enhanceContent();
      this.needsEnhance = false;
    }
  }

  get posts(): PostVm[] {
    return this.postsVmInternal;
  }

  get attachmentsArray(): FormArray {
    return this.replyForm.get('attachments') as FormArray;
  }

  get attachmentGroups(): FormGroup[] {
    return this.attachmentsArray.controls as FormGroup[];
  }

  getInitial(name?: string | null): string {
    if (!name) return '?';
    const trimmed = name.trim();
    return trimmed ? trimmed.charAt(0).toUpperCase() : '?';
  }

  private buildForm(): void {
    this.replyForm = this.fb.group({
      body: ['', [Validators.required, Validators.minLength(5)]],
      attachments: this.fb.array([])
    });
  }

  private buildReportForm(): void {
    this.reportForm = this.fb.group({
      reasonCode: ['', [Validators.required]],
      description: ['']
    });
  }

  private buildEditForms(): void {
    this.editThreadForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5)]],
      body: ['', [Validators.required, Validators.minLength(5)]],
      type: ['', [Validators.required]]
    });

    this.editPostForm = this.fb.group({
      body: ['', [Validators.required, Validators.minLength(5)]]
    });
  }

  private loadThread(): void {
    this.loading = true;
    this.error = null;

    this.forumService.getThread(this.threadId).subscribe({
      next: (thread) => {
        if (thread.status !== 'ABIERTO') {
          this.thread = null;
          this.postsVmInternal = [];
          this.error = 'Este hilo ya no está disponible.';
          this.loading = false;
          return;
        }

        this.setThreadState(thread);
        this.loading = false;
        this.needsEnhance = true;
      },
      error: (err) => {
        console.error('Error loading thread', err);
        this.error = 'No se pudo cargar el hilo.';
        this.loading = false;
      }
    });
  }

  private setThreadState(thread: ThreadDetailDto): void {
    this.thread = thread;
    this.threadRenderedBody = this.renderBody(thread.body || '');

    this.postsVmInternal = (thread.posts || [])
      .filter(post => post.status === 'VISIBLE')
      .map(post => ({
        ...post,
        renderedBody: this.renderBody(post.body || '')
      }));
  }

  private renderBody(raw: string): string {
    return this.markdownService.render(raw);
  }

  // ==========================
  // LIKE HILO
  // ==========================

  toggleThreadLike(): void {
    if (!this.thread) return;

    const request$ = this.thread.likedByMe
      ? this.forumService.unlikeThread(this.thread.id)
      : this.forumService.likeThread(this.thread.id);

    request$.subscribe({
      next: (updated) => {
        this.setThreadState(updated);
        this.needsEnhance = true;
        this.showToast(updated.likedByMe ? 'Te gustó este hilo ❤️' : 'Like eliminado');
      },
      error: (err) => {
        console.error('Error actualizando like del hilo', err);
        this.actionError = 'No se pudo actualizar el like del hilo.';
      }
    });
  }

  // ==========================
  // EDITAR / ELIMINAR HILO
  // ==========================

  startEditThread(): void {
    if (!this.thread) return;

    this.editThreadMode = true;
    this.actionError = null;

    this.editThreadForm.patchValue({
      title: this.thread.title,
      body: this.thread.body,
      type: this.thread.type
    });
  }

  cancelEditThread(): void {
    this.editThreadMode = false;
    this.actionError = null;
  }

  saveThreadEdit(): void {
    if (!this.thread || this.editThreadForm.invalid) {
      this.editThreadForm.markAllAsTouched();
      return;
    }

    const raw = this.editThreadForm.value;

    const payload: ThreadUpdateDto = {
      title: raw.title,
      body: raw.body,
      type: raw.type
    };

    this.savingThread = true;
    this.actionError = null;

    this.forumService.updateThread(this.thread.id, payload).subscribe({
      next: (updated) => {
        this.setThreadState(updated);
        this.editThreadMode = false;
        this.savingThread = false;
        this.needsEnhance = true;
      },
      error: (err) => {
        console.error('Error editando hilo', err);
        this.savingThread = false;
        this.actionError = 'No se pudo editar el hilo.';
      }
    });
  }

  deleteThread(): void {
    if (!this.thread) return;

    const ok = confirm('¿Seguro que quieres eliminar/cerrar este hilo?');
    if (!ok) return;

    this.forumService.deleteThread(this.thread.id).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error('Error eliminando hilo', err);
        this.actionError = 'No se pudo eliminar el hilo.';
      }
    });
  }

  // ==========================
  // LIKE POST
  // ==========================

  togglePostLike(post: PostVm): void {
    const request$ = post.likedByMe
      ? this.forumService.unlikePost(post.id)
      : this.forumService.likePost(post.id);

    request$.subscribe({
      next: (updated) => {
        this.replacePost(updated);
        this.needsEnhance = true;
      },
      error: (err) => {
        console.error('Error actualizando like del post', err);
        this.actionError = 'No se pudo actualizar el like de la respuesta.';
      }
    });
  }

  // ==========================
  // EDITAR / ELIMINAR POST
  // ==========================

  startEditPost(post: PostVm): void {
    this.editingPostId = post.id;
    this.actionError = null;

    this.editPostForm.patchValue({
      body: post.body
    });
  }

  cancelEditPost(): void {
    this.editingPostId = null;
    this.actionError = null;
  }

  savePostEdit(post: PostVm): void {
    if (this.editPostForm.invalid) {
      this.editPostForm.markAllAsTouched();
      return;
    }

    const payload: PostUpdateDto = {
      body: this.editPostForm.value.body
    };

    this.savingPost = true;
    this.actionError = null;

    this.forumService.updatePost(post.id, payload).subscribe({
      next: (updated) => {
        this.replacePost(updated);
        this.editingPostId = null;
        this.savingPost = false;
        this.needsEnhance = true;
      },
      error: (err) => {
        console.error('Error editando respuesta', err);
        this.savingPost = false;
        this.actionError = 'No se pudo editar la respuesta.';
      }
    });
  }

  deletePost(post: PostVm): void {
    const ok = confirm('¿Seguro que quieres eliminar esta respuesta?');
    if (!ok) return;

    this.forumService.deletePost(post.id).subscribe({
      next: () => {
        this.postsVmInternal = this.postsVmInternal.filter(p => p.id !== post.id);

        if (this.thread) {
          this.thread.answersCount = Math.max(0, this.thread.answersCount - 1);
        }
      },
      error: (err) => {
        console.error('Error eliminando respuesta', err);
        this.actionError = 'No se pudo eliminar la respuesta.';
      }
    });
  }

  private replacePost(updated: PostDto): void {
    const vm: PostVm = {
      ...updated,
      renderedBody: this.renderBody(updated.body || '')
    };

    this.postsVmInternal = this.postsVmInternal.map(post =>
      post.id === updated.id ? vm : post
    );
  }

  // ==========================
  // RESPUESTAS
  // ==========================

  addAttachmentRow(): void {
    this.attachmentsArray.push(
      this.fb.group({
        kind: ['LINK', Validators.required],
        url: ['', Validators.required]
      })
    );
  }

  removeAttachmentRow(index: number): void {
    this.attachmentsArray.removeAt(index);
  }

  onSubmitReply(): void {
    if (this.replyForm.invalid || !this.thread) {
      this.replyForm.markAllAsTouched();
      return;
    }

    const raw = this.replyForm.value;

    const attachmentsPayload: AttachmentDto[] = (raw.attachments || [])
      .filter((a: any) => a && (a.url || '').trim().length > 0)
      .map((a: any) => ({
        kind: a.kind,
        url: a.url.trim()
      }));

    const payload: PostCreateDto = {
      body: raw.body,
      attachments: attachmentsPayload
    };

    this.submittingReply = true;
    this.replyError = null;

    this.forumService.createPost(this.threadId, payload).subscribe({
      next: (created) => {
        const vm: PostVm = {
          ...created,
          renderedBody: this.renderBody(created.body || '')
        };

        this.postsVmInternal.push(vm);

        if (this.thread) {
          this.thread.answersCount++;
        }

        this.replyForm.reset();
        this.attachmentsArray.clear();
        this.replyForm.patchValue({ body: '' });

        this.submittingReply = false;
        this.needsEnhance = true;
      },
      error: (err) => {
        console.error('Error creando respuesta', err);
        this.replyError = 'No se pudo enviar tu respuesta.';
        this.submittingReply = false;
      }
    });
  }

  // ==========================
  // REPORTES
  // ==========================

  openReportThread(): void {
    if (!this.thread) return;

    this.reportingTarget = { threadId: this.thread.id, postId: null };
    this.reportForm.reset();
    this.reportSuccess = null;
    this.reportError = null;
    this.showReportModal = true;
  }

  openReportPost(post: PostDto): void {
    this.reportingTarget = { threadId: null, postId: post.id };
    this.reportForm.reset();
    this.reportSuccess = null;
    this.reportError = null;
    this.showReportModal = true;
  }

  closeReportModal(): void {
    if (this.reportSending) return;

    this.showReportModal = false;
    this.reportingTarget = null;
  }

  submitReport(): void {
    if (!this.reportingTarget) return;

    if (this.reportForm.invalid) {
      this.reportForm.markAllAsTouched();
      return;
    }

    const raw = this.reportForm.value;

    const payload: ReportCreateDto = {
      threadId: this.reportingTarget.threadId ?? null,
      postId: this.reportingTarget.postId ?? null,
      reasonCode: raw.reasonCode,
      description: raw.description?.trim() || undefined
    };

    this.reportSending = true;
    this.reportSuccess = null;
    this.reportError = null;

    this.forumService.reportContent(payload).subscribe({
      next: () => {
        this.reportSending = false;
        this.reportSuccess = '¡Reporte enviado! Gracias por ayudar a mantener la comunidad segura.';

        setTimeout(() => this.closeReportModal(), 1200);
      },
      error: (err) => {
        console.error('Error enviando reporte', err);
        this.reportSending = false;
        this.reportError = 'No se pudo enviar el reporte. Intenta de nuevo más tarde.';
      }
    });
  }

  // ==========================
  // ENHANCE CONTENT
  // ==========================

  private enhanceContent(): void {
    if (!this.threadContainer) return;

    const el = this.threadContainer.nativeElement;

    if (typeof hljs !== 'undefined') {
      el.querySelectorAll('pre code').forEach((block: any) => {
        if (!block.classList.contains('hljs')) {
          hljs.highlightElement(block);
        }
      });
    }

    if (typeof mermaid !== 'undefined') {
      const mermaidBlocks = el.querySelectorAll('pre code.language-mermaid');

      mermaidBlocks.forEach((codeEl: any) => {
        const parentPre = codeEl.parentElement;
        const codeText = codeEl.textContent || '';

        const div = document.createElement('div');
        div.className = 'mermaid';
        div.textContent = codeText;

        if (parentPre && parentPre.parentElement) {
          parentPre.parentElement.replaceChild(div, parentPre);
        }
      });

      mermaid.run({ querySelector: '.mermaid' });
    }

    if (typeof MathJax !== 'undefined' && MathJax.typesetPromise) {
      MathJax.typesetPromise([el]).catch((err: any) =>
        console.error('MathJax error', err)
      );
    }
  }

  isDirectVideo(url: string | null | undefined): boolean {
    if (!url) return false;
    return /\.(mp4|webm|ogg)$/i.test(url);
  }

  isDirectAudio(url: string | null | undefined): boolean {
    if (!url) return false;
    return /\.(mp3|wav|ogg)$/i.test(url);
  }

  getYoutubeEmbedUrl(url: string | null | undefined): string | null {
    if (!url) return null;

    let match = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
    if (match?.[1]) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }

    match = url.match(/v=([a-zA-Z0-9_-]+)/);
    if (match?.[1]) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }

    match = url.match(/shorts\/([a-zA-Z0-9_-]+)/);
    if (match?.[1]) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }

    return null;
  }
  toastMessage: string | null = null;

showToast(message: string): void {
  this.toastMessage = message;
  setTimeout(() => {
    this.toastMessage = null;
  }, 2200);
}

copyThreadLink(): void {
  const url = window.location.href;

  navigator.clipboard.writeText(url).then(() => {
    this.showToast('Enlace copiado al portapapeles ✨');
  }).catch(() => {
    this.showToast('No se pudo copiar el enlace');
  });
}
canEditThread(): boolean {
  if (!this.thread) return false;

  const currentUserId = this.authService.getCurrentUserId();

  if (this.authService.isAdmin()) return true;

  // Fallback: si el JWT no trae ID, mostramos el botón.
  // El backend seguirá protegiendo la acción.
  if (!currentUserId) return true;

  return this.thread.authorId === currentUserId;
}

canDeleteThread(): boolean {
  return this.canEditThread();
}

canEditPost(post: PostDto): boolean {
  const currentUserId = this.authService.getCurrentUserId();

  if (this.authService.isAdmin()) return true;

  if (!currentUserId) return true;

  return post.authorId === currentUserId;
}

canDeletePost(post: PostDto): boolean {
  return this.canEditPost(post);
}

goToUserProfile(userId: string): void {
  this.router.navigate(['/users', userId, 'profile']);
}
}
