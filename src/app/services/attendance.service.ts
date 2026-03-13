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

  checkIn(): Observable<any> {
    const user = this.authService.getCurrentUser();
    console.log('Enviando userId:', user?.userId);

    return this.http.post(`${this.baseUrl}/checkin?userId=${user?.userId}`, {});
  }


  checkOut(): Observable<any> {
    const user = this.authService.getCurrentUser();
    if (!user) throw new Error('Usuario no logeado');

    console.log('Enviando workerId:', user.workerId);

    return this.http.post(`${this.baseUrl}/checkout?workerId=${user.workerId}`, {});
  }

  // Verifica si el empleado tiene un check-in activo hoy
  getAttendanceStatus(id: number): Observable<{ hasActiveEntry: boolean }> {
    return this.http.get<{ hasActiveEntry: boolean }>(`${this.baseUrl}/status/${id}`);
  }

  getAttendanceHistory(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/history/${userId}`);
  }
}
