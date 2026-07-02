import { ErrorHandler, Injectable } from '@angular/core';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  handleError(error: any): void {
    // Registramos el error de código o JavaScript en consola para debug
    console.error('[GLOBAL ERROR HANDLER LOG]', error);
    
    // Si fuera necesario, se podría enviar a algún servicio externo como Sentry
  }
}
