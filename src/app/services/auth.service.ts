import { inject, Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environments';

export interface User {
  userId: number;
  workerId: number;
  fullName: string;
  position: string;
  shift: string;
  hasSeenSupportAnnouncement: boolean;
  token?: string;
  refreshToken?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private myAppUrl = environment.apiUrl; // Usamos la URL del entorno
  private apiUrl = `${this.myAppUrl}/Auth/login`;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  public currentUserSignal = signal<User | null>(null);

  // --- NUEVO: Computed para verificar si es ADMIN ---
  public isAdmin = computed(() => {
    const user = this.currentUserSignal();
    return user?.position?.toUpperCase() === 'ADMIN' || user?.position?.toUpperCase() === 'SISTEMAS';
  });

  constructor(private http: HttpClient) {
    // IMPORTANTE: Recuperar sesión al inicializar el servicio
    const userJson = localStorage.getItem('currentUser');
    if (userJson) {
      const user = JSON.parse(userJson) as User;
      this.currentUserSubject.next(user);
      this.currentUserSignal.set(user);
    }
  }

  login(username: string, password: string): Observable<User> {
    return this.http.post<User>(this.apiUrl, { username, password }).pipe(
      tap(user => {
        if (user) {
          this.currentUserSubject.next(user);
          localStorage.setItem('currentUser', JSON.stringify(user));
          if (user.token) localStorage.setItem('token', user.token);
          if (user.refreshToken) localStorage.setItem('refreshToken', user.refreshToken);
          this.currentUserSignal.set(user);
        }
      })
    );
  }

  refreshToken(): Observable<User> {
    const token = localStorage.getItem('token');
    const refreshToken = localStorage.getItem('refreshToken');
    
    return this.http.post<User>(`${this.myAppUrl}/Auth/refresh`, { token, refreshToken }).pipe(
      tap(user => {
        if (user) {
          this.currentUserSubject.next(user);
          localStorage.setItem('currentUser', JSON.stringify(user));
          if (user.token) localStorage.setItem('token', user.token);
          if (user.refreshToken) localStorage.setItem('refreshToken', user.refreshToken);
          this.currentUserSignal.set(user);
        }
      })
    );
  }

  markAnnouncementAsSeen(): Observable<any> {
    const user = this.getCurrentUser();
    if (!user) return new Observable();
    
    return this.http.post(`${this.myAppUrl}/Auth/${user.userId}/mark-support-announcement`, {}).pipe(
      tap(() => {
        user.hasSeenSupportAnnouncement = true;
        this.currentUserSubject.next(user);
        this.currentUserSignal.set(user);
        localStorage.setItem('currentUser', JSON.stringify(user));
      })
    );
  }

  getCurrentUser(): User | null {
    if (this.currentUserSubject.value) return this.currentUserSubject.value;
    const userJson = localStorage.getItem('currentUser');
    if (userJson) {
      const user = JSON.parse(userJson) as User;
      this.currentUserSubject.next(user);
      this.currentUserSignal.set(user); // Sincronizamos también el signal
      return user;
    }
    return null;
  }

  logout() {
    this.currentUserSubject.next(null);
    this.currentUserSignal.set(null); // Limpiamos el signal
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  }
}