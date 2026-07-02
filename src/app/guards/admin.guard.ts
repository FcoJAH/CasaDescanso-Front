import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Si no hay sesión, bloquea directamente y que el authGuard se encargue de mandarlo al login,
  // pero por si acaso, lo mandamos al login.
  if (!authService.getCurrentUser()) {
    return router.parseUrl('/');
  }

  // Si tiene sesión y es ADMIN, lo dejamos pasar
  if (authService.isAdmin()) {
    return true;
  }

  // Si es otro rol (Ej: Guardia, Enfermero), lo rebotamos al dashboard
  return router.parseUrl('/dashboard');
};
