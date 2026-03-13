import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TurnosService } from '../turnos.service';

@Component({
    selector: 'app-ver-turnos',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './ver-turnos.component.html',
    styleUrls: ['./ver-turnos.component.css']
})
export class VerTurnosComponent implements OnInit {
    private turnosService = inject(TurnosService);

    // Señal para almacenar la lista de turnos
    turnos = signal<any[]>([]);
    isLoading = signal(true);

    ngOnInit() {
        this.cargarTurnos();
    }

    cargarTurnos() {
        this.turnosService.getTurnos().subscribe({
            next: (data) => {
                this.turnos.set(data);
                this.isLoading.set(false);
            },
            error: (err) => {
                console.error('Error al cargar turnos:', err);
                this.isLoading.set(false);
            }
        });
    }

    formatTime12h(time: string): string {
        if (!time) return '';

        // Dividimos la cadena (espera HH:mm:ss o HH:mm)
        let [hours, minutes] = time.split(':');
        let hourNum = parseInt(hours, 10);
        const ampm = hourNum >= 12 ? 'PM' : 'AM';

        hourNum = hourNum % 12;
        hourNum = hourNum ? hourNum : 12; // La hora '0' debe ser '12'

        return `${hourNum}:${minutes} ${ampm}`;
    }
}
