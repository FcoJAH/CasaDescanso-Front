import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ShiftCreate } from './shift.model';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environments';

@Injectable({ providedIn: 'root' })
export class TurnosService {
  private http = inject(HttpClient);
  private myAppUrl = environment.apiUrl;
  private apiUrl = `${this.myAppUrl}/Shifts`;

  crearTurno(turno: ShiftCreate) {
    return this.http.post(`${this.apiUrl}/create`, turno);
  }

  getTurnos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/all`);
  }

  actualizarTurno(id: number, datos: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/update/${id}`, datos);
  }

  eliminarTurno(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/delete/${id}`);
  }
}