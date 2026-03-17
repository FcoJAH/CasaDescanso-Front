import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RolesService } from '../roles.service';
import { Router } from '@angular/router';
import { ValidationPopupComponent } from '../../../utils/popup/validation-popup.component';
import { SuccessConfig } from '../../../utils/success/success-config.model';
import { SuccessViewComponent } from '../../../utils/success/success-view.component';

@Component({
    selector: 'app-crear-rol',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, ValidationPopupComponent, SuccessViewComponent],
    templateUrl: './crear-rol.component.html',
    styleUrls: ['./crear-rol.component.css']
})
export class CrearRolComponent {
    private fb = inject(FormBuilder);
    private rolesService = inject(RolesService);
    private router = inject(Router);

    rolForm: FormGroup = this.fb.group({
        name: ['', [Validators.required]],
        description: ['', [Validators.required]]
    });

    isRegistered = signal(false);
    errorMessage = signal('');
    showPopup = signal(false);
    showValidationPopup = signal(false);
    formErrors = signal<string[]>([]); // Lista de errores para el Popup

    onSubmit() {
        if (this.rolForm.valid) {
            const formValue = {
                ...this.rolForm.value,
                name: this.rolForm.value.name.toUpperCase()
            };

            this.rolesService.crearRol(formValue).subscribe({
                next: () => {
                    this.isRegistered.set(true);
                },
                error: (err) => {
                    this.errorMessage.set(err.error || 'Error al crear el rol');
                    this.showPopup.set(true);
                }
            });
        } else {
            this.validarCamposYMostrarError();
        }
    }

    private validarCamposYMostrarError() {
        const listaErrores: string[] = [];
        const controls = this.rolForm.controls;

        // Revisamos cada campo obligatorio
        if (controls['name'].invalid) listaErrores.push('El nombre del rol es obligatorio');
        if (controls['description'].invalid) listaErrores.push('La descripción del rol es obligatoria');


        this.formErrors.set(listaErrores); // Llenamos el signal de errores
        this.showPopup.set(true);      // Disparamos la ventana emergente
        this.showValidationPopup.set(true);
        this.rolForm.markAllAsTouched(); // Marcamos para que se vean los bordes rojos
    }

    cerrarPopup() {
        this.showPopup.set(false);
    }

    configuracionExito: SuccessConfig = {
        titulo: '¡CREACIÓN EXITOSA!',
        mensaje: 'El rol ' + this.rolForm.value.name + ' ha sido creado correctamente.',
        botonPrincipal: 'Crear otro Rol',
        botonSecundario: 'Volver a roles',
    };

    alConfirmar() {
        this.resetVista();
    }

    alSalir() {
        this.router.navigate(['/roles']);
    }

    resetVista() {
        this.isRegistered.set(false);
        this.rolForm.reset();
        this.rolForm.markAsPristine();
        this.rolForm.markAsUntouched();
    }

    // Helpers para el HTML
    isFieldValid(field: string) {
        const control = this.rolForm.get(field);
        return control && control.valid && (control.dirty || control.touched);
    }

    isFieldInvalid(field: string) {
        const control = this.rolForm.get(field);
        return control && control.invalid && (control.dirty || control.touched);
    }

    finalizarEdicion() {
        this.isRegistered.set(false);
        this.rolForm.reset();
        this.router.navigate(['/roles']); // Ajusta a tu ruta de "Ver Roles"
    }
}