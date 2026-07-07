import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { SupportService } from '../services/support.service';
import { APP_VERSION } from '../../environments/versions';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css'
})
export class LayoutComponent implements OnInit {
  private router = inject(Router);
  public authService = inject(AuthService);

  version = APP_VERSION.full;

  // Mantenemos el sidebar abierto por defecto en desktop
  isSidebarOpen = false; 
  user$ = this.authService.currentUser$;

  // Notificaciones
  private supportService = inject(SupportService);
  notifications = signal<any[]>([]);
  showNotifications = signal(false);
  hasUnread = signal(false);

  ngOnInit() {
    this.loadNotifications();

    // Escuchar cambios de navegación para cerrar el sidebar en móviles automáticamente
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      // Si el ancho de pantalla es pequeño, cerramos el sidebar tras navegar
      if (window.innerWidth < 768) {
        this.isSidebarOpen = false;
      }
    });
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  logout() {
    this.authService.logout();
    // Limpiamos todo rastro de sesión
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    this.router.navigate(['']);
  }

  loadNotifications() {
    if (!this.authService.getCurrentUser()) return;
    this.supportService.getMyResolvedTickets().subscribe(res => {
      this.notifications.set(res);
      this.hasUnread.set(res.some(n => !n.isReadByReporter));
    });
  }

  toggleNotifications() {
    this.showNotifications.update(v => !v);
  }

  markAsRead(ticketId: number) {
    this.supportService.markTicketAsRead(ticketId).subscribe(() => {
      this.loadNotifications();
    });
  }
}