import { Injectable } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PushService {

  private readonly baseUrl = `${environment.apiUrl}/upiiz/public/v1/push`;

  constructor(
    private swPush: SwPush,
    private http: HttpClient
  ) {}

  async subscribeToPush(): Promise<void> {
    try {
      if (!this.swPush.isEnabled) {
        console.warn('Service Worker / Push no está habilitado.');
        return;
      }

      const existingSub = await firstValueFrom(this.swPush.subscription);

      if (existingSub) {
        console.log('Ya existe una suscripción push.');
        return;
      }

      const response = await firstValueFrom(
        this.http.get<{ publicKey: string }>(`${this.baseUrl}/public-key`)
      );

      const subscription = await this.swPush.requestSubscription({
        serverPublicKey: response.publicKey
      });

      await firstValueFrom(
        this.http.post(`${this.baseUrl}/subscribe`, subscription)
      );

      console.log('🔥 Suscripción push guardada:', subscription);

    } catch (err) {
      console.error('❌ Error en push:', err);
    }
  }
}