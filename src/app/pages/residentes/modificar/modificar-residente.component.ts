import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ResidentesService } from '../residentes.service';

@Component({
  selector: 'app-modificar-residente',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './modificar-residente.component.html',
  styleUrls: ['./modificar-residente.component.css']
})
export class ModificarResidenteComponent implements OnInit {
  private residentesService = inject(ResidentesService);
  private router = inject(Router);

  // Estados
  residentes = signal<any[]>([]);
  roles = signal<any[]>([]);
  turnos = signal<any[]>([]);

  editMode = signal(false);
  isSuccess = signal(false);

  // Datos del formulario
  formData = signal<any>({});

  ngOnInit() {
    this.cargarListas();
  }

  cargarListas() {
    this.residentesService.obtenerActivos().subscribe(data => this.residentes.set(data));
  }

  onSeleccionar(event: any) {
    const id = event.target.value;
    this.residentesService.obtenerResidentePorId(id).subscribe(data => {
      // Formatear fecha para el input type="date" (YYYY-MM-DD)
      if (data.birthDate) data.birthDate = data.birthDate.split('T')[0];
      this.formData.set(data);
      this.editMode.set(true);
    });
  }

  isError = signal(false); // Añade esta señal si no la tenías

  onSubmit() {
    const data = this.formData();
    //console.log("Enviando datos a la API para el ID:", data.id);
    if (data && data.id) {
      if (data.middleName) data.middleName = data.middleName.toUpperCase();

      this.residentesService.updateResidente(data.id, data).subscribe({
        next: () => {
          this.isSuccess.set(true);
          this.isError.set(false);
        },
        error: (err) => {
          console.error(err);
          this.isError.set(true);
        }
      });
    }
  }

  finalizar() {
    this.isSuccess.set(false);
    this.editMode.set(false);
    this.router.navigate(['/empleados']); // O la ruta que prefieras
  }
}