import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, of, throwError } from 'rxjs';
import { environment } from '../../../environments/environments';
export interface Incidente {
  residentId: number;
  registeredByUserId: number;
  date: string;
  type: string;
  severityLevel: string;
  description: string;
}
@Injectable({
  providedIn: 'root'
})
export class IncidentsService {
  private http = inject(HttpClient);
  private myAppUrl = environment.apiUrl; // Usamos la URL del entorno
  private apiUrl = `${this.myAppUrl}`; // Ajusta según tu IP

  getResindets(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/Residents/active`);
  }

  crearIncident( incidente: Incidente ): Observable<any> {
    return this.http.post(`${this.apiUrl}/Incidents/create`, incidente);
  }

  getIncidentsByResident(residentId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/Incidents/resident/${residentId}`);
  }

  getResidentsById(residentId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/Residents/detail/${residentId}`);
  }

  getWorkerById(workerId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/Workers/detail/${workerId}`);
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