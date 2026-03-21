import { Component, OnInit, signal, inject, computed } from '@angular/core'; // Agregamos computed
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Incidente, IncidentsService } from '../incidents.service';
import { SuccessViewComponent } from '../../../utils/success/success-view.component';
import { ValidationPopupComponent } from '../../../utils/popup/validation-popup.component';

@Component({
    selector: 'app-crear-incidente',
    standalone: true,
    // Agregamos los componentes reutilizables aquí
    imports: [CommonModule, FormsModule, SuccessViewComponent, ValidationPopupComponent],
    templateUrl: './create-incident.component.html',
    styleUrls: ['./create-incident.component.css']
})
export class CrearIncidenciaComponent implements OnInit {
    private incidentesService = inject(IncidentsService);
    private router = inject(Router);

    // Signals de datos
    residentes = signal<any[]>([]);
    residenteSeleccionado = signal<any>(null);
    tipoIncidente = signal<string>('');
    severidad = signal<string>('');
    descripcion = signal<string>('');

    // Signals de control y UI
    loading = signal(false);
    isError = signal(false);
    isSuccess = signal(false);
    errorMessage = signal('');
    formErrors = signal<string[]>([]);
    showValidationPopup = signal(false);

    // --- NUEVO: Configuración para el componente SuccessView ---
    successData = signal<any>(null);

    obtenerFechaHoraGDL(): string {
        // Retorna algo como "3/21/2026, 13:24:00" que Date() sí puede leer
        return new Date().toLocaleString("en-US", { timeZone: "America/Mexico_City" });
    }

    // Ejemplo de salida: "21/03/2026, 13:15:00"

    ngOnInit() {
        this.cargarResidentes();
    }

    cargarResidentes() {
        this.incidentesService.getResindets().subscribe({
            next: (data) => this.residentes.set(data),
            error: () => this.mostrarError('ERROR AL CARGAR LA LISTA DE RESIDENTES.')
        });
    }

    onSeleccionar(event: any) {
        const id = Number(event.target.value);
        const seleccionado = this.residentes().find(u => u.id === id);
        this.residenteSeleccionado.set(seleccionado || null);
    }

    onSubmit() {
        if (this.validarCampos()) {
            this.ejecutarGuardado();
        }
    }

    private validarCampos(): boolean {
        const errores: string[] = [];

        if (!this.tipoIncidente()) {
            errores.push('EL TIPO DE INCIDENCIA ES OBLIGATORIO.');
        }
        if (!this.severidad()) {
            errores.push('EL NIVEL DE SEVERIDAD ES REQUERIDO.');
        }
        if (!this.descripcion() || this.descripcion().trim().length < 10) {
            errores.push('LA DESCRIPCIÓN DEBE TENER AL MENOS 10 CARACTERES.');
        }

        if (errores.length > 0) {
            this.formErrors.set(errores);
            this.showValidationPopup.set(true);
            return false;
        }

        return true;
    }

    private ejecutarGuardado() {
        this.loading.set(true);

        const payload: Incidente = {
            residentId: this.residenteSeleccionado().id,
            registeredByUserId: 1,
            // Si viene de un formulario o de tu función que devuelve string:
            date: new Date(this.obtenerFechaHoraGDL()).toISOString(),
            type: this.tipoIncidente().toUpperCase(),
            severityLevel: this.severidad().toUpperCase(),
            description: this.descripcion().toUpperCase()
        };

        this.incidentesService.crearIncident(payload).subscribe({
            next: (res) => {
                this.loading.set(false);
                if (res?.isBusinessError) {
                    this.formErrors.set([res.errorMessage.toUpperCase()]);
                    this.showValidationPopup.set(true);
                } else {
                    this.prepararSuccessData();
                    this.isSuccess.set(true);
                }
            },
            error: () => {
                this.loading.set(false);
                this.formErrors.set(['ERROR TÉCNICO AL REGISTRAR EL INCIDENTE EN EL SERVIDOR.']);
                this.showValidationPopup.set(true);
            }
        });
    }

    private prepararSuccessData() {
        const nombre = `${this.residenteSeleccionado().firstName} ${this.residenteSeleccionado().lastName} ${this.residenteSeleccionado().middleName || ''}`.trim();
        this.successData.set({
            titulo: '¡INCIDENCIA REGISTRADA!',
            mensaje: `El reporte para el residente ${nombre} se ha guardado correctamente.`,
            botonPrincipal: 'NUEVA INCIDENCIA'
        });
    }

    private mostrarError(msg: string) {
        this.errorMessage.set(msg);
        this.isError.set(true);
    }

    resetVista() {
        this.isError.set(false);
        this.isSuccess.set(false);
        this.errorMessage.set('');
        this.residenteSeleccionado.set(null);
        this.tipoIncidente.set('');
        this.severidad.set('');
        this.descripcion.set('');
    }

    volver() {
        this.router.navigate(['/dashboard']);
    }

    // Agregamos este alias para el botón "Nueva Incidencia" desde el success-view
    nuevoRegistro() {
        this.resetVista();
    }
}