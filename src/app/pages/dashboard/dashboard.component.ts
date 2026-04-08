import {
  Component,
  ElementRef,
  inject,
  OnInit,
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
import { forkJoin } from 'rxjs'; // Importante agregar esto

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  public authService = inject(AuthService);

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

  user$ = this.authService.currentUser$;

  loading = signal(true);

  ngOnInit() {
    this.loadDashboard();
  }

  loadDashboard() {
    this.loading.set(true);

    // Ejecutamos ambas peticiones en paralelo y esperamos a que las dos terminen
    forkJoin({
      stats: this.dashboardService.getStats(),
      incidents: this.dashboardService.getTodayIncidents(),
    }).subscribe({
      next: (result) => {
        // 1. Asignamos todos los datos
        this.stats.set(result.stats);
        this.todayIncidents.set(result.incidents);

        // 2. Quitamos el loading (esto hace que el HTML aparezca en el DOM)
        this.loading.set(false);

        // 3. Esperamos un pequeño respiro para que Angular renderice los canvas
        setTimeout(() => {
          this.renderizarGraficas();
        }, 150);
      },
      error: (err) => {
        console.error('Error cargando datos del dashboard', err);
        this.loading.set(false);
      },
    });
  }

  // Creamos un método limpio para renderizar
  private renderizarGraficas() {
    // Validamos que los ViewChild ya existan en el DOM
    if (this.resChart?.nativeElement && this.incidentChart?.nativeElement) {
      this.createCharts();
    } else {
      console.warn('Los elementos Canvas no están listos todavía');
    }
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
}
