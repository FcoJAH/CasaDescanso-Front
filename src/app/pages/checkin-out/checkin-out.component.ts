import { Component, OnInit, inject } from '@angular/core';
import { AttendanceService } from '../../services/attendance.service';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-checkin-out',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './checkin-out.component.html',
  styleUrls: ['./checkin-out.component.css']
})
export class CheckInOutComponent implements OnInit {
  loading = false;
  message = '';
  currentTime = new Date();
  checkedIn = false;

  // Variables para el Modal
  showLocationModal = false;
  pendingAction: 'in' | 'out' | null = null;
  
  private attendanceService = inject(AttendanceService);
  private authService = inject(AuthService);

  ngOnInit() {
    this.verificarEstadoActual();
    setInterval(() => this.currentTime = new Date(), 1000);
  }

  // --- Lógica del Modal (Pre-permiso) ---
  solicitarUbicacion(tipo: 'in' | 'out') {
    this.pendingAction = tipo;
    this.showLocationModal = true;
  }

  async confirmarUbicacion() {
    this.showLocationModal = false;
    if (this.pendingAction === 'in') {
      await this.ejecutarCheckIn();
    } else if (this.pendingAction === 'out') {
      await this.ejecutarCheckOut();
    }
  }

  // --- Lógica de Geolocalización ---
  private obtenerUbicacion(): Promise<{ lat: number, lng: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject('Geolocalización no soportada por el navegador');
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => reject('Permiso denegado: Se requiere ubicación para marcar asistencia.'),
        { enableHighAccuracy: true }
      );
    });
  }

  // --- Comunicación con el Servicio ---
  verificarEstadoActual() {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    this.loading = true;
    this.attendanceService.getAttendanceStatus(user.userId).subscribe({
      next: (res) => {
        // Sincronizado con el backend (hasOpenAttendance)
        this.checkedIn = res.hasOpenAttendance; 
        this.loading = false;
      },
      error: () => {
        this.message = 'No se pudo sincronizar el estado.';
        this.loading = false;
      }
    });
  }

  private async ejecutarCheckIn() {
    this.loading = true;
    try {
      const coords = await this.obtenerUbicacion();
      this.attendanceService.checkIn(coords).subscribe({
        next: () => {
          this.message = '¡Entrada registrada con éxito!';
          this.checkedIn = true;
          this.loading = false;
        },
        error: () => {
          this.message = 'Error al registrar entrada en el servidor.';
          this.loading = false;
        }
      });
    } catch (error) {
      this.message = error as string;
      this.loading = false;
    }
  }

  private async ejecutarCheckOut() {
    this.loading = true;
    try {
      const coords = await this.obtenerUbicacion();
      console.log('Coordenadas obtenidas para Check-Out:', coords);
      this.attendanceService.checkOut(coords).subscribe({
        next: () => {
          this.message = '¡Salida registrada con éxito!';
          this.checkedIn = false;
          this.loading = false;
        },
        error: () => {
          this.message = 'Error al registrar salida en el servidor.';
          this.loading = false;
        }
      });
    } catch (error) {
      this.message = error as string;
      this.loading = false;
    }
  }
}