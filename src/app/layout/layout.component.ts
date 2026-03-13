import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

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

  // Mantenemos el sidebar abierto por defecto en desktop
  isSidebarOpen = false; 
  user$ = this.authService.currentUser$;

  ngOnInit() {
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
}