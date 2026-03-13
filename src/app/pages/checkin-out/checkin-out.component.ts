import { Component, OnInit, inject } from '@angular/core'; // Agregamos OnInit e inject
import { AttendanceService } from '../../services/attendance.service';
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
  
  // Usamos inject para un estilo más moderno
  private attendanceService = inject(AttendanceService);

  ngOnInit() {
    this.verificarEstadoActual();
    // Actualización del reloj
    setInterval(() => this.currentTime = new Date(), 1000);
  }

  verificarEstadoActual() {
    this.loading = true;
    // El ID lo podrías obtener de tu servicio de autenticación
    const userId = 1; 

    this.attendanceService.getAttendanceStatus(userId).subscribe({
      next: (res) => {
        // Asumiendo que el API responde true si hay un registro activo
        this.checkedIn = res.hasActiveEntry; 
        this.loading = false;
      },
      error: () => {
        this.message = 'No se pudo sincronizar el estado actual.';
        this.loading = false;
      }
    });
  }

  checkIn() {
    this.loading = true;
    this.attendanceService.checkIn().subscribe({
      next: () => {
        this.message = '¡Entrada registrada con éxito!';
        this.checkedIn = true; // Cambia la vista a Check-out
        this.loading = false;
      },
      error: () => {
        this.message = 'Error al registrar check-in';
        this.loading = false;
      }
    });
  }

  checkOut() {
    this.loading = true;
    this.attendanceService.checkOut().subscribe({
      next: () => {
        this.message = '¡Salida registrada con éxito!';
        this.checkedIn = false; // Cambia la vista a Check-in
        this.loading = false;
      },
      error: () => {
        this.message = 'Error al registrar check-out';
        this.loading = false;
      }
    });
  }
}