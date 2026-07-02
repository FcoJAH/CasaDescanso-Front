import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = localStorage.getItem('token');

  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si el backend nos responde 401 Unauthorized (Token expirado)
      if (error.status === 401 && token) {
        // Intentar refrescar el token silenciosamente
        return authService.refreshToken().pipe(
          switchMap(user => {
            // Si el refresco es exitoso, clonamos la petición original fallida con el nuevo token
            const newToken = localStorage.getItem('token');
            const retriedReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${newToken}`
              }
            });
            // Reanudamos la petición como si nada
            return next(retriedReq);
          }),
          catchError(err => {
            // Si el refresh también falla (ej: expiró el refresh token o fue despedido)
            authService.logout();
            router.navigate(['/']);
            return throwError(() => err);
          })
        );
      }
      
      return throwError(() => error);
    })
  );
};
