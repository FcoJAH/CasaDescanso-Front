import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TurnosService } from '../turnos.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-eliminar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './eliminar.component.html',
  styleUrls: ['./eliminar.component.css']
})
export class EliminarComponent implements OnInit {
  private turnosService = inject(TurnosService);
  private router = inject(Router);

  turnos = signal<any[]>([]);
  turnoSeleccionado = signal<any>(null);
  isDeleted = signal(false);
  errorMessage = signal<string>('');
  isError = signal(false);

  ngOnInit() {
    this.cargarTurnos();
  }

  cargarTurnos() {
    this.turnosService.getTurnos().subscribe(data => this.turnos.set(data));
  }

  onSeleccionarTurno(event: any) {
    const id = event.target.value;
    const encontrado = this.turnos().find(t => t.id == id);
    this.turnoSeleccionado.set(encontrado);
  }

  confirmarEliminar() {
  const id = this.turnoSeleccionado().id;
  
  this.turnosService.eliminarTurno(id).subscribe({
    next: () => {
      this.isDeleted.set(true);
      this.isError.set(false);
      this.cargarTurnos();
    },
    error: (err) => {
      this.errorMessage.set(err.error || 'Error al procesar la solicitud');
      this.isError.set(true); 
      this.isDeleted.set(false);
    }
  });
}

resetVista() {
  this.isError.set(false);
  this.turnoSeleccionado.set(null);
  this.router.navigate(['/horarios']);
}

  finalizar() {
    this.router.navigate(['/horarios']);
  }
}