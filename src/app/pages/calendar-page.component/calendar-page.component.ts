import { Component, computed, inject, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FullCalendarComponent, FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';

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
  ],
  templateUrl: './calendar-page.component.html',
  styleUrls: ['./calendar-page.component.css'],
})
export class CalendarPageComponent {
  private api = inject(AgendaApiService);
  private dialog = inject(MatDialog);

  @ViewChild(FullCalendarComponent) calendar?: FullCalendarComponent;

  filter = signal<'ALL' | 'CANCELLED'>('ALL');
  currentMonth = signal(this.startOfMonth(new Date()));

  loading = signal(false);
  events = signal<any[]>([]);

  private plugins = [dayGridPlugin, interactionPlugin];

  filteredEvents = computed(() => {
    const f = this.filter();

    return this.events()
      .filter(e => {
        if (f === 'CANCELLED') return e.extendedProps?.raw?.status === 'CANCELLED';
        return true;
      });
  });

  monthLabel = computed(() => this.currentMonth().toLocaleDateString('es-MX', {
    month: 'long',
    year: 'numeric'
  }));

  calendarOptions = computed<CalendarOptions>(() => ({
    plugins: this.plugins,
    initialView: 'dayGridMonth',
    initialDate: this.currentMonth(),
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
    this.loadMonth(this.currentMonth());
  }

  loadMonth(date = new Date()) {
    const month = this.startOfMonth(date);
    this.currentMonth.set(month);
    this.calendar?.getApi().gotoDate(month);

    const from = new Date(month.getFullYear(), month.getMonth(), 1, 0, 0, 0);
    const to = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59);
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

  previousMonth(): void {
    const month = this.currentMonth();
    this.loadMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1));
  }

  nextMonth(): void {
    const month = this.currentMonth();
    this.loadMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1));
  }

  goToToday(): void {
    this.loadMonth(new Date());
  }

  openCreate(dateISO?: string) {
    const ref = this.dialog.open(AppointmentDialogComponent, {
      width: '600px',
      maxWidth: 'calc(100vw - 24px)',
      maxHeight: '90vh',
      panelClass: 'appointment-dialog-panel',
      data: { mode: 'create', dateISO },
    });

    ref.afterClosed().subscribe((changed: boolean) => {
      if (changed) this.loadMonth(this.currentMonth());
    });
  }

  openDetails(appt: Appointment) {
    const ref = this.dialog.open(AppointmentDialogComponent, {
      width: '600px',
      maxWidth: 'calc(100vw - 24px)',
      maxHeight: '90vh',
      panelClass: 'appointment-dialog-panel',
      data: { mode: 'details', appt },
    });

    ref.afterClosed().subscribe((changed: boolean) => {
      if (changed) this.loadMonth(this.currentMonth());
    });
  }

  private startOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
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
