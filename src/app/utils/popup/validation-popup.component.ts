import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-validation-popup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './validation-popup.component.html',
  styleUrls: ['./validation-popup.component.css']
})
export class ValidationPopupComponent {
  // Recibe el array de errores (ej: ["TEMPERATURA REQUERIDA", "PESO INVÁLIDO"])
  errors = input.required<string[]>();
  
  // Evento para cerrar el popup
  onClose = output<void>();

  cerrar() {
    this.onClose.emit();
  }
}