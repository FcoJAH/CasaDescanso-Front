import { Component, inject, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { TurnosService } from '../../shift/turnos.service';
import { Router } from '@angular/router';
import { ShiftCreate } from '../shift.model';

@Component({
  selector: 'app-crear-turno',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './crear-turno.component.html',
  styleUrl: './crear-turno.component.css'
})
export class CrearTurnoComponent {
  private fb = inject(FormBuilder);
  private turnosService = inject(TurnosService);
  private router = inject(Router);

  isRegistered = signal(false);
  showPopup = signal(false);
  errorMessage = signal('');

  turnoForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    startTime: ['', [Validators.required]],
    endTime: ['', [Validators.required]]
  });

  onSubmit() {
  if (this.turnoForm.valid) {
    const formValue = this.turnoForm.value;

    const payload: ShiftCreate = {
      // Usamos el operador "!" al final para asegurar que no son nulos
      name: formValue.name!, 
      startTime: formValue.startTime!.includes(':') && formValue.startTime!.split(':').length === 2 
                 ? `${formValue.startTime}:00` 
                 : formValue.startTime!,
      endTime: formValue.endTime!.includes(':') && formValue.endTime!.split(':').length === 2 
               ? `${formValue.endTime}:00` 
               : formValue.endTime!
    };

    this.turnosService.crearTurno(payload).subscribe({
      next: () => this.isRegistered.set(true),
      error: (err) => {
        console.error('Error 400 detalle:', err.error);
        this.errorMessage.set('Error en el formato de datos');
        this.showPopup.set(true);
      }
    });
  }
}

  isFieldValid(field: string) {
    const control = this.turnoForm.get(field);
    return control && control.valid && (control.dirty || control.touched);
  }

  isFieldInvalid(field: string) {
    const control = this.turnoForm.get(field);
    return control && control.invalid && (control.dirty || control.touched);
  }

  volver() {
    this.router.navigate(['/horarios']);
  }
}