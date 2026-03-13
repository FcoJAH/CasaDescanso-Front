import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Empleado, EmpleadosService, Role, Shift } from '../empleados.service';
import { minAgeValidator } from '../../../utils/validators'; // Eliminado passwordComplexityValidator ya que es auto
import { Router } from '@angular/router';

@Component({
  selector: 'app-registro-empleado',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './registro-empleado.component.html',
  styleUrl: './registro-empleado.component.css'
})
export class RegistrarEmpleadoComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private empleadosService = inject(EmpleadosService);

  errorMessage = signal('');
  showPopup = signal(false);
  isRegistered = signal(false);
  
  // Actualizamos el signal para que guarde también el password generado
  registeredData = signal<{ username: string; password: string; message: string } | null>(null);

  empleadoForm: FormGroup = this.fb.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    middleName: [''],
    birthDate: ['', [Validators.required, minAgeValidator(15)]],
    gender: ['', [Validators.required]],
    phone: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
    email: ['', [Validators.email]],
    emergencyContactName: ['', [Validators.required]],
    emergencyContactPhone: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
    rfc: [null, [Validators.pattern(/^([A-ZÑ&]{3,4}) ?(\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])) ?([A-Z\d]{2}[A-Z\d])$/i)]],
    curp: [null, [Validators.pattern(/^([A-Z][AEIOUX][A-Z]{2}\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])[HM](AS|BC|BS|CC|CL|CM|CS|CH|DF|DG|GT|HG|JC|MC|MN|MS|NT|NL|OC|PL|QT|QR|SP|SL|SR|TC|TS|TL|VZ|YN|ZS|NE)[B-DF-HJ-NP-TV-Z]{3}[0-9A-Z]\d)$/i)]],
    nss: [null, [Validators.pattern(/^\d{11}$/)]],
    roleId: ['', [Validators.required]],
    educationLevel: ['', [Validators.required]],
    allergies: [null],
    shiftId: ['', [Validators.required]]
    // ELIMINADO: password del formGroup
  });

  roles = signal<Role[]>([]);
  shifts = signal<Shift[]>([]);
  maxDate: string = '';

  constructor() {
    const today = new Date();
    const year = today.getFullYear() - 15;
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    this.maxDate = `${year}-${month}-${day}`;
  }

  ngOnInit() {
    this.cargarCatalogos();
  }

  generarPasswordAleatorio(longitud: number = 10): string {
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let resultado = '';
    for (let i = 0; i < longitud; i++) {
      resultado += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    return resultado;
  }

  onSubmit() {
    if (this.empleadoForm.valid) {
      // 1. Generamos la contraseña
      const passwordGenerado = this.generarPasswordAleatorio();

      // 2. Preparamos el objeto final (los valores del form + la password)
      const payload = {
        ...this.empleadoForm.value,
        password: passwordGenerado
      };

      this.empleadosService.registrarEmpleado(payload).subscribe({
        next: (res) => {
          // 3. Guardamos TODO para mostrar en el éxito (incluyendo la password que generamos)
          this.registeredData.set({
            username: res.username,
            password: passwordGenerado, // La guardamos aquí para el HTML
            message: res.message
          });
          this.isRegistered.set(true);
          this.empleadoForm.reset();
        },
        error: (err) => {
          this.errorMessage.set('Error al registrar en el servidor');
          this.showPopup.set(true);
          setTimeout(() => this.showPopup.set(false), 3500);
        }
      });
    } else {
      this.validarCamposYMostrarError();
    }
  }

  // --- MÉTODOS DE APOYO ---

  cargarCatalogos() {
    this.empleadosService.getRoles().subscribe({
      next: (data) => this.roles.set(data),
      error: () => this.errorMessage.set('Error al cargar roles')
    });

    this.empleadosService.getShifts().subscribe({
      next: (data) => this.shifts.set(data),
      error: () => this.errorMessage.set('Error al cargar turnos')
    });
  }

  private validarCamposYMostrarError() {
    const controls = this.empleadoForm.controls;
    const birthDateControl = controls['birthDate'];

    if (birthDateControl?.invalid && birthDateControl.hasError('underAge')) {
      this.errorMessage.set('El empleado debe ser mayor de 15 años');
    } else if (controls['rfc'].invalid && controls['rfc'].value) {
      this.errorMessage.set('El formato del RFC es incorrecto');
    } else if (controls['curp'].invalid && controls['curp'].value) {
      this.errorMessage.set('El formato de la CURP es incorrecto');
    } else if (controls['nss'].invalid && controls['nss'].value) {
      this.errorMessage.set('El NSS debe tener exactamente 11 dígitos');
    } else {
      this.errorMessage.set('Falta rellenar algún campo obligatorio');
    }

    this.showPopup.set(true);
    this.empleadoForm.markAllAsTouched();
    setTimeout(() => this.showPopup.set(false), 3500);
  }

  isFieldValid(field: string) {
    const control = this.empleadoForm.get(field);
    return control && control.valid && (control.dirty || control.touched);
  }

  isFieldInvalid(field: string) {
    const control = this.empleadoForm.get(field);
    return control && control.invalid && (control.dirty || control.touched);
  }

  volver() {
    this.router.navigate(['/empleados']);
  }
}