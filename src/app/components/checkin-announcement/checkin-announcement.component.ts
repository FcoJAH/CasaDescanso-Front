import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-checkin-announcement',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './checkin-announcement.component.html',
  styleUrls: ['./checkin-announcement.component.css']
})
export class CheckinAnnouncementComponent {
  private authService = inject(AuthService);

  isDismissed = signal(false);

  showAnnouncement = computed(() => {
    const user = this.authService.currentUserSignal();
    return user !== null && !user.hasSeenCheckinAnnouncement && !this.isDismissed();
  });

  accept() {
    // 1. Ocultar inmediatamente por reactividad
    this.isDismissed.set(true);
    
    // 2. Ocultar a la fuerza por DOM (respaldo infalible)
    const overlay = document.querySelector('.announcement-overlay') as HTMLElement;
    if (overlay) {
      overlay.style.display = 'none';
    }
    
    // 3. Actualizar estado local
    const user = this.authService.getCurrentUser();
    if (user) {
      user.hasSeenCheckinAnnouncement = true;
      this.authService.currentUserSignal.set({ ...user });
      localStorage.setItem('currentUser', JSON.stringify(user));
    }

    // 4. Avisar al backend para que no vuelva a salir al iniciar sesión
    this.authService.markCheckinAnnouncementAsSeen().subscribe({
      next: () => console.log('Anuncio marcado como visto en el servidor.'),
      error: (err) => console.error('Falló la conexión al servidor al marcar el anuncio:', err)
    });
  }
}
