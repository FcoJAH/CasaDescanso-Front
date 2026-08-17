import { Component, inject, computed } from '@angular/core';
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

  showAnnouncement = computed(() => {
    const user = this.authService.currentUserSignal();
    return user !== null && !user.hasSeenCheckinAnnouncement;
  });

  isAccepting = false;
  isDismissed = false;

  accept() {
    this.isDismissed = true; // OCULTAR INMEDIATAMENTE EL MODAL
    if (this.isAccepting) return;
    this.isAccepting = true;
    
    this.authService.markCheckinAnnouncementAsSeen().subscribe({
      next: () => {
        this.isAccepting = false;
      },
      error: (err) => {
        console.error('Error al marcar anuncio de checado como visto', err);
        this.isAccepting = false;
        // Ocultar visualmente aunque falle
        const user = this.authService.getCurrentUser();
        if (user) {
           user.hasSeenCheckinAnnouncement = true;
           this.authService.currentUserSignal.set({ ...user });
        }
      }
    });
  }
}
