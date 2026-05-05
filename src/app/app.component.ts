import { Component, OnInit } from '@angular/core';
import { PushService } from './core/services/push.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {

  title = 'platform-upiiz-front';

  constructor(private pushService: PushService) {}

  ngOnInit(): void {
    this.initPush();
  }

  private async initPush() {
    try {
      await this.pushService.subscribeToPush();
    } catch (err) {
      console.error('❌ Error inicializando push:', err);
    }
  }
}