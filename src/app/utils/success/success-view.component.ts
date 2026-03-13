import { Component, input, output } from '@angular/core';
import { SuccessConfig } from './success-config.model';

@Component({
    selector: 'app-success-view',
    standalone: true,
    templateUrl: './success-view.component.html',
    styleUrls: ['./success-view.component.css']
})
export class SuccessViewComponent {
    // Recibe la configuración desde cualquier formulario (Incidencias, Signos, etc.)
    config = input.required<SuccessConfig>();

    // Emite un evento cuando el usuario quiere volver o hacer un nuevo registro
    onAction = output<void>();
    onExit = output<void>();

    ejecutarAccion() {
        this.onAction.emit();
    }

    salir() {
        this.onExit.emit();
    }
}