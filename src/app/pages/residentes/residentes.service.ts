import { Injectable, inject } from '@angular/core'; // Usamos inject
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environments';

export interface Residente {
  // Información Identitaria
  firstName: string;
  lastName: string;
  middleName: string;
  birthDate: string; // Formato ISO "YYYY-MM-DD"
  gender: string;

  // Datos Médicos
  nss?: string | null;           // Opcional
  bloodType: string;             // Requerido (ej. "O+", "A-")
  diagnosedDiseases?: string;    // Opcional
  allergies?: string;            // Opcional
  photoPath?: string;            // Opcional

  // Contactos de Emergencia
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string; // Parentesco

  // Contacto Secundario (Opcional)
  secondContactName?: string;
  secondContactPhone?: string;

  // Datos Operativos
  admissionDate: string;         // Formato ISO "YYYY-MM-DD"
  observations?: string;
}


@Injectable({
  providedIn: 'root'
})
export class ResidentesService {
  // Inyectamos el HttpClient de forma moderna
  private http = inject(HttpClient);
  private myAppUrl = environment.apiUrl; // Usamos la URL del entorno
  private baseUrl = `${this.myAppUrl}`;

  registrarResidente(residente: Residente): Observable<any> {
    return this.http.post(`${this.baseUrl}/Residents/create`, residente);
  }

  cambiarEstatusResidente(id: number): Observable<any> {
    return this.http.patch(`${this.baseUrl}/Residents/${id}/toggle-status`, {});
  }

  obtenerActivos(): Observable<any> {
    return this.http.get(`${this.baseUrl}/Residents/active`);
  }

  obtenerInactivos(): Observable<any> {
    return this.http.get(`${this.baseUrl}/Residents/inactive`);
  }

  obtenerTodos(): Observable<any> {
    return this.http.get(`${this.baseUrl}/Residents/all`);
  }

  updateResidente(id: number, residente: Residente): Observable<any> {
    return this.http.put(`${this.baseUrl}/Residents/update/${id}`, residente);
  }

  obtenerResidentePorId(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/Residents/detail/${id}`);
  }
}