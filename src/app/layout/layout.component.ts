import { Component, inject, OnInit, signal, ElementRef, ViewChild, HostListener } from '@angular/core';
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
    
    // Iniciar conexión SignalR si hay sesión
    if (this.authService.getCurrentUser()) {
      this.supportService.startConnection();
      
      // Escuchar el evento en vivo
      this.supportService.ticketResolvedEvent.subscribe((nuevoTicket) => {
        // Solo recargar si NO somos sistemas (o en todo caso, siempre está bien recargar para mantener sincronía)
        this.loadNotifications();
      });

      this.supportService.newTicketEvent.subscribe((nuevoTicket) => {
        // Alguien creó un ticket nuevo, si somos SISTEMAS recargamos
        if (this.authService.currentUserSignal()?.position === 'SISTEMAS') {
          this.loadNotifications();
        }
      });
    }

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
    const user = this.authService.getCurrentUser();
    if (!user) return;

    if (this.authService.currentUserSignal()?.position === 'SISTEMAS') {
      this.supportService.getSistemasNotifications().subscribe(res => {
        this.notifications.set(res);
        // Marcamos como "No leídos" (punto rojo) si el ticket está 'Pending'
        // El backend lo manda como IsReadByReporter = false cuando es Pending.
        this.hasUnread.set(res.some(n => !n.isReadByReporter));
      });
    } else {
      this.supportService.getMyResolvedTickets().subscribe(res => {
        this.notifications.set(res);
        this.hasUnread.set(res.some(n => !n.isReadByReporter));
      });
    }
  }

  @ViewChild('notificationsWrapper') notificationsWrapper!: ElementRef;

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.showNotifications() && this.notificationsWrapper) {
      if (!this.notificationsWrapper.nativeElement.contains(event.target)) {
        this.showNotifications.set(false);
      }
    }
  }

  toggleNotifications(event: MouseEvent) {
    // Evitamos que este click se propague al document y cierre el menú inmediatamente
    event.stopPropagation();
    this.showNotifications.update((v: boolean) => !v);
  }

  markAsRead(ticketId: number) {
    this.supportService.markTicketAsRead(ticketId).subscribe(() => {
      this.loadNotifications();
    });
  }
}