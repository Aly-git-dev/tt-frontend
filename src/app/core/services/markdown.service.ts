import { Injectable } from '@angular/core';
import { marked } from 'marked';
import hljs from 'highlight.js';
import DOMPurify from 'dompurify';

@Injectable({
  providedIn: 'root'
})
export class MarkdownService {

  constructor() {
    marked.setOptions({
      breaks: true,
      gfm: true
    });
  }

  render(content: string | null | undefined): string {
    if (!content) return '';

    const renderer = new marked.Renderer();

    renderer.link = ({ href, title, tokens }: any) => {
      const text = this.getPlainText(tokens);
      const safeHref = href || '#';
      const safeTitle = title ? `title="${title}"` : '';
      const youtubeEmbedUrl = this.getYoutubeEmbedUrl(safeHref);

      if (youtubeEmbedUrl) {
        return this.renderYoutubeEmbed(youtubeEmbedUrl);
      }

      return `
        <a href="${safeHref}" ${safeTitle} target="_blank" rel="noopener noreferrer">
          ${text}
        </a>
      `;
    };

    renderer.paragraph = ({ tokens }: any) => {
      const text = this.getPlainText(tokens).trim();
      const youtubeEmbedUrl = this.getYoutubeEmbedUrl(text);

      if (youtubeEmbedUrl) {
        return this.renderYoutubeEmbed(youtubeEmbedUrl);
      }

      return `<p>${this.parseInline(tokens)}</p>`;
    };

    renderer.code = ({ text, lang }: any) => {
      const language = lang && hljs.getLanguage(lang) ? lang : 'plaintext';

      const highlighted = language !== 'plaintext'
        ? hljs.highlight(text, { language }).value
        : hljs.highlightAuto(text).value;

      return `
        <pre class="forum-code-block">
          <code class="hljs language-${language}">${highlighted}</code>
        </pre>
      `;
    };

    const rawHtml = marked.parse(content, { renderer }) as string;

    return DOMPurify.sanitize(rawHtml, {
      ADD_TAGS: ['iframe'],
      ADD_ATTR: [
        'target',
        'rel',
        'class',
        'src',
        'title',
        'frameborder',
        'allow',
        'allowfullscreen'
      ]
    });
  }

  private parseInline(tokens: any[]): string {
    if (!tokens) return '';
    return marked.parser([{ type: 'paragraph', tokens } as any]).replace(/^<p>|<\/p>\n?$/g, '');
  }

  private renderYoutubeEmbed(embedUrl: string): string {
    return `
      <div class="youtube-embed">
        <iframe
          src="${embedUrl}"
          title="Video de YouTube"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen>
        </iframe>
      </div>
    `;
  }

  private getYoutubeEmbedUrl(url: string | null | undefined): string | null {
    if (!url) return null;

    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return null;
    }

    const host = parsed.hostname.replace(/^www\./, '').toLowerCase();
    let videoId: string | null = null;

    if (host === 'youtu.be') {
      videoId = parsed.pathname.split('/').filter(Boolean)[0] || null;
    }

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (parsed.pathname === '/watch') {
        videoId = parsed.searchParams.get('v');
      } else if (parsed.pathname.startsWith('/shorts/')) {
        videoId = parsed.pathname.split('/').filter(Boolean)[1] || null;
      } else if (parsed.pathname.startsWith('/embed/')) {
        videoId = parsed.pathname.split('/').filter(Boolean)[1] || null;
      }
    }

    if (!videoId || !/^[a-zA-Z0-9_-]{6,}$/.test(videoId)) {
      return null;
    }

    return `https://www.youtube.com/embed/${videoId}`;
  }

  private getPlainText(tokens: any[]): string {
    if (!tokens) return '';

    return tokens
      .map(token => {
        if (token.raw) return token.raw;
        if (token.text) return token.text;
        return '';
      })
      .join('');
  }
}
