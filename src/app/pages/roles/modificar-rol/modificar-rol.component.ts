import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RolesService } from '../roles.service';
import { Router } from '@angular/router';
import { ValidationPopupComponent } from '../../../utils/popup/validation-popup.component';
import { SuccessViewComponent } from '../../../utils/success/success-view.component';
import { SuccessConfig } from '../../../utils/success/success-config.model';

@Component({
  selector: 'app-modificar-rol',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ValidationPopupComponent, SuccessViewComponent],
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

  showValidationPopup = signal(false);
  formErrors = signal<string[]>([]); // Lista de errores para el Popup
  showPopup = signal(false); // Controla la visibilidad del Popup

  estadoIncial = signal(true);

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
    this.estadoIncial.set(false);
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

  private validarCamposYMostrarError() {
    const listaErrores: string[] = [];
    const controls = this.rolForm.controls;

    // Revisamos cada campo obligatorio
    if (controls['name'].invalid) listaErrores.push('El nombre es obligatorio');
    if (controls['description'].invalid) listaErrores.push('La descripción es obligatoria');

    this.formErrors.set(listaErrores); // Llenamos el signal de errores
    this.showPopup.set(true);      // Disparamos la ventana emergente
    this.showValidationPopup.set(true);
    this.rolForm.markAllAsTouched(); // Marcamos para que se vean los bordes rojos
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
    } else {
      this.validarCamposYMostrarError();
    }
  }

  configuracionExito: SuccessConfig = {
    titulo: '¡ACTUALIZACIÓN EXITOSA!',
    mensaje: 'Los datos del rol se han guardado correctamente para el rol.' + this.rolForm.value.name,
    botonPrincipal: 'Realizar otra modificación',
    botonSecundario: 'volver a roles',
  };

  alConfirmar() {
    this.resetVista();
  }

  alSalir() {
    this.router.navigate(['/roles']);
  }

  cerrarPopup() {
    this.showPopup.set(false);
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

  resetVista() {
    this.isError.set(false);
    this.isUpdated.set(false);
    this.isLoaded.set(false);
    this.roles.set([]);
    this.rolForm.reset();
    this.showValidationPopup.set(false);
    this.showPopup.set(false);
    this.formErrors.set([]);
    this.estadoIncial.set(true);
    this.ngOnInit();
  }

  finalizar() {
    this.router.navigate(['/roles']);
  }
}