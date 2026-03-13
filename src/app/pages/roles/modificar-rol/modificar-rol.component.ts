import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RolesService } from '../roles.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-modificar-rol',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './modificar-rol.component.html',
  styleUrls: ['./modificar-rol.component.css']
})
export class ModificarRolComponent implements OnInit {
  private fb = inject(FormBuilder);
  private rolesService = inject(RolesService);
  private router = inject(Router);

  roles = signal<any[]>([]);
  isLoaded = signal(false);   // <--- Controla si el formulario se muestra (igual que turnos)
  isUpdated = signal(false);
  isError = signal(false);
  errorMessage = signal('');

  rolForm: FormGroup = this.fb.group({
    id: ['', [Validators.required]],
    name: ['', [Validators.required]],
    description: ['', [Validators.required]]
  });

  ngOnInit() {
    this.cargarRoles();
  }

  cargarRoles() {
    this.rolesService.getRoles().subscribe(data => this.roles.set(data));
  }

  onSeleccionarRol(event: any) {
    const id = event.target.value;
    const seleccionado = this.roles().find(r => r.id == id);
    if (seleccionado) {
      this.rolForm.patchValue({
        id: seleccionado.id,
        name: seleccionado.name,
        description: seleccionado.description
      });
      this.isLoaded.set(true); // <--- Al seleccionar, mostramos el formulario
      this.isError.set(false);
    }
  }

  onSubmit() {
    if (this.rolForm.valid) {
      const id = this.rolForm.value.id;
      const datosEnviar = {
        name: this.rolForm.value.name.toUpperCase(), // Mayúsculas obligatorias
        description: this.rolForm.value.description,
        isActive: true
      };

      this.rolesService.actualizarRol(id, datosEnviar).subscribe({
        next: () => {
          this.isUpdated.set(true);
          this.isLoaded.set(false);
        },
        error: (err) => {
          this.errorMessage.set(err.error || 'Error al actualizar');
          this.isError.set(true);
        }
      });
    }
  }

  resetVista() {
    this.isError.set(false);
    this.isUpdated.set(false);
    this.isLoaded.set(false);
    this.rolForm.reset();
  }

  finalizar() {
    this.router.navigate(['/roles']);
  }
}