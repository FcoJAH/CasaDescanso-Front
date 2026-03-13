import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, of, throwError } from 'rxjs';
import { environment } from '../../../environments/environments';
@Injectable({
  providedIn: 'root'
})
export class RolesService {
  private http = inject(HttpClient);
  private myAppUrl = environment.apiUrl; // Usamos la URL del entorno
  private apiUrl = `${this.myAppUrl}/Roles`; // Ajusta según tu IP

  getRoles(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/all`);
  }

  crearRol(rol: { name: string, description: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/create`, rol);
  }

  actualizarRol(id: number, rol: { name: string, description: string, isActive: boolean }): Observable<any> {
    return this.http.put(`${this.apiUrl}/update/${id}`, rol).pipe(
      catchError(error => this.handleBusinessError(error))
    );
  }

  eliminarRol(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/delete/${id}`);
  }

  /**
   * Manejador de errores para evitar el 400 en la consola roja
   * y permitir que el componente reciba el mensaje amigablemente.
   */
  private handleBusinessError(error: any) {
    if (error.status === 400) {
      // Devolvemos un objeto que el componente sabrá interpretar como error de negocio
      return of({
        isBusinessError: true,
        errorMessage: error.error || 'No se pudo completar la acción.'
      });
    }
    // Si es un error técnico (500, 404, etc), lo lanzamos normalmente
    return throwError(() => error);
  }
}