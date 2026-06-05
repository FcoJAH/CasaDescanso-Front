import {
  Component,
  ElementRef,
  inject,
  OnInit,
  OnDestroy,
  signal,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  DashboardData,
  DashboardService,
  IncidentToday,
} from './dashboard.service';
import { Chart, registerables } from 'chart.js';
import { AuthService } from '../../services/auth.service';
import { forkJoin, Subscription, interval } from 'rxjs'; // Importante agregar esto
import { CalendarEvent, EventsService } from '../../services/events.service';
import { computed } from '@angular/core';
import { FormsModule } from '@angular/forms';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  private dashboardService = inject(DashboardService);
  public authService = inject(AuthService);
  public eventsService = inject(EventsService);

  private visibilityListener: (() => void) | null = null;
  private autoRefreshSub: Subscription | null = null;

  @ViewChild('resChart') resChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('workChart') workChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('incidentChart') incidentChart!: ElementRef<HTMLCanvasElement>;

  stats = signal<DashboardData>({
    totalResidents: 0,
    activeResidents: 0,
    inactiveResidents: 0,
    totalWorkers: 0,
    activeWorkers: 0,
    inactiveWorkers: 0,
    todayIncidents: 0,
    totalIncidents: 0,
    workersWorkingNow: 0,
    checkInsToday: 0,
    activeWorkersNames: [],
  });

  public todayIncidents = signal<IncidentToday[]>([]);
  // Signal para los días del mes
  public calendarDays = signal<Date[]>([]);

  // Signal para los huecos vacíos al inicio del mes
  public calendarOffsets = signal<number[]>([]);

  // Fecha de referencia (Mes actual)
  public currentMonth = new Date();

  // Signal de eventos (donde guardas lo que viene del API)
  public events = signal<CalendarEvent[]>([]);

  public showEventModal = signal(false);

  public newEventData = {
    title: '',
    description: '',
    eventDate: '',
  };

  user$ = this.authService.currentUser$;

  loading = signal(true);

  ngOnInit() {
    this.loadDashboard();

    // Configurar polling silencioso cada 5 minutos (300000 ms)
    this.autoRefreshSub = interval(300000).subscribe(() => {
      this.loadDashboard(true);
    });

    // Configurar Page Visibility API para recargar al maximizar la app
    this.visibilityListener = () => {
      if (document.visibilityState === 'visible') {
        this.loadDashboard(true);
      }
    };
    document.addEventListener('visibilitychange', this.visibilityListener);
  }

  ngOnDestroy() {
    if (this.autoRefreshSub) {
      this.autoRefreshSub.unsubscribe();
    }
    if (this.visibilityListener) {
      document.removeEventListener('visibilitychange', this.visibilityListener);
    }
  }

  loadDashboard(silent: boolean = false) {
    if (!silent) {
      this.loading.set(true);
    }

    forkJoin({
      stats: this.dashboardService.getStats(),
      incidents: this.dashboardService.getTodayIncidents(),
      events: this.eventsService.getEvents(), // Consulta al endpoint /getAll
    }).subscribe({
      next: (res) => {
        // Seteamos los datos en las signals
        this.stats.set(res.stats);
        this.todayIncidents.set(res.incidents);
        this.events.set(res.events); // <--- Aquí se guardan todos los eventos

        // Ejecutamos la lógica secundaria
        this.generateCalendar();
        
        if (!silent) {
          this.loading.set(false);
        }

        // Renderizamos gráficas tras el pequeño delay por el ngIf
        setTimeout(() => this.renderizarGraficas(), 150);
      },
      error: (err) => {
        console.error('Error al cargar datos del dashboard', err);
        if (!silent) {
          this.loading.set(false);
        }
      },
    });
  }

  private renderizarGraficas() {
    // 1. Validar que el elemento exista (por si el ngIf aún no lo muestra)
    if (!this.resChart || !this.resChart.nativeElement) {
      console.warn('Canvas no encontrado, reintentando...');
      return;
    }

    const data = this.stats();

    // 2. Limpiar gráfica previa si existe
    const existingChart = Chart.getChart(this.resChart.nativeElement);
    if (existingChart) {
      existingChart.destroy();
    }

    // 3. Crear la nueva gráfica
    new Chart(this.resChart.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Activos', 'Inactivos'],
        datasets: [
          {
            data: [data.activeResidents, data.inactiveResidents],
            backgroundColor: ['#005BB5', '#E2E8F0'], // Azul corporativo y gris claro
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false, // La leyenda la manejamos nosotros en el HTML
          },
        },
        cutout: '70%', // Para que se vea como un anillo elegante
      },
    });
  }

  loadIncidents(): void {
    this.dashboardService.getTodayIncidents().subscribe({
      next: (data) => {
        this.todayIncidents.set(data);
        this.loading.set(false); // Quitamos el loading cuando la última carga termine
      },
      error: (err) => {
        console.error('Error al cargar nombres de incidentes', err);
        this.loading.set(false);
      },
    });
  }

  createCharts() {
    const data = this.stats();

    // Gráfica Residentes (Dona) - Azul Corporativo y Gris
    new Chart(this.resChart.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Activos', 'Inactivos'],
        datasets: [
          {
            data: [data.activeResidents, data.inactiveResidents],
            backgroundColor: ['#005BB5', '#E2E8F0'],
            hoverOffset: 4,
          },
        ],
      },
      options: { responsive: true, maintainAspectRatio: false },
    });

    // Gráfica Trabajadores (Pastel) - Azul Corporativo y Dorado Cálido
    /*new Chart(this.workChart.nativeElement, {
      type: 'pie',
      data: {
        labels: ['Activos', 'Inactivos'],
        datasets: [{
          data: [data.activeWorkers, data.inactiveWorkers],
          backgroundColor: ['#005BB5', '#F9A825'],
          hoverOffset: 4
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });*/

    // Gráfica de Incidentes
    new Chart(this.incidentChart.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Hoy', 'Totales'],
        datasets: [
          {
            data: [data.todayIncidents, data.totalIncidents],
            backgroundColor: ['#E74C3C', '#27AE60'], // Rojo para abiertos, Verde para resueltos
            hoverOffset: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' },
        },
      },
    });
  }

  calcPercent(value: number, total: number): number {
    return total > 0 ? Math.round((value * 100) / total) : 0;
  }

  generateCalendar() {
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();

    // 1. Calcular el "offset" (espacios vacíos)
    // .getDay() devuelve: 0 para Dom, 1 para Lun, etc.
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const offsets = Array.from({ length: firstDayOfMonth }, (_, i) => i);
    this.calendarOffsets.set(offsets);

    // 2. Calcular los días del mes
    // El día "0" del mes siguiente es el último día del mes actual
    const lastDay = new Date(year, month + 1, 0).getDate();
    const days: Date[] = [];

    for (let i = 1; i <= lastDay; i++) {
      days.push(new Date(year, month, i));
    }

    this.calendarDays.set(days);
  }

  hasEvent(date: Date): boolean {
    return this.events().some((e) => {
      const eventDate = new Date(e.eventDate);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  }

  changeMonth(delta: number) {
    const currentYear = this.currentMonth.getFullYear();
    const currentMonth = this.currentMonth.getMonth();

    this.currentMonth = new Date(currentYear, currentMonth + delta, 1);

    this.generateCalendar();
  }

  public proximosEventos = computed(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    return this.events()
      .filter((e) => new Date(e.eventDate) >= hoy) // Filtramos los que ya pasaron
      .sort(
        (a, b) =>
          new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime(),
      ) // Ordenamos por fecha
      .slice(0, 5); // Tomamos los primeros 5
  });

  nuevoEvento() {
    // Limpiamos el objeto
    this.newEventData = {
      title: '',
      description: '',
      eventDate: '',
    };
    // Mostramos el modal
    this.showEventModal.set(true);
  }

  guardarEvento() {
    // Validación mínima
    if (!this.newEventData.title || !this.newEventData.eventDate) {
      alert('El título y la fecha son obligatorios.');
      return;
    }

    // Preparamos el objeto siguiendo tus reglas de negocio
    const payload: CalendarEvent = {
      title: this.newEventData.title.toUpperCase(), // REGLA: Siempre en mayúsculas
      description: this.newEventData.description,
      eventDate: this.newEventData.eventDate,
    };

    // Consumimos el servicio
    this.eventsService.saveEvent(payload).subscribe({
      next: () => {
        this.showEventModal.set(false); // Cerramos modal
        this.loadDashboard(); // Recargamos el dashboard para ver los cambios
      },
      error: (err) => {
        console.error('Error al guardar el evento:', err);
      },
    });
  }
}
