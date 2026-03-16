import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-alert-popup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.css']
})
export class AlertPopupComponent {

  title = input.required<string>();
  description = input.required<string>();
  aditional = input<string>();
  button = input.required<string>();

  // Evento para cerrar el popup
  onClose = output<void>();
  onConfirm = output<void>();

  cerrar() {
    this.onClose.emit();
  }

  confirmar() {
    this.onConfirm.emit();
  }
}