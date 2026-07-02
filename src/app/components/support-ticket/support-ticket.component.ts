import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SupportService, SupportTicketRequest } from '../../services/support.service';

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

  get isUserLoggedIn(): boolean {
    return this.authService.getCurrentUser() !== null;
  }

  toggleModal() {
    this.isOpen.update(v => !v);
    if (!this.isOpen()) {
      this.resetForm();
    }
  }

  resetForm() {
    this.description.set('');
    this.successMessage.set('');
    this.errorMessage.set('');
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
      reporterName: user.name,
      reporterRole: user.role,
      localTime: new Date().toLocaleString()
    };

    this.supportService.sendTicket(request).subscribe({
      next: (res) => {
        this.successMessage.set('Reporte enviado correctamente al área técnica.');
        this.isSubmitting.set(false);
        this.description.set('');
        
        setTimeout(() => {
          this.toggleModal();
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
