import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

import { AgendaApiService, Appointment } from '../../core/services/agenda-api.service';
import { AppointmentDialogComponent } from '../appointment-dialog.component/appointment-dialog.component';

@Component({
  standalone: true,
  selector: 'app-calendar-page',
  imports: [
    CommonModule,
    FullCalendarModule,
    MatDialogModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatInputModule,
  ],
  templateUrl: './calendar-page.component.html',
  styleUrls: ['./calendar-page.component.css'],
})
export class CalendarPageComponent {
  private api = inject(AgendaApiService);
  private dialog = inject(MatDialog);

  view = signal<'dayGridMonth' | 'timeGridWeek'>('dayGridMonth');
  filter = signal<'ALL' | 'CANCELLED'>('ALL');
  query = signal('');

  loading = signal(false);
  events = signal<any[]>([]);

  private plugins = [dayGridPlugin, timeGridPlugin, interactionPlugin];

  filteredEvents = computed(() => {
    const q = this.query().trim().toLowerCase();
    const f = this.filter();

    return this.events()
      .filter(e => {
        if (f === 'CANCELLED') return e.extendedProps?.raw?.status === 'CANCELLED';
        return true;
      })
      .filter(e => {
        if (!q) return true;
        return (e.title || '').toLowerCase().includes(q);
      });
  });

  calendarOptions = computed<CalendarOptions>(() => ({
    plugins: this.plugins,
    initialView: this.view(),
    headerToolbar: false, // ✅ correcto
    height: 'auto',
    dayMaxEvents: true,
    nowIndicator: true,
    selectable: true,
    events: this.filteredEvents(),
    dateClick: (info) => this.openCreate(info.dateStr),
    eventClick: (info) => this.openDetails(info.event.extendedProps?.['raw'] as Appointment),
  }));

  ngOnInit() {
    this.loadMonth();
  }

  loadMonth(date = new Date()) {
    const from = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0);
    const to = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
    this.load(from.toISOString(), to.toISOString());
  }

  private load(fromISO: string, toISO: string) {
    this.loading.set(true);
    this.api.getAgenda(fromISO, toISO).subscribe({
      next: (data) => this.events.set(this.mapAppointmentsToEvents(data)),
      error: () => this.events.set([]),
      complete: () => this.loading.set(false),
    });
  }

  setView(v: 'dayGridMonth' | 'timeGridWeek') {
    this.view.set(v);
  }

  openCreate(dateISO?: string) {
    const ref = this.dialog.open(AppointmentDialogComponent, {
      width: '600px',
      data: { mode: 'create', dateISO },
    });

    ref.afterClosed().subscribe((changed: boolean) => {
      if (changed) this.loadMonth();
    });
  }

  openDetails(appt: Appointment) {
    const ref = this.dialog.open(AppointmentDialogComponent, {
      width: '600px',
      data: { mode: 'details', appt },
    });

    ref.afterClosed().subscribe((changed: boolean) => {
      if (changed) this.loadMonth();
    });
  }

  private mapAppointmentsToEvents(appts: Appointment[]) {
    return appts.map(a => ({
      id: a.id,
      title: a.title,
      start: a.startsAt,
      end: a.endsAt,
      display: 'block',
      classNames: [
        a.modality === 'ONLINE' ? 'evt-online' : 'evt-presencial',
        a.status === 'CANCELLED' ? 'evt-cancelled' : 'evt-normal',
      ],
      extendedProps: { raw: a },
    }));
  }
}
