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
    // Forzamos el cierre a través de la señal y guardamos localmente
    this.isDismissed.set(true);
    
    // Lo guardamos en el localStorage directamente para evitar llamadas a la API que puedan fallar
    const user = this.authService.getCurrentUser();
    if (user) {
      user.hasSeenCheckinAnnouncement = true;
      this.authService.currentUserSignal.set({ ...user });
      localStorage.setItem('currentUser', JSON.stringify(user));
    }
  }
}
