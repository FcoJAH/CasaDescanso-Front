import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmpleadosService } from '../../empleados/empleados.service';

@Component({
  selector: 'app-ver-empleados',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ver-empleados.component.html',
  styleUrls: ['./ver-empleados.component.css']
})
export class VerEmpleadosComponent implements OnInit {
  private empleadosService = inject(EmpleadosService);
  
  // Cargamos los datos que me proporcionaste
  usuarios = signal<any[]>([]);

  ngOnInit() {
    this.obtenerUsuarios();
  }

  obtenerUsuarios() {
    this.empleadosService.getEmpleados().subscribe({
      next: (data) => this.usuarios.set(data),
      error: (err) => console.error('Error al cargar empleados', err)
    });
  }
}