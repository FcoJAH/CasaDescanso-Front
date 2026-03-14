import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environments';

@Injectable({ providedIn: 'root' })
export class AttendanceService {
  private myAppUrl = environment.apiUrl;
  private baseUrl = `${this.myAppUrl}/Attendance`;

  constructor(private http: HttpClient, private authService: AuthService) { }

  // Aceptamos coords y enviamos todo en el body
  checkIn(coords: { lat: number, lng: number }): Observable<any> {
    const user = this.authService.getCurrentUser();

    if (!user || !user.userId) {
      console.error("No se encontró el ID del usuario");
    }

    const body = {
      userId: user?.userId,
      latitude: coords.lat,
      longitude: coords.lng
    };
    return this.http.post(`${this.baseUrl}/checkin`, body);
  }

  // Aceptamos coords y enviamos todo en el body
  checkOut(coords: { lat: number, lng: number }): Observable<any> {
    const user = this.authService.getCurrentUser();

    if (!user || !user.userId) {
      console.error("No se encontró el ID del usuario");
    }

    const body = {
      userId: user?.userId,
      latitude: coords.lat,
      longitude: coords.lng
    };
    return this.http.post(`${this.baseUrl}/checkout`, body);
  }

  // En attendance.service.ts
  getAttendanceStatus(id: number): Observable<{ hasOpenAttendance: boolean }> {
    return this.http.get<{ hasOpenAttendance: boolean }>(`${this.baseUrl}/status/${id}`);
  }

  getAttendanceHistory(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/history/${userId}`);
  }
}
