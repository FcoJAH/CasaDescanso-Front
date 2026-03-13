import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RolesService } from '../roles.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-crear-rol',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
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
        }
    }

    finalizarEdicion() {
        this.isRegistered.set(false);
        this.rolForm.reset();
        this.router.navigate(['/roles']); // Ajusta a tu ruta de "Ver Roles"
    }
}