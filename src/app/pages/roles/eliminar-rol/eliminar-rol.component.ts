import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RolesService } from '../roles.service';
import { Router } from '@angular/router';
import { AlertComponent } from '../../../utils/alert/alert.component';
import { Title } from 'chart.js';
import { SuccessConfig } from '../../../utils/success/success-config.model';
import { SuccessViewComponent } from '../../../utils/success/success-view.component';

@Component({
  selector: 'app-eliminar-rol',
  standalone: true,
  imports: [CommonModule, AlertComponent, SuccessViewComponent],
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
  mostrarAlerta = signal(false);
  showAlertPopup = signal(false);
  estadoIncial = signal(true);
  rolEliminado = signal<string>('');

  ngOnInit() {
    this.cargarRoles();
  }

  cargarRoles() {
    this.rolesService.getRoles().subscribe(data => this.roles.set(data));
  }

  onSeleccionarRol(event: any) {
    this.estadoIncial.set(false);
    const id = event.target.value;
    const seleccionado = this.roles().find(r => r.id == id);
    if (seleccionado) {
      this.rolSeleccionado.set(seleccionado);
      this.rolEliminado.set(seleccionado.name);
      console.log('Rol seleccionado para eliminación:', seleccionado);
      this.isLoaded.set(true);
    }
    this.mostrarAlerta.set(true);
  }

  onDelete() {
    const rol = this.rolSeleccionado();
    if (rol) {
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
    this.cerrarAlertPopup();
    this.mostrarAlerta.set(false);
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

  cerrarAlertPopup() {
    this.showAlertPopup.set(false);
  }

  // Cambia esto en tu clase
  get configuracionExito(): SuccessConfig {
    return {
      titulo: '¡ELIMINACIÓN EXITOSA!',
      mensaje: `El rol "${this.rolEliminado()}" ha sido eliminado del sistema correctamente.`,
      botonPrincipal: 'Eliminar otro rol',
      botonSecundario: 'Volver a roles'
    };
  }

  alConfirmar() {
    this.recargarPagina();
  }

  alSalir() {
    this.router.navigate(['/roles']);
  }

  finalizar() {
    this.isDeleted.set(false);
    this.isLoaded.set(false);
    this.cargarRoles();
    this.router.navigate(['roles']);
  }

  recargarPagina() {
    this.isDeleted.set(false);
    this.isError.set(false);
    this.isLoaded.set(false);
    this.roles.set([]);
    this.rolEliminado.set('');
    this.rolSeleccionado.set(null);
    this.mostrarAlerta.set(false);
    this.showAlertPopup.set(false);
    this.estadoIncial.set(true);

    this.cargarRoles();
  }
}