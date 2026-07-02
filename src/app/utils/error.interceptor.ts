import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMsg = '';
      if (error.error instanceof ErrorEvent) {
        // Error del lado del cliente o de red
        errorMsg = `Error (Client-side): ${error.error.message}`;
      } else {
        // Error retornado por el backend
        errorMsg = `Error (Server-side): Código: ${error.status}, Mensaje: ${error.message}`;
      }
      
      // Aquí imprimimos el error completo en consola para debug
      console.error('[HTTP INTERCEPTOR LOG]', errorMsg, error);
      
      // Retornamos el error para que los servicios lo sigan atrapando (si lo desean)
      // Sin cambiar la lógica de negocio actual
      return throwError(() => error);
    })
  );
};
