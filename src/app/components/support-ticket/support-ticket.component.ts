import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SupportService, SupportTicketRequest } from '../../services/support.service';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-support-ticket',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './support-ticket.component.html',
  styleUrls: ['./support-ticket.component.css']
})
export class SupportTicketComponent {
  private authService = inject(AuthService);
  private supportService = inject(SupportService);
  private router = inject(Router);

  isOpen = signal(false);
  isSubmitting = signal(false);
  description = signal('');
  successMessage = signal('');
  errorMessage = signal('');
  capturedScreenshotBase64 = signal<string | null>(null);

  isUserLoggedIn = computed(() => this.authService.currentUserSignal() !== null);

  toggleModal() {
    this.isOpen.update(v => !v);
    if (this.isOpen()) {
      // Capturar la pantalla sin bloquear la apertura del modal
      setTimeout(() => {
        // Ocultar el botón temporalmente para que no salga en la captura si queremos,
        // pero como es útil que salga, lo dejamos.
        html2canvas(document.body, { 
          scale: 1, // Reducimos escala para aligerar la imagen
          useCORS: true, 
          ignoreElements: (element) => element.classList.contains('modal-overlay') || element.classList.contains('support-fab') // Ignorar el modal y el botón flotante
        }).then(canvas => {
          this.capturedScreenshotBase64.set(canvas.toDataURL('image/png'));
        }).catch(err => console.error('Error al capturar pantalla', err));
      }, 50);
    } else {
      this.resetForm();
    }
  }

  closeModal() {
    this.isOpen.set(false);
    this.resetForm();
  }

  resetForm() {
    this.description.set('');
    this.successMessage.set('');
    this.errorMessage.set('');
    this.capturedScreenshotBase64.set(null);
  }

  submitTicket() {
    if (!this.description().trim()) return;

    const user = this.authService.getCurrentUser();
    if (!user) return; // No permitir sin sesión

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const request: SupportTicketRequest = {
      description: this.description(),
      currentUrl: window.location.pathname + window.location.search,
      reporterName: user.fullName,
      reporterRole: user.position,
      localTime: new Date().toLocaleString(),
      screenshotBase64: this.capturedScreenshotBase64() || undefined
    };

    this.supportService.sendTicket(request).subscribe({
      next: (res) => {
        this.successMessage.set('Reporte enviado correctamente al área técnica.');
        this.isSubmitting.set(false);
        this.description.set('');
        
        setTimeout(() => {
          if (this.isOpen()) {
            this.closeModal();
          }
        }, 3000);
      },
      error: (err) => {
        console.error('Error enviando ticket', err);
        this.errorMessage.set('Hubo un problema al enviar tu reporte. Intenta de nuevo.');
        this.isSubmitting.set(false);
      }
    });
  }
}
