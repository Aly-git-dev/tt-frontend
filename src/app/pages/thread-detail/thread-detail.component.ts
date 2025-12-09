import {
  Component,
  OnInit,
  ElementRef,
  ViewChild,
  AfterViewInit,
  AfterViewChecked
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { ForumService } from '../../core/services/forum.service';
import { ReportCreateDto } from '../../core/models/forum.models';
import {
  ThreadDetailDto,
  PostDto,
  PostCreateDto,
  AttachmentDto
} from '../../core/models/forum.models';

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

  private viewInitialized = false;
  private needsEnhance = false;

  // opciones para tipo de adjunto en respuestas
  attachmentKinds = [
    { value: 'LINK',   label: 'Enlace' },
    { value: 'IMAGEN', label: 'Imagen (URL)' },
    { value: 'VIDEO',  label: 'Video (URL)' },
    { value: 'AUDIO',  label: 'Audio (URL)' }
  ];

  showReportModal = false;
  reportingTarget: { threadId?: number | null; postId?: number | null } | null = null;
  reportForm!: FormGroup;
  reportSending = false;
  reportSuccess: string | null = null;
  reportError: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private forumService: ForumService,
    private fb: FormBuilder
  ) {}

  
  // ========= Helpers visuales =========
  getInitial(name?: string | null): string {
    if (!name) { return '?'; }
    const trimmed = name.trim();
    if (!trimmed) { return '?'; }
    return trimmed.charAt(0).toUpperCase();
  }


  // ========= Ciclo de vida =========
  ngOnInit(): void {
    this.threadId = Number(this.route.snapshot.paramMap.get('id'));
    this.buildForm();
    this.buildReportForm();
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

  // ====== Abrir / cerrar modal de reporte ======
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
    if (this.reportSending) return; // evitar cerrar mientras manda
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
        // opcional: cerrar automáticamente después de un ratito
        setTimeout(() => this.closeReportModal(), 1200);
      },
      error: err => {
        console.error('Error enviando reporte', err);
        this.reportSending = false;
        this.reportError = 'No se pudo enviar el reporte. Intenta de nuevo más tarde.';
      }
    });
  }


  private loadThread(): void {
    this.loading = true;
    this.error = null;

    this.forumService.getThread(this.threadId).subscribe({
      next: (thread) => {
        this.thread = thread;
        this.threadRenderedBody = this.renderBody(thread.body || '');

        this.postsVmInternal = (thread.posts || []).map(p => ({
          ...p,
          renderedBody: this.renderBody(p.body || '')
        }));

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

  // ========= Getters =========
  get posts(): PostVm[] {
    return this.postsVmInternal;
  }

  get attachmentsArray(): FormArray {
    return this.replyForm.get('attachments') as FormArray;
  }

  /** Getter para que el template tenga FormGroup[] tipado */
  get attachmentGroups(): FormGroup[] {
    return this.attachmentsArray.controls as FormGroup[];
  }

  // ========= Adjuntos en la respuesta =========
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

  // ========= Enviar respuesta =========
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

        // limpiar form
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

  // ========= Render básico: Markdown-lite → HTML =========
  private renderBody(raw: string): string {
    if (!raw) return '';

    let text = raw;

    // code fences ```lang\n...\n```
    const codeFenceRegex = /```([\w+-]*)\n([\s\S]*?)```/g;
    text = text.replace(codeFenceRegex, (_match, lang, code) => {
      const safeLang = lang || 'plaintext';
      const escaped = this.escapeHtml(code);
      return `<pre><code class="language-${safeLang}">${escaped}</code></pre>`;
    });

    // párrafos simples
    const parts = text.split(/\n{2,}/g);
    text = parts
      .map(p => `<p>${this.escapeHtmlInline(p)}</p>`)
      .join('');

    return text;
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  private escapeHtmlInline(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // ========= highlight.js + Mermaid + MathJax =========
  private enhanceContent(): void {
    if (!this.threadContainer) return;
    const el = this.threadContainer.nativeElement;

    // highlight.js
    if (typeof hljs !== 'undefined') {
      el.querySelectorAll('pre code').forEach((block: any) => {
        if (!block.classList.contains('hljs')) {
          hljs.highlightElement(block);
        }
      });
    }

    // Mermaid
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

    // MathJax
    if (typeof MathJax !== 'undefined' && MathJax.typesetPromise) {
      MathJax.typesetPromise([el]).catch((err: any) =>
        console.error('MathJax error', err)
      );
    }
  }
  // ===== Helpers para saber si es media directa =====
isDirectVideo(url: string | null | undefined): boolean {
  if (!url) { return false; }
  return /\.(mp4|webm|ogg)$/i.test(url);
}

isDirectAudio(url: string | null | undefined): boolean {
  if (!url) { return false; }
  return /\.(mp3|wav|ogg)$/i.test(url);
}

// ===== (Opcional) YouTube embed =====
getYoutubeEmbedUrl(url: string | null | undefined): string | null {
  if (!url) { return null; }

  // youtu.be/ID
  let match = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (match?.[1]) {
    return `https://www.youtube.com/embed/${match[1]}`;
  }

  // youtube.com/watch?v=ID
  match = url.match(/v=([a-zA-Z0-9_-]+)/);
  if (match?.[1]) {
    return `https://www.youtube.com/embed/${match[1]}`;
  }

  // shorts
  match = url.match(/shorts\/([a-zA-Z0-9_-]+)/);
  if (match?.[1]) {
    return `https://www.youtube.com/embed/${match[1]}`;
  }

  return null;
}

}
