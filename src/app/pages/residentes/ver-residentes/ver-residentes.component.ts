import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResidentesService } from '../residentes.service';

@Component({
  selector: 'app-ver-residentes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ver-residentes.component.html',
  styleUrls: ['./ver-residentes.component.css']
})
export class VerResidentesComponent implements OnInit {
  private residentesService = inject(ResidentesService);

  // Cargamos los datos que me proporcionaste
  usuarios = signal<any[]>([]);

  ngOnInit() {
    this.obtenerUsuarios();
  }

  obtenerUsuarios() {
    this.residentesService.obtenerTodos().subscribe({
      next: (data) => this.usuarios.set(data),
      error: (err) => console.error('Error al cargar residentes', err)
    });
  }

  formatDate(date: string | Date): string {
    if (!date) return '';

    const d = new Date(date);

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0'); // Los meses van de 0 a 11
    const year = d.getFullYear();

    return `${day}/${month}/${year}`;
  }
}