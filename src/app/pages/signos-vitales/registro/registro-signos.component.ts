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
  imports: [CommonModule,
    ReactiveFormsModule,
    SuccessViewComponent,
    ValidationPopupComponent],
  templateUrl: './registro-signos.component.html',
  styleUrl: './registro-signos.component.css'
})
export class RegistroSignosComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);

  // Signals para el manejo del popup (muy Angular 19)
  errorMessage = signal('');
  showPopup = signal(false);

  isRegistered = signal(false);
  registeredData = signal<{ username: string; message: string } | null>(null);
  usuarioLogueado = signal<any>(null);
  residentes = signal<any[]>([]);
  usuarios = signal<any[]>([]);
  successData = signal<SuccessConfig | null>(null);

  // Rangos de referencia
  readonly RANGOS = {
    temp: { min: 36.0, max: 37.5 },
    heart: { min: 60, max: 100 },
    oxigen: { min: 94, max: 100 },
    resp: { min: 12, max: 20 },
    glucosa: { min: 70, max: 140 }
  };

  signosForm: FormGroup = this.fb.group({
    residentId: ['', [Validators.required]],
    recordedByUserId: ['', [Validators.required]],
    temperature: [null, [Validators.required, Validators.min(30), Validators.max(45)]],
    bloodPressure: ['', [Validators.required, Validators.pattern(/^\d{2,3}\/\d{2,3}$/)]],
    heartRate: [null, [Validators.required, Validators.min(10), Validators.max(250)]],
    respiratoryFrequency: [null, [Validators.required, Validators.min(5), Validators.max(60)]],
    oxygenSaturation: [null, [Validators.required, Validators.min(1), Validators.max(100)]],
    glucoseLevel: [null, [Validators.required, Validators.min(20), Validators.max(600)]],
    weight: [null, [Validators.required, Validators.min(20), Validators.max(500)]],
    notes: ['']
  });

  // En RegistrarEmpleadoComponent
  maxDate: string = '';
  authService: any;

  constructor() {
    const today = new Date();
    const year = today.getFullYear() - 15; // Año máximo permitido (2011)
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    this.maxDate = `${year}-${month}-${day}`;
  }

  ngOnInit() {
    this.cargarCatalogos();
    this.establecerUsuarioResponsable();
  }

  establecerUsuarioResponsable() {
    // 1. Red de seguridad: Intentar obtener del servicio o directamente del Storage
    const user = this.authService?.currentUserSignal() || this.getBackupUser();

    if (user) {
      this.signosForm.patchValue({
        recordedByUserId: user.workerId
      });
      this.usuarioLogueado.set(user);
      console.log("✅ Usuario responsable asignado:", user.workerId, user.fullName);
    } else {
      console.error("❌ No se pudo recuperar el usuario de ninguna fuente.");
    }
  }

  // Método de respaldo por si el servicio falla en el arranque
  private getBackupUser(): any {
    const stored = localStorage.getItem('currentUser');
    return stored ? JSON.parse(stored) : null;
  }

  private residentesService = inject(ResidentesService);

  cargarCatalogos() {
    this.residentesService.obtenerActivos().subscribe({
      next: (data) => {
        // Aquí se llena el catálogo que usa el @for del HTML
        this.residentes.set(data);
      },
      error: () => this.errorMessage.set('Error al conectar con la base de datos de residentes')
    });
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
        const sistolica = Number(parts[0]);
        const diastolica = Number(parts[1]);
        // Rango: Sistólica 110-139 y Diastólica 70-89
        return (sistolica >= 110 && sistolica <= 139 && diastolica >= 70 && diastolica <= 89)
          ? 'normal' : 'alerta';

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

  // Inyectas el servicio
  private empleadosService = inject(VitalSignsService);

  onSubmit() {
    const payload = { ...this.signosForm.value };
    payload.residentId = parseInt(payload.residentId, 10);

    this.empleadosService.registrarSignosVitales(payload).subscribe({
      next: () => {
        this.isRegistered.set(true);
        this.successData.set({
          titulo: '¡REGISTRO GUARDADO CON EXITO!',
          mensaje: 'Los datos clinicos han sido guardados con exito en el expediente del residente',
          botonPrincipal: 'NUEVO REGISTRO'
        });
      },
      error: (err) => {
        this.successData.set({
          titulo: 'ERROR AL GUARDAR EN EL SERVIDOR',
          mensaje: 'Los datos clinicos no se han guardado correctamente debido a un error en el servidor. Por favor, intente nuevamente.',
          botonPrincipal: 'NUEVO REGISTRO'
        });
      }
    });
  }

  //Popup de validación para mostrar errores específicos de cada campo
  showValidationPopup = signal(false);
  formErrors = signal<string[]>([]);

  verificarYEnviar() {
    console.log("🔍 Verificando formulario antes de enviar...", this.signosForm.value);

    if (this.signosForm.invalid) {
      const errores: string[] = [];
      const controls = this.signosForm.controls;
      const valorPresion = controls['bloodPressure'].value;

      // --- TEMPERATURA ---
      if (controls['temperature'].errors?.['required']) {
        errores.push("TEMPERATURA REQUERIDA");
      } else if (controls['temperature'].errors?.['min'] || controls['temperature'].errors?.['max']) {
        errores.push("TEMPERATURA DEBE ESTAR ENTRE 30 Y 45 °C");
      }

      // --- PRESIÓN ARTERIAL ---
      if (controls['bloodPressure'].errors?.['required']) {
        errores.push("PRESIÓN ARTERIAL REQUERIDA");
      } else if (controls['bloodPressure'].invalid) {
        errores.push("FORMATO DE PRESIÓN INVÁLIDO (EJ: 120/80)");
      } else if (valorPresion) {
        // Si el formato es correcto (ej. 120/80), verificamos los números
        const partes = valorPresion.split('/');
        const sis = parseInt(partes[0]);
        const dias = parseInt(partes[1]);

        if (sis < 50 || sis > 260) {
          errores.push("VALOR SISTÓLICO (PRIMERO) FUERA DE RANGO REAL (50-260)");
        }
        if (dias < 30 || dias > 150) {
          errores.push("VALOR DIASTÓLICO (SEGUNDO) FUERA DE RANGO REAL (30-150)");
        }
        if (sis <= dias) {
          errores.push("LA PRESIÓN SISTÓLICA DEBE SER MAYOR A LA DIASTÓLICA");
        }
      }

      // --- PULSO CARDÍACO ---
      if (controls['heartRate'].errors?.['required']) {
        errores.push("PULSO CARDÍACO REQUERIDO");
      } else if (controls['heartRate'].errors?.['min'] || controls['heartRate'].errors?.['max']) {
        errores.push("PULSO CARDÍACO DEBE ESTAR ENTRE 10 Y 250 LPM");
      }

      // --- FRECUENCIA RESPIRATORIA ---
      if (controls['respiratoryFrequency'].errors?.['required']) {
        errores.push("FRECUENCIA RESPIRATORIA REQUERIDA");
      } else if (controls['respiratoryFrequency'].errors?.['min'] || controls['respiratoryFrequency'].errors?.['max']) {
        errores.push("FRECUENCIA RESPIRATORIA DEBE ESTAR ENTRE 5 Y 60 RPM");
      }

      // --- SATURACIÓN DE OXÍGENO ---
      if (controls['oxygenSaturation'].errors?.['required']) {
        errores.push("SATURACIÓN DE OXÍGENO REQUERIDA");
      } else if (controls['oxygenSaturation'].errors?.['min'] || controls['oxygenSaturation'].errors?.['max']) {
        errores.push("SATURACIÓN DE OXÍGENO DEBE ESTAR ENTRE 1 Y 100%");
      }

      // --- NIVEL DE GLUCOSA ---
      if (controls['glucoseLevel'].errors?.['required']) {
        errores.push("NIVEL DE GLUCOSA REQUERIDO");
      } else if (controls['glucoseLevel'].errors?.['min'] || controls['glucoseLevel'].errors?.['max']) {
        errores.push("NIVEL DE GLUCOSA DEBE ESTAR ENTRE 20 Y 600 MG/DL");
      }

      // --- PESO ---
      if (controls['weight'].errors?.['required']) {
        errores.push("PESO REQUERIDO");
      } else if (controls['weight'].errors?.['min'] || controls['weight'].errors?.['max']) {
        errores.push("PESO DEBE ESTAR ENTRE 20 Y 500 KG");
      }

      this.formErrors.set(errores);
      this.showValidationPopup.set(true);

    } else {
      this.onSubmit();
    }
  }

  volver() {
    this.router.navigate(['/dashboard']);
  }

  nuevoRegistro() {
    this.signosForm.reset({
      residentId: '', // Volver al valor por defecto del select
      temperature: null,
      bloodPressure: '',
      heartRate: null,
      respiratoryFrequency: null,
      oxygenSaturation: null,
      glucoseLevel: null,
      weight: null,
      notes: ''
    });

    this.signosForm.markAsPristine();
    this.signosForm.markAsUntouched();

    this.isRegistered.set(false);
  }

  // Helper para el HTML
  isFieldValid(field: string) {
    const control = this.signosForm.get(field);
    return control && control.valid && (control.dirty || control.touched);
  }

  isFieldInvalid(field: string) {
    const control = this.signosForm.get(field);
    return control && control.invalid && (control.dirty || control.touched);
  }

  isPasswordVisible = signal(false); // Estado para el ojo

  togglePasswordVisibility() {
    this.isPasswordVisible.update(v => !v);
  }
}