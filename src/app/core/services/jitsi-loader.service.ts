import { Injectable } from '@angular/core';

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

@Injectable({
  providedIn: 'root'
})
export class JitsiLoaderService {
  private scriptLoadingPromise?: Promise<void>;

  load(domain: string = 'meet.jit.si'): Promise<void> {
    if (window.JitsiMeetExternalAPI) {
      return Promise.resolve();
    }

    if (this.scriptLoadingPromise) {
      return this.scriptLoadingPromise;
    }

    this.scriptLoadingPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://${domain}/external_api.js`;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('No se pudo cargar external_api.js de Jitsi'));
      document.body.appendChild(script);
    });

    return this.scriptLoadingPromise;
  }
}