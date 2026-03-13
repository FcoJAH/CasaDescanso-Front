import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environments';

// Definimos la interfaz según tu JSON para tener tipado estricto
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
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private http = inject(HttpClient);
  private myAppUrl = environment.apiUrl;
  private apiUrl = `${this.myAppUrl}/Dashboard`;

  getStats(): Observable<DashboardData> {
    return this.http.get<DashboardData>(this.apiUrl);
  }
}