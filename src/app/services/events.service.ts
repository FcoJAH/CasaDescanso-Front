import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environments';
import { Observable } from 'rxjs';

export interface CalendarEvent {
  id?: number; 
  title: string;
  description: string;
  eventDate: string; // ISO String: "2026-05-15T10:00:00"
}

@Injectable({
  providedIn: 'root'
})
export class EventsService {
  private http = inject(HttpClient);
  // Asegúrate de que environment.apiUrl termine en /api/events o similar según tu backend
  private apiUrl = `${environment.apiUrl}/Events`;

  getEvents(): Observable<CalendarEvent[]> {
    // Corregido: Uso de Template Strings `` y la ruta correcta /getAll
    return this.http.get<CalendarEvent[]>(`${this.apiUrl}/getAll`);
  }

  saveEvent(event: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/create`, event);
  }
}