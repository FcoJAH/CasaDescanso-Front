import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environments';

export interface DashboardData {
  totalResidents: number;
  activeResidents: number;
  inactiveResidents: number;
  totalWorkers: number;
  activeWorkers: number;
  inactiveWorkers: number;
  todayIncidents: number;
  totalIncidents: number;
  workersWorkingNow: number;
  checkInsToday: number;
  activeWorkersNames: string[];
}

// Corregimos la interfaz: El backend manda un string único por cada registro
export interface IncidentToday {
  id: number;
  residentId: number;
  residentName: string; // Es un string, no un array
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private http = inject(HttpClient);
  private myAppUrl = environment.apiUrl;
  private apiUrl = `${this.myAppUrl}/Dashboard`;
  private apiIncidents = `${this.myAppUrl}/Incidents/today`;

  getStats(): Observable<DashboardData> {
    return this.http.get<DashboardData>(this.apiUrl);
  }

  // Corregido: Usamos paréntesis () y definimos que retorna un Array []
  getTodayIncidents(): Observable<IncidentToday[]> {
    return this.http.get<IncidentToday[]>(this.apiIncidents);
  }
}