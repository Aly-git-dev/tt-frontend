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

      return `
        <a href="${safeHref}" ${safeTitle} target="_blank" rel="noopener noreferrer">
          ${text}
        </a>
      `;
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
      ADD_ATTR: ['target', 'rel', 'class']
    });
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