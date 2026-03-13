import { Component, OnInit, signal, inject } from '@angular/core';
import { EmpleadosService } from '../empleados.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-modificar-empleado',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './modificar-empleado.component.html',
  styleUrls: ['./modificar-empleado.component.css']
})
export class ModificarEmpleadoComponent implements OnInit {
  private empleadosService = inject(EmpleadosService);
  private router = inject(Router);

  // Estados
  empleados = signal<any[]>([]);
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
    this.empleadosService.getActiveEmployers().subscribe(data => this.empleados.set(data));
    this.empleadosService.getRoles().subscribe(data => this.roles.set(data));
    this.empleadosService.getShifts().subscribe(data => this.turnos.set(data));
  }

  onSeleccionar(event: any) {
    const id = event.target.value;
    this.empleadosService.getEmployerById(id).subscribe(data => {
      // Formatear fecha para el input type="date" (YYYY-MM-DD)
      if (data.birthDate) data.birthDate = data.birthDate.split('T')[0];
      this.formData.set(data);
      this.editMode.set(true);
    });
  }

  isError = signal(false); // Añade esta señal si no la tenías

  onSubmit() {
    const data = this.formData();
    console.log("Enviando datos a la API para el ID:", data.id);
    if (data && data.id) {
      if (data.middleName) data.middleName = data.middleName.toUpperCase();

      this.empleadosService.updateEmployer(data.id, data).subscribe({
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