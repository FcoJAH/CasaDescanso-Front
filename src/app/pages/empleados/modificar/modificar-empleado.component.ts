import { Component, OnInit, signal, inject } from '@angular/core';
import { EmpleadosService } from '../empleados.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-modificar-empleado',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modificar-empleado.component.html',
  styleUrls: ['./modificar-empleado.component.css'],
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
  isError = signal(false);

  // 1. Inicializar con estructura para evitar errores de lectura en el HTML
  formData = signal<any>({
    firstName: '',
    lastName: '',
    middleName: '',
    birthDate: '',
    gender: '',
    phone: '',
    email: '',
    rfc: '',
    curp: '',
    nss: '',
    roleId: 0,
    shiftId: 0,
    educationLevel: '',
    allergies: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
  });

  ngOnInit() {
    this.cargarListas();
  }

  cargarListas() {
    this.empleadosService
      .getActiveEmployers()
      .subscribe((data) => this.empleados.set(data));
    this.empleadosService.getRoles().subscribe((data) => this.roles.set(data));
    this.empleadosService
      .getShifts()
      .subscribe((data) => this.turnos.set(data));
  }

  onSeleccionar(event: any) {
    const id = event.target.value;
    this.empleadosService.getEmployerById(id).subscribe((data) => {
      // 2. Formatear todas las fechas posibles para el input date
      if (data.birthDate) data.birthDate = data.birthDate.split('T')[0];
      if (data.hireDate) data.hireDate = data.hireDate.split('T')[0]; // Por si lo usas

      this.formData.set(data);
      this.editMode.set(true);
    });
  }

  onSubmit() {
    const data = { ...this.formData() }; // Clonamos para no afectar la señal directamente antes de tiempo

    if (data && data.id) {
      // 3. Aplicar MAYÚSCULAS a los campos de identidad según reglas del sistema
      data.firstName = data.firstName?.toUpperCase();
      data.lastName = data.lastName?.toUpperCase();
      data.middleName = data.middleName?.toUpperCase();
      data.curp = data.curp?.toUpperCase();
      data.rfc = data.rfc?.toUpperCase();

      this.empleadosService.updateEmployer(data.id, data).subscribe({
        next: () => {
          this.isSuccess.set(true);
          this.isError.set(false);
        },
        error: (err) => {
          console.error('Error al actualizar:', err);
          this.isError.set(true);
        },
      });
    }
  }

  finalizar() {
    this.isSuccess.set(false);
    this.editMode.set(false);
    this.router.navigate(['/empleados']); // O la ruta que prefieras
  }
}
