import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-support-announcement',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './support-announcement.component.html',
  styleUrls: ['./support-announcement.component.css']
})
export class SupportAnnouncementComponent {
  private authService = inject(AuthService);

  showAnnouncement = computed(() => {
    const user = this.authService.currentUserSignal();
    return user !== null && !user.hasSeenSupportAnnouncement;
  });

  isAccepting = false;

  accept() {
    if (this.isAccepting) return;
    this.isAccepting = true;
    
    this.authService.markAnnouncementAsSeen().subscribe({
      next: () => {
        this.isAccepting = false;
      },
      error: (err) => {
        console.error('Error al marcar anuncio como visto', err);
        this.isAccepting = false;
        // Ocultar visualmente aunque falle
        const user = this.authService.getCurrentUser();
        if (user) {
           user.hasSeenSupportAnnouncement = true;
           this.authService.currentUserSignal.set(user);
        }
      }
    });
  }
}
