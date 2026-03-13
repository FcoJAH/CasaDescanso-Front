import { Component, OnInit, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ResidentesService } from '../residentes.service';

@Component({
    selector: 'app-desactivar-residente',
    templateUrl: './desactivar-residente.component.html',
    styleUrls: ['./desactivar-residente.component.css']
})
export class DesactivarResidenteComponent implements OnInit {
    private residentesService = inject(ResidentesService);
    private router = inject(Router);

    residentes = signal<any[]>([]);
    empleadoSeleccionado = signal<any>(null);
    isDeleted = signal(false);
    isError = signal(false);
    errorMessage = signal('');

    ngOnInit() {
        this.cargarEmpleados();
    }

    cargarEmpleados() {
        // Filtrar opcionalmente los que ya están activos para no llenar la lista
        this.residentesService.obtenerActivos().subscribe(data => this.residentes.set(data));
    }

    onSeleccionar(event: any) {
        const seleccionado = this.residentes().find(u => u.id == event.target.value);
        this.empleadoSeleccionado.set(seleccionado || null);
    }

    confirmarDesactivar() {
        const empleado = this.empleadoSeleccionado();
        if (empleado) {
            this.residentesService.cambiarEstatusResidente(empleado.id).subscribe({
                next: () => {
                    this.isDeleted.set(true);
                    this.isError.set(false);
                },
                error: (err) => {
                    this.isError.set(true);
                    if (err.status === 400) {
                        this.errorMessage.set('Este residente ya se encuentra desactivado en el sistema.');
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
        this.router.navigate(['/residentes']);
    }
}