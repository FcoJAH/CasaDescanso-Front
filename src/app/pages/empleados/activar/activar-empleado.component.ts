import { Component, OnInit, signal, inject } from '@angular/core';
import { EmpleadosService } from '../empleados.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-activar-empleado',
    templateUrl: './activar-empleado.component.html',
    styleUrls: ['./activar-empleado.component.css']
})
export class ActivarEmpleadoComponent implements OnInit {
    private empleadosService = inject(EmpleadosService);
    private router = inject(Router);

    empleados = signal<any[]>([]);
    empleadoSeleccionado = signal<any>(null);
    isDeleted = signal(false);
    isError = signal(false);
    errorMessage = signal('');

    ngOnInit() {
        this.cargarEmpleados();
    }

    cargarEmpleados() {
        // Filtrar opcionalmente los que ya están activos para no llenar la lista
        this.empleadosService.getInactiveEmployers().subscribe(data => this.empleados.set(data));
    }

    onSeleccionar(event: any) {
        const seleccionado = this.empleados().find(u => u.id == event.target.value);
        this.empleadoSeleccionado.set(seleccionado || null);
    }

    confirmarActivar() {
        const empleado = this.empleadoSeleccionado();
        if (empleado) {
            this.empleadosService.activarUsuario(empleado.id).subscribe({
                next: () => {
                    this.isDeleted.set(true);
                    this.isError.set(false);
                },
                error: (err) => {
                    this.isError.set(true);
                    if (err.status === 400) {
                        this.errorMessage.set('Este empleado ya se encuentra desactivado en el sistema.');
                    } else {
                        this.errorMessage.set('No se pudo procesar la solicitud. Intente más tarde.');
                    }
                }
            });
        }
    }

    resetVista() {
        this.isError.set(false);
        this.empleadoSeleccionado.set(null);
    }

    finalizar() {
        this.router.navigate(['/empleados']);
    }
}