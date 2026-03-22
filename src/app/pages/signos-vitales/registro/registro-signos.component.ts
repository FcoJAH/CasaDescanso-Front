import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { VitalSignsService } from '../signos-vitales.service';
import { ResidentesService } from '../../residentes/residentes.service';
import { SuccessConfig } from '../../../utils/success/success-config.model';
import { SuccessViewComponent } from '../../../utils/success/success-view.component';
import { ValidationPopupComponent } from '../../../utils/popup/validation-popup.component';

@Component({
  selector: 'app-registro-signos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SuccessViewComponent, ValidationPopupComponent],
  templateUrl: './registro-signos.component.html',
  styleUrl: './registro-signos.component.css'
})
export class RegistroSignosComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private residentesService = inject(ResidentesService);
  private empleadosService = inject(VitalSignsService);

  errorMessage = signal('');
  showPopup = signal(false);
  isRegistered = signal(false);
  usuarioLogueado = signal<any>(null);
  residentes = signal<any[]>([]);
  successData = signal<SuccessConfig | null>(null);
  showValidationPopup = signal(false);
  formErrors = signal<string[]>([]);

  // Formulario con validaciones solo de presencia y formato (Permite guardar cualquier rango)
  signosForm: FormGroup = this.fb.group({
    residentId: ['', [Validators.required]],
    recordedByUserId: ['', [Validators.required]],
    temperature: [null, [Validators.required]],
    bloodPressure: ['', [Validators.required, Validators.pattern(/^\d{2,3}\/\d{2,3}$/)]],
    heartRate: [null, [Validators.required]],
    respiratoryFrequency: [null, [Validators.required]],
    oxygenSaturation: [null, [Validators.required]],
    glucoseLevel: [null, [Validators.required]],
    weight: [null, [Validators.required]],
    notes: ['']
  });

  ngOnInit() {
    this.cargarCatalogos();
    this.establecerUsuarioResponsable();
  }

  // --- MÉTODOS PARA EL HTML (RESUELVE TUS ERRORES) ---

  isFieldInvalid(field: string): boolean {
    const control = this.signosForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getStatus(field: string): 'normal' | 'alerta' | 'none' {
    const value = this.signosForm.get(field)?.value;
    if (value === null || value === '' || value === undefined) return 'none';

    switch (field) {
      case 'temperature':
        const temp = Number(value);
        return (temp >= 36 && temp <= 37.5) ? 'normal' : 'alerta';

      case 'bloodPressure':
        if (!String(value).includes('/')) return 'none';
        const parts = String(value).split('/');
        const sis = Number(parts[0]);
        const dia = Number(parts[1]);
        return (sis >= 110 && sis <= 139 && dia >= 70 && dia <= 89) ? 'normal' : 'alerta';

      case 'oxygenSaturation':
        const o2 = Number(value);
        return (o2 >= 94 && o2 <= 100) ? 'normal' : 'alerta';

      case 'heartRate':
        const hr = Number(value);
        return (hr >= 60 && hr <= 100) ? 'normal' : 'alerta';

      case 'glucoseLevel':
        const glu = Number(value);
        return (glu >= 70 && glu <= 140) ? 'normal' : 'alerta';

      case 'respiratoryFrequency':
        const resp = Number(value);
        return (resp >= 12 && resp <= 20) ? 'normal' : 'alerta';

      default:
        return 'none';
    }
  }

  // --- LÓGICA DE ENVÍO ---

  verificarYEnviar() {
    if (this.signosForm.invalid) {
      const errores: string[] = [];
      const controls = this.signosForm.controls;

      const labels: any = {
        temperature: "TEMPERATURA",
        bloodPressure: "PRESIÓN ARTERIAL",
        heartRate: "PULSO CARDÍACO",
        respiratoryFrequency: "FRECUENCIA RESPIRATORIA",
        oxygenSaturation: "SATURACIÓN DE OXÍGENO",
        glucoseLevel: "NIVEL DE GLUCOSA",
        weight: "PESO",
        residentId: "RESIDENTE"
      };

      Object.keys(controls).forEach(key => {
        if (controls[key].errors?.['required']) {
          errores.push(`${labels[key] || key.toUpperCase()} ES REQUERIDO(A)`);
        }
      });

      if (controls['bloodPressure'].errors?.['pattern']) {
        errores.push("FORMATO DE PRESIÓN INVÁLIDO (EJ: 120/80)");
      }

      this.formErrors.set(errores);
      this.showValidationPopup.set(true);
    } else {
      this.onSubmit();
    }
  }

  onSubmit() {
    const payload = { 
      ...this.signosForm.value,
      residentId: parseInt(this.signosForm.value.residentId, 10)
    };

    this.empleadosService.registrarSignosVitales(payload).subscribe({
      next: () => {
        this.isRegistered.set(true);
        this.successData.set({
          titulo: '¡REGISTRO GUARDADO CON ÉXITO!',
          mensaje: 'Los datos clínicos han sido guardados en el expediente.',
          botonPrincipal: 'NUEVO REGISTRO'
        });
      },
      error: () => {
        this.formErrors.set(['ERROR AL CONECTAR CON EL SERVIDOR']);
        this.showValidationPopup.set(true);
      }
    });
  }

  // --- MÉTODOS DE APOYO ---

  establecerUsuarioResponsable() {
    const stored = localStorage.getItem('currentUser');
    const user = stored ? JSON.parse(stored) : null;
    if (user) {
      this.signosForm.patchValue({ recordedByUserId: user.workerId });
      this.usuarioLogueado.set(user);
    }
  }

  cargarCatalogos() {
    this.residentesService.obtenerActivos().subscribe({
      next: (data) => this.residentes.set(data),
      error: () => this.errorMessage.set('Error al cargar residentes')
    });
  }

  nuevoRegistro() {
    this.signosForm.reset({ residentId: '', bloodPressure: '', notes: '' });
    this.signosForm.markAsPristine();
    this.signosForm.markAsUntouched();
    this.isRegistered.set(false);
  }

  volver() { this.router.navigate(['/dashboard']); }
}