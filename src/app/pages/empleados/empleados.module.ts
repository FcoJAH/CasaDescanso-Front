import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { EmpleadosRoutingModule } from './empleados-routing.module';
import { RegistroEmpleadoComponent } from './registro/registro-empleado.component';

@NgModule({
  declarations: [
    RegistroEmpleadoComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    EmpleadosRoutingModule
  ]
})
export class EmpleadosModule { }
