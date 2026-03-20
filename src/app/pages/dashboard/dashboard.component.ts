import { Component, ElementRef, inject, OnInit, signal, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardData, DashboardService } from './dashboard.service';
import { Chart, registerables } from 'chart.js';
import { AuthService } from '../../services/auth.service';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  public authService = inject(AuthService);

  @ViewChild('resChart') resChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('workChart') workChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('incidentChart') incidentChart!: ElementRef<HTMLCanvasElement>;

  stats = signal<DashboardData>({
    totalResidents: 0, activeResidents: 0, inactiveResidents: 0,
    totalWorkers: 0, activeWorkers: 0, inactiveWorkers: 0,
    todayIncidents: 0, totalIncidents: 0,
    workersWorkingNow: 0, checkInsToday: 0,
    activeWorkersNames: []
  });

  user$ = this.authService.currentUser$;

  loading = signal(true);

  ngOnInit() {
    this.loadDashboard();
  }

  loadDashboard() {
    this.loading.set(true);
    this.dashboardService.getStats().subscribe({
      next: (data) => {
        this.stats.set(data);
        this.loading.set(false);
        // Pequeño timeout para asegurar que el DOM se renderizó tras el loading(false)
        setTimeout(() => this.createCharts(), 50);
      },
      error: (err) => {
        console.error('Error al cargar dashboard', err);
        this.loading.set(false);
      }
    });
  }

  createCharts() {
    const data = this.stats();

    // Gráfica Residentes (Dona) - Azul Corporativo y Gris
    new Chart(this.resChart.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Activos', 'Inactivos'],
        datasets: [{
          data: [data.activeResidents, data.inactiveResidents],
          backgroundColor: ['#005BB5', '#E2E8F0'],
          hoverOffset: 4
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
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
        datasets: [{
          data: [data.todayIncidents, data.totalIncidents],
          backgroundColor: ['#E74C3C', '#27AE60'], // Rojo para abiertos, Verde para resueltos
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });
  }

  calcPercent(value: number, total: number): number {
    return total > 0 ? Math.round((value * 100) / total) : 0;
  }
}