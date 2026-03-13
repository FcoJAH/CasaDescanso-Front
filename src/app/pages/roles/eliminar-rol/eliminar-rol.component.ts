import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RolesService } from '../roles.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-eliminar-rol',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './eliminar-rol.component.html',
  styleUrls: ['./eliminar-rol.component.css']
})
export class EliminarRolComponent implements OnInit {
  private rolesService = inject(RolesService);
  private router = inject(Router);

  roles = signal<any[]>([]);
  rolSeleccionado = signal<any>(null);
  isLoaded = signal(false);
  isDeleted = signal(false);
  isError = signal(false);
  errorMessage = signal('');

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
      this.rolSeleccionado.set(seleccionado);
      this.isLoaded.set(true);
    }
  }

  onDelete() {
    const rol = this.rolSeleccionado();
    if (rol) {
      // Usamos la misma lógica de "Eliminar Turno" (soft delete / desactivar)
      this.rolesService.eliminarRol(rol.id).subscribe({
        next: () => {
          this.isDeleted.set(true);
          this.isLoaded.set(false);
        },
        error: () => this.isError.set(true)
      });
    }
  }

  confirmarEliminar() {
    const rol = this.rolSeleccionado();
    if (rol) {
      this.rolesService.eliminarRol(rol.id).subscribe({
        next: () => {
          this.isDeleted.set(true);
          this.isError.set(false);
        },
        error: (err) => {
          // Verificamos si es un error de restricción (comúnmente error 409 o 500 con mensaje de FK)
          console.error('Error desde el servidor:', err);

          this.errorMessage.set(
            'No se puede eliminar el rol porque tiene usuarios asignados. ' +
            'Por favor, reasigna a los empleados a otro perfil antes de intentar borrar este.'
          );
          this.isError.set(true);
        }
      });
    }
  }

  finalizar() {
    this.isDeleted.set(false);
    this.isLoaded.set(false);
    this.cargarRoles();
    this.router.navigate(['roles']);
  }
}