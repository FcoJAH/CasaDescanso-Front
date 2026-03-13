import { Injectable, inject } from '@angular/core'; // Usamos inject
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environments'; // Importamos el environment

export interface Empleado {
  firstName: string;
  lastName: string;
  middleName?: string; // Lo puse opcional por si no tienen segundo apellido
  birthDate: string;
  gender: string;
  phone: string;
  email: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  rfc: string | null; // Cambiado a null explicito si el back lo requiere
  curp: string | null;
  nss: string | null;
  roleId: number;
  educationLevel: string;
  allergies: string | null;
  shiftId: number;
  password: string;
}

export interface Shift {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
}

export interface Role {
  id: number;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class EmpleadosService {
  // Inyectamos el HttpClient de forma moderna
  private http = inject(HttpClient);
  private myAppUrl = environment.apiUrl; // Usamos la URL del environment
  private baseUrl = `${this.myAppUrl}`;

  registrarEmpleado(empleado: Empleado): Observable<any> {
    return this.http.post(`${this.baseUrl}/Workers/create`, empleado);
  }

  // Métodos para obtener turnos y roles
  getShifts(): Observable<Shift[]> {
    return this.http.get<Shift[]>(`${this.baseUrl}/Shifts/all`);
  }

  getRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(`${this.baseUrl}/Roles/all`);
  }

  getEmpleados(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/Workers/all`);
  }

  deactivarUsuario(id: number): Observable<any> {
    return this.http.patch(`${this.baseUrl}/Workers/${id}/deactivate`, {});
  }

  getActiveEmployers(): Observable<any> {
    return this.http.get(`${this.baseUrl}/Workers/active`, {});
  }

  activarUsuario(id: number): Observable<any> {
    return this.http.patch(`${this.baseUrl}/Workers/${id}/activate`, {});
  }

  getInactiveEmployers(): Observable<any> {
    return this.http.get(`${this.baseUrl}/Workers/inactive`, {});
  }

  getEmployerById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/Workers/detail/${id}`);
  }

  updateEmployer(id: number, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/Workers/update/${id}`, data);
  }
}