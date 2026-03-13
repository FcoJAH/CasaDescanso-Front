import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ResidentesService } from '../residentes.service';
import { ValidationPopupComponent } from '../../../utils/popup/validation-popup.component';

@Component({
  selector: 'app-registro-residente',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ValidationPopupComponent],
  templateUrl: './registro-residente.component.html',
  styleUrl: './registro-residente.component.css'
})
export class RegistrarResidenteComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private residentesService = inject(ResidentesService);

  // Signals para manejar los nuevos componentes globales
  showPopup = signal(false);
  formErrors = signal<string[]>([]); // Lista de errores para el Popup
  isRegistered = signal(false);
  showValidationPopup = signal(false);

  // Configuración para la Success View (Estandarizada)
  config = signal({
    titulo: 'REGISTRO EXITOSO',
    mensaje: '',
    nombreUsuario: '', // Aquí guardamos el nombre del residente registrado
    botonPrincipal: 'VOLVER A RESIDENTES'
  });

  registeredData = signal<{ fullName: string } | null>(null);

  residenteForm: FormGroup = this.fb.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    middleName: ['', [Validators.required]],
    birthDate: ['', [Validators.required]],
    gender: ['', [Validators.required]],
    admissionDate: [new Date().toISOString().split('T')[0], [Validators.required]],
    nss: [null, [Validators.required, Validators.pattern(/^\d{11}$/)]],
    bloodType: ['', [Validators.required]],
    diagnosedDiseases: [''],
    allergies: [''],
    emergencyContactName: ['', [Validators.required]],
    emergencyContactPhone: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
    emergencyContactRelation: ['', [Validators.required]],
    secondContactName: [''],
    secondContactPhone: ['', [Validators.pattern('^[0-9]{10}$')]],
    observations: ['']
  });

  maxDate: string = new Date().toISOString().split('T')[0];

  ngOnInit() { }

  onSubmit() {
    if (this.residenteForm.valid) {
      // Transformación a MAYÚSCULAS antes de enviar (Instrucción del 2026-02-18)
      const formValue = { ...this.residenteForm.value };
      const nombreCompleto = `${formValue.firstName} ${formValue.lastName} ${formValue.middleName}`.toUpperCase();

      // Mapeo de valores en mayúsculas para el envío al Backend
      const payload = {
        ...formValue,
        firstName: formValue.firstName.toUpperCase(),
        lastName: formValue.lastName.toUpperCase(),
        middleName: formValue.middleName.toUpperCase(),
        emergencyContactName: formValue.emergencyContactName.toUpperCase()
      };

      this.residentesService.registrarResidente(payload).subscribe({
        next: () => {
          this.config.update(c => ({
            ...c,
            mensaje: 'EL RESIDENTE HA SIDO DADO DE ALTA CORRECTAMENTE.',
            nombreUsuario: nombreCompleto
          }));
          this.registeredData.set({ fullName: nombreCompleto });
          this.isRegistered.set(true);
        },
        error: () => {
          this.formErrors.set(['ERROR DE CONEXIÓN CON EL SERVIDOR (IP 169.XXX).']);
          this.showPopup.set(true);
        }
      });
    } else {
      this.validarCamposYMostrarError();
    }
  }

  private validarCamposYMostrarError() {
    const listaErrores: string[] = [];
    const controls = this.residenteForm.controls;

    // Revisamos cada campo obligatorio
    if (controls['firstName'].invalid) listaErrores.push('El nombre es obligatorio');
    if (controls['lastName'].invalid) listaErrores.push('El apellido paterno es obligatorio');
    if (controls['birthDate'].invalid) listaErrores.push('La fecha de nacimiento es obligatoria');
    if (controls['gender'].invalid) listaErrores.push('Debe seleccionar un género');
    if (controls['bloodType'].invalid) listaErrores.push('El tipo de sangre es obligatorio');
    if (controls['emergencyContactName'].invalid) listaErrores.push('Nombre de contacto de emergencia obligatorio');

    // Validaciones de formato específico
    if (controls['emergencyContactPhone'].errors?.['pattern'] || controls['emergencyContactPhone'].errors?.['required']) {
      listaErrores.push('El teléfono de contacto debe ser de 10 dígitos');
    }
    if (controls['nss'].errors?.['required']) {
      listaErrores.push('El NSS es obligatorio');
    }
    else if (controls['nss'].errors?.['pattern']) {
      listaErrores.push('El NSS debe tener exactamente 11 dígitos');
    }
    if (controls['emergencyContactRelation'].invalid) {
      listaErrores.push('La relación del contacto de emergencia es obligatoria');
    }

    this.formErrors.set(listaErrores); // Llenamos el signal de errores
    this.showPopup.set(true);      // Disparamos la ventana emergente
    this.showValidationPopup.set(true);
    this.residenteForm.markAllAsTouched(); // Marcamos para que se vean los bordes rojos
  }

  cerrarPopup() {
    this.showPopup.set(false);
  }

  volver() {
    this.router.navigate(['/residentes']);
  }

  salir() {
    this.router.navigate(['/dashboard']);
  }

  // Helpers para el HTML
  isFieldValid(field: string) {
    const control = this.residenteForm.get(field);
    return control && control.valid && (control.dirty || control.touched);
  }

  isFieldInvalid(field: string) {
    const control = this.residenteForm.get(field);
    return control && control.invalid && (control.dirty || control.touched);
  }
}