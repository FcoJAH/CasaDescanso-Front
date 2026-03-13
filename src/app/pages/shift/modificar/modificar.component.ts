import { Component, OnInit, signal, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TurnosService } from '../turnos.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
    selector: 'app-modificar-turno',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule 
    ],
    templateUrl: './modificar.component.html',
    styleUrls: ['./modificar.component.css']
})
export class ModificarComponent implements OnInit {
    private fb = inject(FormBuilder);
    private turnosService = inject(TurnosService);
    private router = inject(Router);

    turnos = signal<any[]>([]); 
    turnoForm: FormGroup;
    isLoaded = signal(false); 
    isRegistered = signal(false); 

    constructor() {
        this.turnoForm = this.fb.group({
            id: [null],
            name: ['', [Validators.required]],
            startTime: ['', [Validators.required]],
            endTime: ['', [Validators.required]]
        });
    }

    ngOnInit() {
        this.cargarTurnos();
    }

    cargarTurnos() {
        this.turnosService.getTurnos().subscribe(data => {
            this.turnos.set(data);
        });
    }

    // CAMBIADO: Antes decía onSeleccionarRol y usaba this.roles()
    onSeleccionarTurno(event: any) {
        const id = event.target.value;
        const seleccionado = this.turnos().find(t => t.id == id); // Usamos turnos()
        
        if (seleccionado) {
            this.turnoForm.patchValue({
                id: seleccionado.id,
                name: seleccionado.name,
                startTime: seleccionado.startTime,
                endTime: seleccionado.endTime
            });
            this.isLoaded.set(true); 
        }
    }

    // CAMBIADO: Antes usaba rolForm y rolesService
    onUpdate() {
        if (this.turnoForm.valid) {
            const id = this.turnoForm.value.id;
            const body = {
                name: this.turnoForm.value.name.toUpperCase(), // Mantenemos UPPERCASE
                startTime: this.turnoForm.value.startTime,
                endTime: this.turnoForm.value.endTime,
                isActive: true 
            };

            this.turnosService.actualizarTurno(id, body).subscribe({
                next: () => this.isRegistered.set(true),
                error: (err) => console.error('Error al actualizar:', err)
            });
        }
    }

    finalizarEdicion() {
        this.isRegistered.set(false);
        this.isLoaded.set(false);
        this.turnoForm.reset();
        this.router.navigate(['/horarios']);
    }

    isFieldInvalid(field: string): boolean {
        const control = this.turnoForm.get(field);
        return !!(control && control.invalid && (control.touched || control.dirty));
    }

    isFieldValid(field: string): boolean {
        const control = this.turnoForm.get(field);
        return !!(control && control.valid && (control.touched || control.dirty));
    }
}